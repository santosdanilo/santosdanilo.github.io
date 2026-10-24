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

  const scene = document.querySelector(".agent-scene");
  if (scene && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          scene.classList.add("scene-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(scene);
  } else if (scene) {
    scene.classList.add("scene-visible");
  }
})();
