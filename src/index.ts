import { ConfigFileOptions, ConfigParserOptions } from "./typings";
import { glob } from "glob";
import { FSWatcher, watch } from "chokidar";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { parse as parseJsonc } from "jsonc-parser";
import { parse as parseIni } from "ini";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";
import { XMLParser as xmlParser } from "fast-xml-parser"
import { isSchema } from "joi";
import isBinaryPath from "is-binary-path";
import path from "path";

class ConfigParser<T extends Record<string, any>> {
    private options: ConfigParserOptions;
    private started: boolean = false;
    private watcher?: FSWatcher;
    public configs: T = {} as T;

    constructor(options: ConfigParserOptions) {
        this.options = options;
        this.options.logging ??= { error: true, debug: false };
        this.options.logging.error ??= true;
        this.options.logging.debug ??= false;
        this.options.conserveExtensions ??= false;
        this.options.conservePaths ??= false;
        this.options.hotReload ??= true;
        this.options.start ??= true;
        if (this.options.start) this.start();
    }

    public async start() {
        if (this.started) throw new Error("ConfigParser already started");
        this.started = true;

        const paths: string[] = [];
        for (const file of Object.values(this.options.files)) {
            file.hotReload ??= this.options.hotReload;
            if (file.hotReload) paths.push(file.path);
            await this.load(file.path);
        }

        for (const folder of this.options.folders) {
            folder.hotReload ??= this.options.hotReload;
            if (folder.hotReload) paths.push(folder.path);
            const files = await glob(folder.path, this.options.globOptions ?? {});
            for (const file of files) await this.load(file);
        }

        if (paths.length) {
            this.debug(`Watching ${paths.length} files and folders...`)
            this.watcher = watch(paths, this.options.watchOptions);
            this.watcher.on("add", (path) => this.debug(`Started watching ${path}`));
            this.watcher.on("addDir", (path) => this.debug(`Started watching ${path}`));
            this.watcher.on("change", this.load.bind(this));
        }
    }

    public stop() {
        if (!this.started) throw new Error("ConfigParser not started");
        if (!this.watcher) throw new Error("Watcher not initialized");
            
        this.started = false;
        this.watcher.close();
        this.watcher = undefined;
    }

    private async load(filePath: string) {
        if (!existsSync(filePath)) return this.debug(`[LOAD] File ${filePath} does not exist`);
        if (isBinaryPath(filePath)) return this.debug(`[LOAD] Ignoring binary file ${filePath}`);
        this.debug(`[LOAD] (Re)Loading file ${filePath}...`);

        const file = await readFile(filePath, { encoding: this.options.encoding ?? "utf-8" });
        const extension = path.extname(filePath)
        const [configName, configOptions] = Object.entries(this.options.files).find(([, file]) => path.normalize(file.path) === path.normalize(filePath)) ?? [this.options.conservePaths ? path.normalize(filePath) : path.basename(filePath, this.options.conserveExtensions ? undefined : extension), {} as ConfigFileOptions];
        let config: any;

        if (configOptions?.parser) {
            try {
                config = await configOptions.parser(file); 
            } catch (err) {
                this.error(err);
            }
        } else {
            try {
                switch (extension) {
                    case ".json":
                        config = JSON.parse(file);
                        break;
                    case ".jsonc":
                        config = parseJsonc(file);
                        break;
                    case ".ini":
                        config = parseIni(file);
                        break;
                    case ".yaml":
                    case ".yml":
                        config = parseYaml(file);
                        break;
                    case ".toml":
                        config = parseToml(file);
                        break;
                    case ".xml":
                        config = new xmlParser().parse(file);
                        break;
                    case ".js":
                        config = require(filePath);
                        break;
                    default:
                        config = file;
                }
            } catch (err) {
                this.error(err);
            }
        }

        if (configOptions?.validator) {
            if (isSchema(configOptions?.validator)) {
                const { error } = configOptions.validator.validate(config);
                if (error) {
                    this.error(new Error(`Validation error in file ${filePath}: ${error.message}`));
                    return;
                }
            } else {
                if (!configOptions.validator(config)) {
                    this.error(new Error(`Validation error in file ${filePath}`));
                    return;
                }
            }
        }

        this.configs[configName as keyof T] = config;        
        this.debug(`[LOAD] Successfully (re)loaded ${filePath}`);
    }

    private error(err: Error) {
        if (!this.options.logging?.error) return
        console.error(`\x1b[31m[ConfigParser]\x1b[0m ${err.message}`);
    }

    private debug(message: string) {
        if (!this.options.logging?.debug) return
        console.log(`\x1b[35m[ConfigParser]\x1b[0m ${message}`);
    }
}

export default ConfigParser;
export * from "./typings";