// Client-side project filter (FR-2). Without JavaScript the filter bar stays
// hidden and every project is listed.
const bar = document.getElementById("project-filters");
const list = document.getElementById("project-list");

if (bar && list) {
  const buttons = [...bar.querySelectorAll(".filter-button")];
  const cards = [...list.querySelectorAll(".card")];
  const status = document.getElementById("filter-status");

  const apply = (term) => {
    let shown = 0;
    for (const card of cards) {
      const terms = (card.dataset.terms || "").split("|");
      const match = term === "" || terms.includes(term);
      card.hidden = !match;
      if (match) shown++;
    }
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.term === term));
    }
    if (status) {
      status.textContent = `Showing ${shown} of ${cards.length} projects.`;
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => apply(button.dataset.term));
  }

  bar.hidden = false;
}
