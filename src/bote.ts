import fs from 'fs'

import mongoose from 'mongoose'
import { Events } from './event/events'

import { Logging } from './logging'
import { BoteMasterDispatcher } from './command/controller'
import { PluginLoader } from './plugin/plugin-loader'
import { PermissionManager, PermissionManagerDefaultImpl, VoidPermissionManagerImpl } from './permission/permission-manager'
import { BoteConfig } from './utils/config'
import { pause } from './utils/promise'
import TelegramBot from 'node-telegram-bot-api'
import { TelegramRawMessageUpdate } from './utils/common-types'

export let telegram: TelegramBot
export let masterCommandDispatcher = new BoteMasterDispatcher()
export let permissionManager: PermissionManager
export const pluginManager = new PluginLoader()

function buildWebhookConfig(config: BoteConfig) {
    if (config.telegram?.useWebhook) {
        return {
            port: config.telegram.useWebhook.port,
            host: config.telegram.useWebhook.host,
            key: config.telegram.useWebhook.tls.private,
            cert: config.telegram.useWebhook.tls.public,
            autoOpen: false,
            https: {
                cert: config.telegram.useWebhook.tls.public,
                key: config.telegram.useWebhook.tls.private
            }
        }
    } else {
        return undefined
    }
}

export async function launch(config: BoteConfig) {
    telegram = new TelegramBot(config.credentials.telegramBoteToken, {
        baseApiUrl: config.telegram?.telegramAPI,
        polling: {
            autoStart: false
        },
        webHook: buildWebhookConfig(config)
    })

    if (config.credentials.mongodbConnectionURL.length != 0) {
        await mongoose.connect(config.credentials.mongodbConnectionURL)
    }

    Logging.init(config.storage?.programLog, [], config.loggingModuleLength)
    Logging.info("Loading plugins...")

    if (config.storage?.plugins) {
        pluginManager.setBaseLocation(config.storage?.plugins)
    }
    await pluginManager.loadAll()
    const managedServices = await pluginManager.invokeMainAll()
    
    if (managedServices.permissionManager) {
        permissionManager = managedServices.permissionManager
    } else {
        if (config.credentials.mongodbConnectionURL.length == 0) {
            if (!config.devMode) {
                Logging.error(new Error("Mongodb connection string is not set."), "Mongodb not available! If you are not going to use permission manager please set devMode to true.")
            } else {
                Logging.info("WARNING: Mongodb connection string is not set. Permission manager will not work.")
                permissionManager = new VoidPermissionManagerImpl()
            }
        } else {
            permissionManager = new PermissionManagerDefaultImpl()
        }
        
    }

    Logging.info("Invoke startup event")
    await Events.onStartup.call(null, null)

    setupEvents()

    Logging.info("Invoke postStartup event")
    await Events.onPostStartup.call(null, null)

    if (config.telegram?.useWebhook) {
        const webhookConfig = config.telegram.useWebhook

        await telegram.setWebHook(`${webhookConfig.domain}`, {
            certificate: webhookConfig.tls.public
        })

        Logging.info("Connecting to Telegram Bot API with webhook enabled...")
        await telegram.openWebHook()
    } else {
        if (!config.devMode) {
            Logging.info("< WARNING > PRODUCTION MODE DETECTED! PLEASE ENBALE WEBHOOKS! NOW TIMEOUT 20s TO LET YOU THINK ABOUT IT.")
            Logging.info("< WARNING > IF YOU ACCPET THE RISKS PLEASE WAIT 20s THEN BOTE WILL START UP.")
            
            for (let i = 0; i < 20; i ++) {
                await pause(1000)
            }
        }

        Logging.info("Connecting to Telegram Bot API...")
        await telegram.startPolling()
    }

    Logging.info(`Bote launched with token: ${replaceRange(config.credentials.telegramBoteToken.split(""), 20, 30, "*").join("")}`)

    await Events.onFinalization.call(null, null)
}

function replaceRange <T> (arr: T[], begin: number, end: number, data: T): T[] {
    const result: T[] = arr
    if (end >= arr.length) {
        throw new Error("Index out of bounds!")
    }

    for (let i = begin; i < end; i ++) {
        result[i] = data
    }

    return result
}

function setupEvents() {
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)

    telegram.addListener('polling_error', (err) => {
        Events.onBotError.call(null, err)
        Logging.error(err)
    })

    telegram.addListener('webhook_error', (err) => {
        Events.onBotError.call(null, err)
        Logging.error(err)
    })

    telegram.on('message', async (msg) => {
        if (msg.from) {
            await masterCommandDispatcher.handleUpdate(<TelegramRawMessageUpdate>msg)
        } else {
            // Handle the case when 'msg.from' is undefined
            console.log("Message 'from' is undefined.")
        }
    })
}
 
export async function shutdown(sig?: NodeJS.Signals) {
    await Events.onBoteShutdown.call(null, sig ?? null)

    if (telegram?.isPolling()) {
        await telegram.stopPolling()
    }

    if (telegram?.hasOpenWebHook()) {
        await telegram.closeWebHook()
    }

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close()
    }
}