// One timeline drives both the WebGL scene and its DOM fallback.
export const DURATION = 15;
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

export function stateAt(seconds) {
  const t = ((seconds % DURATION) + DURATION) % DURATION;
  const fade = 1 - ease((t - 14) / 1);
  return {
    t,
    phase: t < 5 ? 0 : t < 9 ? 1 : t < 12 ? 2 : 3,
    frame: ease(t / 0.8) * fade,
    parts: [1.2, 2.1, 3, 3.9].map((start) => ease((t - start) / 0.8) * fade),
    server: ease((t - 5.1) / 1) * fade,
    connection: ease((t - 6.4) / 1.4) * fade,
    scan: clamp((t - 9) / 2.5),
    checks: [9.4, 10.3, 11.2].map((start) => ease((t - start) / 0.4) * fade),
    success: ease((t - 12) / 0.5) * fade,
    working: t < 5 ? Math.sin(t * 7) : 0,
    connecting: t >= 5 && t < 9 ? Math.sin(t * 6) : 0,
    testing: t >= 9 && t < 12 ? Math.sin(t * 5) : 0,
    celebrate:
      t >= 12 && t < 14 ? Math.max(0, Math.sin((t - 12) * Math.PI * 2)) : 0,
  };
}
