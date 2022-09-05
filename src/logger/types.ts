import type chalk from "chalk"

export type ArrowFunc<T = void> = () => T


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
