import { Transform } from "stream"
import { spawn } from "cross-spawn"
import type { StdioOptions } from "child_process"

import { ANSI_REGEX, YARN_ERROR_MSGS } from "src/helpers/consts"
import { Logger, Observable } from "src/helpers"

import type {
	InstanceType,
	SpawnedInstance,
	SpawnedInstanceInterface,
	TransformType,
} from "src/types"

export const Spawn: SpawnedInstanceInterface = (Instance, options) => {
	const { config, logger } = Instance

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
		Instance,
		eventOnErr: options.eventOnErr,
	}
}

export const SetupChildProcess = (spawned: SpawnedInstance): void => {
	const { config, cp, logger, err, eventOnErr, Instance } = spawned

	/* Setup Listeners */
	cp.stderr?.once("data", (data) => stderrCB(data, err, eventOnErr, Instance))

	/* Pipe Stream */
	const transformer = generateTransformer(async (chunk, _, done) => {
		const line = stripANSI(chunk)

		if (stripLine(line)) {
			done()
			return
		}

		if (line.includes("error")) {
			cp.kill() // Kill process when an error occurs
			done()
			return
		}
		done(null, chunk)
	})

	logger.log("Debug - Piping child stream to main process\n", "debug")

	if (cp.stdout) cp.stdout.pipe(transformer).pipe(process.stdout).setEncoding("utf-8")
	else if (!cp.stdout && !config.noChildProcessLogs)
		logger.WithBackground("Debug", "Couldn't pipe transformer to 'process.stdout'", "debug")
}

const getStdIO = (config: InstanceType["config"]): StdioOptions => {
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

export type stderrCBInterface = (
	bufferedData: Buffer,
	err: Observable<boolean>,
	eventOnErr: (Instance: InstanceType) => void,
	Instance: InstanceType
) => void

const stderrCB: stderrCBInterface = (bufferedData, err, eventOnErr, Instance): void => {
	const data = String(bufferedData)
	const logger = Logger.GetInstance()

	console.log(err.value)
	if (err.value) return

	logger.WithBackground("Error", "", "error")
	logger.log(data, "error")
	if (YARN_ERROR_MSGS.includes(data)) err.setValue(true)
	eventOnErr(Instance)
}
