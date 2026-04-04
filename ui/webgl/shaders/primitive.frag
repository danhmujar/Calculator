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

    outColor = color * 0.25;
}
