import fs from "fs"
import { convertPath } from "../helpers/utils"
import { UpdateOptsFile, InterpretFile, WriteFile } from "../helpers/file-writer"
import { FILENAME } from "../helpers/consts"
import { Spawn, SetupChildProcess } from "./spawn"

import type {
	InstanceType,
	EventFunctionInterface,
	OnChangeFnInterface,
	OnEventInterface,
	RunCustomFnInterface,
} from "src/types"

const ChangeSet = {
	add: false,
	addDir: false,
	unlink: false,
	unlinkDir: false,
	change: false,
}

export const OnUnlink: OnEventInterface = (Instance) => {
	const { instance } = Instance

	if (ChangeSet["unlink"]) return
	ChangeSet["unlink"] = true

	instance.once("unlink", (filePath) => EventFunction(Instance, filePath, "unlink"))
}

export const OnUnlinkDir: OnEventInterface = (Instance) => {
	const { instance } = Instance

	if (ChangeSet["unlinkDir"]) return
	ChangeSet["unlinkDir"] = true

	instance.once("unlinkDir", (filePath) => EventFunction(Instance, filePath, "unlinkDir"))
}

export const OnAdd: OnEventInterface = (Instance) => {
	const { instance } = Instance

	if (ChangeSet["add"]) return
	ChangeSet["add"] = true

	instance.once("add", (filePath) => EventFunction(Instance, filePath, "add"))
}

export const OnAddDir: OnEventInterface = (Instance) => {
	const { instance } = Instance

	if (ChangeSet["addDir"]) return
	ChangeSet["addDir"] = true

	instance.once("addDir", (filePath) => EventFunction(Instance, filePath, "addDir"))
}

export const EventFunction: EventFunctionInterface = (Instance, filePath, event) => {
	const { config, instance, logger } = Instance

	let action,
		name = ""

	switch (event) {
		case "add":
			action = config?.actions?.add
			name = "Add"
			instance.add(filePath)
			break
		case "addDir":
			action = config?.actions?.addDir
			name = "Add Dir"
			instance.add(filePath)
			break
		case "unlink":
			action = config?.actions?.unlink
			name = "Remove"
			instance.unwatch(filePath)
			break
		case "unlinkDir":
			action = config?.actions?.unlinkDir
			name = "Remove Dir"
			instance.unwatch(filePath)
			break

		default:
			throw new Error("Invalid event type")
	}

	/* Remove path from watch list */

	logger.PerformAction(convertPath(config.root, filePath))

	/* Run user function */
	RunCustomFn(Instance, { filePath, eventName: name }, action)
	ChangeSet[event] = false
}

export const onChange = (Instance: InstanceType): void => {
	const { instance } = Instance
	if (ChangeSet["change"]) return
	ChangeSet["change"] = true
	instance.once("change", (filePath, stats) => OnChangeFn(filePath, stats, Instance))
	return
}

export const OnChangeFn: OnChangeFnInterface = (filePath, stats, Instance, once = false) => {
	const { config, OptionsToggle, logger } = Instance

	stats = stats ?? fs.statSync(filePath)

	UpdateOptsFile({ lastFile: filePath, stats }) //Store last file that was changed.

	/* Read and save `fileSize` to temp disk file */
	if (!once && stats.size === InterpretFile(FILENAME, filePath)) {
		logger.clearScreen()
		logger.WithBackground("No Change", "No file recorded on current save", "info", () => {
			setTimeout(() => logger.ShowOptions(OptionsToggle.value, config.autoShowOptions), 250)
		})
		WriteFile(FILENAME, stats.size, filePath)
		ChangeSet["change"] = false
		if (once) return
		onChange(Instance)
		return
	}
	WriteFile(FILENAME, stats.size, filePath)

	const change = config?.actions?.change
	logger.PerformAction(convertPath(config.root, filePath))

	logger.WithBackground("Debug", "About to run custom user function", "debug")
	/* Run user function. Using async lock to prevent running the action multiple times for a single file.*/
	RunCustomFn(Instance, { eventName: "Change", filePath }, change)

	logger.WithBackground("Debug", "Finished running custom user function", "debug")

	if (once) return
	ChangeSet["change"] = false
	onChange(Instance)
}

export const RunCustomFn: RunCustomFnInterface = (Instance, opts, fn) => {
	const { config, logger, OptionsToggle } = Instance
	const { eventName, ...options } = opts
	const relativePath = convertPath(config.root, options.filePath)

	OptionsToggle.setValue(false)
	/* Async check is done in parser */
	if (fn) {
		logger.log("Running action given by the user\n", "debug")
		fn(Object.assign({}, { ...options, eventOnErr: AllEvents }))
			.then(() => {
				logger.clearScreen()
				logger.WithBackground(eventName, relativePath, "success", () => {
					setTimeout(() => {
						logger.ShowOptions(OptionsToggle.value, config.autoShowOptions)
						OptionsToggle.setValue(() => (config.autoShowOptions ? true : false))
					}, 250)
				})
			})
			.catch((err) => {
				logger.Error(`An error occured while running the action\n. ${err}`)
			})
			.finally(() => {
				OptionsToggle.setValue(() => (config.autoShowOptions ? true : false))
			})
		return Instance
	} else if (eventName === "Change" && config && config.runScripts.length > 0) {
		logger.log("Debug - Running command given by user\n", "debug")
		logger.log(`Debug - Running command: ${config.runScripts}\n`, "debug")

		const spawner = Spawn(Instance, {
			...options,
			eventOnErr: AllEvents,
		})
		SetupChildProcess(spawner)
		const { cp } = spawner
		cp.once("close", (code) => {
			logger.log(`Child process with code ${code}\n`, "debug")
			if (code === 0) {
				logger.clearScreen()
				logger.WithBackground(eventName, relativePath, "success", () => {
					setTimeout(() => {
						logger.ShowOptions(OptionsToggle.value, config.autoShowOptions)
						OptionsToggle.setValue(() => (config.autoShowOptions ? true : false))
					}, 250)
				})
			}
		})
		return Instance
	}

	let name = eventName

	switch (eventName) {
		case "Add Dir":
			name = "Add Directory"
			break
		case "Remove Dir":
			name = "Remove Directory"
			break
	}

	OptionsToggle.setValue(true)
	logger.clearScreen()
	logger.WithBackground(
		"Warn",
		`No action is specified for ${name} event in the configuration file.`,
		"warn"
	)
	logger.ShowOptions(OptionsToggle.value, config.autoShowOptions)

	return Instance
}

// Add this even handler to on error and monitor the number of event listeners.
export const AllEvents = (Instance: InstanceType): void => {
	OnAdd(Instance)
	OnAddDir(Instance)
	OnUnlink(Instance)
	OnUnlinkDir(Instance)
	onChange(Instance)
}
