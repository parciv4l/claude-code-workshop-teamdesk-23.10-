import { useEffect, useRef } from "react";
import { useResolvedTheme } from "#/hooks/use-resolved-theme";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789";
const FONT_SIZE = 16;
const FRAME_MS = 50;
// Classic green, darkened on the light theme so it still reads on paper.
const GREEN = { dark: "#00ff41", light: "#00a82d" } as const;

// A fixed canvas of falling glyphs behind every page. Trails fade by erasing
// towards transparent rather than painting a background colour, so the page
// background shows through and the effect follows the theme toggle for free.
export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useResolvedTheme();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      return;
    }
    const { canvas } = ctx;

    let drops: number[] = [];
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = Math.ceil(window.innerWidth / FONT_SIZE);
      drops = Array.from({ length: columns }, () =>
        Math.floor((Math.random() * window.innerHeight) / FONT_SIZE)
      );
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let last = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) {
        return;
      }
      last = now;

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = GREEN[theme];
      ctx.font = `${FONT_SIZE}px monospace`;
      for (const [column, row] of drops.entries()) {
        const glyph = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        ctx.fillText(glyph, column * FONT_SIZE, row * FONT_SIZE);
        drops[column] =
          row * FONT_SIZE > window.innerHeight && Math.random() > 0.975
            ? 0
            : row + 1;
      }
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-25 dark:opacity-30"
      ref={canvasRef}
    />
  );
}
