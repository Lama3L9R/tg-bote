import Logging from "../logging"
import fs from 'fs'
import path from 'path'
import { BotePlugin, IPluginManager, PluginDescription } from "."
import { Events } from '../events'

class PluginManagerImpl implements IPluginManager {
    private plugins: Map<string, BotePlugin> = new Map()
    private nameCache: { [key: string]: string } = { }

    async loadPlugins(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        await Promise.all(fs.readdirSync(dir).map(async it => {
            await this.loadPlugin(dir, it)
        }))
    }

    getPlugin(name: string) {
        return this.plugins.get(this.nameCache[name]) ?? this.plugins.get(name) ?? null
    }
    
    async unloadPlugin(name: string) {
        const plugin = this.getPlugin(name)
        if (plugin) {
            if (plugin.plugin.hidden) {
                Logging.info("Unload plugin operation rejected! Reason: Attempt unload system plugin " + name)
                return
            }

            await Events.onRequestUnload.call(this, plugin.getFullName())
            
            const delEntry = require.cache[path.resolve(plugin.file + "")]!!.exports.plugin as PluginDescription

            this.plugins.delete(plugin.getUniqueIdentifier())
            delete require.cache[path.resolve(plugin.file + "")]

            Logging.info(`Unloaded user plugin @${delEntry.author}:${delEntry.name}(${delEntry.version})`)
        } else {
            throw new Error("No such plugin")
        }
    }

    async loadPlugin(dir: string, name: string) {
        const fullPath = path.join(dir, name)
        return this.loadFilePlugin(fullPath)
    }

    async loadFilePlugin(file: string) {
        if (file.endsWith(".disable")) {
            Logging.info("Load plugin operation rejected! Reason: Attempt load disabled plugin" + file)
            return
        }
        const fullPath = path.join(file)
        if (!fs.lstatSync(fullPath).isFile()) {
            return 
        }
        const plugin = await import(path.relative(__dirname, fullPath.replace(".ts", "")))
        if (!("plugin" in plugin)) {
            return Logging.error(new Error("No plugin information found!"), "Failed to enable plugin: " + file)
        }

        const bPlugin = new BotePlugin(plugin.plugin, plugin, fullPath)
        this.nameCache[bPlugin.getFullName()] = bPlugin.getUniqueIdentifier()
        this.plugins.set(this.nameCache[bPlugin.getFullName()], bPlugin)
        Logging.info(`Loaded ${bPlugin.plugin.hidden ? "system" : "user"} plugin ${bPlugin.getFullName()}(${bPlugin.getVersion()})`)

        return bPlugin
    }

    getAllPlugins(): BotePlugin[] {
        return Array.from(this.plugins.values())
    }

    async reloadAll() {
        const files: string[] = []
        const plugins: string[] = []
        for (const i of this.plugins.values()) {
            if (i.plugin.hidden) {
                Logging.info("Unload plugin operation rejected! Reason: Attempt unload system plugin " + i.getFullName())
                continue
            }
            plugins.push(i.getUniqueIdentifier())
            files.push(i.file + "")
        }

        await Promise.all(plugins.map(it => {
            return this.unloadPlugin(it)
        }))

        await Promise.all(files.map(it => this.loadFilePlugin(it)))
    }
} 

export const PluginManager = new PluginManagerImpl()