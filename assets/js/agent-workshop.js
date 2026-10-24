import { DURATION, stateAt } from "./workshop-state.js";

const workshop = document.querySelector(".agent-workshop");
if (workshop) startWorkshop(workshop);

function startWorkshop(root) {
  const fallback = root.querySelector(".agent-scene");
  const stage = root.querySelector(".webgl-stage");
  const toggle = root.querySelector("[data-scene-toggle]");
  const replay = root.querySelector("[data-scene-replay]");
  const status = root.querySelector("[data-scene-status]");
  const stages = JSON.parse(root.dataset.stages);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const bars = [...root.querySelectorAll(".workshop-progress i")];
  const parts = [
    ...fallback.querySelectorAll(
      ".ui-sidebar, .ui-title, .ui-cards, .ui-chart",
    ),
  ];
  const bots = [...fallback.querySelectorAll(".bot")];
  const frame = fallback.querySelector(".assembly");
  const check = fallback.querySelector(".assembly-check");
  const parcel = fallback.querySelector(".floating-block");
  const server = fallback.querySelector(".fallback-server");
  const cable = fallback.querySelector(".fallback-cable");
  let elapsed = reduced.matches ? 12.8 : 0;
  let paused = reduced.matches;
  let visible = false;
  let renderer = null;
  let loading = false;
  let failed = false;
  let disposed = false;
  let raf = null;
  let previous = 0;
  let lastPhase = -1;
  let controller;

  root.dataset.renderer = "fallback";
  root.classList.add("workshop-enhanced");
  root.querySelector(".workshop-controls").hidden = false;

  function render() {
    const state = stateAt(elapsed);
    root.dataset.phase = String(state.phase);
    if (state.phase !== lastPhase) {
      status.textContent = stages[state.phase];
      bars.forEach((bar, index) =>
        bar.classList.toggle("is-active", index <= state.phase),
      );
      lastPhase = state.phase;
    }
    if (renderer) {
      try {
        renderer.render(state);
        root.dataset.renderer = "webgl";
      } catch {
        useFallback();
      }
    }
    if (!renderer) {
      frame.style.opacity = String(0.2 + state.frame * 0.8);
      parts.forEach((part, index) => {
        const p = state.parts[index];
        part.style.opacity = String(p);
        part.style.translate = `${(1 - p) * -35}px ${(1 - p) * 22}px`;
      });
      bots.forEach((bot, index) => {
        const action = [state.working, state.connecting, state.testing][index];
        bot.style.translate = "0 0";
        bot.querySelector(".bot-head").style.rotate = `${action * 6}deg`;
        bot.querySelector(".arm-right").style.rotate =
          `${action * 25 - state.celebrate * 60}deg`;
        bot.querySelector(".arm-left").style.rotate =
          `${action * -20 + state.celebrate * 60}deg`;
      });
      const carrying = state.t < 4.8;
      const trip = (state.t % 0.9) / 0.9;
      parcel.style.opacity = carrying ? String(Math.sin(trip * Math.PI)) : "0";
      parcel.style.translate = `${trip * 75}px ${-Math.sin(trip * Math.PI) * 38}px`;
      server.style.opacity = String(state.server);
      server.style.translate = `0 ${(1 - state.server) * 30}px`;
      cable.style.scale = `${state.connection} 1`;
      check.style.opacity = String(state.success);
      check.style.scale = String(0.6 + state.success * 0.4);
      fallback.style.setProperty("--scan", String(state.scan));
    }
    root.dataset.time = elapsed.toFixed(2);
  }

  function useFallback() {
    failed = true;
    root.dataset.renderer = "fallback";
    // Clear the reference before disposal: context-loss callbacks can re-enter.
    const old = renderer;
    renderer = null;
    controller?.abort();
    old?.dispose();
    stage.replaceChildren();
  }

  async function loadWebGL() {
    if (
      loading ||
      renderer ||
      failed ||
      disposed ||
      (reduced.matches && paused)
    )
      return;
    loading = true;
    try {
      const { createWorkshop } = await import("./agent-webgl.js");
      if (disposed) return;
      controller = new AbortController();
      renderer = createWorkshop(stage, {
        signal: controller.signal,
        onFailure: () => {
          useFallback();
          render();
        },
      });
      render();
    } catch {
      useFallback();
    } finally {
      loading = false;
    }
  }

  function tick(now) {
    raf = null;
    if (!visible || document.hidden || paused || disposed) return;
    if (!previous) previous = now;
    if (now - previous >= 1000 / 30) {
      elapsed = (elapsed + Math.min((now - previous) / 1000, 0.1)) % DURATION;
      previous = now;
      render();
    }
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    previous = 0;
    const label = paused ? root.dataset.play : root.dataset.pause;
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
    toggle.dataset.paused = String(paused);
    root.dataset.playing = String(!paused && visible && !document.hidden);
    if (!paused && visible && !document.hidden && !disposed)
      raf = requestAnimationFrame(tick);
  }

  toggle.addEventListener("click", () => {
    paused = !paused;
    if (!paused) loadWebGL();
    sync();
  });
  replay.addEventListener("click", () => {
    elapsed = 0;
    paused = false;
    loadWebGL();
    render();
    sync();
  });
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    if (paused) elapsed = 12.8;
    else loadWebGL();
    render();
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  const preload =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              loadWebGL();
              preload.disconnect();
            }
          },
          { rootMargin: "200px" },
        )
      : null;
  const visibility =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            sync();
          },
          { threshold: 0.05 },
        )
      : null;
  if (preload && visibility) {
    preload.observe(root);
    visibility.observe(root);
  } else {
    visible = true;
    loadWebGL();
  }
  // bfcache pages retain their scene; dispose only when leaving permanently.
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      return;
    }
    disposed = true;
    sync();
    preload?.disconnect();
    visibility?.disconnect();
    controller?.abort();
    renderer?.dispose();
  });
  window.addEventListener("pageshow", sync);
  render();
  sync();
}
