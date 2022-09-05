#! /usr/bin/env node

import { ResolvePackageJSON } from "./core/resolver"
import { CreateInstances, InitialSetup, SetKeyboardListeners } from "./core/watcher"
import { AllEvents } from "./core/events"

import { Config, argv, MergeNormalizeConfig } from "./helpers"
import { DependenciesPathType } from "./types"

const config = MergeNormalizeConfig(Config, argv)

/* Watch Files */
const include = [
	...config.include,
	...ResolvePackageJSON(config.root, config.dependenciesPath as DependenciesPathType[]),
]

let Instance = CreateInstances({ config, include })
Instance = InitialSetup(Instance)
Instance = SetKeyboardListeners(Instance)
AllEvents(Instance)
