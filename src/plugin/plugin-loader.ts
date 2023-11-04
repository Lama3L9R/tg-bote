import fs from 'fs'
import path from 'path'
import { createRequire } from 'node:module'
import { BotePluginModule } from './plugin'
import { CentralEventManager, I } from '../..'

export class DynamicModule {
    public readonly loader: PluginLoader
    public readonly name: string
    public readonly fileName: string
    public readonly mod: BotePluginModule
    public readonly esmName: string

    constructor(loader: PluginLoader, name: string, mod: BotePluginModule, esmName: string) {
        this.loader = loader
        this.name = name
        this.fileName = path.basename(name)
        this.mod = mod
        this.esmName = esmName
    }
    
}

export class PluginLoader {
    protected baseLocation: string
    protected registry: Map<string, DynamicModule> = new Map()
    
    constructor(baseLocation: string = "./plugins") {
        this.baseLocation = baseLocation

        if (!fs.existsSync(baseLocation)) {
            fs.mkdirSync(baseLocation)
        }
    }

    setBaseLocation(newLoc: string) {
        this.baseLocation = newLoc
    }

    async loadAll() {
        return Promise.all(fs.readdirSync(this.baseLocation).map(it => {
            if (it.endsWith(".disable")) {
                return null
            }
            
            if (!it.endsWith(".ts") && !it.endsWith(".js")) {
                return null
            }

            return this.loadAnyModule(path.resolve(this.baseLocation, it))
        }).filter(Boolean))
    }

    /**
     * Invoke main function of all plugins and return a map of plugin managed core features.
     */
    async invokeMainAll(): Promise<{ [key in string]: any }> {
        await Promise.all(Array.from(this.registry.values()).map(it => it.mod.main()))

        return Array.from(this.registry.values()).map(it => it.mod.managed).reduce((acc, cur) => ({ ...acc, ...cur }), {})
    }
    
    async loadAnyModule(mod: string): Promise<BotePluginModule | null> {
        if (mod.endsWith(".disable")) {
            return null
        }
        
        if (fs.lstatSync(mod).isDirectory()) {
            return this.loadDirectoryModule(mod)
        }

        const esmName = path.relative(__dirname, mod).replace(".ts", "").replace(".js", "")
        const pluginModule = require(esmName)

        const name = pluginModule.default.plugin.name
        this.registry.set(name, new DynamicModule(this, name, pluginModule.default, esmName))

        return pluginModule.default
    }

    async loadESM(mod: string): Promise<BotePluginModule | null> {
        const pluginModule = require(mod)

        const name = pluginModule.default.plugin.name
        this.registry.set(name, new DynamicModule(this, name, pluginModule.default, mod))

        return pluginModule.default
    }

    protected async loadDirectoryModule(moduleDir: string): Promise<BotePluginModule | null> {
        const files = fs.readdirSync(moduleDir)
        let mainFile: string = ""
        if (files.includes("index.ts")) {
            mainFile = "index.ts"
        } else if (files.includes("index.js")) {
            mainFile = "index.js"
        } else if (files.includes("package.json")) {
            const pkgInfo = JSON.parse(fs.readFileSync(path.join(moduleDir, "package.json")).toString())
            if ("main" in pkgInfo && typeof pkgInfo.main === 'string') {
                mainFile = pkgInfo.main
            } else {
                throw new Error("No main file was found! Name your main file as index.ts(js) or put a main field in your package.json that points to your main file.")
            }
        } else {
            throw new Error("No main file was found! Name your main file as index.ts(js) or put a main field in your package.json that points to your main file.")
        }

        return this.loadAnyModule(path.relative(this.baseLocation, path.resolve(moduleDir, mainFile)))
    }

    async unloadModule(name: string): Promise<string | null> {
        if (this.registry.has(name)) {
            const mod = this.registry.get(name)!
        
            if (mod.mod.hooks.onUnload) { 
                await mod.mod.hooks.onUnload()
            }
            // Remove all references.
            I.getMasterDispatcher().deRegisterAll(mod.mod)
            CentralEventManager.unsubscribeAll(mod.name)

            const esmName = mod.esmName
            delete require.cache[esmName]
            this.registry.delete(name)
            
            return esmName
        }

        return null
    }

    async reloadPlugin(name: string) {
        if (this.registry.has(name)) {
            const mod = await this.loadESM((await this.unloadModule(name))!)

            if (mod?.hooks.onReload) { 
                mod.hooks.onReload()
            }
        }

        throw new Error("Plugin is not yet loaded. It is impossible to reload a unloaded plugin.");
        
    }

    requirePlugin(name: string): any | null {
        return this.registry.get(name)?.mod.exports
    }

    protected getScopeFromString(str: string): string | null {
        const splitter = str.indexOf(":")
        if (!splitter) {
            return null
        }

        return str.substring(0, splitter)
    }

    protected getModuleFromString(str: string): string | null {
        const splitter = str.indexOf(":")
        if (!splitter) {
            return null
        }

        return str.substring(splitter + 1)
    }

}