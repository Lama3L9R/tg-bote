
import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'

import Logging from './logging'
import { BotePermissionManagerImpl } from './permission/permission-manager'
import { PluginManager } from './plugin'
import { BoteMasterDispatcher } from './plugin/command/command-telegraf-middleware'

export type BoteConfig = {
    pluginsFolder?: string
}

let telegraf: Telegraf | null = null
let masterCommandDispatcher = new BoteMasterDispatcher()
const permissionManager = new BotePermissionManagerImpl(["pem.deny.*", "pm.deny.*"])

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
 
export async function launch(mongodb: string, token: string, config: BoteConfig = { }) {
    telegraf = new Telegraf(token)
    if (mongodb.length != 0) {
        await mongoose.connect(mongodb)
    }
    await permissionManager.sync()

    const task = async () => {
        Logging.info(`Synchronizing permissions to database`)
        await permissionManager.save()
        await permissionManager.sync()
        Logging.info(`Synchronization complete`)

        setTimeout(task, 60 * 1000)
    }
    setTimeout(task, 60 * 1000)


    Logging.init()
    Logging.info("Loading plugins...")

    await PluginManager.loadPlugins(config.pluginsFolder ?? "./plugins")

    telegraf.catch((err, ctx) => {
        if (!err) {
            return
        }

        Logging.error({ name: "UnknownTelegrafError", message: "unknown", ...(err as any) })
    })

    telegraf.on(["text"], getMasterDispatcher())

    await telegraf.launch()
    Logging.info(`Bote launched with token: ${replaceRange(token.split(""), 20, 30, "*").join("")}`)
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