import Logging from "../logging"
import { Logger } from "../logging/logger"
import { EventHandlerRef } from "./event-system"

export type PluginManagementFlag = "DisallowReload" | "DisallowUnload" | "LibraryPlugin"
export type ScopeDesciptor = `${string}:${string}`

export interface PluginConfig {
    /**
     * Unique identifier of a plugin
     * 
     * Please follow the nameing rules below:
     * 
     * `domain-suffix.domain.groupname(or projectname).NameOfPlugin`
     * 
     * Bad name: MyMiniGame.games.dp7management.lama.icu
     * Bad name: ICU.Lama.DP7Management.Games.myMiniGame
     * Bad name: icu*lama dp7management!games-MyM1n1Game
     * 
     * Good name: icu.lama.dp7management.games.MyMiniGame
     * 
     * Plugin names are scoped names.
     * Schoped names are something like this:
     * 
     * `Scope:Name`
     * 
     * Default scope for plugin is plugin. You don't need add `plugin:` for plugin names.
     * Unless you are going to use a seperate scope!
     * 
     */
    name: string

    /**
     * Optional user friendly name. Highly recommend to set this.
     * 
     * Bad name: icu.lama.dp7management.games.MyMiniGame
     * Bad name: dp7management.games.MyMiniGame
     * Bad name: myminigame
     * 
     * Godd name: MyMiniGame
     * Godd name: DP7-MyMiniGame
     */
    displayName?: string
    author: string | string[]

    /**
     * Version string follow the rules below:
     * 
     * `MajorVersion.MinorVersion@Branch`
     */
    version: `${number}.${number}@${string}`

    /**
     * Plugin dependencies. Please write plugin name **not** displayName!
     * 
     * Default scope goes `plugin`
     * For npm libraries please use `npm` scope.
     * 
     * Example plugin dependency: `icu.lama.example.ExamplePlugin`
     * Example plugin dependency with scope(Optional, since the default scope is plugin): `plugin:icu.lama.example.ExamplePlugin` 
     * Example npm dependency: `npm:tg-bote`
     */
    dependencies?: string[]

    /**
     * If your plugin somehow cannot unload or reload please add flags at here.
     */
    flags?: PluginManagementFlag[]
}

export type PluginEntryPoint = Function & { pluginConfig?: PluginConfig, plugin?: BotePluginModule }

export class PluginConstructor {
    private config: PluginConfig
    private exports: { [key in string]: Function } = { }

    constructor(config: PluginConfig) {
        this.config = config
    }

    /**
     * After this function being called. You can use this as BotePluginModule in main function.
     * If you'd like to use BotePluginModule as this in other functions please call decorate() in BotePluginModule.
     * 
     * Example
     * ```
     * export default definePlugin({...})
     *      .begin(mainFn)
     *      .decorate(fn1)
     *      .decorate(fn2)
     * ```
     * 
     * @param mainFn Your main function
     * @returns 
     */
    public begin(mainFn: PluginEntryPoint): BotePluginModule {
        mainFn['pluginConfig'] = this.config

        const mod = {
            plugin: this.config,
            main: mainFn,
            registeredEvents: [],
            exports: this.exports,
            decorate(fn: Function) {
                fn.bind(this)

                return this
            },
            getLogger() {
                return Logging.getLogger(this)
            }
        }

        mainFn['plugin'] = mod
        mainFn.bind(mod)
    
        return mod
    }

    /**
     * Export a specific function. Do not use ESM export!
     * When other plugin call requirePlugin they will get all functions you exported here!
     * This prevents other plugins access sensitive data illegally (Ex. login tokens that exported for other files but not other plugins).
     * Use only when you are passing a arrow function or anonymous function.
     * 
     * @param key name of exported function
     * @param data export function
     * @returns this
     */
    public exportNamed(key: string, data: Function) {
        this.exports[key] = data
        return this
    }

    /**
     * Export a specific function. Do not use ESM export!
     * When other plugin call requirePlugin they will get all functions you exported here!
     * This prevents other plugins access sensitive data illegally (Ex. login tokens that exported for other files but not other plugins).
     * 
     * If you are using an arrow function or anonymous function please use exportNamed
     * 
     * @param key name of exported function
     * @param data export function
     * @returns this
     * 
     * @throws Error When passing an anonymous or arrow function.
     */
    public export(fn: Function) {
        if (!fn.name) {
            throw new Error("Arrow functions or anonymous functions must use: exportNamed")
        }
        return this.exportNamed(fn.name, fn)
    }
}

export interface BotePluginModule {
    plugin: PluginConfig
    main: PluginEntryPoint
    exports: { [key in string]: any }
    registeredEvents: EventHandlerRef[]

    decorate(fn: Function): BotePluginModule
    getLogger(): Logger
}

/**
 * Declare a plugin.
 * 
 * You should export default the return value
 * 
 * Example:
 * ```
 * export default definePlugin({
 *      name: 'icu.lama.example.ExamplePlugin',
 *      displayName: 'ExamplePlugin',
 *      author: 'lamadaemon',
 *      version: '1.0@stable'
 * }).begin(main) 
 * ```
 * 
 * async function main() {
 *      console.log("Hello World!")
 * }
 */
export function definePlugin(config: PluginConfig) {
    return new PluginConstructor(config)
}
