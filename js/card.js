import { getState, updateCardContent } from './state.js';

export function createCardElement(itemId) {
  const item = getState().items[itemId];
  if (!item || item.type !== 'card') return null;

  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.itemId = itemId;

  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  el.appendChild(handle);

  const contentEl = document.createElement('div');
  contentEl.className = 'card-content';
  contentEl.contentEditable = 'true';
  contentEl.textContent = item.content;
  contentEl.spellcheck = false;

  contentEl.addEventListener('blur', () => {
    updateCardContent(itemId, contentEl.textContent);
  });

  contentEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });

  el.appendChild(contentEl);
  return el;
}
