const listeners = {}

export const emitStorageUpdate = (key) => {
  listeners[key]?.forEach(fn => fn())
}

export const onStorageUpdate = (key, fn) => {
  if (!listeners[key]) listeners[key] = new Set()
  listeners[key].add(fn)
  return () => listeners[key].delete(fn)
}