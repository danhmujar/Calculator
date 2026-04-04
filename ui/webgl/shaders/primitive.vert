#version 300 es
precision highp float;

/**
 * primitive.vert
 * A simple pass-through vertex shader for fullscreen quad rendering.
 * Maps [-1, 1] position to [0, 1] texture coordinates.
 */

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    // Pass UV coordinates to fragment shader
    v_texCoord = a_texCoord;
    
    // Position is already in clip space [-1, 1] for fullscreen quad
    gl_Position = vec4(a_position, 0.0, 1.0);
}
