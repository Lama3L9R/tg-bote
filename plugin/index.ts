import fs from 'fs'
import { createHash } from 'crypto'
import { Context, Middleware, NarrowedContext } from "telegraf";


import { Update } from "telegraf/typings/core/types/typegram";
import { MountMap } from "telegraf/typings/telegram-types";
export { PluginManager } from './plugin-manager'
import { Command } from './command/command'
import { Logger } from '../logging/logger'
import Logging from '../logging'

export type TelegrafCommandContext = NarrowedContext<Context<Update>, MountMap["text"]>
export type TelegrafCommandHandler = Middleware<TelegrafCommandContext>
export type CommandHandler <RTN> = (ctx: TelegrafCommandContext, args: string[]) => MaybePromise<RTN>

export class BotePlugin { 
    plugin: PluginDescription
    module: any
    file: fs.PathLike 
    logger: Logger

    constructor(plugin: PluginDescription, module: any, file: fs.PathLike) {
        this.plugin = plugin
        this.module = module
        this.file = file
        this.logger = Logging.getLogger(this.plugin.name)
    }

    getFullName() {
        return `@${this.plugin.author}:${this.plugin.name}`
    }

    getVersion() {
        return this.plugin.version
    }
 
    getUniqueIdentifier() {
        const chunks = createHash("SHA1").update(JSON.stringify(this.plugin)).digest().toString("hex").split("")
        chunks.splice(8, 0, "-")

        return chunks.join("")
    }

    getLogger() {
        return this.logger
    }
}
export type PluginDescription = { name: string, author: string, version: string, hidden?: boolean, license?: string }

export type MaybePromise<T> = Promise<T> | T

export interface IPluginManager {
    loadPlugins(dir: string): Promise<void>
    getPlugin(name: string): BotePlugin | null
    unloadPlugin(name: string): Promise<void>
    loadPlugin(dir: string, name: string): Promise<BotePlugin | void>
    loadFilePlugin(file: string): Promise<BotePlugin | void>
    getAllPlugins(): BotePlugin[]
    reloadAll(): Promise<void>
}

export interface RegisteredCommand <RTN> {
    name: string
    handler: CommandHandler<RTN>
}

export interface ICommandDispatcher {
    dispatch(ctx: TelegrafCommandContext, cmdRaw: string): Promise<any>
    register(cmds: Command<any>): void
    remove(cmds: Command<any>): void
    removeCommand(cmd: string): void
}

export interface BoteCommandContext {
    command: string
    args: string[]

    reply(msg: string): Promise<void>
    replyWithMarkdownV2(msg: string): Promise<void>
    
}
