import { masterCommandDispatcher, permissionManager, pluginManager, telegram, launch as launchBote } from './src/bote'
import { Logging } from './src/logging'
import { BoteConfig } from './src/utils/config'

export * from './src/event/events'
export * from './src/event/event-system'

export * from './src/plugin/plugin'
export * from './src/plugin/plugin-loader'

export * from './src/logging/index'
export * from './src/logging/logger'

export * from './src/command/controller'
export * from './src/command/command'

export * from './src/permission/permission-manager'

export * from './src/utils/common-types'
export * from './src/utils/config'
export * from './src/utils/promise'
export * from './src/utils/utils'
export * from './src/utils/advanced-telegram-types'

export namespace I {
    export const launch = launchBote

    export function getTelegram() {
        return telegram!
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