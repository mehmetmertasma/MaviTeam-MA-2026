// Renders every MaviTeam app/web icon from one vector definition of the logo
// (the same shapes as assets/images/logo.svg), so all sizes stay in sync.
// Usage: node scripts/render-brand-icons.js
const path = require("path");
const Jimp = require("jimp-compact");

const BLUE = [0x2b, 0x6b, 0xff];
const CYAN = [0x7f, 0xe3, 0xec];
const WHITE = [0xff, 0xff, 0xff];

// Logo geometry on a 1024 x 1024 canvas.
const CORNER_RADIUS = 225;
const STROKE_RADIUS = 45;
const HEAD_RADIUS = 72;
const DOT_RADIUS = 61;
const heads = [[348, 297], [676, 297]];
const dot = [512, 410];
const mStroke = [[225, 780], [348, 447], [512, 654], [676, 447], [799, 780]];
// Bounding box of the mark (heads + M), used to fit it into other canvases.
const MARK_BOX = { x0: 180, x1: 844, y0: 225, y1: 825 };

const ROOT = path.join(__dirname, "..");

function segmentDistance(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function insideRoundedSquare(x, y) {
  const qx = Math.max(Math.abs(x - 512) - (512 - CORNER_RADIUS), 0);
  const qy = Math.max(Math.abs(y - 512) - (512 - CORNER_RADIUS), 0);
  return Math.hypot(qx, qy) <= CORNER_RADIUS;
}

function insideMark(x, y) {
  if (heads.some(([cx, cy]) => Math.hypot(x - cx, y - cy) <= HEAD_RADIUS)) return true;
  for (let i = 0; i < mStroke.length - 1; i++) {
    if (segmentDistance(x, y, mStroke[i], mStroke[i + 1]) <= STROKE_RADIUS) return true;
  }
  return false;
}

function insideDot(x, y) {
  return Math.hypot(x - dot[0], y - dot[1]) <= DOT_RADIUS;
}

// background: "square" (full bleed), "rounded", or null (transparent).
// mark/dotColor: colors for the white shapes and the cyan dot.
// fit: fraction of the canvas the mark's larger side should fill; when unset
// the mark keeps its position inside the 1024 icon.
async function render(file, size, { background, markColor = WHITE, dotColor = CYAN, fit }) {
  let scale = 1024 / size;
  let offsetX = 0;
  let offsetY = 0;

  if (fit !== undefined) {
    const boxSize = Math.max(MARK_BOX.x1 - MARK_BOX.x0, MARK_BOX.y1 - MARK_BOX.y0);
    scale = boxSize / (fit * size);
    offsetX = (MARK_BOX.x0 + MARK_BOX.x1) / 2 - (size / 2) * scale;
    offsetY = (MARK_BOX.y0 + MARK_BOX.y1) / 2 - (size / 2) * scale;
  }

  const image = new Jimp(size, size, 0x00000000);
  const samples = 4;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (px + (sx + 0.5) / samples) * scale + offsetX;
          const y = (py + (sy + 0.5) / samples) * scale + offsetY;
          let color = null;

          if (background === "square" || (background === "rounded" && insideRoundedSquare(x, y))) color = BLUE;
          if (insideMark(x, y)) color = markColor;
          if (insideDot(x, y)) color = dotColor;

          if (color !== null) {
            r += color[0]; g += color[1]; b += color[2]; a += 1;
          }
        }
      }

      if (a > 0) {
        const alpha = Math.round((a / (samples * samples)) * 255);
        image.setPixelColor(Jimp.rgbaToInt(Math.round(r / a), Math.round(g / a), Math.round(b / a), alpha), px, py);
      }
    }
  }

  await image.writeAsync(path.join(ROOT, file));
  console.log("wrote", file);
}

(async () => {
  // iOS / App Store / Play Store icon: full bleed, the OS rounds the corners.
  await render("assets/images/icon.png", 1024, { background: "square" });
  // Android adaptive icon: the mark must sit inside the central safe zone.
  await render("assets/images/android-icon-foreground.png", 512, { background: null, fit: 0.5 });
  await render("assets/images/android-icon-background.png", 512, { background: "square", markColor: BLUE, dotColor: BLUE });
  await render("assets/images/android-icon-monochrome.png", 432, { background: null, dotColor: WHITE, fit: 0.5 });
  await render("assets/images/splash-icon.png", 512, { background: null, fit: 0.9 });
  await render("assets/images/favicon.png", 48, { background: "rounded" });
  // Web: link previews, structured-data logo, and touch icon.
  await render("public/logo.png", 1024, { background: "rounded" });
  await render("public/apple-touch-icon.png", 180, { background: "square" });
})();
