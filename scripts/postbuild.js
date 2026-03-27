const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist exists (it should, after vite build)
if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Run vite build first.');
    process.exit(1);
}

// Vite's public/ directory already copies sw.js, manifest.json, icons, etc.
// to dist/ root. We only need to TRANSFORM sw.js to reference Vite-bundled assets.

const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Dynamically pick up whatever JS/CSS Vite built into dist/assets
    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.readdirSync(assetsDir).filter(f => /\.(js|css)$/.test(f));
    const assetUrls = assetFiles.map(f => `'./assets/${f}',`).join('\n    ');

    // Replace the block of local 3-tier files with the Vite-bundled assets
    swContent = swContent.replace(
        /'\.\/services\/app\.js',\s*'\.\/ui\/ui\.js',\s*'\.\/ui\/styles\.css',/,
        assetUrls
    );

    // --- Font path rewriting ---
    // Vite inlines fonts.css into index.css, so remove the standalone entry
    swContent = swContent.replace(/\s*'\.\/ui\/fonts\.css',/, '');

    // Get actual font files in dist/assets
    const distFonts = fs.readdirSync(assetsDir).filter(f => f.endsWith('.woff2'));

    // Replace the entire block of ./ui/fonts/* entries with ./assets/* entries
    swContent = swContent.replace(
        /\/\/ Local Fonts[\s\S]*?'\.\/ui\/fonts\/font-\d+\.woff2',/g,
        '// Local Fonts (Vite-resolved)\n    ' + distFonts.map(f => `'./assets/${f}',`).join(' ')
    );

    // Remove any remaining ./ui/fonts references that didn't match the block
    swContent = swContent.replace(/ *'\.\/ui\/fonts\/font-\d+\.woff2',?\n?/g, '');

    // Rewrite isFont handler to match Vite's asset path instead of ./ui/fonts/
    swContent = swContent.replace(
        "url.includes('/ui/fonts/')",
        "url.endsWith('.woff2')"
    );

    // Inject cache-busting timestamp to CACHE_NAME to ensure SW updates when built
    const timestamp = new Date().getTime();
    swContent = swContent.replace(/const CACHE_NAME = 'calc-[^']+';/, `const CACHE_NAME = 'calc-v13-build-${timestamp}';`);

    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`Transformed dist/sw.js for production assets: ${assetFiles.join(', ')}`);
    console.log(`Included ${distFonts.length} font files in precache.`);
} else {
    console.error('dist/sw.js not found! Ensure sw.js is in public/.');
    process.exit(1);
}
