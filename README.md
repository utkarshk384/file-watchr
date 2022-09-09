# Monorepo Watch

NOTE: This is a work in progress. Currently it's in its beta state.
Any suggestions are warmly welcomed 😄.
<br/>
<br />
A asynchronous, customizable file watcher for projects using lerna, yarn workspaces, and monorepos.

<br/>
<br/>

## Recommended Usage
It is recommended to use terminals that has a at least level=2 support for colors([256 color support](https://nodejs.org/api/tty.html#tty_readstream_setrawmode_mode))

Terminals that support colors are:

1. [Gitbash](https://git-scm.com/download/win)
2. [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701#activetab=pivot:overviewtab)
3. [zsh](https://ohmyz.sh/#install)
4. [bash](https://www.gnu.org/software/bash/)

## Installation

```sh
npm install --save file-watchr
npm install -g file-watchr # Optional way to add the packge globally
```

or

```sh
yarn add file-watchr
yarn add global file-watchr # Optional way to add the packge globally
```

<br/>
<br/>

## Usage

See [configuration](https://https://github.com/Utkarshk384/monorepo-watch#Configuration) section below on how to configure your watcher.

1. Create a config file in the working directory.
   </br>
   Eg:

```
src
├── dir1
│   ├── file1
│   └── file2
└── dir2
    ├── file1
    └── file2
watcher.config.js <--root
```



2. Now write the following configuration in the config file.
```js
module.exports = {
	root: process.cwd(),
	watchType: "Raw", // Can be "Node" or "Raw" see configuration section below for more details
}
```
3. Now run the following command in the terminal.
   <br/>
```sh
npm run watcher -c ../../watcher.config.js -i src
```
or
```sh
yarn watcher -c ../../watcher.config.js -i src
```

The `-c` flag is the config file path and `-i` is the dirs to include.
For multiple dirs use `-i={"src","lib", etc...}`

<br />

This will watch the `src` directory for any file changes.

<br/>
<br/>

## Configuration

NOTE: Only [CommonJS](https://medium.com/@cgcrutch18/commonjs-what-why-and-how-64ed9f31aa46) is supported for the config file

```ts
//watcher.config.js


/**
 * Include types for ease of use
 * @type {import('file-watchr/dist/types/types.d.ts').IConfig}
 */

module.exports = {
    /**
     * @required
     * @default process.cwd()
     * 
     * The root directory of the project
    */
    root: string,

    /**
     * @optional
     * @default ["src"]
     * 
     * Can be passed as command-line argument as well.
     * The directories to be watched inside the package folder.
     * 
     * Globbing is supported.
    */
    include: string[],

    /**
     * @required
     * @default {}
     * 
     * 
     * Options that is directly passed to the `chokidar.watch` method.
     * Please refer to the https://github.com/paulmillr/chokidar#api
     * to see all the available options
    */
    options: chokidar.WatchOptions,

    /**
     * @optional
     * @type {
            add?: (opts: ActionOpts) => Promise<void>
            addDir?: (opts: ActionOpts) => Promise<void>
            unlink?: (opts: ActionOpts) => Promise<void>
            unlinkDir?: (opts: ActionOpts) => Promise<void>
            change: (opts: ActionOpts) => Promise<void>
        } EventAction
     *
     * @type {
        filePath: string;
        stats: fs.Stats;
        } ActionOpts
     * 
     * This is the action that is to be performed when different events 
     * occur.
    */
    actions: EventAction,

    /**
     * @optional
     * @default []
     * 
     * A command that will be ran on all file event changes.
     * 
     */
    runScripts: string | string[],

    /**
     * @optional
     * @default true
     * 
     * If true, the watcher will not pipe any logs to process.stdout 
     * and set the stdio to "ignore". Only applicable for situations  
     * where `runScripts` is defined.
     * 
     */
    noChildProcessLogs: boolean,

    /**
     * @optional
     * @default true
     * 
     * If true, then all available options will be automatically be displayed.
     */
    autoShowOptions: boolean,

    /**
     * @optional
     * @default []
     * @note Only available for `Node` watchType.
     * @type {
        name: string
        folders: string[]
       } DependenciesPathType
     * 
     * A list of directories that can be added outside of the root directory. A common use case is when you have a monorepo.
     */
    dependenciesPath: DependenciesPathType[],
        
}
```