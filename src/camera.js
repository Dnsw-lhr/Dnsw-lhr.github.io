// Small, dependency-free camera math shared by pointer, keyboard, and zoom controls.
export function constrain(camera, viewport, world) {
  const scale = Math.max(.09, Math.min(2.8, camera.scale));
  const axis = (value, size, extent) => extent * scale <= size
    ? (size - extent * scale) / 2
    : Math.max(size - extent * scale, Math.min(0, value));
  return { x: axis(camera.x, viewport.width, world.width), y: axis(camera.y, viewport.height, world.height), scale };
}
export function frame(bounds, viewport, padding = 36) {
  const scale = Math.max(.09, Math.min(2.2, (viewport.width - padding * 2) / bounds.width, (viewport.height - padding * 2) / bounds.height));
  return { scale, x: viewport.width / 2 - (bounds.x + bounds.width / 2) * scale, y: viewport.height / 2 - (bounds.y + bounds.height / 2) * scale };
}
export function zoomAt(camera, factor, point) {
  const scale = Math.max(.09, Math.min(2.8, camera.scale * factor));
  return { scale, x: point.x - (point.x - camera.x) * scale / camera.scale, y: point.y - (point.y - camera.y) * scale / camera.scale };
}
