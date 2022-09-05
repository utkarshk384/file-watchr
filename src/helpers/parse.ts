import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Logger } from "../logger/logger"

import type { Dict, ArgsOptions, InternalConfig } from "../types"
import { getConfigFile } from "./config-utils"

/* Logger */
const logger = Logger.GetInstance()

/* Args options */

const options: Dict<yargs.Options> = {
	config: {
		type: "string",
		alias: "c",
		default: "./watcher.config.js",
		normalize: true,
		description: "Path to config file",
		defaultDescription: "./watcher.config.js",
		requiresArg: true,
	},
	include: {
		type: "array",
		alias: "i",
		default: [process.cwd()],
		defaultDescription: "[process.cwd()]",
		description: "Directories to watch(Globbing supported)",
	},
}

export const argv = yargs(hideBin(process.argv))
	.recommendCommands()
	.options(options)
	.help()
	.parseSync() as unknown as ArgsOptions
if (argv.config === "") {
	//Enforces config file to alaways be given
	logger.WithBackground(
		{ message: "Error", br: "before" },
		"A config file must be provided using the -c flag",
		"error"
	)
	process.exit(1)
}
const configPath = argv.config

const Config: InternalConfig = (await getConfigFile(configPath).catch((err) =>
	logger.Error(err)
)) as InternalConfig

if (!Config) logger.Error("No config file found")

const config = (Object.assign({}, Config) as unknown as Dict<any>).default

/* Set Yargs values */
if (argv.include || argv.i) config.include = argv.include || argv.i

export { config as Config }
