import chokidar from "chokidar"
import {
	CreateFile,
	FILENAME,
	Logger,
	Observable,
	ReadFile,
	RemoveFile,
	TEMP_OPTS_FILE,
	UpdateOptsFileDataType,
} from "src/helpers"

import type { LoggerType } from "src/helpers"
import { InternalConfig } from "src/types"
import { onChange, OnChangeFn } from "./events"

export type DefaultParams = {
	logger: LoggerType
	instance: chokidar.FSWatcher
	OptionsToggle: Observable<boolean>
	config: InternalConfig
}

type CreateInstanceInterface = {
	config: InternalConfig
	include: string[]
}

export const CreateInstances = (opts: CreateInstanceInterface): DefaultParams => {
	const logger = Logger.getInstance()
	const instance = chokidar.watch(opts.include, { ...opts.config.options, ignoreInitial: true })
	const OptionsToggle = new Observable<boolean>(false)

	return { logger, instance, OptionsToggle, config: opts.config }
}

export const InitialSetup = (params: DefaultParams): DefaultParams => {
	const { logger, instance, OptionsToggle, config } = params

	process.on("uncaughtException", (err: Error, origin: string) => {
		logger.LineBreak()

		logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

		onChange(params)
	})

	process.on("unhandledRejection", (err: Error, origin: string) => {
		logger.LineBreak()

		logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

		onChange(params)
	})

	CreateFile(FILENAME)
	CreateFile(TEMP_OPTS_FILE)
	instance.on("ready", () => readyMessage({ logger, instance, OptionsToggle, config }))

	//Set Input mode and encoding for stdin
	process.stdin.setRawMode(true)
	process.stdin.setEncoding("utf8")

	return params
}

export const SetKeyboardListeners = (params: DefaultParams): DefaultParams => {
	const { logger, OptionsToggle, config } = params

	const baseKeyPressEvent = (data: Buffer): void => {
		const key = String(data)

		logger.WithBackground("Debug", `'${key}' key(s) is pressed`, "debug")

		if (key === "o" && !config.autoShowOptions) {
			if (!OptionsToggle.value) {
				logger.clearLastLines(2)

				OptionsToggle.setValue(true)
				logger.OptionsLogger(OptionsToggle.value, config.autoShowOptions)
			}
		}

		switch (key) {
			case "\u0003":
				close(params)
				return

			case "q":
				close(params)
				break
		}
	}

	const activeKeypressEvent = (data: Buffer): void => {
		const key = String(data)

		baseKeyPressEvent(data)

		switch (key) {
			case "a": {
				const message = JSON.stringify(prettyPrintWatchedFiles(params, true), null, 2)
				logger.WithBackground({ message: "Watched Files Verbose", br: "before" }, message, "log")
				break
			}

			case "w": {
				const message = JSON.stringify(prettyPrintWatchedFiles(params), null, 2)
				logger.WithBackground({ message: "Watched Files", br: "before" }, message, "log")
				break
			}

			case "c":
				logger.ClearScreen()
				readyMessage(params)
				break

			case "r": {
				const { lastFile, stats } = ReadFile<UpdateOptsFileDataType>(TEMP_OPTS_FILE)

				if (!lastFile) {
					logger.WithBackground("Info", "No previous file found", "info")
					break
				}

				OnChangeFn(lastFile, stats, params, true)
				break
			}
		}
	}

	OptionsToggle.onChange((val) => {
		if (val) {
			if (process.stdin.listeners("data").length > 0) process.stdin.off("data", baseKeyPressEvent)
			process.stdin.on("data", activeKeypressEvent)
		} else {
			if (process.stdin.listeners("data").length > 0) process.stdin.off("data", activeKeypressEvent)
			process.stdin.on("data", baseKeyPressEvent)
		}
	})

	OptionsToggle.setValue(true)

	return params
}

const readyMessage = (params: DefaultParams): void => {
	const { logger, OptionsToggle, config } = params
	logger.ClearScreen()
	logger.WithBackground("Ready", "Now watching for changes", "success", () => {
		setTimeout(() => logger.OptionsLogger(OptionsToggle.value, config.autoShowOptions), 500)
	})
}

const close = (params: DefaultParams): void => {
	const { instance, logger } = params
	instance.close().then(() => {
		logger.LineBreak()
		logger.WithBackground("Closed", "Sucessfully stopped watching files", "error")

		RemoveFile(FILENAME)
		RemoveFile(TEMP_OPTS_FILE)

		process.exit(0)
	})
}

const prettyPrintWatchedFiles = (params: DefaultParams, detailed = false): string[] => {
	const { instance, config } = params
	const watchFiles: string[] = []

	const watched = instance.getWatched()
	Object.keys(watched).forEach((_key) => {
		const key = _key.replace(config.root, "") // To `__dirname` up until `this.root`

		if (detailed && Array.isArray(watched[_key]))
			watched[_key].forEach((item) => {
				watchFiles.push(`${key}/${item}`)
			})
		else watchFiles.push(key)
	})

	return watchFiles
}
