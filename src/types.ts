import type { Stats } from "fs"
import type chokidar from "chokidar"
import type { ChildProcess } from "child_process"
import type { Observable } from "./helpers"
import type { LoggerType } from "./logger"
import type { Transform, TransformCallback } from "stream"

/* General Types */
export type envModes = "info" | "debug"
export type Dict<T = string, K extends string | number = string> = Record<K, T>
export type EventType = "add" | "addDir" | "change" | "unlink" | "unlinkDir"

export type DynamicLoad = {
	default: InternalConfig
}

/* Function Types */
export type EventFunctionInterface = (
	instance: InstanceType,
	event: FSEvents,
	filePath: string
) => void
export type RunCustomFnInterface = (
	instance: InstanceType,
	event: { eventName: string; filePath: string },
	fn: ((opts: ActionOpts) => Promise<void>) | undefined
) => void
export type OnChangeFnInterface = (
	filePath: string,
	stats: Stats,
	instance: InstanceType,
	once?: boolean
) => void
export type OnEventInterface = (instance: InstanceType) => void
export type SpawnedInstanceInterface = (
	instance: InstanceType,
	options: ActionOpts
) => SpawnedInstance
export type CreateInstanceInterface = (opts: CreateInstanceOpts) => InstanceType
export type WalkDirectoryInterface = (
	dirPath: string,
	callback: (opts: WalkDirectoryCBOpts) => void
) => void

/* Instance Type */
export type InstanceType = {
	logger: LoggerType
	instance: chokidar.FSWatcher
	OptionsToggle: Observable<boolean>
	config: InternalConfig
}

type CreateInstanceOpts = {
	config: InternalConfig
	include: string[]
}

export type SpawnedInstance = {
	cp: ChildProcess
	err: Observable<boolean>
	logger: LoggerType
	Instance: InstanceType
	config: InternalConfig
	eventOnErr: (Instance: InstanceType) => void
}

/* Resolver Types */
export type ResolvePackageInterface = (
	root: string,
	includeFolders: DependenciesPathType[]
) => string[]

/* Utils Types */
export type FSEvents = "unlink" | "unlinkDir" | "add" | "addDir"

export type UpdateOptsFileDataType = {
	lastFile: string
	stats: Stats
}

export type TransformType = (
	this: Transform,
	chunk: Buffer,
	encoding: BufferEncoding,
	callback: TransformCallback
) => void

export type WalkDirectoryCBOpts = {
	filePath: string
	stats: Stats
}

/* Watcher Types */
export type WatcherConfig = {
	root: string
	include: string[]
	config: InternalConfig
}

/* Event Types */
export type ActionOpts = {
	filePath: string
	stats?: Stats
	eventOnErr: (Instance: InstanceType) => void
}

export type EventAction = {
	add?: (opts: ActionOpts) => Promise<void>
	addDir?: (opts: ActionOpts) => Promise<void>
	unlink?: (opts: ActionOpts) => Promise<void>
	unlinkDir?: (opts: ActionOpts) => Promise<void>
	change: (opts: ActionOpts) => Promise<void>
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

export const Config: IConfig = {
	root: process.cwd(),
	watchType: "Node",
}
