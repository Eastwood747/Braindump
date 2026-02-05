import { generateId, deepClone } from './utils.js';

let renderCallback = null;

const appState = {
  items: {},
  canvasNodes: [],
  viewport: { zoom: 1, panX: 0, panY: 0 }
};

export function getState() {
  return appState;
}

export function onStateChange(cb) {
  renderCallback = cb;
}

function notify() {
  if (renderCallback) renderCallback();
}

// --- Item CRUD ---

export function createCard(content = '') {
  const id = generateId('card');
  appState.items[id] = { id, type: 'card', content };
  return id;
}

export function createGroup(title = 'Ny gruppe') {
  const id = generateId('group');
  appState.items[id] = { id, type: 'group', title, children: [], collapsed: false };
  return id;
}

export function updateCardContent(id, content) {
  if (appState.items[id]?.type === 'card') {
    appState.items[id].content = content;
  }
}

export function updateGroupTitle(id, title) {
  if (appState.items[id]?.type === 'group') {
    appState.items[id].title = title;
  }
}

export function toggleGroupCollapse(id) {
  const item = appState.items[id];
  if (item?.type === 'group') {
    item.collapsed = !item.collapsed;
    notify();
  }
}

export function deleteItem(id) {
  const parent = findParentGroup(id);
  if (parent) {
    parent.children = parent.children.filter(cid => cid !== id);
  }
  appState.canvasNodes = appState.canvasNodes.filter(n => n.itemId !== id);
  const item = appState.items[id];
  if (item?.type === 'group') {
    for (const childId of [...item.children]) {
      deleteItem(childId);
    }
  }
  delete appState.items[id];
  notify();
}

// --- Canvas Node operations ---

export function addCanvasNode(itemId, x, y) {
  appState.canvasNodes.push({ itemId, x, y });
  notify();
}

export function moveCanvasNode(itemId, x, y) {
  const node = appState.canvasNodes.find(n => n.itemId === itemId);
  if (node) {
    node.x = x;
    node.y = y;
  }
}

export function removeCanvasNode(itemId) {
  appState.canvasNodes = appState.canvasNodes.filter(n => n.itemId !== itemId);
}

// --- Group child operations ---

export function addChildToGroup(groupId, childId, index = -1) {
  const group = appState.items[groupId];
  if (!group || group.type !== 'group') return;

  const oldParent = findParentGroup(childId);
  if (oldParent) {
    oldParent.children = oldParent.children.filter(cid => cid !== childId);
  }

  removeCanvasNode(childId);

  if (index >= 0 && index < group.children.length) {
    group.children.splice(index, 0, childId);
  } else {
    group.children.push(childId);
  }
  notify();
}

export function removeChildFromGroup(childId) {
  const parent = findParentGroup(childId);
  if (parent) {
    parent.children = parent.children.filter(cid => cid !== childId);
  }
}

// --- Copy ---

export function copyItem(itemId) {
  const original = appState.items[itemId];
  if (!original) return null;

  if (original.type === 'card') {
    return createCard(original.content);
  }

  if (original.type === 'group') {
    const newId = createGroup(original.title);
    const newGroup = appState.items[newId];
    newGroup.collapsed = original.collapsed;
    for (const childId of original.children) {
      const copiedChildId = copyItem(childId);
      if (copiedChildId) {
        newGroup.children.push(copiedChildId);
      }
    }
    return newId;
  }
  return null;
}

// --- Viewport ---

export function setViewport(zoom, panX, panY) {
  appState.viewport.zoom = zoom;
  appState.viewport.panX = panX;
  appState.viewport.panY = panY;
}

// --- Helpers ---

export function findParentGroup(itemId) {
  for (const item of Object.values(appState.items)) {
    if (item.type === 'group' && item.children.includes(itemId)) {
      return item;
    }
  }
  return null;
}

export function isDescendantOf(potentialChildId, potentialAncestorId) {
  const ancestor = appState.items[potentialAncestorId];
  if (!ancestor || ancestor.type !== 'group') return false;
  for (const childId of ancestor.children) {
    if (childId === potentialChildId) return true;
    if (isDescendantOf(potentialChildId, childId)) return true;
  }
  return false;
}

// --- Serialization ---

export function exportState() {
  return deepClone(appState);
}

export function importState(data) {
  appState.items = data.items || {};
  appState.canvasNodes = data.canvasNodes || [];
  appState.viewport = data.viewport || { zoom: 1, panX: 0, panY: 0 };
  notify();
}
