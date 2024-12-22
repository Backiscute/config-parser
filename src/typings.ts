import { FSWInstanceOptions as ChokidarOptions } from "chokidar";
import { GlobOptionsWithFileTypesUnset, GlobOptionsWithFileTypesFalse } from "glob";
import { Schema as JoiSchema } from "joi";
import { ZodSchema } from "zod";
import { Stats } from "fs";

type FSWatcherEventMap = {
    add: (path: string, stats?: Stats) => void;
    addDir: (path: string, stats?: Stats) => void;
    change: (path: string, stats?: Stats) => void;
    all: (eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', path: string, stats?: Stats) => void;
    error: (error: Error) => void;
    raw: (eventName: string, path: string, details: any) => void;
    ready: () => void;
    unlink: (path: string) => void;
    unlinkDir: (path: string) => void;
};

type FSWatcherEvents = {
    [K in keyof FSWatcherEventMap]?: FSWatcherEventMap[K];
};

export interface ConfigParserOptions {
    hotReload?: boolean;
    allowBinary?: boolean;
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
    events?: FSWatcherEvents;
}

export interface ConfigFileOptions {
    path: string;
    hotReload?: boolean;
    allowBinary?: boolean;
    parser?: (config: string) => any | Promise<any>;
    validator?: JoiSchema | ZodSchema | ((config: any) => boolean);
}

export interface ConfigFolderOptions {
    path: string;
    hotReload?: boolean;
    allowBinary?: boolean;
    parsers?: Record<string, (config: string) => any | Promise<any>>;
    validators?: Record<string, JoiSchema | ZodSchema | ((config: any) => boolean)>;
}