"use strict";

(() => {
  const pages = new Map([...document.querySelectorAll("[data-page]")].map(page => [page.dataset.page, page]));
  const links = [...document.querySelectorAll("[data-page-link]")];
  const positions = new Map();
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const skipLink = document.querySelector(".skip-link");
  const transitionDuration = 200;
  let activePage = readPage();
  let requestedPage = activePage;
  let transitioning = false;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function readPage() {
    const page = location.hash.slice(1).toLowerCase();
    return pages.has(page) ? page : "main";
  }

  function updateNavigation(page) {
    for (const link of links) {
      if (link.dataset.pageLink === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    document.title = `LEE JAEHAN — ${page.toUpperCase()}`;
    skipLink.href = `#page-${page}`;
  }

  async function fade(element, from, to) {
    if (motionPreference.matches || !element.animate) return;
    const animation = element.animate([{ opacity: from }, { opacity: to }], {
      duration: transitionDuration,
      easing: "ease-in-out",
      fill: "both"
    });
    try { await animation.finished; } catch (_) { /* A cancelled animation can finish immediately. */ }
    animation.cancel();
  }

  async function requestPage(page) {
    requestedPage = page;
    if (transitioning || requestedPage === activePage) return;
    transitioning = true;
    try {
      while (requestedPage !== activePage) {
        const outgoing = pages.get(activePage);
        positions.set(activePage, window.scrollY);
        document.dispatchEvent(new CustomEvent("portfolio:pagechange"));
        outgoing.setAttribute("inert", "");
        await fade(outgoing, 1, 0);
        outgoing.hidden = true;
        outgoing.removeAttribute("inert");

        activePage = requestedPage;
        const incoming = pages.get(activePage);
        incoming.hidden = false;
        updateNavigation(activePage);
        window.scrollTo({ top: positions.get(activePage) || 0, behavior: "instant" });
        await fade(incoming, 0, 1);
      }
    } finally {
      transitioning = false;
    }
  }

  for (const [name, page] of pages) page.hidden = name !== activePage;
  updateNavigation(activePage);

  for (const link of document.querySelectorAll('.site-nav a, .brand')) {
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const next = link.getAttribute("href").slice(1);
      if (!pages.has(next)) return;
      event.preventDefault();
      if (location.hash !== `#${next}`) history.pushState({ page: next }, "", `#${next}`);
      void requestPage(next);
    });
  }

  skipLink.addEventListener("click", event => {
    event.preventDefault();
    pages.get(activePage).focus();
  });

  window.addEventListener("popstate", () => { void requestPage(readPage()); });
  window.addEventListener("hashchange", () => { void requestPage(readPage()); });
})();
