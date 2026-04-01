import { test, expect } from '@playwright/test';

test('WebGL 2.0 Actual Shader Compilation', async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
    const result = await page.evaluate(async () => {
        const { PRIMITIVE_VERT, PRIMITIVE_FRAG } = await import('./ui/webgl/shaders.js');
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        if (!gl) return { error: 'No WebGL 2.0' };
        
        const compile = (type, source) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            return { 
                status: gl.getShaderParameter(s, gl.COMPILE_STATUS), 
                log: gl.getShaderInfoLog(s) 
            };
        };

        return { 
            vs: compile(gl.VERTEX_SHADER, PRIMITIVE_VERT),
            fs: compile(gl.FRAGMENT_SHADER, PRIMITIVE_FRAG)
        };
    });
    console.log(JSON.stringify(result, null, 2));
});
