import fs from "fs"
import path from "path"

import type { Dict, DependenciesPathType } from "../types"
import { WalkDirectory } from "src/helpers"

type ResolvePackageJSONInterface = (
	root: string,
	includeFolders: DependenciesPathType[]
) => string[]
/**
 * @function
 * @name ResolvePackageJSON
 * @param { string } root - Path from which the serach will start
 * @param { DependenciesPathType } includeFolders - List of package name and folders that was given by the user
 */
export const ResolvePackageJSON: ResolvePackageJSONInterface = (root, includeFolders) => {
	const packageJSON: string[] = []
	const paths: string[] = []

	/* Return if there is no packages to match */
	if (includeFolders.length === 0) return paths

	/* Get all packages for the given path */
	WalkDirectory(root, ({ filePath }) => {
		if (path.basename(filePath) == "package.json") packageJSON.push(filePath)
	})

	// Convert package name and folders to key value pairs
	const includeDirs: Dict<string[], string> = {}
	includeFolders.forEach((item) => {
		includeDirs[item.name.toLowerCase()] = item.folders
	})

	// Get all package.json files for package names that matches
	packageJSON.forEach((pkg) => {
		const parsed = JSON.parse(fs.readFileSync(pkg, "utf8"))

		if (includeDirs[parsed.name.toLowerCase()]) {
			const filePath = pkg.substring(0, pkg.lastIndexOf("/"))
			includeFolders[parsed.name].folders.forEach((folder) => {
				const resolvedPath = path.resolve(filePath, folder)
				paths.push(resolvedPath)
			})
		}
	})

	return paths
}
