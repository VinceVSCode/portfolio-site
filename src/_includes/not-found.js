// 404.html can be served at any URL depth, so its relative links may not
// resolve. Walk up the path until the site root marker is found, then point
// the page's base URL at it.
(async () => {
  const depth = location.pathname.split("/").length - 2;
  for (let level = 0; level <= depth; level++) {
    const prefix = level === 0 ? "./" : "../".repeat(level);
    try {
      const response = await fetch(prefix + "assets/site-root.json", { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.marker !== "portfolio-site-root") continue;
      if (level > 0) {
        const base = document.createElement("base");
        base.href = new URL(prefix, location.href).href;
        document.head.prepend(base);
        for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
          link.href = new URL(link.getAttribute("href"), base.href).href;
        }
      }
      return;
    } catch {
      // Try the next level up.
    }
  }
})();
