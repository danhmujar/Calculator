#version 300 es
precision highp float;

/**
 * primitive.frag
 * Implementation of a multi-pass Kawase blur.
 * Accepts a texture, resolution, and offset for iterative blurring.
 */

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uOffset; // Iteration of the blur pass (0.0, 1.0, 2.0, ...)

// Theme colors for Aurora effect
uniform vec3 uAuroraColor1;
uniform vec3 uAuroraColor2;
uniform vec3 uAuroraColor3;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    vec2 pixelSize = 1.0 / uResolution;
    
    // The +0.5 offset leverages linear filtering to sample 4 texels with one lookup.
    // This is the core of the Kawase blur algorithm for high performance.
    vec4 color = texture(uTexture, v_texCoord + (vec2(uOffset, uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(-uOffset, uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(-uOffset, -uOffset) + 0.5) * pixelSize);
    color += texture(uTexture, v_texCoord + (vec2(uOffset, -uOffset) + 0.5) * pixelSize);

    vec4 blurred = color * 0.25;

    // Apply colorizing only on the pass-through pass (uOffset == 0.0) 
    // or always? The plan implies using them for the final output.
    if (uOffset == 0.0) {
        // Simple procedural gradient based on texture coordinates to simulate Aurora feel
        float mixVal1 = v_texCoord.x * v_texCoord.y;
        float mixVal2 = (1.0 - v_texCoord.x) * (1.0 - v_texCoord.y);
        
        vec3 themeColor = mix(uAuroraColor1, uAuroraColor2, mixVal1);
        themeColor = mix(themeColor, uAuroraColor3, mixVal2);
        
        // Blend blurred texture (which contains UI highlights) with the theme color
        // The alpha of 'blurred' determines how much of the UI highlight is seen
        outColor = vec4(mix(themeColor, blurred.rgb, blurred.a), 1.0);
    } else {
        outColor = blurred;
    }
}
