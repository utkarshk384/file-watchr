import { Package } from "@manypkg/get-packages"
import chalk from "chalk"
import chokidar from "chokidar"
import { Stats } from "fs"
import { Transform, TransformCallback } from "stream"

/* General Types */
export type envModes = "info" | "debug"
export type Dict<T = string, K extends string | number = string> = Record<K, T>
export type EventType = "add" | "addDir" | "change" | "unlink" | "unlinkDir"
export type ArrowFunc<T = void> = () => T

export type DynamicLoad = {
	default: InternalConfig
}

/* Utils Types */

export type TransformType = (
	this: Transform,
	chunk: Buffer,
	encoding: BufferEncoding,
	callback: TransformCallback
) => void

/* Resolver Types */
interface IBaseResolver {
	ExtractDependencies: () => string[]
}

export type ResolverConfig = {
	resolveDevDep: boolean
	resolvePeerDep: boolean
	packageJSON: Dict
	packages: Package[]
}

export type ResolverType = (config: ResolverConfig) => IBaseResolver

/* Watcher Types */
export type WatcherConfig = {
	root: string
	include: string[]
	config: InternalConfig
	packages: Package[]
}

/* Event Types */

export type ActionOpts = {
	filePath: string
	stats?: Stats
}

export type EventAction = {
	add?: (opts: ActionOpts) => Promise<void>
	addDir?: (opts: ActionOpts) => Promise<void>
	unlink?: (opts: ActionOpts) => Promise<void>
	unlinkDir?: (opts: ActionOpts) => Promise<void>
	change: (opts: ActionOpts) => Promise<void>
}

/* Logger Types */
export type LoggerActions = {
	pad?: boolean
	message: string
	bg?: boolean
	clr?: boolean
	bold?: boolean
	italic?: boolean
	visible?: boolean
	hidden?: boolean
	dim?: boolean
	br?: "before" | "after" | "both"
}

export type LoggerLevel = "log" | "warn" | "success" | "info" | "error" | "debug"
export type LoggerLevelExtended =
	| LoggerLevel
	| "log.bg"
	| "info.bg"
	| "warn.bg"
	| "success.bg"
	| "error.bg"
	| "debug.bg"

export type LoggerTheme = {
	text: {
		log: chalk.Chalk
		success: chalk.Chalk
		info: chalk.Chalk
		warning: chalk.Chalk
		error: chalk.Chalk
		debug: chalk.Chalk
	}
	bg: {
		log: chalk.Chalk
		success: chalk.Chalk
		info: chalk.Chalk
		warning: chalk.Chalk
		error: chalk.Chalk
		debug: chalk.Chalk
	}
}

export type WithBackgroundType = {
	primary: string
	secondary: string
	level: LoggerLevelExtended
	async?: boolean
}

/* Config Types */

export type ArgsOptions = {
	config: string
	c: string
	include: string[]
	i: string
}

export type watchSelectorType = "Node" | "Raw"
export type AsyncResponseType<T> = { data: T; err: null } | { data: null; err: string }

export interface BaseConfig {
	root: string
	include?: string[]
	exclude?: string | string[]
	options?: chokidar.WatchOptions
	actions?: EventAction & Dict
	runScripts?: string[] | string
	noChildProcessLogs?: boolean
	autoShowOptions?: boolean
}

export type DependenciesPathType = {
	name: string
	folders: string[]
}

export type IConfig = (
	| {
			watchType: "Node"
			packageJSON: string
			dependenciesPath?: DependenciesPathType[]
	  }
	| {
			watchType: "Raw"
	  }
) &
	BaseConfig

export type InternalConfig = Required<BaseConfig> & {
	watchType: "Node" | "Raw"
	dependenciesPath?: DependenciesPathType[]
}
