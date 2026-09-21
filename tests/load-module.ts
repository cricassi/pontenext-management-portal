import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";

export function loadModule<T>(filename: string, mocks: Record<string, unknown>): T {
  const absolute = resolve(filename);
  const { outputText } = transpileModule(readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2020, esModuleInterop: true, jsx: JsxEmit.ReactJSX }, fileName: absolute,
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name: string) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module, module.exports);
  return module.exports as T;
}
