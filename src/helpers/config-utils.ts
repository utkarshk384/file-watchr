import path from "path"
import mergeWith from "lodash.mergewith"

import { defaultConfig } from "./consts"
import { isAsync } from "./utils"

import type { ArgsOptions, AsyncResponseType, Dict, DynamicLoad, InternalConfig } from "src/types"
import { Logger } from "../logger/logger"

const logger = Logger.GetInstance()

export const MergeNormalizeConfig = (config: InternalConfig, argv: ArgsOptions): InternalConfig => {
	config = normalizeConfig(config)

	config = mergeWith(defaultConfig(argv), config) // Overriding default config with user config

	return config as InternalConfig
}

const normalizeConfig = (_config: InternalConfig): InternalConfig => {
	/* Check for actions and if each function is async */
	const config = Object.assign({}, _config)

	if (config?.actions && typeof config?.actions == "object") {
		Object.keys(config.actions).forEach((actionName) => {
			const action = config.actions?.[actionName]
			if (typeof action === "function" && !isAsync(action))
				logger.Error(`Action ${actionName} is not async`)
		})
	}

	/* Normalize command */
	if (config?.runScripts && typeof config.runScripts == "string")
		config.runScripts = config.runScripts.split(" ")

	if (!config?.include)
		/* Fixing string bug with includes */
		config["include"] = [process.cwd()]

	if (config.runScripts?.length === 0 && !config.actions)
		logger.Error("Please pass a command or a list of actions to the config file")

	/* Check if exclude exists */
	if (!config?.exclude) config.exclude = []

	/* Normalize Node opts */
	if (!config?.dependenciesPath) config.dependenciesPath = []

	/* AutoShowOptions */
	if (typeof config["autoShowOptions"] === "undefined") config["autoShowOptions"] = true

	return config
}

export const getConfigFile = (configPath: string): Promise<DynamicLoad["default"]> => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<DynamicLoad["default"]>(async (resolve, reject) => {
		const res = await LoadFile<DynamicLoad["default"]>(configPath)
		if (res.err !== null) reject(res.err)

		resolve(res.data as DynamicLoad["default"])
	})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LoadFile = async <T = Dict>(filePath: string): Promise<AsyncResponseType<T>> => {
	const Path = path.join(process.cwd(), filePath)
	let returnFile: T

	try {
		returnFile = await import(Path)
	} catch (err) {
		return { err: `Couldn't find the config file at ${Path}`, data: null }
	}

	return { data: returnFile, err: null }
}
