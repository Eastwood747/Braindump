import {
  getState, moveCanvasNode, addCanvasNode, addChildToGroup,
  removeChildFromGroup, removeCanvasNode, findParentGroup,
  isDescendantOf
} from './state.js';
import { screenToWorld } from './utils.js';
import { render } from './render.js';
import { isPanningActive, isSpaceHeld } from './canvas.js';

let dragState = null;

export function initDrag() {
  const worldEl = document.getElementById('canvas-world');
  worldEl.addEventListener('pointerdown', onDragStart);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
}

function onDragStart(e) {
  if (e.button !== 0) return;
  if (isPanningActive() || isSpaceHeld()) return;

  const handle = e.target.closest('.drag-handle, .group-header');
  if (!handle) return;
  if (e.target.closest('[contenteditable="true"]')) return;

  // Find the nearest item element (card or group)
  let itemEl;
  if (handle.classList.contains('drag-handle')) {
    itemEl = handle.closest('.card');
  } else {
    itemEl = handle.closest('.group');
  }
  if (!itemEl) return;

  const itemId = itemEl.dataset.itemId;
  if (!itemId) return;

  e.preventDefault();
  e.stopPropagation();

  const state = getState();
  const parentGroup = findParentGroup(itemId);
  const vpRect = document.getElementById('canvas-viewport').getBoundingClientRect();

  let startX, startY;
  if (parentGroup) {
    const rect = itemEl.getBoundingClientRect();
    const worldCoords = screenToWorld(
      rect.left - vpRect.left,
      rect.top - vpRect.top,
      state.viewport
    );
    startX = worldCoords.x;
    startY = worldCoords.y;
  } else {
    const canvasNode = state.canvasNodes.find(n => n.itemId === itemId);
    if (!canvasNode) return;
    startX = canvasNode.x;
    startY = canvasNode.y;
  }

  dragState = {
    itemId,
    startMouseX: e.clientX,
    startMouseY: e.clientY,
    startItemX: startX,
    startItemY: startY,
    wasInGroup: !!parentGroup,
    originalParentId: parentGroup?.id || null,
    element: null,
    originalHidden: null,
    hasMovedEnough: false
  };
}

function onDragMove(e) {
  if (!dragState) return;

  const dx = e.clientX - dragState.startMouseX;
  const dy = e.clientY - dragState.startMouseY;

  if (!dragState.hasMovedEnough) {
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    dragState.hasMovedEnough = true;
    beginVisualDrag();
  }

  const zoom = getState().viewport.zoom;
  const newX = dragState.startItemX + dx / zoom;
  const newY = dragState.startItemY + dy / zoom;

  if (dragState.element) {
    dragState.element.style.left = `${newX}px`;
    dragState.element.style.top = `${newY}px`;
  }

  clearDropTargets();
  const dropTarget = findDropTargetGroup(e.clientX, e.clientY, dragState.itemId);
  if (dropTarget) {
    dropTarget.classList.add('drop-target');
  }
}

function onDragEnd(e) {
  if (!dragState) return;

  if (!dragState.hasMovedEnough) {
    dragState = null;
    return;
  }

  const zoom = getState().viewport.zoom;
  const dx = e.clientX - dragState.startMouseX;
  const dy = e.clientY - dragState.startMouseY;
  const finalX = dragState.startItemX + dx / zoom;
  const finalY = dragState.startItemY + dy / zoom;

  const dropTargetEl = findDropTargetGroup(e.clientX, e.clientY, dragState.itemId);

  if (dropTargetEl) {
    const groupId = dropTargetEl.dataset.itemId;
    if (groupId) {
      if (!dragState.wasInGroup) {
        removeCanvasNode(dragState.itemId);
      } else {
        removeChildFromGroup(dragState.itemId);
      }
      addChildToGroup(groupId, dragState.itemId);
    }
  } else {
    if (dragState.wasInGroup) {
      removeChildFromGroup(dragState.itemId);
      addCanvasNode(dragState.itemId, finalX, finalY);
    } else {
      moveCanvasNode(dragState.itemId, finalX, finalY);
      render();
    }
  }

  clearDropTargets();
  dragState = null;
}

function beginVisualDrag() {
  const worldEl = document.getElementById('canvas-world');

  if (dragState.wasInGroup) {
    // Item is inside a group - create a floating clone on the canvas
    const originalEl = worldEl.querySelector(
      `.group-children [data-item-id="${dragState.itemId}"]`
    );
    if (!originalEl) return;

    const floater = document.createElement('div');
    floater.className = 'canvas-item';
    floater.dataset.dragFloater = 'true';
    floater.style.left = `${dragState.startItemX}px`;
    floater.style.top = `${dragState.startItemY}px`;
    floater.style.zIndex = '9999';
    floater.style.pointerEvents = 'none';
    floater.style.width = `${originalEl.offsetWidth}px`;

    const clone = originalEl.cloneNode(true);
    clone.classList.add('dragging');
    floater.appendChild(clone);
    worldEl.appendChild(floater);

    originalEl.style.opacity = '0.3';

    dragState.element = floater;
    dragState.originalHidden = originalEl;
  } else {
    // Item is on the canvas - move it directly
    const wrapper = worldEl.querySelector(`.canvas-item[data-item-id="${dragState.itemId}"]`);
    if (!wrapper) return;

    const inner = wrapper.querySelector('.card, .group');
    if (inner) inner.classList.add('dragging');
    wrapper.style.zIndex = '9999';

    dragState.element = wrapper;
  }
}

function findDropTargetGroup(screenX, screenY, dragItemId) {
  const groups = document.querySelectorAll('.group');
  let bestMatch = null;
  let bestArea = Infinity;

  for (const groupEl of groups) {
    const groupId = groupEl.dataset.itemId;
    if (!groupId) continue;
    if (groupId === dragItemId) continue;
    if (isDescendantOf(groupId, dragItemId)) continue;

    // Skip if the group is collapsed
    if (groupEl.classList.contains('collapsed')) continue;

    const rect = groupEl.getBoundingClientRect();
    if (screenX >= rect.left && screenX <= rect.right &&
        screenY >= rect.top && screenY <= rect.bottom) {
      // Prefer the smallest (innermost) group
      const area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        bestMatch = groupEl;
      }
    }
  }

  return bestMatch;
}

function clearDropTargets() {
  document.querySelectorAll('.drop-target').forEach(el => {
    el.classList.remove('drop-target');
  });
}
