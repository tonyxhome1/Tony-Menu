const menuPages = Array.from({ length: 13 }, (_, i) => {
  const number = i + 3;
  return { number, filename: `${number}.png`, src: `./menu/${number}.png` };
});

const gallery = document.getElementById("gallery");
const viewer = document.getElementById("viewer");
const stage = document.getElementById("viewerStage");
const wrap = document.getElementById("imageWrap");
const image = document.getElementById("viewerImage");
const pageLabel = document.getElementById("pageLabel");
const viewerHint = document.getElementById("viewerHint");

let current = 0;
let scale = 1;
let minScale = 1;
let x = 0, y = 0;
let startX = 0, startY = 0;
let lastX = 0, lastY = 0;
let dragging = false;
let moved = false;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let pinchStartCenter = null;
let swipeStartX = 0;
let swipeStartY = 0;
let swipeStartTime = 0;
let hintTimer;

function renderGallery() {
  const frag = document.createDocumentFragment();
  menuPages.forEach((page, index) => {
    const figure = document.createElement("figure");
    figure.className = "menu-card";
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `Open menu page ${page.number}`);
    figure.innerHTML = `
      <img src="${page.src}" alt="Menu page ${page.number}" loading="${index < 2 ? "eager" : "lazy"}">
      <figcaption>Page ${page.number}</figcaption>
    `;
    figure.addEventListener("click", () => openViewer(index));
    figure.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openViewer(index);
      }
    });
    frag.appendChild(figure);
  });
  gallery.appendChild(frag);
}

function getBaseScale() {
  if (!image.naturalWidth || !image.naturalHeight) return 1;
  const w = stage.clientWidth, h = stage.clientHeight;
  return Math.min(w / image.naturalWidth, h / image.naturalHeight) * 0.96;
}

function fitImage() {
  minScale = getBaseScale();
  scale = minScale;
  x = 0; y = 0;
  applyTransform();
}

function applyTransform() {
  wrap.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${scale})`;
  const percent = Math.max(100, Math.round(scale / minScale * 100));
  document.getElementById("zoomReset").textContent = `${percent}%`;
}

function setScale(next, centerX = stage.clientWidth / 2, centerY = stage.clientHeight / 2) {
  const old = scale;
  scale = Math.max(minScale, Math.min(minScale * 5, next));
  if (scale !== old) {
    const factor = scale / old;
    x = centerX - (centerX - x) * factor;
    y = centerY - (centerY - y) * factor;
    applyTransform();
  }
}

function openViewer(index) {
  current = index;
  viewer.classList.add("open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("viewer-open");
  loadPage();
}

function closeViewer() {
  viewer.classList.remove("open");
  viewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("viewer-open");
}

function loadPage() {
  const page = menuPages[current];
  pageLabel.textContent = `Page ${page.number} / ${menuPages.length}`;
  image.src = page.src;
  image.alt = `Menu page ${page.number}`;
  image.onload = fitImage;
  x = y = 0;
  scale = 1;
  applyTransform();
  clearTimeout(hintTimer);
  viewerHint.hidden = false;
  hintTimer = setTimeout(() => viewerHint.hidden = true, 4500);
}

function nextPage() {
  current = (current + 1) % menuPages.length;
  loadPage();
}
function prevPage() {
  current = (current - 1 + menuPages.length) % menuPages.length;
  loadPage();
}

document.getElementById("closeViewer").addEventListener("click", closeViewer);
document.getElementById("nextPage").addEventListener("click", nextPage);
document.getElementById("prevPage").addEventListener("click", prevPage);
document.getElementById("zoomIn").addEventListener("click", () => setScale(scale * 1.35));
document.getElementById("zoomOut").addEventListener("click", () => setScale(scale / 1.35));
document.getElementById("zoomReset").addEventListener("click", fitImage);

stage.addEventListener("wheel", e => {
  e.preventDefault();
  const rect = stage.getBoundingClientRect();
  setScale(scale * (e.deltaY < 0 ? 1.18 : 0.85), e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });

stage.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  stage.setPointerCapture(e.pointerId);
  dragging = true; moved = false;
  startX = lastX = e.clientX;
  startY = lastY = e.clientY;
  swipeStartX = e.clientX; swipeStartY = e.clientY; swipeStartTime = Date.now();
  stage.classList.add("dragging");
});

stage.addEventListener("pointermove", e => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 5) moved = true;
  x += dx; y += dy;
  lastX = e.clientX; lastY = e.clientY;
  applyTransform();
});

stage.addEventListener("pointerup", e => {
  if (!dragging) return;
  dragging = false;
  stage.classList.remove("dragging");
  const dx = e.clientX - swipeStartX;
  const dy = e.clientY - swipeStartY;
  const dt = Date.now() - swipeStartTime;
  if (!moved && dt < 300) {
    // handled as a tap below
  } else if (scale <= minScale * 1.03 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    dx < 0 ? nextPage() : prevPage();
  }
});

let lastTap = 0;
stage.addEventListener("click", e => {
  const now = Date.now();
  if (now - lastTap < 300) {
    const rect = stage.getBoundingClientRect();
    setScale(scale > minScale * 1.1 ? minScale : minScale * 2, e.clientX - rect.left, e.clientY - rect.top);
  }
  lastTap = now;
});

stage.addEventListener("touchstart", e => {
  if (e.touches.length !== 2) return;
  const a = e.touches[0], b = e.touches[1];
  pinchStartDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  pinchStartScale = scale;
  pinchStartCenter = {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2
  };
}, { passive: true });

stage.addEventListener("touchmove", e => {
  if (e.touches.length !== 2 || !pinchStartDistance) return;
  e.preventDefault();
  const a = e.touches[0], b = e.touches[1];
  const distance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  const rect = stage.getBoundingClientRect();
  setScale(
    pinchStartScale * (distance / pinchStartDistance),
    pinchStartCenter.x - rect.left,
    pinchStartCenter.y - rect.top
  );
}, { passive: false });

stage.addEventListener("touchend", () => {
  pinchStartDistance = 0;
});

document.addEventListener("keydown", e => {
  if (viewer.classList.contains("open")) {
    if (e.key === "Escape") closeViewer();
    else if (e.key === "ArrowRight") nextPage();
    else if (e.key === "ArrowLeft") prevPage();
    else if (e.key === "+" || e.key === "=") setScale(scale * 1.35);
    else if (e.key === "-" || e.key === "_") setScale(scale / 1.35);
    else if (e.key === "0") fitImage();
  }
  if (helpModal.classList.contains("open") && e.key === "Escape") closeHelp();
});

const helpModal = document.getElementById("helpModal");
function closeHelp() {
  helpModal.classList.remove("open");
  helpModal.setAttribute("aria-hidden", "true");
}
document.getElementById("helpBtn").addEventListener("click", () => {
  helpModal.classList.add("open");
  helpModal.setAttribute("aria-hidden", "false");
});
document.getElementById("closeHelp").addEventListener("click", closeHelp);
helpModal.addEventListener("click", e => { if (e.target === helpModal) closeHelp(); });

window.addEventListener("resize", () => {
  if (viewer.classList.contains("open") && image.complete) fitImage();
});

renderGallery();
