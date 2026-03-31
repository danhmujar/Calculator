#version 300 es

/**
 * primitive.vert
 * Vertex shader for UI primitive rendering.
 * Transforms a unit quad [0, 1] into screen-space coordinates.
 */

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_rectSize;
uniform vec2 u_offset;

out vec2 v_texCoord;

void main() {
    // Transform from unit quad to pixel coordinates
    vec2 pixelPos = a_position * u_rectSize + u_offset;
    
    // Convert pixels to clip space [-1, 1]
    // WebGL's clip space origin (0,0) is center, Y is up.
    // Our UI origin (0,0) is top-left, Y is down.
    vec2 zeroToOne = pixelPos / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
    
    // Pass UV coordinates to fragment shader
    v_texCoord = a_texCoord;
}
