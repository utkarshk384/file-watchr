import p from "path"
import { WalkDirectoryInterface } from "src/types"
import walk from "walkdir"

export function convertPath(root: string, absPath: string): string {
	const fullPath = absPath.replace(root, "")
	return fullPath
}

export function isAsync(fn?: unknown): boolean {
	const AsyncFunction = (async () => {
		return
	}).constructor

	return fn instanceof AsyncFunction
}

export class Observable<T> {
	public readonly value: T
	public valueChangedCallback: ((val: T) => void) | null
	constructor(value: T) {
		this.value = value
		this.valueChangedCallback = null
	}

	public setValue(value: ((val: T) => T) | T): void {
		let val: T

		if (typeof value === "boolean") val = value
		else val = (value as (val: T) => T)(this.value)

		if (this.value != val) {
			;(this.value as T) = val
			this.raiseChangedEvent(val)
		}
	}

	public onChange(callback: (value: T) => void): void {
		this.valueChangedCallback = callback
	}

	public raiseChangedEvent(value: T): void {
		if (this.valueChangedCallback) {
			this.valueChangedCallback(value)
		}
	}
}

export const WalkDirectory: WalkDirectoryInterface = (dirPath, callback) => {
	const ignoreDir = ["node_modules", ".git", "build", "dist", "test", "docs", "examples", "public"]
	walk.sync(dirPath, function (path, stats) {
		if (!path) return
		if (ignoreDir.includes(p.basename(path))) this.ignore(path)

		callback({ filePath: path, stats })
	})
}
