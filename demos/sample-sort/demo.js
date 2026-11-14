// Placeholder demo: animated bubble sort. Self-contained in this folder.
const BAR_COUNT = 24;
const STEP_MS = 60;

const fallback = document.getElementById("demo-fallback");
const demo = document.getElementById("demo");
const barsEl = document.getElementById("bars");
const shuffleButton = document.getElementById("shuffle");
const sortButton = document.getElementById("sort");
const statusEl = document.getElementById("status");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let values = [];
let sorting = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const draw = (active = [], sortedFrom = values.length) => {
  const bars = barsEl.children;
  values.forEach((value, index) => {
    const bar = bars[index];
    bar.style.height = `${value}%`;
    bar.classList.toggle("active", active.includes(index));
    bar.classList.toggle("done", index >= sortedFrom);
  });
};

const shuffle = () => {
  values = Array.from({ length: BAR_COUNT }, () => 5 + Math.floor(Math.random() * 95));
  draw();
  statusEl.textContent = "Shuffled. Press Sort to start.";
};

const sort = async () => {
  if (sorting) return;
  sorting = true;
  shuffleButton.disabled = true;
  sortButton.disabled = true;
  statusEl.textContent = "Sorting…";

  let comparisons = 0;
  for (let end = values.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      comparisons++;
      if (values[i] > values[i + 1]) {
        [values[i], values[i + 1]] = [values[i + 1], values[i]];
      }
      if (!reducedMotion) {
        draw([i, i + 1], end + 1);
        await sleep(STEP_MS);
      }
    }
  }
  draw([], 0);

  statusEl.textContent = `Sorted ${values.length} values with ${comparisons} comparisons.`;
  sorting = false;
  shuffleButton.disabled = false;
  sortButton.disabled = false;
};

try {
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    barsEl.append(bar);
  }
  shuffleButton.addEventListener("click", shuffle);
  sortButton.addEventListener("click", sort);
  shuffle();
  demo.hidden = false;
  fallback.hidden = true;
} catch (error) {
  console.error(error);
  // The fallback message stays visible.
}
