const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");

const bundledModules = path.join(
  os.homedir(),
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
);
const sharp = require(require.resolve("sharp", { paths: [bundledModules] }));
const assetDirectory = path.resolve(__dirname, "../assets");

const documents = [
  {
    name: "s4-zaswiadczenie-zanonimizowane",
    regions: [[[123, 143], [839, 149], [873, 1221], [45, 1210]]],
    pageWidth: 860,
    pageHeight: 1216,
    mask: [579, 494, 128, 36],
    gain: [1.05, 1.1, 1.19],
    offset: -8,
  },
  {
    name: "s4-certyfikat-zanonimizowany",
    regions: [[[167, 126], [898, 126], [914, 1245], [80, 1207]]],
    pageWidth: 860,
    pageHeight: 1216,
    mask: [300, 510, 215, 30],
    gain: [1.05, 1.1, 1.19],
    offset: -8,
  },
  {
    name: "s4-legitymacja-zanonimizowana",
    regions: [
      [[89, 405], [449, 435], [455, 912], [88, 965]],
      [[451, 435], [796, 416], [825, 908], [456, 910]],
    ],
    pageWidth: 520,
    pageHeight: 736,
    mask: [183, 587, 157, 30],
    gain: [1.06, 1.09, 1.16],
    offset: -6,
    preserveTone: [553, 612, 174, 208],
  },
];

const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
const contains = (box, x, y) =>
  box && x >= box[0] && y >= box[1] && x < box[0] + box[2] && y < box[1] + box[3];

function correctTone(pixels, width, height, document) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (contains(document.preserveTone, x, y)) continue;
      const index = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        pixels[index + channel] = clamp(
          pixels[index + channel] * document.gain[channel] + document.offset
        );
      }
    }
  }
}

function redact(pixels, width, height, box) {
  const [left, top, boxWidth, boxHeight] = box;
  const feather = 3;
  const neutral = [215, 218, 220];
  for (let y = top - feather; y < top + boxHeight + feather; y += 1) {
    for (let x = left - feather; x < left + boxWidth + feather; x += 1) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const distance = Math.max(left - x, top - y, x - (left + boxWidth - 1), y - (top + boxHeight - 1), 0);
      const alpha = Math.max(0, 1 - distance / feather);
      const index = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        // The entire sensitive core is replaced, not merely blurred or overlaid in CSS.
        pixels[index + channel] = clamp(
          neutral[channel] * alpha + pixels[index + channel] * (1 - alpha)
        );
      }
    }
  }
  for (let y = top; y < top + boxHeight; y += 1) {
    for (let x = left; x < left + boxWidth; x += 1) {
      const index = (y * width + x) * 3;
      if (neutral.some((value, channel) => pixels[index + channel] !== value)) {
        throw new Error("Redaction core was not fully replaced");
      }
    }
  }
}

function perspective(quad) {
  const [a, b, c, d] = quad;
  const dx1 = b[0] - c[0];
  const dx2 = d[0] - c[0];
  const dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1];
  const dy2 = d[1] - c[1];
  const dy3 = a[1] - b[1] + c[1] - d[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  return [b[0] - a[0] + g * b[0], d[0] - a[0] + h * d[0], a[0],
    b[1] - a[1] + g * b[1], d[1] - a[1] + h * d[1], a[1], g, h];
}

function straighten(source, width, height, document) {
  const outputWidth = document.pageWidth * document.regions.length;
  const outputHeight = document.pageHeight;
  const output = Buffer.alloc(outputWidth * outputHeight * 3, 255);
  document.regions.forEach((quad, page) => {
    const [a, b, c, d, e, f, g, h] = perspective(quad);
    for (let y = 0; y < outputHeight; y += 1) {
      const v = y / (outputHeight - 1);
      for (let x = 0; x < document.pageWidth; x += 1) {
        const u = x / (document.pageWidth - 1);
        const denominator = g * u + h * v + 1;
        const sx = Math.max(0, Math.min(width - 1.001, (a * u + b * v + c) / denominator));
        const sy = Math.max(0, Math.min(height - 1.001, (d * u + e * v + f) / denominator));
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const tx = sx - x0;
        const ty = sy - y0;
        const target = (y * outputWidth + page * document.pageWidth + x) * 3;
        for (let channel = 0; channel < 3; channel += 1) {
          const sample = (px, py) => source[(py * width + px) * 3 + channel];
          output[target + channel] = clamp(
            sample(x0, y0) * (1 - tx) * (1 - ty) +
            sample(x0 + 1, y0) * tx * (1 - ty) +
            sample(x0, y0 + 1) * (1 - tx) * ty +
            sample(x0 + 1, y0 + 1) * tx * ty
          );
        }
      }
    }
  });
  return { pixels: output, width: outputWidth, height: outputHeight };
}

async function main() {
  const sources = process.argv.slice(2);
  if (sources.length !== documents.length) {
    throw new Error("Provide the Polish certificate, English certificate, and instructor card photo paths");
  }
  for (const [index, document] of documents.entries()) {
    const original = await fs.readFile(sources[index]);
    const decoded = await sharp(original).toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (decoded.info.width !== 960 || decoded.info.height !== 1280 || decoded.info.channels !== 3) {
      throw new Error("Unexpected source dimensions; review crop and redaction coordinates first");
    }
    correctTone(decoded.data, 960, 1280, document);
    redact(decoded.data, 960, 1280, document.mask);
    // All output files are derived only from this already-redacted pixel buffer.
    const scan = straighten(decoded.data, 960, 1280, document);
    const image = sharp(scan.pixels, { raw: { width: scan.width, height: scan.height, channels: 3 } });
    const full = path.join(assetDirectory, `${document.name}.jpg`);
    const thumbnail = path.join(assetDirectory, `${document.name}.webp`);
    await image.clone().jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(full);
    await image.clone().resize({ width: 520, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(thumbnail);
    if (hash(original) !== hash(await fs.readFile(sources[index]))) {
      throw new Error("Original document was modified");
    }
    const metadata = await sharp(full).metadata();
    if (metadata.exif || metadata.xmp || metadata.iptc) {
      throw new Error("Unexpected private metadata in output");
    }
    console.log(JSON.stringify({ file: path.basename(full), width: scan.width, height: scan.height,
      bytes: (await fs.stat(full)).size, sourceUnchanged: true, redactedBeforeExport: true, metadataStripped: true }));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
