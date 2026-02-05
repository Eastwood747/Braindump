import {
  getState, createCard, createGroup, addCanvasNode,
  copyItem, deleteItem, findParentGroup, addChildToGroup
} from './state.js';
import { screenToWorld } from './utils.js';

let menuEl = null;
let menuContext = { worldX: 0, worldY: 0, targetItemId: null };

export function initContextMenu() {
  menuEl = document.getElementById('context-menu');
  const viewportEl = document.getElementById('canvas-viewport');

  viewportEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const state = getState();
    const vpRect = viewportEl.getBoundingClientRect();
    const coords = screenToWorld(
      e.clientX - vpRect.left,
      e.clientY - vpRect.top,
      state.viewport
    );
    menuContext.worldX = coords.x;
    menuContext.worldY = coords.y;

    // Find deepest item element under cursor
    const itemEl = e.target.closest('[data-item-id]');
    menuContext.targetItemId = itemEl?.dataset?.itemId || null;

    // Show/hide item-specific options
    const copyOption = menuEl.querySelector('[data-action="copy"]');
    const deleteOption = menuEl.querySelector('[data-action="delete"]');
    if (menuContext.targetItemId) {
      copyOption.style.display = '';
      deleteOption.style.display = '';
      menuEl.querySelector('.ctx-separator').style.display = '';
    } else {
      copyOption.style.display = 'none';
      deleteOption.style.display = 'none';
      menuEl.querySelector('.ctx-separator').style.display = 'none';
    }

    // Position menu, clamping to screen bounds
    let left = e.clientX;
    let top = e.clientY;
    menuEl.classList.remove('hidden');
    const menuRect = menuEl.getBoundingClientRect();
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 4;
    }
    if (top + menuRect.height > window.innerHeight) {
      top = window.innerHeight - menuRect.height - 4;
    }
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
  });

  document.addEventListener('click', () => {
    menuEl.classList.add('hidden');
  });

  menuEl.addEventListener('click', (e) => {
    const action = e.target.closest('.ctx-item')?.dataset?.action;
    if (!action) return;
    handleAction(action);
    menuEl.classList.add('hidden');
  });
}

function handleAction(action) {
  switch (action) {
    case 'new-card': {
      const id = createCard('');
      addCanvasNode(id, menuContext.worldX, menuContext.worldY);
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-item-id="${id}"] .card-content`);
        if (el) el.focus();
      });
      break;
    }
    case 'new-group': {
      const id = createGroup('Ny gruppe');
      addCanvasNode(id, menuContext.worldX, menuContext.worldY);
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
      break;
    }
    case 'copy': {
      if (!menuContext.targetItemId) return;
      const newId = copyItem(menuContext.targetItemId);
      if (!newId) return;

      const parent = findParentGroup(menuContext.targetItemId);
      if (parent) {
        addChildToGroup(parent.id, newId);
      } else {
        const state = getState();
        const origNode = state.canvasNodes.find(n => n.itemId === menuContext.targetItemId);
        addCanvasNode(
          newId,
          (origNode?.x ?? menuContext.worldX) + 30,
          (origNode?.y ?? menuContext.worldY) + 30
        );
      }
      break;
    }
    case 'delete': {
      if (menuContext.targetItemId) {
        deleteItem(menuContext.targetItemId);
      }
      break;
    }
  }
}
