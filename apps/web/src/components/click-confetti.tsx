import type { Options } from "canvas-confetti";
import { useEffect } from "react";
import { splatSauce } from "#/lib/sauce-splat";

const RAINBOW = [
  "#ff595e",
  "#ff924c",
  "#ffca3a",
  "#8ac926",
  "#1982c4",
  "#6a4c93",
];
// Anything that looks like a button bursts, including links rendered through
// <Button asChild>, which carry data-slot="button". Every other click puffs.
const BUTTON_SELECTOR =
  'button, [role="button"], [data-slot="button"], input[type="submit"], input[type="button"]';
const BURST: Options = {
  particleCount: 8000,
  spread: 120,
  startVelocity: 45,
};
const PUFF: Options = {
  particleCount: 500,
  scalar: 0.8,
  spread: 90,
  startVelocity: 25,
};
const SAUCE_EVERY = 10;

// Keyboard activation reports 0,0, so aim at the button's centre instead.
function clickPoint(event: MouseEvent, button: Element | null | undefined) {
  if (event.detail === 0 && button) {
    const rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return { x: event.clientX, y: event.clientY };
}

// Fires confetti from wherever the page is clicked, and every tenth click a
// tomato sauce splat instead. canvas-confetti is loaded in the browser only
// and skips itself for prefers-reduced-motion; the sauce checks it here.
export default function ClickConfetti() {
  useEffect(() => {
    let cancelled = false;
    let clicks = 0;
    let onClick: ((event: MouseEvent) => void) | undefined;

    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) {
        return;
      }
      onClick = (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest(BUTTON_SELECTOR);
        const { x, y } = clickPoint(event, button);

        clicks += 1;
        if (clicks % SAUCE_EVERY === 0) {
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            splatSauce(x, y);
          }
          return;
        }

        confetti({
          ...(button ? BURST : PUFF),
          colors: RAINBOW,
          disableForReducedMotion: true,
          origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        });
      };
      document.addEventListener("click", onClick);
    });

    return () => {
      cancelled = true;
      if (onClick) {
        document.removeEventListener("click", onClick);
      }
    };
  }, []);

  return null;
}
