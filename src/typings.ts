import { WatchOptions as ChokidarOptions } from "chokidar";
import { GlobOptionsWithFileTypesUnset, GlobOptionsWithFileTypesFalse } from "glob";
import { Schema } from "joi";

export interface ConfigParserOptions {
    hotReload?: boolean;
    watchOptions?: ChokidarOptions;
    globOptions?: GlobOptionsWithFileTypesUnset | GlobOptionsWithFileTypesFalse;
    conserveExtensions?: boolean;
    conservePaths?: boolean;
    encoding?: BufferEncoding;
    start?: boolean;
    files: Record<string, ConfigFileOptions>;
    folders: ConfigFolderOptions[];
    parsers?: Record<string, (config: string) => any | Promise<any>>;
    logging?: {
        error?: boolean;
        debug?: boolean;
    }
}

export interface ConfigFileOptions {
    path: string;
    hotReload?: boolean;
    parser?: (config: string) => any | Promise<any>;
    validator?: Schema | ((config: any) => boolean);
}

export interface ConfigFolderOptions {
    path: string;
    hotReload?: boolean;
    parsers?: Record<string, (config: string) => any | Promise<any>>;
    validators?: Record<string, Schema | ((config: any) => boolean)>;
}