// Client-side project filter (FR-2, track filter from FR-11). Without
// JavaScript the filter bar stays hidden and every project is listed.
// The filter bar and project list come from src/projects.njk. There are two
// groups of buttons, marked with data-group: "track" (Software development or
// Machine learning) and "tag" (one technology). A card is shown when it
// matches the chosen button in both groups.
// Each card's data-track attribute holds its track, and data-terms is a
// "|"-separated list of its technologies built by projectTerms in macros.njk,
// e.g. "Python|scikit-learn".
const bar = document.getElementById("project-filters");
const list = document.getElementById("project-list");

if (bar && list) {
  const buttons = [...bar.querySelectorAll(".filter-button")];
  const cards = [...list.querySelectorAll(".card")];
  const status = document.getElementById("filter-status");
  // The chosen term in each group. An empty term means "All".
  const chosen = { track: "", tag: "" };

  // Shows only the cards that match both chosen terms, updates the pressed
  // state of the buttons, and updates the status text, which is announced to
  // screen readers (role="status").
  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const terms = (card.dataset.terms || "").split("|");
      const match =
        (chosen.track === "" || card.dataset.track === chosen.track) &&
        (chosen.tag === "" || terms.includes(chosen.tag));
      card.hidden = !match;
      if (match) shown++;
    }
    for (const button of buttons) {
      const pressed = chosen[button.dataset.group] === button.dataset.term;
      button.setAttribute("aria-pressed", String(pressed));
    }
    if (status) {
      status.textContent = `Showing ${shown} of ${cards.length} projects.`;
    }
  };

  // Each button sets the chosen term of its own group.
  for (const button of buttons) {
    button.addEventListener("click", () => {
      chosen[button.dataset.group] = button.dataset.term;
      apply();
    });
  }

  // The bar is hidden in the HTML and only shown here, so visitors without
  // JavaScript never see buttons that do nothing.
  bar.hidden = false;
}
