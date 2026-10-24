// One timeline drives both the WebGL scene and its DOM fallback.
export const DURATION = 22;
export const COMPLETED_TIME = 19.2;
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

export function stateAt(seconds) {
  const t = ((seconds % DURATION) + DURATION) % DURATION;
  const fade = 1 - ease((t - 21) / 1);
  const review = t >= 13 && t < 18;
  const repairing = t >= 15.3 && t < 17.5;
  return {
    t,
    phase: t < 3 ? 0 : t < 5 ? 1 : t < 10 ? 2 : t < 13 ? 3 : t < 18 ? 4 : 5,
    idea: ease(t / 0.7) * (1 - ease((t - 3.8) / 1)),
    assigned: [3, 3.55, 4.1].map((start) => ease((t - start) / 0.5) * fade),
    signals: [3, 3.55, 4.1].map((start) =>
      t >= start && t < start + 1.2 ? clamp((t - start) / 1.2) : -1,
    ),
    directing: t < 5 || (t >= 15 && t < 17.5),
    redirect: repairing ? clamp((t - 15.3) / 1.5) : -1,
    frame: ease((t - 4.7) / 0.8) * fade,
    parts: [5.5, 6.5, 7.5, 8.5].map((start) => ease((t - start) / 0.8) * fade),
    server: ease((t - 10.1) / 1) * fade,
    connection: ease((t - 11) / 1.4) * fade,
    scan: clamp((t - 13) / 3.5),
    checks: [13.6, 14.4, 17.3].map((start) => ease((t - start) / 0.4) * fade),
    issue: t >= 14.6 && t < 16.8 ? 1 - ease((t - 16.2) / 0.6) : 0,
    repair: repairing ? Math.sin((t - 15.3) * 8) : 0,
    success: ease((t - 18) / 0.5) * fade,
    working: (t >= 5 && t < 10) || repairing ? Math.sin(t * 7) : 0,
    connecting: t >= 10 && t < 13 ? Math.sin(t * 6) : 0,
    testing: review ? Math.sin(t * 5) : 0,
    celebrate:
      t >= 18 && t < 21 ? Math.max(0, Math.sin((t - 18) * Math.PI * 2)) : 0,
  };
}
