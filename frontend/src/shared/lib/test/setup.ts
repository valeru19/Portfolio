import "@testing-library/jest-dom/vitest";

/** Node 22+/26 may not expose `localStorage` unless configured — provide an in-memory shim for tests. */
function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: memoryStorage,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: memoryStorage,
    });
  }
}

try {
  const probe = globalThis.localStorage;
  if (!probe || typeof probe.getItem !== "function") {
    installMemoryLocalStorage();
  } else {
    probe.setItem("__vitest_probe__", "1");
    probe.removeItem("__vitest_probe__");
  }
} catch {
  installMemoryLocalStorage();
}
