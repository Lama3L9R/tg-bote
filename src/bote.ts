import fs from 'fs'

import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'
import { Events } from './event/events'

import { Logging } from './logging'
import { BoteMasterDispatcher } from './command/command-telegraf-middleware'
import { PluginLoader } from './plugin/plugin-loader'
import { PermissionManager, PermissionManagerDefaultImpl } from './permission/permission-manager'
import { BoteConfig } from './utils/config'
import { pause } from './utils/promise'

export let telegraf: Telegraf | null = null
export let masterCommandDispatcher = new BoteMasterDispatcher()
export let permissionManager: PermissionManager = new PermissionManagerDefaultImpl()
export const pluginManager = new PluginLoader()

export async function launch(config: BoteConfig) {
    telegraf = new Telegraf(config.credentials.telegramBoteToken, {
        telegram: {
            apiRoot: config.telegram?.telegramAPI,
        }
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
    }

    Logging.info("Invoke startup event")
    await Events.onStartup.call(null, null)

    telegraf.catch((err, ctx) => {
        if (!err) {
            return
        }

        Logging.error({ name: "UnknownTelegrafError", message: "unknown", ...(err as any) })
    })

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)

    telegraf.on(["text"], masterCommandDispatcher)

    Logging.info("Invoke postStartup event")
    await Events.onPostStartup.call(null, null)

    if (config.telegram?.useWebhook) {
        const webhookConfig = config.telegram.useWebhook

        telegraf.launch({
            webhook: {
                domain: webhookConfig.domain,
                host: webhookConfig.host,
                path: webhookConfig.path,
                port: webhookConfig.port,
                secretToken: webhookConfig.secretToken,

                tlsOptions: {
                    cert: fs.readFileSync(webhookConfig.tls.public),
                    key: fs.readFileSync(webhookConfig.tls.private),
                }
            }
        })

        Logging.info("Connecting to Telegram Bot API with webhook enabled...")

    } else {
        if (!config.devMode) {
            Logging.info("< WARNING > PRODUCTION MODE DETECTED! PLEASE ENBALE WEBHOOKS! NOW TIMEOUT 20s TO LET YOU THINK ABOUT IT.")
            Logging.info("< WARNING > IF YOU ACCPET THE RISKS PLEASE WAIT 20s THEN BOTE WILL START UP.")
            
            for (let i = 0; i < 20; i ++) {
                await pause(1000)
            }
        }

        telegraf.launch()
        Logging.info("Connecting to Telegram Bot API...")
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

export async function shutdown(sig?: NodeJS.Signals) {
    await Events.onBoteShutdown.call(null, null)

    telegraf!.stop(sig ?? 'SIGTERM')
}