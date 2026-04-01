import { test, expect } from '@playwright/test';

test.describe('Shader Infrastructure', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });

    test('ShaderManager compiles and links PRIMITIVE shaders successfully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG } = await import('/Calculator/ui/webgl/shaders.js');
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            if (!gl) return { error: 'WebGL 2.0 not available' };

            try {
                const program = ShaderManager.createProgram(gl, PRIMITIVE_VERT, PRIMITIVE_FRAG);
                return {
                    success: !!program,
                    programLinked: gl.getProgramParameter(program, gl.LINK_STATUS)
                };
            } catch (err) {
                return { error: err.message };
            }
        });

        if (result.error) {
            console.error('Shader Compilation Error:', result.error);
        }

        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
        expect(result.programLinked).toBe(true);
    });

    test('Primitive fragment shader implements sdRoundedBox and anti-aliasing', async ({ page }) => {
        const shaderSource = await page.evaluate(async () => {
            const { PRIMITIVE_FRAG } = await import('/Calculator/ui/webgl/shaders.js');
            return PRIMITIVE_FRAG;
        });

        // Heuristic check for the logic mentioned in RESEARCH.md
        expect(shaderSource).toContain('sdRoundedBox');
        expect(shaderSource).toContain('fwidth');
        expect(shaderSource).toContain('smoothstep');
        expect(shaderSource).toContain('discard');
    });

    test('Primitive vertex shader implements top-left coordinate system (0,0)', async ({ page }) => {
        const vertSource = await page.evaluate(async () => {
            const { PRIMITIVE_VERT } = await import('/Calculator/ui/webgl/shaders.js');
            return PRIMITIVE_VERT;
        });

        // Verification of coordinate math: (pixelPos / u_resolution) * 2.0 - 1.0, then flipping Y
        expect(vertSource).toContain('gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1)');
        expect(vertSource).toContain('pixelPos = a_position * u_rectSize + u_offset');
    });

    test('All shaders implement GlobalState UBO block', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG, BATCH_VERT, BATCH_FRAG } = await import('/Calculator/ui/webgl/shaders.js');
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            if (!gl) return { error: 'WebGL 2.0 not available' };

            const programs = [
                ShaderManager.createProgram(gl, PRIMITIVE_VERT, PRIMITIVE_FRAG),
                ShaderManager.createProgram(gl, BATCH_VERT, BATCH_FRAG)
            ];

            const blockName = 'GlobalState';
            return programs.map(prog => {
                const index = gl.getUniformBlockIndex(prog, blockName);
                return {
                    name: prog.label || 'program',
                    hasBlock: index !== gl.INVALID_INDEX,
                    index: index
                };
            });
        });

        expect(result).toHaveLength(2);
        result.forEach(prog => {
            expect(prog.hasBlock).toBe(true);
            expect(prog.index).toBeGreaterThanOrEqual(0);
        });
    });
});
