/**
 * ShaderManager handles GLSL 3.00 ES compilation and program linking for WebGL 2.0.
 */
export class ShaderManager {
    /**
     * Compiles a shader from source.
     * @param {WebGL2RenderingContext} gl 
     * @param {number} type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {string} source GLSL source code
     * @returns {WebGLShader}
     */
    static compile(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
            console.error(`Could not compile ${typeName} shader:\n${info}`);
            
            // Log source with line numbers for easier debugging
            const lines = source.split('\n');
            lines.forEach((line, i) => {
                console.debug(`${(i + 1).toString().padStart(3, ' ')}: ${line}`);
            });
            
            gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${info}`);
        }
        return shader;
    }

    /**
     * Creates and links a shader program.
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vertSource 
     * @param {string} fragSource 
     * @returns {WebGLProgram}
     */
    static createProgram(gl, vertSource, fragSource) {
        const vertexShader = this.compile(gl, gl.VERTEX_SHADER, vertSource);
        const fragmentShader = this.compile(gl, gl.FRAGMENT_SHADER, fragSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            console.error(`Could not link shader program:\n${info}`);
            gl.deleteProgram(program);
            throw new Error(`Program linking failed: ${info}`);
        }

        console.log("Shader program linked successfully");
        return program;
    }

    /**
     * Sets multiple uniforms at once.
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLProgram} program 
     * @param {Object} uniforms Key-value pairs of uniform names and values
     */
    static setUniforms(gl, program, uniforms) {
        gl.useProgram(program);
        for (const [name, value] of Object.entries(uniforms)) {
            const location = gl.getUniformLocation(program, name);
            if (location === null) continue;

            if (Array.isArray(value) || value instanceof Float32Array || value instanceof Int32Array) {
                switch (value.length) {
                    case 1: gl.uniform1fv(location, value); break;
                    case 2: gl.uniform2fv(location, value); break;
                    case 3: gl.uniform3fv(location, value); break;
                    case 4: gl.uniform4fv(location, value); break;
                    case 9: gl.uniformMatrix3fv(location, false, value); break;
                    case 16: gl.uniformMatrix4fv(location, false, value); break;
                    default: gl.uniform1fv(location, value);
                }
            } else if (typeof value === 'number') {
                // Samplers and specific integer uniforms must use uniform1i
                if (name === 'u_atlas' || name.toLowerCase().includes('sampler')) {
                    gl.uniform1i(location, value);
                } else {
                    gl.uniform1f(location, value);
                }
            } else if (typeof value === 'boolean') {
                gl.uniform1i(location, value ? 1 : 0);
            }
        }
    }
}

/**
 * Global Uniform Block for shared state (std140 layout)
 */
export const GLOBAL_STATE_BLOCK = `
layout(std140) uniform GlobalState {
    vec2 u_resolution;
    float u_time;
    float u_dpr;
    vec2 u_scroll;
};
`;

/**
 * Standard Primitive Vertex Shader Source (Raw GLSL 3.00 ES)
 */
export const PRIMITIVE_VERT = `#version 300 es
${GLOBAL_STATE_BLOCK}

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

uniform vec2 u_rectSize;
uniform vec2 u_offset;

out vec2 v_texCoord;

void main() {
    vec2 pixelPos = a_position * u_rectSize + u_offset;
    vec2 zeroToOne = pixelPos / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    v_texCoord = a_texCoord;
}
`;

/**
 * Standard Primitive Fragment Shader Source (Raw GLSL 3.00 ES)
 * Implements SDF-based rounded rectangles with anti-aliasing.
 */
export const PRIMITIVE_FRAG = `#version 300 es
precision highp float;
${GLOBAL_STATE_BLOCK}

uniform vec2 u_rectSize;
uniform float u_radius;
uniform vec4 u_color;

in vec2 v_texCoord;
out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    vec2 p = (v_texCoord - 0.5) * u_rectSize;
    vec2 b = u_rectSize * 0.5;
    float r = min(u_radius, min(b.x, b.y));
    float d = sdRoundedBox(p, b, r);
    float edge = fwidth(d) * 0.5;
    float alpha = 1.0 - smoothstep(-edge, edge, d);
    if (alpha <= 0.0) discard;
    outColor = vec4(u_color.rgb, u_color.a * alpha);
}
`;

/**
 * Unified Batch Vertex Shader Source (Raw GLSL 3.00 ES)
 */
export const BATCH_VERT = `#version 300 es
${GLOBAL_STATE_BLOCK}

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

// Instanced attributes for GPU-side animation interpolation
layout(location = 2) in vec4 a_startRect;   // [x, y, w, h] at t=0
layout(location = 3) in vec4 a_endRect;     // [x, y, w, h] at t=1
layout(location = 4) in vec4 a_startColor;  // [r, g, b, a] at t=0
layout(location = 5) in vec4 a_endColor;    // [r, g, b, a] at t=1
layout(location = 6) in vec4 a_instUV;      // [u, v, tw, th]
layout(location = 7) in vec2 a_transition;  // [startTime, duration]
layout(location = 8) in float a_instType;   // 0=Rect, 1=Text
layout(location = 9) in float a_instRadius; // corner radius

out vec2 v_texCoord;
out vec2 v_instSize;
out vec4 v_instUV;
out vec4 v_instColor;
out float v_instType;
out float v_instRadius;

float quadraticOut(float t) {
    return t * (2.0 - t);
}

void main() {
    float startTime = a_transition.x;
    float duration = a_transition.y;
    
    // Calculate normalized time [0, 1]
    float t = duration > 0.0 ? clamp((u_time - startTime) / duration, 0.0, 1.0) : 1.0;
    
    // Apply easing (Quadratic Out)
    float easedT = quadraticOut(t);
    
    // Interpolate rect and color on the GPU
    vec4 rect = mix(a_startRect, a_endRect, easedT);
    vec4 color = mix(a_startColor, a_endColor, easedT);
    
    vec2 instPos = rect.xy;
    vec2 instSize = rect.zw;
    
    vec2 pixelPos = a_position * instSize + instPos;
    vec2 zeroToOne = pixelPos / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Y-flip for screen space coordinates
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    
    v_texCoord = a_texCoord;
    v_instSize = instSize;
    v_instUV = a_instUV;
    v_instColor = color;
    v_instType = a_instType;
    v_instRadius = a_instRadius;
}
`;

/**
 * Unified Batch Fragment Shader Source (Raw GLSL 3.00 ES)
 * Dynamically switches between SDF rounded rects and SDF text glyphs.
 */
export const BATCH_FRAG = `#version 300 es
precision highp float;
${GLOBAL_STATE_BLOCK}

uniform sampler2D u_atlas;

in vec2 v_texCoord;
in vec2 v_instSize;
in vec4 v_instUV;
in vec4 v_instColor;
in float v_instType;
in float v_instRadius;

out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    if (v_instType < 0.5) {
        // Mode 0: Rounded Rect
        vec2 p = (v_texCoord - 0.5) * v_instSize;
        vec2 b = v_instSize * 0.5;
        float r = min(v_instRadius, min(b.x, b.y));
        float d = sdRoundedBox(p, b, r);
        float edge = fwidth(d) * 0.5;
        float alpha = 1.0 - smoothstep(-edge, edge, d);
        if (alpha <= 0.0) discard;
        outColor = vec4(v_instColor.rgb, v_instColor.a * alpha);
    } else {
        // Mode 1: SDF Text (Sigma/Pi Glyphs)
        vec2 uv = v_instUV.xy + v_texCoord * v_instUV.zw;
        float sampleVal = texture(u_atlas, uv).r;
        
        // High-fidelity anti-aliasing + subtle outer glow
        float width = fwidth(sampleVal) * 1.5;
        float alpha = smoothstep(0.5 - width, 0.5 + width, sampleVal);
        float glow = smoothstep(0.1, 0.5, sampleVal) * 0.4;
        
        float finalAlpha = clamp(alpha + glow, 0.0, 1.0);
        if (finalAlpha <= 0.0) discard;
        outColor = vec4(v_instColor.rgb, v_instColor.a * finalAlpha);
    }
}
`;
