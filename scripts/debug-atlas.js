/**
 * debug-atlas.js
 * Visual debugging tool for the TextureAtlas and SDFGenerator.
 * Renders the texture atlas to a visible canvas on the page.
 */

async function debugAtlas() {
    const { TextureAtlas } = await import('/Calculator/ui/webgl/atlas.js');
    
    // Create a visible debug container
    let debugContainer = document.getElementById('atlas-debug-container');
    if (!debugContainer) {
        debugContainer = document.createElement('div');
        debugContainer.id = 'atlas-debug-container';
        debugContainer.style.position = 'fixed';
        debugContainer.style.bottom = '10px';
        debugContainer.style.right = '10px';
        debugContainer.style.zIndex = '9999';
        debugContainer.style.background = 'rgba(0,0,0,0.8)';
        debugContainer.style.padding = '10px';
        debugContainer.style.border = '1px solid #0051cc';
        debugContainer.style.borderRadius = '8px';
        debugContainer.style.color = 'white';
        debugContainer.innerHTML = '<h3>Texture Atlas Debug</h3><p>Generating glyphs...</p>';
        document.body.appendChild(debugContainer);
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        debugContainer.innerHTML = '<h3>Error</h3><p>WebGL 2.0 not available.</p>';
        return;
    }

    const atlasSize = 512; // Smaller size for debug view
    const atlas = new TextureAtlas(gl, { size: atlasSize });

    // Generate a set of math symbols to fill the atlas
    const symbols = '0123456789+-*/=()\\alpha\\beta\\gamma\\delta\\sum\\int\\infty\\forall\\exists\\in\\notin\\ni\\prod';
    const font = '24px serif';
    
    for (const char of symbols) {
        atlas.getGlyph(char, font);
    }

    // Now, to visualize the texture, we need to read it back
    // WebGL doesn't let us read directly from a texture easily without a framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, atlas.texture, 0);

    const pixels = new Uint8Array(atlasSize * atlasSize * 4);
    // Since it's R8, it might not read back as RGBA easily depending on implementation
    // But we can try
    gl.readPixels(0, 0, atlasSize, atlasSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);

    // Render to a 2D canvas for display
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = atlasSize;
    displayCanvas.height = atlasSize;
    displayCanvas.style.border = '1px solid #ccc';
    displayCanvas.style.maxWidth = '300px';
    displayCanvas.style.maxHeight = '300px';
    const ctx = displayCanvas.getContext('2d');
    const imgData = ctx.createImageData(atlasSize, atlasSize);
    
    // Copy the R channel to RGB
    for (let i = 0; i < atlasSize * atlasSize; i++) {
        const val = pixels[i * 4];
        imgData.data[i * 4 + 0] = val; // R
        imgData.data[i * 4 + 1] = val; // G
        imgData.data[i * 4 + 2] = val; // B
        imgData.data[i * 4 + 3] = 255; // A
    }
    
    ctx.putImageData(imgData, 0, 0);
    debugContainer.innerHTML = '<h3>Texture Atlas Debug</h3>';
    debugContainer.appendChild(displayCanvas);
    debugContainer.innerHTML += `<p>Packed ${symbols.length} glyphs.</p>`;
}

// Export for console use
window.debugAtlas = debugAtlas;
console.log('debug-atlas.js loaded. Run window.debugAtlas() to see the texture atlas.');
