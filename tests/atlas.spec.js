import { test, expect } from '@playwright/test';

test.describe('Texture Atlas and SDF Generation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });

    test('TextureAtlas handles glyph packing and returns UVs', async ({ page }) => {
        const result = await page.evaluate(async () => {
            try {
                const { TextureAtlas } = await import('/Calculator/ui/webgl/atlas.js');
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2');
                if (!gl) return { error: 'WebGL 2.0 not available' };

                const atlas = new TextureAtlas(gl, { size: 1024 });
                const glyph1 = atlas.getGlyph('A', '16px Arial');
                const glyph2 = atlas.getGlyph('B', '16px Arial');

                return {
                    glyph1,
                    glyph2,
                    different: glyph1.u !== glyph2.u || glyph1.v !== glyph2.v,
                    validUVs: glyph1.u >= 0 && glyph1.u <= 1 && glyph1.v >= 0 && glyph1.v <= 1
                };
            } catch (err) {
                return { error: err.message };
            }
        });

        if (result.error) {
            console.error('Atlas Error:', result.error);
        }

        expect(result.error).toBeUndefined();
        expect(result.glyph1).toBeDefined();
        expect(result.glyph2).toBeDefined();
        expect(result.different).toBe(true);
        expect(result.validUVs).toBe(true);
    });

    test('SDFGenerator produces valid distance data', async ({ page }) => {
        const result = await page.evaluate(async () => {
            try {
                const { SDFGenerator } = await import('/Calculator/ui/webgl/atlas.js');
                const sdf = SDFGenerator.generate('A', '64px serif', { buffer: 3, radius: 8 });

                // Check if we got an object with data and dimensions
                const hasData = sdf.data instanceof Uint8Array || sdf.data instanceof Float32Array;
                const midValue = sdf.data[Math.floor(sdf.data.length / 2)];

                return {
                    width: sdf.width,
                    height: sdf.height,
                    hasData,
                    dataLength: sdf.data.length,
                    midValue // Should be around 128 for 8-bit SDF if at edge
                };
            } catch (err) {
                return { error: err.message };
            }
        });

        expect(result.error).toBeUndefined();
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(result.hasData).toBe(true);
        expect(result.dataLength).toBe(result.width * result.height);
    });

    test('TextureAtlas dynamically updates WebGL texture', async ({ page }) => {
        const result = await page.evaluate(async () => {
            try {
                const { TextureAtlas } = await import('/Calculator/ui/webgl/atlas.js');
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2');
                const atlas = new TextureAtlas(gl, { size: 512 });

                // Add glyph to trigger texture update
                atlas.getGlyph('X', '24px sans-serif');

                return {
                    textureExists: !!atlas.texture,
                    isTexture: gl.isTexture(atlas.texture)
                };
            } catch (err) {
                return { error: err.message };
            }
        });

        expect(result.error).toBeUndefined();
        expect(result.textureExists).toBe(true);
        expect(result.isTexture).toBe(true);
    });
});
