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
const outputDirectory = path.join(projectRoot, "materialy", "facebook");

const trackedText = (context, text, x, baseline, spacing) => {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, baseline);
    cursor += context.measureText(character).width + spacing;
  }
};

const cropPreview = (source, crop, width, height) => {
  const preview = createCanvas(width, height);
  preview.getContext("2d").drawImage(
    source, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height
  );
  return preview;
};

const drawIcon = (context, type, x, y) => {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#43b8ff";
  context.fillStyle = "#0b1b30";
  context.lineWidth = 2.4;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (type === "online") {
    context.beginPath();
    context.roundRect(1, 7, 31, 22, 3);
    context.stroke();
    context.beginPath();
    context.moveTo(16.5, 29);
    context.lineTo(16.5, 36);
    context.moveTo(8, 36);
    context.lineTo(25, 36);
    context.stroke();
    context.beginPath();
    context.moveTo(23, 1);
    context.lineTo(40, 1);
    context.quadraticCurveTo(43, 1, 43, 4);
    context.lineTo(43, 13);
    context.quadraticCurveTo(43, 16, 40, 16);
    context.lineTo(30, 16);
    context.lineTo(24, 21);
    context.lineTo(24, 16);
    context.lineTo(23, 16);
    context.quadraticCurveTo(20, 16, 20, 13);
    context.lineTo(20, 4);
    context.quadraticCurveTo(20, 1, 23, 1);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(26, 8);
    context.lineTo(36, 8);
    context.stroke();
  } else if (type === "plan") {
    context.beginPath();
    context.roundRect(5, 3, 29, 34, 4);
    context.stroke();
    context.beginPath();
    context.roundRect(13, 0, 13, 7, 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(12, 14);
    context.lineTo(27, 14);
    context.moveTo(10, 26);
    context.lineTo(29, 26);
    context.moveTo(11, 21);
    context.lineTo(11, 31);
    context.moveTo(15, 23);
    context.lineTo(15, 29);
    context.moveTo(24, 23);
    context.lineTo(24, 29);
    context.moveTo(28, 21);
    context.lineTo(28, 31);
    context.stroke();
  } else if (type === "meals") {
    context.beginPath();
    context.arc(21, 19, 11, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(21, 19, 6.5, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(3, 3);
    context.lineTo(3, 13);
    context.moveTo(0, 3);
    context.lineTo(0, 11);
    context.quadraticCurveTo(0, 16, 3, 16);
    context.quadraticCurveTo(6, 16, 6, 11);
    context.lineTo(6, 3);
    context.moveTo(3, 16);
    context.lineTo(3, 35);
    context.moveTo(40, 3);
    context.quadraticCurveTo(34, 9, 36, 20);
    context.lineTo(40, 20);
    context.moveTo(40, 3);
    context.lineTo(40, 35);
    context.stroke();
  } else if (type === "medal") {
    context.beginPath();
    context.arc(12, 9, 7, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(7, 15);
    context.lineTo(5, 25);
    context.lineTo(12, 21);
    context.lineTo(19, 25);
    context.lineTo(17, 15);
    context.stroke();
  }
  context.restore();
};

const render = async () => {
  const originalBytes = fs.readFileSync(sourcePath);
  const originalHash = crypto.createHash("sha256").update(originalBytes).digest("hex");
  const photo = await loadImage(originalBytes);
  const width = 1640;
  const height = 720;
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
  for (const startX of [640, 860, 1080]) {
    context.beginPath();
    context.moveTo(startX, height);
    context.lineTo(startX + 610, 0);
    context.stroke();
  }

  // Keep the photograph intact: only proportional scaling and placement.
  const photoWidth = 690;
  context.drawImage(photo, 950, -105, photoWidth, photoWidth * photo.height / photo.width);

  // Blend the empty background, stopping before the person's outline.
  const edge = context.createLinearGradient(950, 0, 1030, 0);
  edge.addColorStop(0, "#0b1b30");
  edge.addColorStop(1, "rgba(11, 27, 48, 0)");
  context.fillStyle = edge;
  context.fillRect(950, 0, 80, height);

  context.font = '21px "Bahnschrift"';
  context.fillStyle = "#f2f5fb";
  trackedText(context, "ŁUKASZ JASZCZUR", 270, 90, 3);
  context.fillStyle = "#2bafff";
  trackedText(context, "| TRENER ONLINE", 570, 90, 2.5);

  context.fillStyle = "rgba(43, 149, 255, 0.09)";
  context.strokeStyle = "rgba(67, 184, 255, 0.3)";
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(270, 111, 383, 41, 12);
  context.fill();
  context.stroke();
  drawIcon(context, "medal", 282, 118);
  context.font = '20px "Bahnschrift"';
  context.fillStyle = "#d6e9fa";
  context.fillText("2× mistrz Polski Men's Physique", 318, 138);

  const lines = ["Zbuduj formę,", "z której będziesz", "dumny."];
  const headlineX = 264;
  const headlineRightLimit = 914;
  let headlineSize = 98;
  const setHeadlineFont = () => {
    context.font = `italic ${headlineSize}px "Franklin Gothic Heavy"`;
  };
  setHeadlineFont();
  const measureHeadline = () => Math.max(...lines.map((line) => {
    const metrics = context.measureText(line);
    return Math.max(metrics.width, metrics.actualBoundingBoxRight);
  }));
  while (headlineX + measureHeadline() > headlineRightLimit) {
    headlineSize -= 0.25;
    setHeadlineFont();
  }
  const headlineRightEdge = headlineX + measureHeadline();
  lines.forEach((line, index) => {
    context.fillStyle = index === 0 ? "#f7f8fc" : "#22adf8";
    context.fillText(line, headlineX, 245 + index * 93);
  });

  context.font = '22px "Bahnschrift"';
  context.fillStyle = "#e0e8f2";
  context.fillText("Indywidualny plan. Stałe wsparcie. Trwałe nawyki.", 270, 480);

  context.strokeStyle = "rgba(67, 184, 255, 0.25)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(270, 509);
  context.lineTo(918, 509);
  context.stroke();

  const services = [
    { x: 270, icon: "online", lines: ["Prowadzenie", "online 1:1"] },
    { x: 490, icon: "plan", lines: ["Indywidualny", "plan treningowy"] },
    { x: 710, icon: "meals", lines: ["Dieta i posiłki", "dopasowane do Ciebie"] },
  ];
  services.forEach((service) => {
    drawIcon(context, service.icon, service.x, 528);
    context.fillStyle = "#e0e8f2";
    context.font = '20px "Bahnschrift"';
    context.fillText(service.lines[0], service.x, 590);
    context.fillStyle = "#a9c1d8";
    context.font = '19px "Bahnschrift"';
    context.fillText(service.lines[1], service.x, 617);
  });

  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "okladka-facebook-v2-1640x720.png");
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

  const desktop = cropPreview(canvas, { x: 0, y: 48, width: 1640, height: 624 }, 820, 312);
  const mobile = cropPreview(canvas, { x: 180, y: 0, width: 1280, height: 720 }, 640, 360);
  fs.writeFileSync(path.join(outputDirectory, "podglad-v2-desktop-820x312.png"), desktop.toBuffer("image/png"));
  fs.writeFileSync(path.join(outputDirectory, "podglad-v2-mobile-640x360.png"), mobile.toBuffer("image/png"));

  const sourceCropHeight = width * 315 / 851;
  const compact = cropPreview(canvas, {
    x: 0, y: (height - sourceCropHeight) / 2, width, height: sourceCropHeight
  }, 1702, 630);
  fs.writeFileSync(path.join(outputDirectory, "okladka-facebook-v2-1702x630.png"), compact.toBuffer("image/png"));

  const afterHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
  if (afterHash !== originalHash) {
    throw new Error("The original photograph was changed.");
  }
  console.log(JSON.stringify({
    outputPath, width, height, originalPhotoUnchanged: true,
    originalHash, headlineSize, headline: lines.join(" "),
    headlineRightEdge,
    headlineRightLimit
  }, null, 2));
};

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
