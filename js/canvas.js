import { getState, setViewport } from './state.js';

let viewportEl = null;
let worldEl = null;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let spaceHeld = false;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const ZOOM_SENSITIVITY = 0.001;

export function initCanvas() {
  viewportEl = document.getElementById('canvas-viewport');
  worldEl = document.getElementById('canvas-world');

  viewportEl.addEventListener('wheel', onWheel, { passive: false });
  viewportEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  applyTransform();
}

function onWheel(e) {
  e.preventDefault();
  const vp = getState().viewport;
  const rect = viewportEl.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const oldZoom = vp.zoom;
  const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY * oldZoom;
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + zoomDelta));

  const scale = newZoom / oldZoom;
  const newPanX = mouseX - scale * (mouseX - vp.panX);
  const newPanY = mouseY - scale * (mouseY - vp.panY);

  setViewport(newZoom, newPanX, newPanY);
  applyTransform();
  updateZoomDisplay();
}

function onPointerDown(e) {
  if (e.button === 1 || (e.button === 0 && spaceHeld)) {
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    viewportEl.classList.add('panning');
    viewportEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
}

function onPointerMove(e) {
  if (!isPanning) return;
  const vp = getState().viewport;
  const dx = e.clientX - panStartX;
  const dy = e.clientY - panStartY;
  panStartX = e.clientX;
  panStartY = e.clientY;
  setViewport(vp.zoom, vp.panX + dx, vp.panY + dy);
  applyTransform();
}

function onPointerUp() {
  if (isPanning) {
    isPanning = false;
    viewportEl.classList.remove('panning');
  }
}

function onKeyDown(e) {
  if (e.code === 'Space' && !e.repeat) {
    // Don't hijack space when typing in an editable field
    if (e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault();
    spaceHeld = true;
    viewportEl.style.cursor = 'grab';
  }
}

function onKeyUp(e) {
  if (e.code === 'Space') {
    spaceHeld = false;
    viewportEl.style.cursor = '';
  }
}

export function applyTransform() {
  const { zoom, panX, panY } = getState().viewport;
  worldEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function updateZoomDisplay() {
  const el = document.getElementById('zoom-display');
  if (el) el.textContent = `${Math.round(getState().viewport.zoom * 100)}%`;
}

export function resetZoom() {
  setViewport(1, 0, 0);
  applyTransform();
  updateZoomDisplay();
}

export function isPanningActive() {
  return isPanning;
}

export function isSpaceHeld() {
  return spaceHeld;
}
