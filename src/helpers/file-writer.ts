import fs from "fs"
import path from "path"
import { Dict, UpdateOptsFileDataType } from "src/types"

import { TEMP_OPTS_FILE, TMP_DIR } from "./consts"


/* 
  Exports
*/
export const UpdateOptsFile = (data: UpdateOptsFileDataType): void => {
	CreateFile(TEMP_OPTS_FILE)
	const parsedData = ReadFile<UpdateOptsFileDataType>(TEMP_OPTS_FILE)
	const newData = { ...parsedData, ...data }

	const stringifiedData = JSON.stringify(newData)

	fs.writeFileSync(path.join(TMP_DIR, TEMP_OPTS_FILE), stringifiedData, "utf-8")
}

export const WriteFile = (fileName: string, fileSize: number, filePath: string): void => {
	CreateFile(fileName)
	const parsedData = ReadFile<Dict<number, string>>(fileName)
	parsedData[filePath] = fileSize

	const data = JSON.stringify(parsedData)

	fs.writeFileSync(path.join(TMP_DIR, fileName), data, "utf-8")
}

export const InterpretFile = <T = number>(fileName: string, filePath: string): T | null => {
	const parsedData = ReadFile(fileName)
	const entry = parsedData[filePath] || null

	return entry as unknown as T
}

export const RemoveFile = (fileName: string): void => {
	try {
		fs.rmSync(path.join(TMP_DIR, fileName))
	} catch (err) {
		// Ignore
	}
}

export const CreateFile = (fileName: string): boolean => {
	const exists = fs.existsSync(path.join(TMP_DIR, fileName))

	if (!exists) {
		const data = JSON.stringify({})
		fs.writeFileSync(path.join(TMP_DIR, fileName), data, "utf-8")
	}
	return exists
}

/* 
  Helpers
*/
export const ReadFile = <T = Dict<string, string>>(fileName: string): T => {
	CreateFile(fileName)
	const payload = fs.readFileSync(path.join(TMP_DIR, fileName), "utf8")

	return JSON.parse(payload)
}
