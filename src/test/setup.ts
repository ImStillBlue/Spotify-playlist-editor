// The app is browser-only, so the unit tests need the two Web Storage globals
// the services touch. Node has neither, and pulling in jsdom for two maps would
// be a heavier dependency than the tests justify.
function createMemoryStorage() {
  const map = new Map<string, string>()

  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createMemoryStorage(),
  configurable: true,
  writable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: createMemoryStorage(),
  configurable: true,
  writable: true,
})
