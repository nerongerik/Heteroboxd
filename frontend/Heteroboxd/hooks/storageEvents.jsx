const listeners = {};

export function emitStorageUpdate(key) {
  listeners[key]?.forEach(fn => fn());
}

export function onStorageUpdate(key, fn) {
  if (!listeners[key]) listeners[key] = new Set();
  listeners[key].add(fn);

  return () => listeners[key].delete(fn);
}