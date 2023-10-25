
import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'
import { Events } from './events'

import Logging from './logging'
import { BotePermissionManagerImpl } from './permission/permission-manager'
import { BoteMasterDispatcher } from './plugin/command/command-telegraf-middleware'
import { PluginLoader } from './plugin/module/scoped-loader'

export type BoteConfig = {
    pluginsFolder?: string,
    mongodb: string, 
    token: string
}

export let telegraf: Telegraf | null = null
export let masterCommandDispatcher = new BoteMasterDispatcher()
export const permissionManager = new BotePermissionManagerImpl(["pem.deny.*", "pm.deny.*"])
export const pluginManager = new PluginLoader()

export async function launch({ pluginsFolder, mongodb, token }: BoteConfig) {
    telegraf = new Telegraf(token)
    if (mongodb.length != 0) {
        await mongoose.connect(mongodb)
    }
    await permissionManager.sync()

    const task = async () => {
        await permissionManager.sync()

        setTimeout(task, 60 * 1000)
    }
    setTimeout(task, 60 * 1000)


    Logging.init()
    Logging.info("Loading plugins...")

    if (pluginsFolder) {
        pluginManager.setBaseLocation(pluginsFolder)
    }
    await pluginManager.loadAll()
    await pluginManager.invokeMainAll()
    
    Logging.info("Invoke startup event")
    await Events.onStartup.call(null, null)

    telegraf.catch((err, ctx) => {
        if (!err) {
            return
        }

        Logging.error({ name: "UnknownTelegrafError", message: "unknown", ...(err as any) })
    })

    process.once('SIGINT', () => telegraf!.stop('SIGINT'))
    process.once('SIGTERM', () => telegraf!.stop('SIGTERM'))

    telegraf.on(["text"], masterCommandDispatcher)

    Logging.info("Invoke postStartup event")
    await Events.onPostStartup.call(null, null)

    Logging.info("Connecting to Telegram Bot API...")
    telegraf.launch()
    Logging.info(`Bote launched with token: ${replaceRange(token.split(""), 20, 30, "*").join("")}`)

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