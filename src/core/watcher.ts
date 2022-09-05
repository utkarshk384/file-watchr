import chokidar from "chokidar"
import {
	CreateFile,
	FILENAME,
	Logger,
	Observable,
	ReadFile,
	RemoveFile,
	TEMP_OPTS_FILE,
} from "src/helpers"

import { CreateInstanceInterface, InstanceType, UpdateOptsFileDataType } from "src/types"
import { AllEvents, OnChangeFn } from "./events"

export const CreateInstances: CreateInstanceInterface = (opts) => {
	const logger = Logger.GetInstance()
	const instance = chokidar.watch(opts.include, { ...opts.config.options, ignoreInitial: true })
	const OptionsToggle = new Observable<boolean>(false)

	return { logger, instance, OptionsToggle, config: opts.config }
}

export const InitialSetup = (Instance: InstanceType): InstanceType => {
	const { logger, instance, OptionsToggle, config } = Instance

	process.on("uncaughtException", (err: Error, origin: string) => {
		logger.lineBreak()

		console.log(origin)
		logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

		AllEvents(Instance)
	})

	process.on("unhandledRejection", (err: Error, origin: string) => {
		logger.lineBreak()

		logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

		AllEvents(Instance)
	})

	CreateFile(FILENAME)
	CreateFile(TEMP_OPTS_FILE)
	instance.on("ready", () => readyMessage({ logger, instance, OptionsToggle, config }))

	//Set Input mode and encoding for stdin
	process.stdin.setRawMode(true)
	process.stdin.setEncoding("utf8")

	return Instance
}

export const SetKeyboardListeners = (Instance: InstanceType): InstanceType => {
	const { logger, OptionsToggle, config } = Instance

	const baseKeyPressEvent = (data: Buffer): void => {
		const key = String(data)

		logger.WithBackground("Debug", `'${key}' key(s) is pressed`, "debug")

		if (key === "o" && !config.autoShowOptions) {
			if (!OptionsToggle.value) {
				logger.clearLastLines(2)

				OptionsToggle.setValue(true)
				logger.ShowOptions(OptionsToggle.value, config.autoShowOptions)
			}
		}

		switch (key) {
			case "\u0003":
				close(Instance)
				return

			case "q":
				close(Instance)
				break
		}
	}

	const activeKeypressEvent = (data: Buffer): void => {
		const key = String(data)

		baseKeyPressEvent(data)

		switch (key) {
			case "a": {
				const message = JSON.stringify(prettyPrintWatchedFiles(Instance, true), null, 2)
				logger.WithBackground({ message: "Watched Files Verbose", br: "before" }, message, "log")
				break
			}

			case "w": {
				const message = JSON.stringify(prettyPrintWatchedFiles(Instance), null, 2)
				logger.WithBackground({ message: "Watched Files", br: "before" }, message, "log")
				break
			}

			case "c":
				logger.clearScreen()
				readyMessage(Instance)
				break

			case "r": {
				const { lastFile, stats } = ReadFile<UpdateOptsFileDataType>(TEMP_OPTS_FILE)

				if (!lastFile) {
					logger.WithBackground("Info", "No file found to run a change event.", "info")
					break
				}

				OnChangeFn(lastFile, stats, Instance, true)
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

	return Instance
}

const readyMessage = (Instance: InstanceType): void => {
	const { logger, OptionsToggle, config } = Instance
	logger.clearScreen()
	logger.WithBackground("Ready", "Now watching for changes", "success", () => {
		setTimeout(() => logger.ShowOptions(OptionsToggle.value, config.autoShowOptions), 500)
	})
}

const close = (Instance: InstanceType): void => {
	const { instance, logger } = Instance
	instance.close().then(() => {
		logger.lineBreak()
		logger.WithBackground("Closed", "Sucessfully stopped watching files", "error")

		RemoveFile(FILENAME)
		RemoveFile(TEMP_OPTS_FILE)

		process.exit(0)
	})
}

const prettyPrintWatchedFiles = (Instance: InstanceType, detailed = false): string[] => {
	const { instance, config } = Instance
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
