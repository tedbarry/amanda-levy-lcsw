const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimize() {
  const src = 'src/img/headshot.jpeg';
  const outDir = 'dist/img';
  fs.mkdirSync(outDir, { recursive: true });

  // Copy original
  fs.copyFileSync(src, path.join(outDir, 'headshot.jpeg'));

  // Copy favicon
  fs.copyFileSync('src/img/favicon.svg', path.join(outDir, 'favicon.svg'));

  // Generate WebP
  await sharp(src).webp({ quality: 80 }).toFile(path.join(outDir, 'headshot.webp'));

  // Generate AVIF
  await sharp(src).avif({ quality: 65 }).toFile(path.join(outDir, 'headshot.avif'));

  console.log('Images optimized: headshot.webp, headshot.avif created.');
}

optimize().catch(err => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
