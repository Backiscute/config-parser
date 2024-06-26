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

    get isStarted() { return this.started; }

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
            this.debug(`Found file ${file.path}`);
            await this.load(file.path);
        }

        for (const folder of this.options.folders) {
            folder.hotReload ??= this.options.hotReload;
            if (folder.hotReload) paths.push(folder.path);
            const files = await glob(folder.path, this.options.globOptions ?? {});
            this.debug(`Found ${files.length} files in folder "${folder.path}"`);
            this.debug(`Files: ${files.join(", ")}`);
            for (const file of files) {
                this.debug(`Found file ${file}`);
                await this.load(file, { parser: folder.parsers?.[path.basename(file)], validator: folder.validators?.[path.basename(file)] });
            }
        }

        if (paths.length) {
            this.debug(`Watching ${paths.length} files and folders...`)
            this.watcher = watch(paths, this.options.watchOptions);
            this.watcher.on("add", (path) => this.debug(`Started watching "${path}"`));
            this.watcher.on("addDir", (path) => this.debug(`Started watching "${path}"`));
            this.watcher.on("change", this.load.bind(this));
            for (const [eventName, eventValue] of Object.entries(this.options.events ?? {})) this.watcher.on(eventName, eventValue);
        }
    }

    public stop() {
        if (!this.started) throw new Error("ConfigParser not started");
        if (!this.watcher) throw new Error("Watcher not initialized");
            
        this.started = false;
        this.watcher.close();
        this.watcher = undefined;
    }

    private async load(filePath: string, { parser, validator }: { parser?: (config: string) => any | Promise<any>; validator?: any; } = {}) {
        filePath = path.resolve(filePath);
        if (!existsSync(filePath)) return this.debug(`\x1b[35m[LOAD]\x1b[0m File "${filePath}" does not exist`);
        if (isBinaryPath(filePath)) return this.debug(`\x1b[35m[LOAD]\x1b[0m Ignoring binary file "${filePath}"`);
        this.debug(`\x1b[35m[LOAD]\x1b[0m (Re)Loading file "${filePath}"...`);

        const file = await readFile(filePath, { encoding: this.options.encoding ?? "utf-8" });
        const extension = path.extname(filePath)
        const [configName, configOptions] = Object.entries(this.options.files).find(([, file]) => path.normalize(path.resolve(file.path)) === path.normalize(filePath)) ?? [this.options.conservePaths ? path.normalize(filePath) : path.basename(filePath, this.options.conserveExtensions ? undefined : extension), {} as ConfigFileOptions];
        let config: any;

        if (configOptions?.parser) {
            try {
                config = await configOptions.parser(file); 
            } catch (err) {
                this.error(err);
            }
        } else {
            try {
                if (this.options.parsers?.[extension]) config = await this.options.parsers[extension](file);
                else {
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
                }
            } catch (err) {
                this.error(err);
            }
        }

        if (configOptions?.validator) {
            if (isSchema(configOptions?.validator)) {
                const { error } = configOptions.validator.validate(config);
                if (error) {
                    this.error(new Error(`Validation error in file "${filePath}": ${error.message}`));
                    return;
                }
            } else {
                if (!configOptions.validator(config)) {
                    this.error(new Error(`Validation error in file "${filePath}"`));
                    return;
                }
            }
        }

        this.configs[configName as keyof T] = config;        
        this.debug(`\x1b[35m[LOAD]\x1b[0m Successfully (re)loaded "${filePath}"`);
    }

    private error(err: Error) {
        if (!this.options.logging?.error) return
        console.error(`\x1b[31m[ConfigParser]\x1b[0m ${err.message}`);
    }

    private debug(message: string) {
        if (!this.options.logging?.debug) return
        console.log(`\x1b[35m[ConfigParser]\x1b[0m ${message}`);
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `ConfigParser <Watching ${this.options.hotReload ? "enabled" : "disabled"}>`
    }
}

export default ConfigParser;
export * from "./typings";