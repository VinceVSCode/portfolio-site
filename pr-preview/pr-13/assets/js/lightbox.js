// Image viewer. Project images (card thumbnails and images in case studies)
// open in a full-window viewer with zoom buttons. Without JavaScript they stay
// plain images.
//
// - Opens at full size, or smaller when the image is larger than the window.
// - Zoom: the -, + and "Fit" buttons, the + - 0 keys, or Ctrl + mouse wheel.
// - Closes with the x button, the Escape key, or a click outside the image.
//   Focus then returns to the image that was opened, and the page has not
//   scrolled, so the visitor is back where they were.
// Loaded on every page by base.njk.
const IMAGES = ".prose img, .card-thumb";
const STEP = 1.25; // each zoom step enlarges or shrinks by 25%
const MIN = 0.1; // 10% of the image's real size
const MAX = 4; // 400%

const images = [...document.querySelectorAll(IMAGES)];

if (images.length && typeof HTMLDialogElement === "function") {
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Image viewer");
  dialog.innerHTML = `
    <div class="lightbox-bar">
      <button type="button" class="lightbox-button" data-action="out" aria-label="Zoom out">&minus;</button>
      <output class="lightbox-level" aria-live="polite">100%</output>
      <button type="button" class="lightbox-button" data-action="in" aria-label="Zoom in">+</button>
      <button type="button" class="lightbox-button" data-action="fit">Fit</button>
      <button type="button" class="lightbox-button" data-action="close" aria-label="Close">&times;</button>
    </div>
    <div class="lightbox-stage"><img class="lightbox-image" alt=""></div>`;
  document.body.append(dialog);

  const stage = dialog.querySelector(".lightbox-stage");
  const picture = dialog.querySelector(".lightbox-image");
  const level = dialog.querySelector(".lightbox-level");
  let scale = 1;

  // The largest scale (up to 100%) at which the whole image fits inside the
  // stage's padding.
  const fitScale = () => {
    const style = getComputedStyle(stage);
    const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    return Math.min(1, width / picture.naturalWidth, height / picture.naturalHeight);
  };

  // Sizes the image to `next` times its real size and shows the percentage.
  const zoom = (next) => {
    scale = Math.min(MAX, Math.max(MIN, next));
    picture.width = Math.round(picture.naturalWidth * scale);
    picture.height = Math.round(picture.naturalHeight * scale);
    level.value = `${Math.round(scale * 100)}%`;
  };

  const open = (image) => {
    picture.alt = image.alt;
    picture.src = image.currentSrc || image.src;
    dialog.showModal(); // the browser returns focus to the opener on close
    if (picture.complete) zoom(fitScale());
    else picture.addEventListener("load", () => zoom(fitScale()), { once: true });
  };

  // Wrap each image in a button, so it can be opened by mouse, touch or keyboard.
  for (const image of images) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "zoom-trigger";
    button.setAttribute("aria-label", `View full size: ${image.alt}`);
    image.replaceWith(button);
    button.append(image);
    button.addEventListener("click", () => open(image));
  }

  dialog.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "in") zoom(scale * STEP);
    else if (action === "out") zoom(scale / STEP);
    else if (action === "fit") zoom(fitScale());
    else if (action === "close") dialog.close();
    // A click anywhere outside the image and the zoom controls closes the viewer.
    else if (!event.target.closest(".lightbox-image, .lightbox-button, .lightbox-level")) {
      dialog.close();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") zoom(scale * STEP);
    else if (event.key === "-") zoom(scale / STEP);
    else if (event.key === "0") zoom(fitScale());
    else return;
    event.preventDefault();
  });

  stage.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) return; // a plain wheel scrolls a zoomed image
      event.preventDefault();
      zoom(event.deltaY < 0 ? scale * STEP : scale / STEP);
    },
    { passive: false },
  );

  // Free the image when the viewer closes.
  dialog.addEventListener("close", () => picture.removeAttribute("src"));
}
