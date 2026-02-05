import { onStateChange, createCard, createGroup, addCanvasNode, getState } from './state.js';
import { initCanvas, resetZoom } from './canvas.js';
import { render } from './render.js';
import { initDrag } from './drag.js';
import { initContextMenu } from './context-menu.js';
import { initIO } from './io.js';

function init() {
  onStateChange(render);

  initCanvas();
  initDrag();
  initContextMenu();
  initIO();

  // Toolbar: new card
  document.getElementById('btn-new-card').addEventListener('click', () => {
    const id = createCard('');
    const vp = getState().viewport;
    const centerX = (window.innerWidth / 2 - vp.panX) / vp.zoom;
    const centerY = (window.innerHeight / 2 - vp.panY) / vp.zoom;
    addCanvasNode(id, centerX - 120, centerY - 30);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-item-id="${id}"] .card-content`);
      if (el) el.focus();
    });
  });

  // Toolbar: new group
  document.getElementById('btn-new-group').addEventListener('click', () => {
    const id = createGroup('Ny gruppe');
    const vp = getState().viewport;
    const centerX = (window.innerWidth / 2 - vp.panX) / vp.zoom;
    const centerY = (window.innerHeight / 2 - vp.panY) / vp.zoom;
    addCanvasNode(id, centerX - 135, centerY - 40);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-item-id="${id}"] .group-title`);
      if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  });

  // Toolbar: reset zoom
  document.getElementById('btn-zoom-reset').addEventListener('click', resetZoom);

  // Initial render
  render();
}

document.addEventListener('DOMContentLoaded', init);
