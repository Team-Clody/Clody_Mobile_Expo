/*
 * Offline regressions for our controller against the installed AdMob SDK's
 * actual MobileAd, InterstitialAd, RewardedAd, validators, and event handling.
 * Only the native modules/event bridge and time are replaced. No ads or network
 * requests are made. Run: node scripts/test-admob-controller.cjs
 */
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.dirname(require.resolve("../package.json"));
const sdk = path.join(path.dirname(require.resolve("react-native-google-mobile-ads/package.json")), "src");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function settle() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

class Clock {
  now = 1_000_000;
  timers = new Map();
  nextId = 1;

  setTimeout = (callback, delay) => {
    const id = this.nextId++;
    this.timers.set(id, { callback, at: this.now + Math.max(0, delay) });
    return id;
  };

  clearTimeout = (id) => { this.timers.delete(id); };

  async advance(milliseconds) {
    const end = this.now + milliseconds;
    for (let count = 0; ; count += 1) {
      assert.ok(count < 100, "retry timers must not spin without a bound");
      const due = [...this.timers].filter(([, timer]) => timer.at <= end)
        .sort((left, right) => left[1].at - right[1].at)[0];
      if (!due) break;
      this.now = due[1].at;
      this.timers.delete(due[0]);
      due[1].callback();
      await settle();
    }
    this.now = end;
    await settle();
  }
}

function environment(options = {}) {
  const clock = new Clock();
  const emitter = new EventEmitter();
  const cache = new Map();
  const loads = [];
  const shows = [];
  const logs = [];
  const initialization = options.initialization ?? { promise: Promise.resolve([]) };
  let initializeCalls = 0;
  let nativeLoad = options.nativeLoad;
  let nativeShow = options.nativeShow;

  const library = {
    __esModule: true,
    default: () => ({ initialize: () => { initializeCalls += 1; return initialization.promise; } }),
  };
  const nativeModule = (kind) => ({
    [`${kind}Load`]: (requestId, unitId, requestOptions) => {
      const request = { kind, requestId, unitId, requestOptions };
      loads.push(request);
      return nativeLoad?.(request);
    },
    [`${kind}Show`]: (requestId, unitId, showOptions) => {
      const request = { kind, requestId, unitId, showOptions };
      shows.push(request);
      return nativeShow ? nativeShow(request) : Promise.resolve();
    },
  });
  const boundary = new Map([
    [path.join(sdk, "specs/modules/NativeRewardedModule"), { __esModule: true, default: nativeModule("rewarded") }],
    [path.join(sdk, "specs/modules/NativeInterstitialModule"), { __esModule: true, default: nativeModule("interstitial") }],
    [path.join(sdk, "internal/SharedEventEmitter"), { SharedEventEmitter: {
      addListener(name, callback) {
        emitter.on(name, callback);
        return { remove: () => emitter.off(name, callback) };
      },
    } }],
  ]);

  function sourcePath(name) {
    for (const extension of ["", ".ts", ".native.ts", ".tsx", ".js", "/index.ts"]) {
      const candidate = name + extension;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    throw new Error(`Cannot resolve test source: ${name}`);
  }

  function loadSource(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    const sourceRequire = (specifier) => {
      if (specifier === "react-native-google-mobile-ads") return library;
      if (specifier === "react-native") return { Platform: { OS: "ios" } };
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return require(specifier);
      let resolved = specifier.startsWith("@/")
        ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
      if (resolved === path.join(root, "shared/ads/initializeAdMob")) resolved += ".native";
      if (boundary.has(resolved)) return boundary.get(resolved);
      return loadSource(sourcePath(resolved));
    };
    const FakeDate = class extends Date { static now() { return clock.now; } };
    const quietConsole = { log: (...args) => logs.push(args), warn: (...args) => logs.push(args) };
    new Function("require", "module", "exports", "console", "setTimeout", "clearTimeout", "Date", compiled)(
      sourceRequire, module, module.exports, quietConsole, clock.setTimeout, clock.clearTimeout, FakeDate,
    );
    return module.exports;
  }

  Object.assign(library, loadSource(path.join(sdk, "AdEventType.ts")),
    loadSource(path.join(sdk, "RewardedAdEventType.ts")),
    loadSource(path.join(sdk, "ads/InterstitialAd.ts")),
    loadSource(path.join(sdk, "ads/RewardedAd.ts")));
  const { getAdMobFullScreenAdController: get } = loadSource(path.join(root, "shared/ads/adMobFullScreenAdController.ts"));

  function emit(request, type, payload) {
    assert.ok(request, "a native load request must exist before emitting its SDK response");
    const body = type === library.AdEventType.ERROR
      ? { type, error: payload } : { type, data: payload };
    emitter.emit(`google_mobile_ads_${request.kind}_event:${request.unitId}:${request.requestId}`, { body });
  }

  return {
    get, clock, loads, shows, logs, library, loadSource,
    get initializeCalls() { return initializeCalls; },
    setNativeLoad: (callback) => { nativeLoad = callback; },
    setNativeShow: (callback) => { nativeShow = callback; },
    emit,
    loaded: (request = loads.at(-1)) => emit(request,
      request.kind === "rewarded" ? library.RewardedAdEventType.LOADED : library.AdEventType.LOADED,
      request.kind === "rewarded" ? { amount: 1, type: "reward" } : undefined),
    error: (code = "no-fill", request = loads.at(-1)) => emit(request, library.AdEventType.ERROR,
      { code, message: `Injected ${code}` }),
  };
}

async function started(env, kind = "rewarded", unit = "test-unit") {
  const controller = env.get(kind, unit);
  const unsubscribe = controller.subscribe(() => {});
  await settle();
  return { controller, unsubscribe };
}

test("uses the pinned SDK and its real native request/event classes", async () => {
  assert.equal(require("react-native-google-mobile-ads/package.json").version, "16.0.0");
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  assert.equal(env.loads.length, 1);
  assert.equal(env.loads[0].requestOptions.requestAgent, "rn-invertase-16.0.0");
  env.loaded();
  assert.equal(controller.getSnapshot().isLoaded, true);
  assert.equal(controller.showAd(), true);
  assert.equal(env.shows.length, 1);
  unsubscribe();
});

for (const kind of ["rewarded", "interstitial"]) {
  test(`${kind}: pending initialization and repeated manual loads issue one request`, async () => {
    const initialization = deferred();
    const env = environment({ initialization });
    const { controller, unsubscribe } = await started(env, kind);
    assert.equal(controller.load(), true);
    assert.equal(controller.load(), true);
    assert.equal(env.initializeCalls, 1);
    assert.equal(env.loads.length, 0, "manual loading must wait for initialization");
    initialization.resolve([]);
    await settle();
    assert.equal(env.loads.length, 1);
    assert.equal(controller.load(), true);
    assert.equal(env.loads.length, 1, "in-flight native request cannot be duplicated");
    env.loaded();
    const ready = controller.getSnapshot();
    assert.equal(controller.load(), true);
    assert.strictEqual(controller.getSnapshot(), ready, "duplicate public load cannot reset ready snapshot");
    assert.equal(env.loads.length, 1);
    assert.equal(controller.showAd(), true);
    unsubscribe();
  });

  test(`${kind}: a pre-render load/show callback observes current loaded state`, async () => {
    const env = environment();
    const { controller, unsubscribe } = await started(env, kind);
    const loadBeforeReady = controller.load;
    const showBeforeReady = controller.showAd;
    env.loaded();
    assert.equal(loadBeforeReady(), true);
    assert.equal(controller.getSnapshot().isLoaded, true);
    assert.equal(showBeforeReady(), true);
    assert.equal(env.loads.length, 1);
    assert.equal(env.shows.length, 1);
    unsubscribe();
  });
}

test("identity is cached per kind/unit, while distinct placements load independently", async () => {
  const env = environment();
  const a = env.get("rewarded", "same-unit");
  assert.strictEqual(a, env.get("rewarded", "same-unit"));
  const b = env.get("interstitial", "same-unit");
  const c = env.get("rewarded", "other-unit");
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a, c);
  assert.equal(env.loads.length, 0, "retrieving a controller must not create/load native ads");
  const offA = a.subscribe(() => {});
  const offA2 = a.subscribe(() => {});
  const offB = b.subscribe(() => {});
  const offC = c.subscribe(() => {});
  await settle();
  assert.equal(env.initializeCalls, 1);
  assert.equal(env.loads.length, 3, "two screens sharing one placement share one request");
  offA(); offA2(); offB(); offC();
});

test("last unsubscribe blocks loading and late initialization; remount resumes once", async () => {
  const initialization = deferred();
  const env = environment({ initialization });
  const { controller, unsubscribe } = await started(env);
  unsubscribe();
  assert.equal(controller.load(), false);
  assert.equal(controller.showAd(), false);
  initialization.resolve([]);
  await settle();
  assert.equal(env.loads.length, 0);
  const off = controller.subscribe(() => {});
  await settle();
  assert.equal(env.loads.length, 1);
  assert.equal(env.initializeCalls, 1);
  env.loaded();
  off();
  const ready = controller.getSnapshot();
  const offAgain = controller.subscribe(() => {});
  assert.strictEqual(controller.getSnapshot(), ready);
  assert.equal(env.loads.length, 1, "remount keeps a cached loaded ad");
  offAgain();
});

test("subscriptions receive stable snapshots and stop receiving updates when removed", async () => {
  const env = environment();
  const controller = env.get("rewarded", "subscriptions");
  let first = 0;
  let second = 0;
  const offFirst = controller.subscribe(() => { first += 1; });
  const offSecond = controller.subscribe(() => { second += 1; });
  await settle();
  assert.strictEqual(controller.getSnapshot(), controller.getSnapshot());
  env.loaded();
  assert.equal(first, 1);
  assert.equal(second, 1);
  offFirst();
  env.emit(env.loads[0], env.library.AdEventType.CLICKED);
  assert.equal(first, 1);
  assert.equal(second, 2);
  offSecond();
});

for (const [code, baseDelay] of [["no-fill", 60_000], ["network-error", 30_000], ["invalid-request", 120_000]]) {
  test(`${code}: cooldown, exponential retries and automatic retry bound`, async () => {
    const env = environment();
    const { controller, unsubscribe } = await started(env);
    for (let retry = 0; retry < 4; retry += 1) {
      env.error(code);
      const failed = controller.getSnapshot();
      assert.match(failed.error.message, new RegExp(code));
      assert.equal(controller.load(), false, "manual attempts cannot bypass cooldown");
      assert.strictEqual(controller.getSnapshot(), failed, "error must survive rejected manual load");
      const delay = Math.min(baseDelay * 2 ** retry, 300_000);
      if (retry < 3) {
        await env.clock.advance(delay - 1);
        assert.equal(env.loads.length, retry + 1);
        await env.clock.advance(1);
        assert.equal(env.loads.length, retry + 2);
        assert.strictEqual(controller.getSnapshot().error, failed.error, "retry preserves last error until success");
      } else {
        await env.clock.advance(delay + 1_000_000);
        assert.equal(env.loads.length, 4, "first request plus exactly three automatic retries");
      }
    }
    assert.equal(controller.load(), true, "explicit retry after cooldown starts a new cycle");
    assert.equal(env.loads.length, 5);
    env.error(code);
    await env.clock.advance(baseDelay);
    assert.equal(env.loads.length, 6, "manual cycle restores the automatic retry budget");
    env.loaded();
    assert.equal(controller.getSnapshot().error, undefined);
    assert.equal(controller.getSnapshot().isLoaded, true);
    unsubscribe();
  });
}

test("unsubscribe cancels retry timer; remount retains cooldown and error", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.error();
  const error = controller.getSnapshot().error;
  unsubscribe();
  assert.equal(env.clock.timers.size, 0);
  await env.clock.advance(30_000);
  const off = controller.subscribe(() => {});
  assert.strictEqual(controller.getSnapshot().error, error);
  assert.equal(controller.load(), false);
  await env.clock.advance(29_999);
  assert.equal(env.loads.length, 1);
  await env.clock.advance(1);
  assert.equal(env.loads.length, 2);
  off();
});

test("resubscribing during an in-flight retry cannot consume the retry budget", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.error();
  await env.clock.advance(60_000);
  assert.equal(env.loads.length, 2);
  const offSecond = controller.subscribe(() => {});
  await env.clock.advance(0);
  const offThird = controller.subscribe(() => {});
  await env.clock.advance(0);
  assert.equal(env.loads.length, 2, "subscribing must not duplicate a pending native retry");
  env.error();
  assert.equal(env.clock.timers.size, 1, "subscriber churn must not exhaust the remaining retries");
  await env.clock.advance(120_000);
  assert.equal(env.loads.length, 3);
  offSecond(); offThird(); unsubscribe();
});

test("late events from a discarded failed ad cannot restore ready state", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  const oldRequest = env.loads[0];
  env.error();
  const failed = controller.getSnapshot();
  env.loaded(oldRequest);
  assert.strictEqual(controller.getSnapshot(), failed);
  await env.clock.advance(60_000);
  env.loaded();
  assert.equal(controller.getSnapshot().isLoaded, true);
  assert.equal(controller.getSnapshot().error, undefined);
  unsubscribe();
});

test("display lock prevents duplicate shows across one or multiple placements", async () => {
  const env = environment();
  const first = await started(env, "rewarded", "rewarded");
  const second = await started(env, "interstitial", "interstitial");
  env.loaded(env.loads[0]);
  env.loaded(env.loads[1]);
  assert.equal(first.controller.showAd(), true);
  assert.equal(first.controller.getSnapshot().isShowing, true);
  assert.equal(first.controller.load(), false);
  assert.equal(first.controller.showAd(), false);
  assert.equal(second.controller.showAd(), false);
  assert.equal(env.shows.length, 1);
  env.emit(env.loads[0], env.library.AdEventType.CLOSED);
  assert.equal(second.controller.showAd(), true);
  assert.equal(env.shows.length, 2);
  first.unsubscribe(); second.unsubscribe();
});

for (const mode of ["throw", "reject"]) {
  test(`show ${mode}: error is retained, locks release and next ad is fresh`, async () => {
    const failure = Object.assign(new Error(`native ${mode}`), { code: "googleMobileAds/nil-vc" });
    const env = environment({ nativeShow: () => {
      if (mode === "throw") throw failure;
      return Promise.reject(failure);
    } });
    const { controller, unsubscribe } = await started(env);
    env.loaded();
    assert.equal(controller.showAd(), mode !== "throw");
    await settle();
    assert.strictEqual(controller.getSnapshot().error, failure);
    assert.equal(controller.getSnapshot().isShowing, false);
    assert.equal(controller.getSnapshot().isLoaded, false);
    assert.equal(controller.load(), false);
    await env.clock.advance(30_000);
    assert.equal(env.loads.length, 2);
    assert.notEqual(env.loads[1].requestId, env.loads[0].requestId, "rejected loaded instance must be discarded");
    env.setNativeShow(() => Promise.resolve());
    env.loaded();
    assert.equal(controller.showAd(), true);
    unsubscribe();
  });
}

test("a late rejection from a completed show cannot damage its preloaded successor", async () => {
  const pendingShow = deferred();
  const env = environment({ nativeShow: () => pendingShow.promise });
  const { controller, unsubscribe } = await started(env);
  env.loaded();
  assert.equal(controller.showAd(), true);
  env.emit(env.loads[0], env.library.AdEventType.CLOSED);
  env.loaded();
  const ready = controller.getSnapshot();
  pendingShow.reject(new Error("late rejection from closed show"));
  await settle();
  assert.strictEqual(controller.getSnapshot(), ready);
  assert.equal(env.clock.timers.size, 0);
  unsubscribe();
});

test("earned reward and CLOSED survive synchronous preload until the next show", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.loaded();
  assert.equal(controller.showAd(), true);
  const shownRequest = env.loads[0];
  env.emit(shownRequest, env.library.AdEventType.CLICKED);
  env.emit(shownRequest, env.library.RewardedAdEventType.EARNED_REWARD, { amount: 7, type: "clover" });
  env.setNativeLoad((request) => env.loaded(request));
  env.emit(shownRequest, env.library.AdEventType.CLOSED);
  assert.equal(controller.getSnapshot().isLoaded, true);
  assert.equal(controller.getSnapshot().isClosed, true);
  assert.equal(controller.getSnapshot().isEarnedReward, true);
  assert.deepEqual(controller.getSnapshot().reward, { amount: 7, type: "clover" });
  assert.equal(controller.showAd(), true);
  assert.equal(controller.getSnapshot().isClosed, false);
  assert.equal(controller.getSnapshot().isClicked, false);
  assert.equal(controller.getSnapshot().isEarnedReward, false);
  assert.equal(controller.getSnapshot().reward, undefined);
  unsubscribe();
});

test("CLOSED without earning does not grant a reward and still preloads", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.loaded();
  controller.showAd();
  env.emit(env.loads[0], env.library.AdEventType.CLOSED);
  assert.equal(controller.getSnapshot().isClosed, true);
  assert.equal(controller.getSnapshot().isEarnedReward, false);
  assert.equal(env.loads.length, 2);
  unsubscribe();
});

test("initialization failure is observable and uses a delayed retry", async () => {
  const initialization = deferred();
  const env = environment({ initialization });
  const { controller, unsubscribe } = await started(env);
  const failure = new Error("initialization failed");
  initialization.reject(failure);
  await settle();
  assert.strictEqual(controller.getSnapshot().error, failure);
  assert.equal(env.loads.length, 0);
  assert.equal(controller.load(), false);
  assert.equal(env.clock.timers.size, 1);
  unsubscribe();
});

test("a late initialization rejection retains cooldown across unmount and can recover", async () => {
  const initialization = deferred();
  const env = environment({ initialization });
  const { controller, unsubscribe } = await started(env);
  unsubscribe();
  const failure = new Error("late initialization rejection");
  initialization.reject(failure);
  await settle();
  assert.strictEqual(controller.getSnapshot().error, failure);
  assert.equal(env.clock.timers.size, 0, "inactive controllers cannot keep automatic retry timers");
  initialization.promise = Promise.resolve([]);
  const off = controller.subscribe(() => {});
  assert.equal(controller.load(), false);
  await env.clock.advance(30_000);
  assert.equal(env.initializeCalls, 2);
  assert.equal(env.loads.length, 1);
  env.loaded();
  assert.equal(controller.getSnapshot().error, undefined);
  off();
});

test("native load throws are caught and a later request uses a fresh ad", async () => {
  const failure = new Error("native load failed synchronously");
  const env = environment({ nativeLoad: () => { throw failure; } });
  const { controller, unsubscribe } = await started(env);
  assert.strictEqual(controller.getSnapshot().error, failure);
  assert.equal(controller.load(), false);
  env.setNativeLoad(undefined);
  await env.clock.advance(30_000);
  assert.equal(env.loads.length, 2);
  assert.notEqual(env.loads[0].requestId, env.loads[1].requestId);
  env.loaded();
  assert.equal(controller.getSnapshot().isLoaded, true);
  unsubscribe();
});

for (const kind of ["rewarded", "interstitial"]) {
  for (const trigger of ["load", "showAd", "remount"]) {
    test(`${kind}: ${trigger} refreshes a 55-minute cached ad with a fresh native object`, async () => {
      const env = environment();
      const active = await started(env, kind);
      const { controller } = active;
      env.loaded();
      const ready = controller.getSnapshot();
      const oldRequest = env.loads[0];
      await env.clock.advance(55 * 60_000 - 1);
      assert.equal(controller.load(), true);
      assert.strictEqual(controller.getSnapshot(), ready, "unexpired ads remain ready");
      assert.equal(env.loads.length, 1);
      if (trigger === "remount") active.unsubscribe();
      await env.clock.advance(1);
      assert.strictEqual(controller.getSnapshot(), ready, "getSnapshot must be pure even when a cached ad expires");
      assert.equal(env.loads.length, 1, "reading an expired snapshot cannot cause native side effects");
      let offAgain;
      if (trigger === "remount") offAgain = controller.subscribe(() => {});
      else assert.equal(controller[trigger](), trigger === "load");
      assert.equal(controller.getSnapshot().isLoaded, false);
      assert.equal(env.shows.length, 0, "expired ads must not reach native show");
      assert.equal(env.loads.length, 2);
      assert.notEqual(env.loads[1].requestId, oldRequest.requestId);
      env.loaded(oldRequest);
      assert.equal(controller.getSnapshot().isLoaded, false, "old expired ad responses are ignored");
      env.loaded();
      assert.equal(controller.getSnapshot().isLoaded, true);
      assert.equal(controller.showAd(), true);
      if (offAgain) offAgain();
      else active.unsubscribe();
    });
  }
}

test("a successful load resets exponential backoff for the next failure", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.error();
  await env.clock.advance(60_000);
  env.loaded();
  assert.equal(controller.getSnapshot().error, undefined);
  env.error();
  await env.clock.advance(59_999);
  assert.equal(env.loads.length, 2);
  await env.clock.advance(1);
  assert.equal(env.loads.length, 3, "post-success retry uses the first 60-second delay again");
  unsubscribe();
});

test("native presentation ERROR is reported as show rather than load failure", async () => {
  const env = environment();
  const { controller, unsubscribe } = await started(env);
  env.loaded();
  controller.showAd();
  env.error("internal-error");
  const failure = env.logs.find((entry) => entry[0] === "[AdMob] ad failed");
  assert.equal(failure[1].phase, "show");
  assert.equal(controller.getSnapshot().isShowing, false);
  assert.match(controller.getSnapshot().error.message, /internal-error/);
  unsubscribe();
});

// The probe renders no DOM nodes. This minimal host is sufficient to exercise
// React's real subscribe/effect/StrictMode behavior without a browser or package
// install; all ad requests still end at the native mock above.
function installNullDom() {
  class Element {
    constructor(tag, document) {
      this.nodeType = 1;
      this.tagName = tag.toUpperCase();
      this.nodeName = this.tagName;
      this.ownerDocument = document;
      this.namespaceURI = "http://www.w3.org/1999/xhtml";
      this.style = {};
      this.childNodes = [];
    }
    addEventListener() {}
    removeEventListener() {}
    setAttribute() {}
    removeAttribute() {}
    appendChild(child) { this.childNodes.push(child); child.parentNode = this; }
    removeChild(child) { this.childNodes.splice(this.childNodes.indexOf(child), 1); }
    get firstChild() { return this.childNodes[0] ?? null; }
  }
  const document = {
    nodeType: 9,
    addEventListener() {},
    removeEventListener() {},
    createElement(tag) { return new Element(tag, this); },
  };
  document.body = document.createElement("body");
  document.documentElement = document.createElement("html");
  document.activeElement = document.body;
  const window = {
    document, HTMLElement: Element, HTMLIFrameElement: class {},
    addEventListener() {}, removeEventListener() {}, getSelection: () => null,
  };
  document.defaultView = window;
  const before = Object.fromEntries(["window", "document", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"]
    .map((key) => [key, { exists: Object.hasOwn(global, key), value: global[key] }]));
  Object.assign(global, { window, document, HTMLElement: Element, IS_REACT_ACT_ENVIRONMENT: true });
  return {
    document,
    restore() {
      for (const [key, entry] of Object.entries(before)) {
        if (entry.exists) global[key] = entry.value;
        else delete global[key];
      }
    },
  };
}

test("real useSyncExternalStore subscribers and StrictMode share the cached ad", async (context) => {
  const dom = installNullDom();
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const initialization = deferred();
  const env = environment({ initialization });
  const { useAdMobFullScreenAd } = env.loadSource(path.join(root, "shared/ads/useAdMobFullScreenAd.ts"));
  const latest = [];
  const renderCounts = [0, 0];
  function Probe({ id }) {
    latest[id] = useAdMobFullScreenAd("rewarded", "react-shared-unit");
    renderCounts[id] += 1;
    return null;
  }
  const first = createRoot(dom.document.createElement("div"));
  const second = createRoot(dom.document.createElement("div"));
  let firstMounted = true;
  context.after(async () => {
    await React.act(async () => {
      if (firstMounted) first.unmount();
      second.unmount();
    });
    dom.restore();
  });
  await React.act(async () => {
    first.render(React.createElement(React.StrictMode, null, React.createElement(Probe, { id: 0 })));
    second.render(React.createElement(Probe, { id: 1 }));
  });
  assert.equal(env.initializeCalls, 1);
  assert.equal(env.loads.length, 0);
  assert.strictEqual(latest[0].load, latest[1].load);
  await React.act(async () => { initialization.resolve([]); await settle(); });
  assert.equal(env.loads.length, 1);
  const callbackBeforeReady = latest[0].load;
  await React.act(async () => env.loaded());
  assert.equal(latest[0].isLoaded, true);
  assert.equal(latest[1].isLoaded, true);
  assert.equal(callbackBeforeReady(), true);
  assert.equal(env.loads.length, 1);
  await React.act(async () => first.unmount());
  firstMounted = false;
  const oldCount = renderCounts[0];
  await React.act(async () => env.emit(env.loads[0], env.library.AdEventType.CLICKED));
  assert.equal(renderCounts[0], oldCount);
  assert.equal(latest[1].isClicked, true);
});
