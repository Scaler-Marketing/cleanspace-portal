(() => {
  // =========================
  // CONFIG (edit these only)
  // =========================
  const CONFIG = {
    // If you have a fixed navbar, set this to its height (e.g. 72)
    topOffsetPx: 0,

    // Main selectors
    containerSelector: ".app_table-wrapper",
    headerWrapperSelector: ".app_table-header-sticky-wrapper",
    headerInnerSelector: ".app_table-header-sticky-inner-wrapper",

    // Optional: common horizontal scroll container selectors inside the table
    horizontalScrollerCandidates: [
      ".app_table-inner-wrapper",
      ".app_table-scroll",
      "[data-table-scroll]",
    ],

    // Visual tweaks
    zIndex: 9999,
    fallbackBackground: "#fff", // used only if header background is transparent
  };

  function canScrollX(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return (
      (s.overflowX === "auto" || s.overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 1
    );
  }

  function findHorizontalScroller(el) {
    // 1) Most common in this Webflow layout: an inner wrapper is the scroll container.
    const common = CONFIG.horizontalScrollerCandidates
      .map((sel) => el.querySelector(sel))
      .find(Boolean);
    if (canScrollX(common)) return common;

    // 2) Try the container itself.
    if (canScrollX(el)) return el;

    // 3) Walk up ancestors (some layouts put overflow on a parent wrapper).
    let cur = el.parentElement;
    while (cur && cur !== document.documentElement) {
      if (canScrollX(cur)) return cur;
      cur = cur.parentElement;
    }

    // 4) Last resort: find first horizontally-scrollable descendant.
    for (const node of el.querySelectorAll("*")) {
      if (canScrollX(node)) return node;
    }

    return null;
  }

  const containers = Array.from(
    document.querySelectorAll(CONFIG.containerSelector),
  );
  if (containers.length === 0) return;

  const instances = [];

  for (const container of containers) {
    // If Webflow injects this code twice, don't double-initialize the same container.
    if (container.dataset.stickyHeaderInit === "true") continue;

    // Prefer the *inner* header within THIS container.
    const headerNode =
      container.querySelector(CONFIG.headerInnerSelector) ||
      container.querySelector(CONFIG.headerWrapperSelector);
    if (!headerNode) continue;

    container.dataset.stickyHeaderInit = "true";

    const originalHeader = headerNode;
    const scrollerX = findHorizontalScroller(container);

    // Fixed "viewport" wrapper: clips the header horizontally.
    const fixedViewport = document.createElement("div");
    fixedViewport.setAttribute("data-sticky-clone", "true");
    fixedViewport.setAttribute("aria-hidden", "true");
    fixedViewport.style.position = "fixed";
    fixedViewport.style.top = CONFIG.topOffsetPx + "px";
    fixedViewport.style.left = "0px";
    fixedViewport.style.width = "0px";
    fixedViewport.style.height = "0px";
    fixedViewport.style.overflow = "hidden";
    fixedViewport.style.zIndex = String(CONFIG.zIndex);
    fixedViewport.style.display = "none";
    fixedViewport.style.pointerEvents = "none";
    fixedViewport.style.transform = "translate3d(0,0,0)";
    fixedViewport.style.boxSizing = "border-box";

    // Inner clone: translated by scrollLeft to stay aligned.
    const fixedInner = originalHeader.cloneNode(true);
    fixedInner.style.boxSizing = "border-box";
    fixedInner.style.transform = "translate3d(0,0,0)";
    fixedInner.style.willChange = "transform";

    // Avoid duplicate IDs if any exist in header markup
    fixedInner
      .querySelectorAll("[id]")
      .forEach((el) => el.removeAttribute("id"));

    // If the header has transparent background in CSS, force a solid background on the clone
    const cs = getComputedStyle(originalHeader);
    if (
      cs.backgroundColor === "rgba(0, 0, 0, 0)" ||
      cs.backgroundColor === "transparent"
    ) {
      fixedInner.style.background = CONFIG.fallbackBackground;
    }

    fixedViewport.appendChild(fixedInner);
    document.body.appendChild(fixedViewport);

    instances.push({
      container,
      originalHeader,
      scrollerX,
      fixedViewport,
      fixedInner,
      shown: false,
    });
  }

  if (instances.length === 0) return;

  let ticking = false;

  function setShown(inst, show) {
    if (show === inst.shown) return;
    inst.shown = show;
    inst.fixedViewport.style.display = show ? "block" : "none";
  }

  function updateInstance(inst) {
    const c = inst.container.getBoundingClientRect();
    const headerH = inst.originalHeader.getBoundingClientRect().height;

    const shouldFix = c.top <= CONFIG.topOffsetPx;
    const deltaY = Math.min(0, c.bottom - CONFIG.topOffsetPx - headerH);

    if (!shouldFix) {
      setShown(inst, false);
      return;
    }

    setShown(inst, true);

    const left = Math.round(c.left);
    const width = Math.round(c.width);
    const scrollLeft = inst.scrollerX ? inst.scrollerX.scrollLeft : 0;

    inst.fixedViewport.style.top = CONFIG.topOffsetPx + "px";
    inst.fixedViewport.style.left = left + "px";
    inst.fixedViewport.style.width = width + "px";
    inst.fixedViewport.style.height = Math.round(headerH) + "px";
    inst.fixedViewport.style.transform = `translate3d(0, ${Math.round(deltaY)}px, 0)`;

    const innerWidth = Math.max(inst.originalHeader.scrollWidth || 0, width);
    inst.fixedInner.style.width = innerWidth + "px";
    inst.fixedInner.style.transform = `translate3d(${-Math.round(scrollLeft)}px, 0, 0)`;
  }

  function updateAll() {
    ticking = false;
    for (const inst of instances) updateInstance(inst);
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateAll);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  for (const inst of instances) {
    if (inst.scrollerX) {
      inst.scrollerX.addEventListener("scroll", onScrollOrResize, {
        passive: true,
      });
    }
  }

  updateAll();
})();
