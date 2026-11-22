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
const desktop = path.join(os.homedir(), "Desktop");
const temp = os.tmpdir();

const assets = [
  {
    source: path.join(desktop, "PROGRAMOWANIE TRENINGU SI\u0141OWEGO CERTYFIKAT_page-0001.jpg"),
    output: "certyfikat-programowanie-treningu-silowego.jpg",
    scan: true,
  },
  {
    source: path.join(desktop, "certificate-ABC-po\u015bladki_page-0001.jpg"),
    output: "certyfikat-abc-ksztaltowania-posladkow.jpg",
    scan: true,
  },
  {
    source: path.join(temp, "codex-clipboard-e807f072-4ac8-4a69-8741-a7f645375eee.png"),
    output: "lukasz-trening-sylwetka.webp",
  },
  {
    source: path.join(temp, "codex-clipboard-e80726f9-8339-494f-8c9b-a43cb633dc86.png"),
    output: "lukasz-trener-personalny-wegrow.webp",
  },
];

const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function main() {
  for (const asset of assets) {
    const source = await fs.readFile(asset.source);
    const destination = path.join(assetDirectory, asset.output);

    if (asset.scan) {
      await fs.copyFile(asset.source, destination);
      await sharp(source)
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 90, effort: 6 })
        .toFile(destination.replace(/\.jpg$/, ".webp"));
    } else {
      // Only resize and encode: no retouching, filters, or generated content.
      await sharp(source)
        .rotate()
        .resize({ height: 2000, withoutEnlargement: true })
        .webp({ quality: 90, effort: 6 })
        .toFile(destination);
    }

    const result = await fs.readFile(destination);
    const metadata = await sharp(result).metadata();
    const unchanged = hash(source) === hash(await fs.readFile(asset.source));
    if (!unchanged || (asset.scan && hash(source) !== hash(result))) {
      throw new Error(`Source preservation failed: ${asset.output}`);
    }
    console.log(JSON.stringify({
      file: asset.output,
      width: metadata.width,
      height: metadata.height,
      bytes: result.length,
      sourceUnchanged: unchanged,
      exactScanCopy: asset.scan || undefined,
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
