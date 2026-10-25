(() => {
  const button = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation");
  if (button && navigation) {
    document.documentElement.classList.add("js");
    button.hidden = false;
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("is-open", open);
    });
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        button.getAttribute("aria-expanded") === "true"
      ) {
        closeMenu();
        button.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".header-inner")) closeMenu();
    });
    window
      .matchMedia("(min-width: 761px)")
      .addEventListener("change", closeMenu);
  }
  const languageLink = document.querySelector(".language-link");
  if (languageLink) {
    const syncLanguageAnchor = () => {
      const target = new URL(languageLink.href);
      target.hash = window.location.hash;
      languageLink.href = target.href;
    };
    syncLanguageAnchor();
    window.addEventListener("hashchange", syncLanguageAnchor);
  }

  const tiltPreference = matchMedia(
    "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  const tilt = { maxAngle: 10, maxShift: 5 };
  document.querySelectorAll("[data-tilt]").forEach((element) => {
    const surface = element.querySelector("[data-tilt-surface]") || element;
    let frame = null;
    let bounds = null;
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      bounds = null;
      element.classList.remove("is-tilting");
      ["--tilt-x", "--tilt-y", "--tilt-shift-x", "--tilt-shift-y"].forEach(
        (property) => surface.style.removeProperty(property),
      );
    };
    element.addEventListener(
      "pointermove",
      (event) => {
        if (!tiltPreference.matches || event.pointerType === "touch") return;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          bounds ||= element.getBoundingClientRect();
          const x = Math.max(
            -0.5,
            Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5),
          );
          const y = Math.max(
            -0.5,
            Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5),
          );
          element.classList.add("is-tilting");
          surface.style.setProperty(
            "--tilt-x",
            `${(-y * 2 * tilt.maxAngle).toFixed(2)}deg`,
          );
          surface.style.setProperty(
            "--tilt-y",
            `${(x * 2 * tilt.maxAngle).toFixed(2)}deg`,
          );
          surface.style.setProperty(
            "--tilt-shift-x",
            `${(x * 2 * tilt.maxShift).toFixed(2)}px`,
          );
          surface.style.setProperty(
            "--tilt-shift-y",
            `${(y * 2 * tilt.maxShift).toFixed(2)}px`,
          );
          frame = null;
        });
      },
      { passive: true },
    );
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", reset, { passive: true });
    tiltPreference.addEventListener("change", reset);
  });
})();
