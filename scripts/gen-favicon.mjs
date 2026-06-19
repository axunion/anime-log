/**
 * Generate favicon assets from favicon.svg
 *   - public/apple-touch-icon.png  (180x180)
 *   - public/favicon.ico           (32x32, PNG-in-ICO)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const sharp = require(
  resolve(
    root,
    "node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js",
  ),
);

const svgPath = resolve(root, "src/client/public/favicon.svg");
const svgBuf = readFileSync(svgPath);

// ── apple-touch-icon.png (180x180) ───────────────────────────────────────────
const touchIconPath = resolve(root, "src/client/public/apple-touch-icon.png");
await sharp(svgBuf, { density: 300 })
  .resize(180, 180)
  .png()
  .toFile(touchIconPath);
console.log("✓ apple-touch-icon.png (180x180)");

// ── favicon.ico (32x32, PNG embedded in ICO) ─────────────────────────────────
const pngBuf = await sharp(svgBuf, { density: 300 })
  .resize(32, 32)
  .png()
  .toBuffer();

// ICO format: header(6) + directory(16) + PNG data
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = 1 (icon)
header.writeUInt16LE(1, 4); // image count = 1

const dir = Buffer.alloc(16);
dir.writeUInt8(32, 0); // width
dir.writeUInt8(32, 1); // height
dir.writeUInt8(0, 2); // color count (0 = no palette)
dir.writeUInt8(0, 3); // reserved
dir.writeUInt16LE(1, 4); // planes
dir.writeUInt16LE(32, 6); // bit count
dir.writeUInt32LE(pngBuf.length, 8); // size of image data
dir.writeUInt32LE(22, 12); // offset to image data (6 + 16)

const icoPath = resolve(root, "src/client/public/favicon.ico");
writeFileSync(icoPath, Buffer.concat([header, dir, pngBuf]));
console.log("✓ favicon.ico (32x32)");
