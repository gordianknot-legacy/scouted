/**
 * Generate PWA icons from SVG template.
 * Usage: node scripts/generate-icons.js
 *
 * If canvas/sharp not available, creates SVG files that can be
 * converted manually or served directly.
 */
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const outDir = path.resolve('public/icons');

function makeSvg(size) {
  const pad = Math.round(size * 0.15);
  const boxSize = size - pad * 2;
  const cornerRadius = Math.round(size * 0.18);
  const fontSize = Math.round(boxSize * 0.42);
  const yOffset = Math.round(size * 0.56);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#00316B"/>
  <rect x="${pad}" y="${pad}" width="${boxSize}" height="${boxSize}" rx="${Math.round(cornerRadius * 0.6)}" fill="#FFD400"/>
  <text x="${size / 2}" y="${yOffset}" text-anchor="middle" font-family="Inter, Gill Sans MT, sans-serif" font-weight="800" font-size="${fontSize}" fill="#00316B">SE</text>
</svg>`;
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const svg = makeSvg(size);
  const svgPath = path.join(outDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${svgPath}`);
}

console.log('\nSVG icons created. Converting to PNG...');

// Try using resvg-js or sharp if available, otherwise use canvas-less approach
async function convertToPng() {
  try {
    // Try sharp first
    const sharp = (await import('sharp')).default;
    for (const size of sizes) {
      const svgPath = path.join(outDir, `icon-${size}.svg`);
      const pngPath = path.join(outDir, `icon-${size}.png`);
      await sharp(svgPath).resize(size, size).png().toFile(pngPath);
      console.log(`Converted to ${pngPath}`);
    }
  } catch {
    console.log('sharp not available. Using SVG icons directly in manifest.');
    console.log('To generate PNGs: npm i -D sharp && node scripts/generate-icons.js');

    // Update manifest to use SVG
    const manifestPath = path.resolve('public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    manifest.icons = sizes.map(size => ({
      src: `/icons/icon-${size}.svg`,
      sizes: `${size}x${size}`,
      type: 'image/svg+xml',
      purpose: 'any maskable',
    }));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log('Updated manifest.json to reference SVG icons.');
  }
}

await convertToPng();
