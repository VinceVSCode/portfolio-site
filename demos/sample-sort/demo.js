// Placeholder demo: animated bubble sort. Self-contained in this folder.
//
// This file is loaded as a module by index.html and must not depend on other
// files. It has three parts: set up the bars, shuffle them into random
// heights, and sort them one comparison at a time while drawing each step.
const BAR_COUNT = 24; // number of bars drawn
const STEP_MS = 60; // pause between animation steps, in milliseconds

// Elements from index.html. "demo" holds the whole interactive area, which
// stays hidden until the script has started successfully.
const fallback = document.getElementById("demo-fallback");
const demo = document.getElementById("demo");
const barsEl = document.getElementById("bars");
const shuffleButton = document.getElementById("shuffle");
const sortButton = document.getElementById("sort");
const statusEl = document.getElementById("status");

// Respect the visitor's "reduce motion" setting: if it is on, the sort runs
// without the step-by-step animation and only shows the final result.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let values = []; // the bar heights, as percentages (5 to 99)
let sorting = false; // true while a sort is running, to block a second one

// Waits for the given number of milliseconds. Used between animation steps.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Redraws every bar to match "values".
//  - active: indexes currently being compared (highlighted red).
//  - sortedFrom: bars at or after this index are in their final place (green).
const draw = (active = [], sortedFrom = values.length) => {
  const bars = barsEl.children;
  values.forEach((value, index) => {
    const bar = bars[index];
    bar.style.height = `${value}%`;
    bar.classList.toggle("active", active.includes(index));
    bar.classList.toggle("done", index >= sortedFrom);
  });
};

// Fills "values" with random heights and draws them.
const shuffle = () => {
  values = Array.from({ length: BAR_COUNT }, () => 5 + Math.floor(Math.random() * 95));
  draw();
  statusEl.textContent = "Shuffled. Press Sort to start.";
};

// Bubble sort: repeatedly compares neighbouring values and swaps them when
// they are out of order. The largest unsorted value "bubbles" to the end on
// each pass, so the sorted section grows from the right.
const sort = async () => {
  if (sorting) return;
  // Disable both buttons while sorting so the array cannot change mid-sort.
  sorting = true;
  shuffleButton.disabled = true;
  sortButton.disabled = true;
  statusEl.textContent = "Sorting…";

  let comparisons = 0; // counted for the final message
  for (let end = values.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      comparisons++;
      if (values[i] > values[i + 1]) {
        [values[i], values[i + 1]] = [values[i + 1], values[i]];
      }
      // Draw this step and pause, unless the visitor asked for reduced motion.
      if (!reducedMotion) {
        draw([i, i + 1], end + 1);
        await sleep(STEP_MS);
      }
    }
  }
  // Sorting is finished: mark every bar as done.
  draw([], 0);

  statusEl.textContent = `Sorted ${values.length} values with ${comparisons} comparisons.`;
  sorting = false;
  shuffleButton.disabled = false;
  sortButton.disabled = false;
};

// Startup. If anything here throws, the fallback message stays visible
// and the interactive area stays hidden.
try {
  // Create the empty bar elements once. shuffle() then only changes their heights.
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    barsEl.append(bar);
  }
  shuffleButton.addEventListener("click", shuffle);
  sortButton.addEventListener("click", sort);
  shuffle();
  // Everything is ready: show the demo and hide the loading message.
  demo.hidden = false;
  fallback.hidden = true;
} catch (error) {
  console.error(error);
  // The fallback message stays visible.
}
