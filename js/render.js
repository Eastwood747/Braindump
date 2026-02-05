import { getState } from './state.js';
import { createCardElement } from './card.js';
import { createGroupElement } from './group.js';
import { applyTransform } from './canvas.js';

export function render() {
  const state = getState();
  const worldEl = document.getElementById('canvas-world');
  worldEl.innerHTML = '';

  for (const node of state.canvasNodes) {
    const item = state.items[node.itemId];
    if (!item) continue;

    let el;
    if (item.type === 'card') {
      el = createCardElement(node.itemId);
    } else if (item.type === 'group') {
      el = createGroupElement(node.itemId);
    }
    if (!el) continue;

    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-item';
    wrapper.dataset.itemId = node.itemId;
    wrapper.style.left = `${node.x}px`;
    wrapper.style.top = `${node.y}px`;
    wrapper.appendChild(el);

    worldEl.appendChild(wrapper);
  }

  applyTransform();
  updateZoomDisplay();
}

function updateZoomDisplay() {
  const el = document.getElementById('zoom-display');
  if (el) el.textContent = `${Math.round(getState().viewport.zoom * 100)}%`;
}
