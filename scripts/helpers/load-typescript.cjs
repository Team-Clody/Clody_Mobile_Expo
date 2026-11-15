const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Run production TypeScript with explicit mocks only at platform/API boundaries.
module.exports = function loadTypeScript(relativePath, mocks = {}) {
  const filename = path.resolve(path.dirname(require.resolve("../../package.json")), relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", code)((name) =>
    Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded.exports, loaded);
  return loaded.exports;
};
