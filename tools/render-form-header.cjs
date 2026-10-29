const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const bundledModules = path.join(
  process.env.USERPROFILE,
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
);
const { createCanvas, loadImage } = require(
  require.resolve("@napi-rs/canvas", { paths: [bundledModules] })
);
const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "assets", "hero-secondary.jpeg");
const outputDirectory = path.join(projectRoot, "materialy", "ankieta-google");

const trackedText = (context, text, x, baseline, spacing) => {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, baseline);
    cursor += context.measureText(character).width + spacing;
  }
};

const render = async () => {
  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceHash = crypto.createHash("sha256").update(sourceBytes).digest("hex");
  const photo = await loadImage(sourceBytes);
  const width = 1600;
  const height = 400;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#07101e");
  background.addColorStop(0.65, "#0b1b30");
  background.addColorStop(1, "#0b2642");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(43, 149, 255, 0.3)";
  context.lineWidth = 1;
  for (const startX of [680, 900, 1120]) {
    context.beginPath();
    context.moveTo(startX, height);
    context.lineTo(startX + 340, 0);
    context.stroke();
  }

  // Use the original photo with uniform scaling and cropping, without filters or retouching.
  const photoWidth = 610;
  const photoHeight = photoWidth * photo.height / photo.width;
  context.drawImage(photo, 990, -145, photoWidth, photoHeight);

  // Blend only the empty gym background at the left edge of the photograph.
  const edge = context.createLinearGradient(990, 0, 1060, 0);
  edge.addColorStop(0, "#0b1b30");
  edge.addColorStop(1, "rgba(11, 27, 48, 0)");
  context.fillStyle = edge;
  context.fillRect(990, 0, 70, height);

  context.font = '23px "Bahnschrift"';
  context.fillStyle = "#f2f5fb";
  trackedText(context, "ŁUKASZ JASZCZUR", 72, 62, 4);
  context.fillStyle = "#2bafff";
  trackedText(context, "| TRENER ONLINE", 410, 62, 3);

  let headlineSize = 102;
  const setHeadlineFont = () => {
    context.font = `italic ${headlineSize}px "Franklin Gothic Heavy"`;
  };
  setHeadlineFont();
  const headlineWidth = Math.max(
    context.measureText("Zbuduj formę,").width,
    context.measureText("którą utrzymasz.").width
  );
  if (headlineWidth > 925) {
    headlineSize *= 925 / headlineWidth;
    setHeadlineFont();
  }
  context.fillStyle = "#f7f8fc";
  context.fillText("Zbuduj formę,", 66, 174);
  context.fillStyle = "#22adf8";
  context.fillText("którą utrzymasz.", 66, 278);

  context.font = '28px "Bahnschrift"';
  context.fillStyle = "#e0e8f2";
  context.fillText("Indywidualny plan. Stałe wsparcie. Trwałe nawyki.", 72, 341);

  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "baner-oryginalne-zdjecie-1600x400.png");
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  const afterHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
  if (afterHash !== sourceHash) {
    throw new Error("Source photograph changed unexpectedly.");
  }
  console.log(JSON.stringify({ outputPath, width, height, originalPhotoUnchanged: true, sourceHash }, null, 2));
};

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
