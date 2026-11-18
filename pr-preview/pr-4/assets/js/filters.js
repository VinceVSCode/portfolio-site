// Client-side project filter (FR-2). Without JavaScript the filter bar stays
// hidden and every project is listed.
// The filter bar and project list come from src/projects.njk. Each card's
// data-terms attribute is a "|"-separated list built by projectTerms in
// macros.njk, e.g. "Machine learning|Python|scikit-learn".
const bar = document.getElementById("project-filters");
const list = document.getElementById("project-list");

if (bar && list) {
  const buttons = [...bar.querySelectorAll(".filter-button")];
  const cards = [...list.querySelectorAll(".card")];
  const status = document.getElementById("filter-status");

  // Shows only the cards that have the chosen term. An empty term means "All".
  // Also updates the pressed state of the buttons and the status text, which
  // is announced to screen readers (role="status").
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

  // Each filter button passes its data-term value to apply().
  for (const button of buttons) {
    button.addEventListener("click", () => apply(button.dataset.term));
  }

  // The bar is hidden in the HTML and only shown here, so visitors without
  // JavaScript never see buttons that do nothing.
  bar.hidden = false;
}
