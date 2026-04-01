import { test, expect } from '@playwright/test';

test('WebGL 2.0 Simple Shader Compilation', async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
    const result = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        if (!gl) return { error: 'No WebGL 2.0 context' };
        
        const vsSource = '#version 300 es\nvoid main() { gl_Position = vec4(0,0,0,1); }';
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        
        const status = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
        const log = gl.getShaderInfoLog(vs);
        
        return { 
            contextExists: !!gl,
            status, 
            log: log || 'empty log',
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER)
        };
    });
    console.log(JSON.stringify(result, null, 2));
});
