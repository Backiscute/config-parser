import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    esbuildOptions: (options) => {
        options.footer = {
            js: `
if (module.exports.default) {
  Object.assign(module.exports.default, module.exports);
  module.exports = module.exports.default;
  delete module.exports.default;
}`,
        }
    }
});