# Back's config parser
## What's this?
It's a package that parses config files from different languages. It can reload them once they change and features a custom parser and validator. It supports as of now:
- JS *(default export only)*
- JSON
- JSONC
- INI
- YAML/YML
- TOML
- XML
### NOTE
> The parser **will ignore** any binary files.
## Usage examples
> JS
```js
    const ConfigParser = require("@backs/config-parser")
    const { mySchema } = require("./schemas")
    const { myValidator } = require("./validators")

    const parser = new ConfigParser({
        files: {
            bot: {
                path: "./configs/bot.json",
                validator: mySchema
            },
            server: {
                path: "./configs/server.yaml",
                hotReload: false,
                validator: myValidator
            }
        },
        folders: [{
            path: "./other/configs"
        }]
    })

    // Types will be any so no intellisense
    console.log(
        parser.configs.bot,
        parser.configs.server,
        // If other/configs has a file named test, view options for more customization of the name
        parser.configs.test
    )
```
> TS
```ts
    import ConfigParser from "@backs/config-parser"
    import { mySchema } from "./schemas"
    import { myValidator } from "./validators"

    const parser = new ConfigParser<MyConfigType>({
        files: {
            bot: {
                path: "./configs/bot.json",
                validator: mySchema
            },
            server: {
                path: "./configs/server.yaml",
                hotReload: false,
                validator: myValidator
            }
        },
        folders: [{
            path: "./other/configs"
        }]
    })

    // Types will be the types of MyConfigType
    console.log(
        parser.configs.bot,
        parser.configs.server,
        // If other/configs has a file named test, view options for more customization of the name
        parser.configs.test
    )
```
### NOTE
> If you set `start` to false, you will need to manually start the parser
```js
    parser.start()
```
> You can also stop the parser. **Useful when watching for changes.**
```js
    parser.stop()
```
## Custom Parser
Let's say you're using a not-so-common file type. Well you're not out of luck, you can just pass a custom function parser to parse it.
Your function should take a string and return any type value. Your function can be both synchronous or asynchronous.
*Example:*
```ts
    import ConfigParser from "@backs/config-parser"

    const parser = new ConfigParser({
        files: {
            myWeirdFile: {
                path: "./path/to/my/config.weirdextension",
                parser: async (config) => {
                    return await myWeirdParser.parse(config)
                }
            }
        },
        folders: {}
    })

    console.log(parser.configs.myWeirdFile)
```
### NOTE
> If you're using the `folders` option to load your files and need a custom parser, you must add each file manually to the `files` option instead.
## Options
### ConfigParserOptions
- `hotReload`?: `boolean` - Whether or not to watch the files for changes using [chokidar](https://www.npmjs.com/package/chokidar) and reload them once they change. Defaults to `true`.
- `watchOptions`?: `ChokidarWatchOptions` - Just the watch options from [chokidar](https://www.npmjs.com/package/chokidar).
- `globOptions`?: `GlobOptionsWithFileTypesUnset | GlobOptionsWithFileTypesFalse` - Just the globOptions from [glob](https://www.npmjs.com/package/glob). *The option `withFileTypes` must be `undefined` or `false`.*
- `conserveExtensions`?: `boolean` - Whether or not to conserve extensions of files when using the `folders` option to load files. Defaults to `false`.
- `conservePaths`?: `boolean` - Whether or not to conserve the full file path of files when using the `folders` option to load files. Useful to avoid conflicts between files named similarly. *Setting this option to true **will always show the file extension** aswell.* Defaults to `false`.
- `encoding`?: `BufferEncoding` - Which encoding to use for all files. *Example:* `utf-16`, `base64`... Defaults to `utf-8`.
- `start`?: `boolean` - Whether to start parsing files as soon as the parser is created or until the `start()` function is called. Defaults to `true`.
- `files`: `Record<string, ConfigFileOptions>` - An object of config names to load and their options.
- `folders`: `Record<string, ConfigFolderOptions>` - An object of config folder names to load and their options.
- `logging`?:
    - `error`?: `boolean` - Whether or not to log any errors that happen while parsing or loading the files to the console. Defaults to `true`.
    - `debug`?: `boolean` - Whether or not to log additional info about the parser to the console. Defaults to `false`.
### ConfigFileOptions
- `path`: `string` - The path to file.
- `hotReload`?: `boolean` - Whether or not to watch this file for changes. Overrides the global `hotReload`.
- `parser`?: `(config: string) => any | Promise<any>` - The custom parser for your file. **This is entirely optional.** The parser will parse any file that is supported and will leave the rest as a `string`.
- `validator`?: `Joi.Schema | ((config: any) => boolean)` - Can be either a [Joi](https://www.npmjs.com/package/joi) Schema or a function that takes the parsed file and returns a boolean.
### ConfigFolderOptions
- `path`: `string` - The path or glob pattern to the files in a specific folder.
- `hotReload`?: `boolean` - Whether or not to watch this files in this folder for changes. Overrides the global `hotReload`.