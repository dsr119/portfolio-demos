// Loaded first on every demo page. All demos share the dsr119.github.io origin
// with the live apps, so they must never read or write its real storage:
// localStorage and sessionStorage become per-tab, in-memory stores.
(function () {
  function memoryStorage() {
    var data = new Map();
    return {
      get length() { return data.size; },
      key: function (i) { return Array.from(data.keys())[i] ?? null; },
      getItem: function (k) { k = String(k); return data.has(k) ? data.get(k) : null; },
      setItem: function (k, v) { data.set(String(k), String(v)); },
      removeItem: function (k) { data.delete(String(k)); },
      clear: function () { data.clear(); },
    };
  }
  ["localStorage", "sessionStorage"].forEach(function (name) {
    Object.defineProperty(window, name, { configurable: true, enumerable: true, value: memoryStorage() });
  });
})();
