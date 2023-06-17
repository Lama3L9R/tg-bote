import Logging from "../logging"
import fs from 'fs'
import path from 'path'
import { BotePlugin, IPluginManager } from "."

class PluginManagerImpl implements IPluginManager {
    private plugins: Map<string, BotePlugin> = new Map()

    async loadPlugins(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }

        await Promise.all(fs.readdirSync(dir).map(async it => {
            const fullPath = path.join(dir, it)
            if (!fs.lstatSync(fullPath).isFile()) {
                return
            }
            const plugin = await import(path.relative(__dirname, fullPath.replace(".ts", "")))
            if (!("plugin" in plugin)) {
                return Logging.error(new Error("No plugin information found!"), "Failed to enable plugin: " + it)
            }
    
            const bPlugin = new BotePlugin(plugin.plugin, plugin, fullPath)
            this.plugins.set(bPlugin.getUniqueIdentifier(), bPlugin)
            Logging.info(`Loaded ${bPlugin.plugin.hidden ? "system" : "user"} plugin: ${bPlugin.getFullName()}(${bPlugin.getVersion()})`)
        }))
    }

    getPlugin(name: string) {
        return this.plugins.get(name) ?? null
    }
} 

export const PluginManager = new PluginManagerImpl()