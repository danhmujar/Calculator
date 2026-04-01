import { test, expect } from '@playwright/test';

test.describe('WebGL Shader Infrastructure (07-02)', () => {
    test.beforeEach(async ({ page }) => {
        // Correct base path for this project's Vite config
        await page.goto('http://localhost:5173/Calculator/');
    });

    test('ShaderManager compiles and links shaders successfully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            try {
                // Dynamically import from relative path
                const { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG } = await import('./ui/webgl/shaders.js');
                const canvas = document.getElementById('webgl-underlay');
                if (!canvas) return { error: 'Canvas #webgl-underlay not found' };
                
                const gl = canvas.getContext('webgl2');
                if (!gl) return { error: 'WebGL 2.0 context not available' };
                
                const program = ShaderManager.createProgram(gl, PRIMITIVE_VERT, PRIMITIVE_FRAG);
                const isProgram = gl.isProgram(program);
                const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);

                // Test uniform updates (bulk update check)
                const uniforms = {
                    u_resolution: [canvas.width, canvas.height],
                    u_rectSize: [100.0, 100.0],
                    u_radius: 10.0,
                    u_color: [1.0, 0.0, 0.0, 1.0],
                    u_offset: [50.0, 50.0]
                };
                ShaderManager.setUniforms(gl, program, uniforms);

                return {
                    success: true,
                    isProgram,
                    linkStatus,
                    error: null
                };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });

        if (result.error) {
            console.error('Shader Evaluation Error:', result.error);
        }

        expect(result.success).toBe(true);
        expect(result.isProgram).toBe(true);
        expect(result.linkStatus).toBe(true);
    });

    test('Shader source contains SDF logic (sdRoundedBox) and anti-aliasing', async ({ page }) => {
        const shaderData = await page.evaluate(async () => {
            const { PRIMITIVE_FRAG, PRIMITIVE_VERT } = await import('./ui/webgl/shaders.js');
            return { frag: PRIMITIVE_FRAG, vert: PRIMITIVE_VERT };
        });
        
        expect(shaderData.frag).toContain('sdRoundedBox');
        expect(shaderData.frag).toContain('fwidth');
        expect(shaderData.frag).toContain('smoothstep');
        expect(shaderData.vert).toContain('gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1)');
    });
});
