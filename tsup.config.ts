import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true,
    async onSuccess() {
        const distPath = path.resolve(__dirname, 'dist', 'index.js');

        let content = fs.readFileSync(distPath, 'utf-8');
        content += `
module.exports = Object.assign(module.exports.default, module.exports);
module.exports.default = module.exports;
        `;

        fs.writeFileSync(distPath, content, 'utf-8');
    }
});