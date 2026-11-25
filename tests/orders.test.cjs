const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function createBrowser(storage = new Map()) {
  const events = new EventTarget();
  return {
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    },
    addEventListener: events.addEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    setTimeout,
    clearTimeout
  };
}

function createLoader() {
  const modules = new Map();
  function load(file) {
    const filename = path.resolve(root, file);
    if (modules.has(filename)) return modules.get(filename).exports;
    const source = fs.readFileSync(filename, "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    const module = { exports: {} };
    modules.set(filename, module);
    const localRequire = (specifier) => {
      if (specifier.startsWith("@assets/")) return { default: {} };
      if (specifier.startsWith("@data/")) return load(`src/data/${specifier.slice(6)}.ts`);
      if (specifier.startsWith("@stores/")) return load(`src/stores/${specifier.slice(8)}.ts`);
      if (specifier.startsWith("@utils/")) return load(`src/utils/${specifier.slice(7)}.ts`);
      if (specifier.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${specifier}.ts`)));
      return require(specifier);
    };
    vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`, { filename })(
      localRequire, module, module.exports
    );
    return module.exports;
  }
  return load;
}

function setup(storage) {
  global.window = createBrowser(storage);
  const load = createLoader();
  const stores = load("src/stores/orderStore.ts");
  const cart = load("src/stores/cartStore.ts");
  const receipt = load("src/stores/currentOrder.ts");
  const service = load("src/services/orderService.ts");
  cart.setSelectedVariant("wall-2027");
  stores.setQuantity(2);
  stores.$shippingDepartment.set("Bogotá D.C.");
  stores.$shippingCity.set("Bogotá");
  stores.setShippingAddressField("address", "Calle 123");
  stores.setShippingAddressField("neighborhood", "Centro");
  stores.setCustomerContactField("fullName", "Ana Perez");
  stores.setCustomerContactField("phone", "3001234567");
  stores.setCustomerContactField("email", "ana@example.test");
  stores.setCustomerContactField("documentId", "12345678");
  stores.$customerContact.setKey("acceptedPrivacy", true);
  return { stores, cart, receipt, service, load };
}

test("sends real prices and emits and persists a confirmed receipt", async () => {
  const storage = new Map();
  const { receipt, service } = setup(storage);
  let eventReceipt;
  window.addEventListener("order:created", (event) => { eventReceipt = event.detail; });
  let request;
  global.fetch = async (url, options) => {
    request = { url, ...options };
    const body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true, orderId: body.orderId }) };
  };
  const result = await service.createConsolidatedOrder();
  assert.match(result.orderId, /^CL27-[A-HJ-NP-Z2-9]{10}$/);
  assert.equal(result.syncStatus, "synced");
  assert.equal(result.unitPrice, 85000);
  assert.equal(result.subtotal, 170000);
  assert.equal(result.shippingCost, 10000);
  assert.equal(result.total, 180000);
  assert.equal(request.headers["Content-Type"], "application/json");
  assert.equal(JSON.parse(request.body).orderId, result.orderId);
  assert.deepEqual(eventReceipt, result);
  assert.deepEqual(JSON.parse(storage.get("calendar-current-order")), result);
  await service.createConsolidatedOrder();
  assert.equal(receipt.$currentOrder.get().orderId, result.orderId);
  assert.equal(request.url, "/api/orders");
});

test("fallback retries the same ID and snapshot and can become synced", async () => {
  const storage = new Map();
  const { service, receipt, stores } = setup(storage);
  const requests = [];
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) throw new Error("offline");
    return { ok: true, json: async () => ({ ok: true, orderId: requests.at(-1).orderId, duplicate: true }) };
  };
  const fallback = await service.createConsolidatedOrder();
  assert.equal(fallback.syncStatus, "fallback");
  const synced = await service.createConsolidatedOrder();
  assert.equal(synced.syncStatus, "synced");
  assert.equal(synced.orderId, fallback.orderId);
  assert.deepEqual(requests[0], requests[1]);
  await service.createConsolidatedOrder();
  assert.equal(requests.length, 2);
  stores.setQuantity(3);
  assert.equal(service.isCurrentOrderForCheckout(), false);
  const next = await service.createConsolidatedOrder();
  assert.notEqual(next.orderId, synced.orderId);
  assert.equal(receipt.$currentOrder.get().shippingCost, 0);
  assert.equal(next.syncStatus, "synced");
});

test("unavailable service, rate limiting, bad responses and timeout preserve an unconfirmed receipt", async () => {
  for (const kind of ["unavailable", "rate-limit", "http", "invalid", "malformed", "opaque", "timeout"]) {
    const { service } = setup();
    let timer;
    if (kind === "timeout") {
      window.setTimeout = (callback, delay) => {
        assert.equal(delay, 8000);
        timer = callback;
        return 1;
      };
      window.clearTimeout = () => {};
    }
    global.fetch = async (_url, options) => {
      if (kind === "timeout") {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      }
      if (["unavailable", "rate-limit", "http", "opaque"].includes(kind)) {
        return { ok: false, json: async () => ({ ok: false, error: kind }) };
      }
      if (kind === "malformed") return { ok: true, json: async () => { throw new SyntaxError("bad JSON"); } };
      return { ok: true, json: async () => ({ ok: true, orderId: "wrong" }) };
    };
    const pending = service.createConsolidatedOrder();
    if (timer) timer();
    const result = await pending;
    assert.equal(result.syncStatus, "fallback", kind);
    assert.match(result.orderId, /^CL27-[A-HJ-NP-Z2-9]{10}$/);
  }
});

test("restores receipt from session storage and rejects corrupt data", async () => {
  const storage = new Map();
  let context = setup(storage);
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  const saved = await context.service.createConsolidatedOrder();
  context = setup(storage);
  assert.deepEqual(context.receipt.$currentOrder.get(), saved);
  const historical = { ...saved, unitPrice: 80000, subtotal: 160000, total: 170000 };
  storage.set("calendar-current-order", JSON.stringify(historical));
  context = setup(storage);
  assert.deepEqual(context.receipt.$currentOrder.get(), historical);
  storage.set("calendar-current-order", JSON.stringify({ ...saved, orderId: "invalid" }));
  context = setup(storage);
  assert.equal(context.receipt.$currentOrder.get(), null);
  storage.set("calendar-current-order", JSON.stringify({ orderId: saved.orderId }));
  context = setup(storage);
  assert.equal(context.receipt.$currentOrder.get(), null);
});

test("surfaces an explicit ID conflict rather than claiming success", async () => {
  const { service } = setup();
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false, error: "ORDER_ID_CONFLICT" }) });
  await assert.rejects(service.createConsolidatedOrder(), /conflicts/);
});

test("Netlify validates orders and forwards only confirmed webhook responses", async () => {
  const { service, load } = setup();
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  const order = await service.createConsolidatedOrder();
  const { default: handler, config } = load("netlify/functions/orders.ts");
  assert.equal(config.path, "/api/orders");
  assert.deepEqual(config.rateLimit, { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] });
  const originalUrl = process.env.ORDERS_WEBHOOK_URL;
  const post = (body) => handler(new Request("https://site.test/api/orders", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body)
  }));
  try {
    delete process.env.ORDERS_WEBHOOK_URL;
    assert.equal((await post(order)).status, 503);
    process.env.ORDERS_WEBHOOK_URL = "https://example.test/exec";
    let upstreamCalls = 0;
    global.fetch = async (url, options) => {
      upstreamCalls++;
      assert.equal(url, "https://example.test/exec");
      assert.equal(options.headers["Content-Type"], "application/json");
      const sent = JSON.parse(options.body);
      assert.equal(sent.orderId, order.orderId);
      assert.equal(sent.extra, undefined);
      assert.equal(sent.customer.extra, undefined);
      return { ok: true, json: async () => ({ ok: true, orderId: order.orderId, duplicate: true }) };
    };
    const success = await post({ ...order, extra: "ignored", customer: { ...order.customer, extra: "ignored" } });
    assert.equal(success.status, 200);
    assert.deepEqual(await success.json(), { ok: true, orderId: order.orderId, duplicate: true });
    const deskOrder = { ...order, variant: "desk-2027", unitPrice: 65000, subtotal: 130000, total: 140000 };
    assert.equal((await post(deskOrder)).status, 200);

    for (const invalid of [
      { ...order, unitPrice: 1, subtotal: 2, total: 10002 },
      { ...order, shippingCost: 0, total: order.subtotal },
      { ...order, quantity: 11 },
      { ...order, variant: "constructor" },
      { ...order, orderId: "invalid" },
      { ...order, createdAt: "2027-01-01" },
      { ...order, shipping: { ...order.shipping, address: null } },
      { ...order, customer: { ...order.customer, phone: "123" } },
      { ...order, shipping: { ...order.shipping, department: "Desconocido" } }
    ]) {
      assert.equal((await post(invalid)).status, 400);
    }
    assert.equal(upstreamCalls, 2);
    assert.equal((await post("{")).status, 400);
    assert.equal((await post("x".repeat(16_385))).status, 413);
    assert.equal((await handler(new Request("https://site.test/api/orders"))).status, 405);

    global.fetch = async () => ({
      ok: true, json: async () => ({ ok: false, error: "ORDER_ID_CONFLICT" })
    });
    assert.equal((await post(order)).status, 409);
    global.fetch = async () => ({ ok: true, json: async () => ({ ok: true, orderId: "other" }) });
    assert.equal((await post(order)).status, 502);
    global.fetch = async () => { throw new Error("offline"); };
    assert.equal((await post(order)).status, 502);

    const warnings = [];
    const originalWarn = console.warn;
    try {
      console.warn = (message) => warnings.push(message);
      global.fetch = async () => ({ ok: true, json: async () => ({ ok: false, error: "INVALID_SHEET" }) });
      assert.equal((await post(order)).status, 502);
      global.fetch = async () => ({ ok: true, json: async () => ({ ok: false, error: "untrusted details" }) });
      assert.equal((await post(order)).status, 502);
    } finally {
      console.warn = originalWarn;
    }
    assert.deepEqual(warnings, [
      "Orders webhook rejected the order: INVALID_SHEET.",
      "Orders webhook rejected the order: UNKNOWN_ERROR."
    ]);
  } finally {
    if (originalUrl === undefined) delete process.env.ORDERS_WEBHOOK_URL;
    else process.env.ORDERS_WEBHOOK_URL = originalUrl;
  }
});

test("Netlify aborts a slow upstream request before the browser timeout", async () => {
  const { service, load } = setup();
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  const order = await service.createConsolidatedOrder();
  const handler = load("netlify/functions/orders.ts").default;
  const originalUrl = process.env.ORDERS_WEBHOOK_URL;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const mockedTimeout = Symbol("orders timeout");
  let triggerTimeout;
  try {
    process.env.ORDERS_WEBHOOK_URL = "https://example.test/exec";
    global.setTimeout = (callback, delay, ...args) => {
      if (delay !== 7000) return originalSetTimeout(callback, delay, ...args);
      triggerTimeout = callback;
      return mockedTimeout;
    };
    global.clearTimeout = (timeout) => {
      if (timeout !== mockedTimeout) originalClearTimeout(timeout);
    };
    global.fetch = async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
    const pending = handler(new Request("https://site.test/api/orders", {
      method: "POST",
      body: JSON.stringify(order)
    }));
    await new Promise(setImmediate);
    assert.equal(typeof triggerTimeout, "function");
    triggerTimeout();
    assert.equal((await pending).status, 502);
  } finally {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    if (originalUrl === undefined) delete process.env.ORDERS_WEBHOOK_URL;
    else process.env.ORDERS_WEBHOOK_URL = originalUrl;
  }
});

test("checkout disables duplicate submissions and offers a real retry after fallback", async () => {
  const { load, stores } = setup();
  const form = new EventTarget();
  const button = {
    textContent: "Continuar al pago",
    disabled: false,
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const status = { textContent: "" };
  form.querySelector = (selector) => ({
    "#checkout-submit-btn": button,
    "[data-order-status]": status,
    '[aria-invalid="true"]': null
  })[selector];
  global.document = { querySelector: () => form };

  const source = fs.readFileSync(path.join(root, "src/components/checkout/Checkout.astro"), "utf8")
    .match(/<script>([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === "../../services/orderService") return load("src/services/orderService.ts");
    if (specifier.startsWith("@stores/")) return load(`src/stores/${specifier.slice(8)}.ts`);
    if (specifier.startsWith("@data/")) return load(`src/data/${specifier.slice(6)}.ts`);
    throw new Error(`Unexpected import: ${specifier}`);
  };
  vm.runInThisContext(`(function(require, exports) { ${code}\n})`)(localRequire, {});

  const requests = [];
  let rejectFirst;
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) return new Promise((_resolve, reject) => { rejectFirst = reject; });
    return { ok: true, json: async () => ({ ok: true, orderId: requests.at(-1).orderId }) };
  };
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  assert.equal(button.disabled, true);
  assert.equal(button.attributes["aria-busy"], "true");
  assert.equal(button.textContent, "Generando tu pedido...");
  window.dispatchEvent(new CustomEvent("checkout:valid"));
  assert.equal(requests.length, 1);
  rejectFirst(new Error("offline"));
  await new Promise(setImmediate);
  assert.equal(button.disabled, false);
  assert.equal(button.attributes["aria-busy"], "false");
  assert.equal(button.textContent, "Reintentar");
  assert.match(status.textContent, /No pudimos confirmar el registro/);
  assert.match(status.textContent, new RegExp(requests[0].orderId));

  form.dispatchEvent(new Event("submit", { cancelable: true }));
  await new Promise(setImmediate);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].orderId, requests[0].orderId);
  assert.equal(button.textContent, "Continuar al pago");
  assert.match(status.textContent, /registrado/);
  stores.setQuantity(3);
  assert.equal(status.textContent, "");

  let resolveChanged;
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Promise((resolve) => { resolveChanged = resolve; });
  };
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  stores.setQuantity(2);
  resolveChanged({ ok: true, json: async () => ({ ok: true, orderId: requests.at(-1).orderId }) });
  await new Promise(setImmediate);
  assert.match(status.textContent, /datos del formulario cambiaron/);
  assert.match(status.textContent, new RegExp(requests.at(-1).orderId));
  assert.equal(button.textContent, "Continuar al pago");
});

function scriptHarness() {
  const headers = [
    "ID Orden", "Fecha", "Estado", "Formato", "Cantidad", "Subtotal", "Envío",
    "Total", "Nombre", "Cédula", "Celular", "Email", "Departamento", "Municipio",
    "Dirección", "Barrio", "Complemento", "Notas", "# Guía"
  ];
  const rows = [headers];
  const formats = new Map();
  let locked = false;
  const sheet = {
    getLastColumn: () => 19,
    getLastRow: () => rows.length,
    getRange: (row, column, height = 1, width = 1) => ({
      getValues: () => rows.slice(row - 1, row - 1 + height)
        .map((values) => values.slice(column - 1, column - 1 + width)),
      setNumberFormat: (format) => formats.set(`${row},${column},${height},${width}`, format),
      setValues: (values) => {
        assert.equal(locked, true);
        assert.equal(column, 1);
        assert.equal(height, 1);
        assert.equal(width, 19);
        assert.equal(formats.get(`${row},2,1,1`), "yyyy/MM/dd HH:mm");
        rows[row - 1] = Array.from(values[0]);
      }
    })
  };
  const context = {
    console,
    LockService: { getScriptLock: () => ({
      tryLock: () => { locked = true; return true; },
      releaseLock: () => { locked = false; }
    }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }), flush: () => {} },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) })
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "docs/google-apps-script/orders-webhook.gs"), "utf8"), context);
  return {
    rows,
    formats,
    post: (data) => context.doPost({ postData: { contents: JSON.stringify(data) } }),
    isLocked: () => locked
  };
}

test("Apps Script escapes formulas and deduplicates under a lock", async () => {
  const { service } = setup();
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  const order = await service.createConsolidatedOrder();
  order.shipping.address = " \t=HYPERLINK(\"bad\")";
  order.shipping.deliveryNotes = "+formula";
  const app = scriptHarness();
  assert.equal(app.post(order).ok, true);
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][1].getTime(), Date.parse(order.createdAt));
  assert.equal(app.formats.get("2,1,1,1"), "@");
  assert.equal(app.formats.get("2,2,1,1"), "yyyy/MM/dd HH:mm");
  assert.equal(app.rows[1][2], "Pendiente de pago");
  assert.equal(app.rows[1][14], "' \t=HYPERLINK(\"bad\")");
  assert.equal(app.rows[1][17], "'+formula");
  assert.equal(app.post(order).duplicate, true);
  assert.equal(app.rows.length, 2);
  app.formats.set("2,2,1,1", "dd/MM/yyyy HH:mm:ss");
  assert.equal(app.post(order).duplicate, true);
  assert.equal(app.formats.get("2,2,1,1"), "dd/MM/yyyy HH:mm:ss");
  const dateValue = app.rows[1][1];
  app.rows[1][1] = order.createdAt;
  const legacyDateRetry = app.post(order);
  assert.equal(legacyDateRetry.duplicate, true, JSON.stringify(legacyDateRetry));
  app.rows[1][1] = dateValue;
  app.rows[1][2] = "Pagado";
  app.rows[1][18] = "123";
  assert.equal(app.post(order).duplicate, true);
  assert.equal(app.post({ ...order, quantity: 1, subtotal: 85000, total: 95000 }).error, "ORDER_ID_CONFLICT");
  assert.equal(app.post({ ...order, total: 0 }).error, "INVALID_ORDER");
  assert.equal(app.isLocked(), false);
  for (const prefix of ["=", "+", "-", "@"]) {
    assert.equal(app.post({
      ...order,
      orderId: `CL27-ABCDEFGH${prefix === "=" ? "22" : prefix === "+" ? "23" : prefix === "-" ? "24" : "25"}`,
      shipping: { ...order.shipping, address: `${prefix}formula` }
    }).ok, true);
    assert.equal(app.rows.at(-1)[14], `'${prefix}formula`);
  }
});
