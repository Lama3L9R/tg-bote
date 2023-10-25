import { masterCommandDispatcher, permissionManager, pluginManager, telegraf, launch as launchBote, BoteConfig } from './bote'
import Logging from './logging'

export * from './plugin/event-system'
export * from './plugin/plugin'
export * from './logging/index'
export * from './logging/logger'
export * from './plugin/command/command-telegraf-middleware'
export * from './plugin/module/scoped-loader'
export * from './permission/permission-manager'
export * from './events' 

export namespace I {
    export const launch = launchBote

    export function getTelegraf() {
        return telegraf!
    }
    
    export function getMasterDispatcher() {
        return masterCommandDispatcher!
    }
    
    export const getLogger = Logging.getLogger
    
    export function getPermissionManager() {
        return permissionManager
    }
    
    export function getPluginManager() {
        return pluginManager
    }

    export function requirePlugin(name: string) {
        return pluginManager.requirePlugin(name)
    }
}

export function defineConfig(config: BoteConfig): BoteConfig {
    return config
}