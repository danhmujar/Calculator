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
                gl.uniform1f(location, value);
            } else if (typeof value === 'boolean') {
                gl.uniform1i(location, value ? 1 : 0);
            }
        }
    }
}

/**
 * Standard Primitive Vertex Shader Source (Raw GLSL 3.00 ES)
 */
export const PRIMITIVE_VERT = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

uniform vec2 u_resolution;
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
    float edge = fwidth(d);
    float alpha = 1.0 - smoothstep(-edge, edge, d);
    if (alpha <= 0.0) discard;
    outColor = vec4(u_color.rgb, u_color.a * alpha);
}
`;

/**
 * Unified Batch Vertex Shader Source (Raw GLSL 3.00 ES)
 */
export const BATCH_VERT = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

// Instanced attributes
layout(location = 2) in vec2 a_instPos;
layout(location = 3) in vec2 a_instSize;
layout(location = 4) in vec4 a_instUV;
layout(location = 5) in vec4 a_instColor;
layout(location = 6) in float a_instType;
layout(location = 7) in float a_instRadius;

uniform vec2 u_resolution;

out vec2 v_texCoord;
out vec2 v_instSize;
out vec4 v_instUV;
out vec4 v_instColor;
out float v_instType;
out float v_instRadius;

void main() {
    vec2 pixelPos = a_position * a_instSize + a_instPos;
    vec2 zeroToOne = pixelPos / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    // Y-flip for screen space coordinates
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    
    v_texCoord = a_texCoord;
    v_instSize = a_instSize;
    v_instUV = a_instUV;
    v_instColor = a_instColor;
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
        float edge = fwidth(d);
        float alpha = 1.0 - smoothstep(-edge, edge, d);
        if (alpha <= 0.0) discard;
        outColor = vec4(v_instColor.rgb, v_instColor.a * alpha);
    } else {
        // Mode 1: SDF Text
        vec2 uv = v_instUV.xy + v_texCoord * v_instUV.zw;
        float sampleVal = texture(u_atlas, uv).r;
        
        // Anti-aliasing using screen-space derivatives
        float width = fwidth(sampleVal);
        float alpha = smoothstep(0.5 - width, 0.5 + width, sampleVal);
        
        if (alpha <= 0.0) discard;
        outColor = vec4(v_instColor.rgb, v_instColor.a * alpha);
    }
}
`;
