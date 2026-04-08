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
                const lowerName = name.toLowerCase();
                if (lowerName === 'u_atlas' || lowerName.includes('sampler') || lowerName.includes('texture') || name === 'uBackgroundMode') {
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
 * Fullscreen quad pass-through for multi-pass effects.
 */
export const PRIMITIVE_VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Standard Primitive Fragment Shader Source (Raw GLSL 3.00 ES)
 * Multi-pass Kawase blur implementation with theme colorization.
 */
export const PRIMITIVE_FRAG = `#version 300 es
precision highp float;
${GLOBAL_STATE_BLOCK}

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uOffset;

// Theme color uniforms (D-06)
uniform vec3 uAuroraColor1;
uniform vec3 uAuroraColor2;
uniform vec3 uAuroraColor3;

// Background Pipeline
uniform int uBackgroundMode; // 0: Solid, 1: Aurora, 2: BTS
uniform float uGrainIntensity;
uniform float uIsFinalPass;

// BTS Theme uniforms
uniform sampler2D uBackgroundTexture;

in vec2 v_texCoord;
out vec4 outColor;

// Procedural noise function for grain
float noise(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

// Procedural bubble function
float bubble(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center);
    // Soft circle with glow
    float edge = smoothstep(radius, radius * 0.7, d);
    // Rim highlight
    float rim = smoothstep(radius * 0.4, radius * 0.2, d) * 0.3;
    return edge - rim;
}

void main() {
    vec2 pixelSize = 1.0 / uResolution;
    
    // Kawase Blur Sampling
    vec4 color = texture(uTexture, v_texCoord + (vec2(uOffset, uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(-uOffset, uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(-uOffset, -uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(uOffset, -uOffset) + 0.5) * pixelSize);
    vec4 blurred = color * 0.25;

    if (uIsFinalPass > 0.5) {
        vec3 finalBg = uAuroraColor1;

        if (uBackgroundMode == 2) {
            // --- BTS THEME: Image background + Procedural bubbles ---
            
            // Cover-fill UV calculation (no stretching, crop from center)
            float screenAspect = u_resolution.x / u_resolution.y;
            float imgAspect = 1.0; // Source image is 1024x1024 (square)
            vec2 bgUV = v_texCoord;
            bgUV.y = 1.0 - bgUV.y; // Flip Y for WebGL
            if (screenAspect > imgAspect) {
                float scale = imgAspect / screenAspect;
                bgUV.y = bgUV.y * scale + (1.0 - scale) * 0.5;
            } else {
                float scale = screenAspect / imgAspect;
                bgUV.x = bgUV.x * scale + (1.0 - scale) * 0.5;
            }
            vec3 imgColor = texture(uBackgroundTexture, bgUV).rgb;
            imgColor *= 0.55; // Dim the image
            
            finalBg = mix(uAuroraColor1, imgColor, 0.45);
            
            // --- Procedural Bubble Particles ---
            float bubbleAccum = 0.0;
            float aspect = u_resolution.x / u_resolution.y;
            vec2 uv = v_texCoord;
            uv.x *= aspect;
            
            // Layer 1: Small fast bubbles
            for (int i = 0; i < 12; i++) {
                float fi = float(i);
                float speed = 0.08 + fi * 0.012;
                float phase = fi * 1.618033;
                float xBase = fract(sin(fi * 127.1 + 311.7) * 43758.5453) * aspect;
                float yPos = fract(-u_time * speed + phase);
                float xOff = sin(u_time * 0.5 + fi * 2.4) * 0.03;
                float radius = 0.008 + fract(sin(fi * 43.7) * 4375.5) * 0.012;
                bubbleAccum += bubble(uv, vec2(xBase + xOff, yPos), radius) * 0.5;
            }
            
            // Layer 2: Larger slow bubbles
            for (int i = 0; i < 6; i++) {
                float fi = float(i) + 20.0;
                float speed = 0.03 + float(i) * 0.008;
                float phase = fi * 2.399;
                float xBase = fract(sin(fi * 73.3 + 157.9) * 43758.5) * aspect;
                float yPos = fract(-u_time * speed + phase);
                float xOff = sin(u_time * 0.3 + fi * 1.7) * 0.05;
                float radius = 0.018 + fract(sin(fi * 91.1) * 2175.3) * 0.015;
                bubbleAccum += bubble(uv, vec2(xBase + xOff, yPos), radius) * 0.35;
            }
            
            vec3 bubbleColor = vec3(0.68, 0.35, 0.88); // Borahae purple
            finalBg += bubbleColor * bubbleAccum;
            
        } else if (uBackgroundMode == 1) {
            // --- AURORA THEME: Rotating Gradient Blobs ---
            vec2 centered = v_texCoord - 0.5;
            centered.x *= u_resolution.x / u_resolution.y;
            
            float s = sin(u_time * 0.314159);
            float c = cos(u_time * 0.314159);
            vec2 rotated = vec2(
                centered.x * c - centered.y * s,
                centered.x * s + centered.y * c
            );
            
            float dist1 = length(rotated - vec2(0.45, 0.0));
            float dist2 = length(rotated - vec2(-0.45, 0.0));
            float blob1 = 1.0 - smoothstep(0.0, 1.2, dist1 * 1.8);
            float blob2 = 1.0 - smoothstep(0.0, 1.2, dist2 * 1.8);
            
            finalBg = uAuroraColor1;
            finalBg += (uAuroraColor2 - uAuroraColor1) * blob1;
            finalBg += (uAuroraColor3 - uAuroraColor1) * blob2;
            finalBg = clamp(finalBg, 0.0, 1.0);
            
        } else {
            // --- SOLID THEME: Base color ---
            finalBg = uAuroraColor1;
        }

        // Apply Grain (Noise) to all modes, but primarily intended for Solid
        if (uGrainIntensity > 0.0) {
            float n = noise(v_texCoord * 1000.0); // High frequency noise
            finalBg += (n - 0.5) * uGrainIntensity;
        }

        // --- Unified Frosted Glass Composition ---
        // 1. Saturated version for frosted transmission
        float luma = dot(finalBg, vec3(0.299, 0.587, 0.114));
        vec3 saturated = mix(vec3(luma), finalBg, 1.4);
        vec3 frosted = saturated + 0.12;
        
        // 2. Blend with blurred highlights
        float glassOpacity = min(blurred.a * 2.0, 1.0);
        vec3 glassColor = mix(frosted, blurred.rgb, 0.3);
        
        outColor = vec4(mix(finalBg, glassColor, glassOpacity), 1.0);

    } else {
        // Blur passes: just pass the Kawase blur along
        outColor = blurred;
    }
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
