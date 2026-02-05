export function generateId(prefix = 'item') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${suffix}`;
}

export function screenToWorld(screenX, screenY, viewport) {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom
  };
}

export function worldToScreen(worldX, worldY, viewport) {
  return {
    x: worldX * viewport.zoom + viewport.panX,
    y: worldY * viewport.zoom + viewport.panY
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
