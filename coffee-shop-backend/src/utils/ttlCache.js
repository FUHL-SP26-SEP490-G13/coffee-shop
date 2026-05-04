class TtlCache {
  constructor({ defaultTtlMs = 30_000 } = {}) {
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  getStale(key) {
    const entry = this.store.get(key);
    return entry ? entry.value : undefined;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + Math.max(0, Number(ttlMs) || 0);
    this.store.set(key, { value, expiresAt });
    return value;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TtlCache };
