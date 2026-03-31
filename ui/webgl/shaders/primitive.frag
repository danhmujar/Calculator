#version 300 es
precision highp float;

/**
 * primitive.frag
 * Fragment shader for high-precision UI primitives.
 * Implements SDF-based rounded rectangles with perfect anti-aliasing.
 */

uniform vec2 u_rectSize;
uniform float u_radius;
uniform vec4 u_color;

in vec2 v_texCoord; // Range [0, 1]
out vec4 outColor;

/**
 * SDF for a rounded rectangle.
 * p: current point (centered at 0,0)
 * b: half-extents (rectSize / 2)
 * r: corner radius
 */
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    // Map uv [0,1] to pixel space and center at 0,0
    vec2 p = (v_texCoord - 0.5) * u_rectSize;
    vec2 b = u_rectSize * 0.5;
    
    // Clamp radius to ensure it doesn't exceed half-extents
    float r = min(u_radius, min(b.x, b.y));
    
    // Calculate signed distance
    float d = sdRoundedBox(p, b, r);
    
    // Anti-aliased alpha mask using derivatives
    // fwidth(d) allows for sharp yet smooth edges regardless of zoom or scale
    float edge = fwidth(d);
    float alpha = 1.0 - smoothstep(-edge, edge, d);
    
    // Discard fragments that are completely transparent to avoid blending overhead
    if (alpha <= 0.0) discard;
    
    outColor = vec4(u_color.rgb, u_color.a * alpha);
}
