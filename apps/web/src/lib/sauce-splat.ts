// A tomato sauce splat at a screen point that then dribbles down the page.
// It draws on its own fixed canvas above the UI, ignores the pointer so the
// page stays clickable, and fades out and removes itself after a few seconds.

const SAUCE = "#b5150b";
const SAUCE_DARK = "#7a0c05";
const SAUCE_LIGHT = "#e0391f";
const SHINE = "rgba(255, 255, 255, 0.35)";
const LIFETIME_MS = 7000;
const FADE_MS = 1200;

interface Drip {
  length: number;
  speed: number;
  top: number;
  width: number;
  x: number;
}

const between = (min: number, max: number) => min + Math.random() * (max - min);

function drawBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  const points = 22;
  const outline = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    // A few longer spikes make it read as a splash rather than a circle.
    const reach = radius * between(0.75, 1.1) * (index % 4 === 0 ? 1.45 : 1);
    return { x: x + Math.cos(angle) * reach, y: y + Math.sin(angle) * reach };
  });

  const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
  gradient.addColorStop(0, SAUCE_LIGHT);
  gradient.addColorStop(0.6, SAUCE);
  gradient.addColorStop(1, SAUCE_DARK);
  ctx.fillStyle = gradient;

  // Curve through the midpoints between outline points for a smooth edge.
  ctx.beginPath();
  for (const [index, point] of outline.entries()) {
    const next = outline[(index + 1) % points] ?? point;
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;
    if (index === 0) {
      ctx.moveTo(midX, midY);
    } else {
      ctx.quadraticCurveTo(point.x, point.y, midX, midY);
    }
  }
  const [first, second] = outline;
  if (first && second) {
    ctx.quadraticCurveTo(
      first.x,
      first.y,
      (first.x + second.x) / 2,
      (first.y + second.y) / 2
    );
  }
  ctx.fill();

  ctx.fillStyle = SHINE;
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.3,
    y - radius * 0.35,
    radius * 0.22,
    radius * 0.1,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawDroplets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.fillStyle = SAUCE;
  for (let index = 0; index < 30; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * between(1.2, 2.8);
    const size = Math.max(0.75, radius * between(0.03, 0.12));
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(angle) * distance,
      y + Math.sin(angle) * distance,
      size,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawDrip(ctx: CanvasRenderingContext2D, drip: Drip) {
  const half = drip.width / 2;
  ctx.fillStyle = SAUCE;
  ctx.fillRect(drip.x - half, drip.top, drip.width, drip.length);
  // The bead at the tip is a touch wider than the stream, like a real drip.
  ctx.beginPath();
  ctx.arc(drip.x, drip.top + drip.length, half * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SHINE;
  ctx.fillRect(drip.x - half * 0.5, drip.top, half * 0.35, drip.length);
}

export function splatSauce(x: number, y: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99;transition:opacity ${FADE_MS}ms ease`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // The splash is drawn once and reused, so each frame only adds the drips.
  const splash = document.createElement("canvas");
  splash.width = canvas.width;
  splash.height = canvas.height;
  const splashCtx = splash.getContext("2d");
  // Everything below is sized from the radius, so this sets the whole splat.
  const radius = between(14, 21);
  if (splashCtx) {
    splashCtx.scale(dpr, dpr);
    drawDroplets(splashCtx, x, y, radius);
    drawBlob(splashCtx, x, y, radius);
  }

  const drips: Drip[] = Array.from(
    { length: Math.floor(between(5, 9)) },
    () => ({
      length: 0,
      speed: between(1.5, 4),
      top: y + radius * between(0.2, 0.6),
      width: radius * between(0.1, 0.2),
      x: x + between(-0.8, 0.8) * radius,
    })
  );

  let frame = requestAnimationFrame(function step() {
    ctx.clearRect(0, 0, width, height);
    for (const drip of drips) {
      if (drip.top + drip.length < height && drip.speed > 0.1) {
        drip.length += drip.speed;
        // Sauce is thick: drips slow down and some stall partway.
        drip.speed *= Math.random() < 0.01 ? 0.3 : 0.997;
      }
      drawDrip(ctx, drip);
    }
    ctx.drawImage(splash, 0, 0, width, height);
    frame = requestAnimationFrame(step);
  });

  setTimeout(() => {
    canvas.style.opacity = "0";
    setTimeout(() => {
      cancelAnimationFrame(frame);
      canvas.remove();
    }, FADE_MS);
  }, LIFETIME_MS);
}
