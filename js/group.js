import { getState, toggleGroupCollapse, updateGroupTitle } from './state.js';
import { createCardElement } from './card.js';

export function createGroupElement(itemId) {
  const item = getState().items[itemId];
  if (!item || item.type !== 'group') return null;

  const el = document.createElement('div');
  el.className = 'group' + (item.collapsed ? ' collapsed' : '');
  el.dataset.itemId = itemId;

  // Header
  const header = document.createElement('div');
  header.className = 'group-header';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'collapse-toggle';
  collapseBtn.textContent = item.collapsed ? '\u25B6' : '\u25BC';
  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleGroupCollapse(itemId);
  });
  header.appendChild(collapseBtn);

  const titleEl = document.createElement('div');
  titleEl.className = 'group-title';
  titleEl.contentEditable = 'true';
  titleEl.textContent = item.title;
  titleEl.spellcheck = false;
  titleEl.addEventListener('blur', () => {
    updateGroupTitle(itemId, titleEl.textContent);
  });
  titleEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });
  header.appendChild(titleEl);

  el.appendChild(header);

  // Children container
  const childrenContainer = document.createElement('div');
  childrenContainer.className = 'group-children';
  childrenContainer.dataset.groupId = itemId;

  for (const childId of item.children) {
    const childItem = getState().items[childId];
    if (!childItem) continue;

    let childEl;
    if (childItem.type === 'card') {
      childEl = createCardElement(childId);
    } else if (childItem.type === 'group') {
      childEl = createGroupElement(childId); // recursive
    }
    if (childEl) {
      childrenContainer.appendChild(childEl);
    }
  }

  el.appendChild(childrenContainer);
  return el;
}
