import { Transform } from "stream"
import { spawn } from "cross-spawn"
import type { ChildProcess, StdioOptions } from "child_process"

import { ANSI_REGEX, YARN_ERROR_MSGS } from "src/helpers/consts"
import { Logger, Observable, LoggerType } from "src/helpers"

import type { ActionOpts, InternalConfig, TransformType } from "src/types"
import { DefaultParams } from "./watcher"

type SpawnedInstance = {
	cp: ChildProcess
	err: Observable<boolean>
	logger: LoggerType
	config: InternalConfig
}

export const Spawn = (params: DefaultParams, options: ActionOpts): SpawnedInstance => {
	const { config, logger } = params

	const err = new Observable<boolean>(false)

	const cp = spawn(config.runScripts[0], ["-s", ...config.runScripts.slice(1)], {
		env: process.env,
		cwd: options.filePath.substring(0, options.filePath.lastIndexOf("/")),
		stdio: getStdIO(config),
	})

	return {
		cp,
		err,
		logger,
		config,
	}
}

export const SetupChildProcess = (spawned: SpawnedInstance): void => {
	const { config, cp, logger, err } = spawned

	/* Setup Listeners */
	cp.stderr?.once("data", (data) => stderrCB(data, err))

	/* Pipe Stream */
	const transformer = generateTransformer(async (chunk, _, done) => {
		const line = stripANSI(chunk)

		if (stripLine(line)) {
			done()
			return
		}

		//TODO: Add a concrete way to catch error in the stream
		if (line.includes("error")) {
			console.log({ line })
			// logger.WithBackground("Error", line, "error")

			cp.kill() // Kill process when an error occurs
			done()
			return
		}
		done(null, chunk)
	})

	logger.WithBackground("Debug", "Piping child stream to main process", "debug")

	if (cp.stdout) cp.stdout.pipe(transformer).pipe(process.stdout).setEncoding("utf-8")
	else if (!cp.stdout && !config.noChildProcessLogs)
		logger.WithBackground("Debug", "Couldn't pipe transformer to 'process.stdout'", "debug")
}

const getStdIO = (config: DefaultParams["config"]): StdioOptions => {
	return config.noChildProcessLogs ? "ignore" : ["inherit", "pipe", "pipe"]
}

const stripLine = (line: string): boolean => {
	let val = false

	if (line[0] === "$" || line === "") val = true
	else if (line.includes("exited with 2") || line.includes("exited with 1")) val = true
	else if (YARN_ERROR_MSGS.includes(line)) val = true

	return val
}

const generateTransformer = (transform: TransformType): Transform => {
	return new Transform({
		encoding: "utf-8",
		transform,
		final(done) {
			this.push(null)
			done()
		},
	})
}

const stripANSI = (data: Buffer): string => {
	let cleanData = data.toString().split("\n")[0]
	cleanData = cleanData.replace(ANSI_REGEX, "")

	return cleanData
}

const stderrCB = (bufferedData: Buffer, err: Observable<boolean>): void => {
	const data = String(bufferedData)
	const logger = Logger.getInstance()

	if (err.value) return

	logger.WithBackground("Error", "", "error")
	logger.log(data, "error")
	if (YARN_ERROR_MSGS.includes(data)) err.setValue(true)
}
