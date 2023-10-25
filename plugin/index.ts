
import { Context, Middleware, NarrowedContext } from "telegraf";


import { Update } from "telegraf/typings/core/types/typegram";
import { MountMap } from "telegraf/typings/telegram-types";
import { Command } from './command/command'

export type TelegrafCommandContext = NarrowedContext<Context<Update>, MountMap["text"]>
export type TelegrafCommandHandler = Middleware<TelegrafCommandContext>
export type CommandHandler <RTN> = (ctx: TelegrafCommandContext, args: string[]) => MaybePromise<RTN>
export type MaybePromise<RTN> = Promise<RTN> | RTN

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
