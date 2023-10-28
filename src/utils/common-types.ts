import { Context, NarrowedContext } from "telegraf";


import { Update } from "telegraf/typings/core/types/typegram";
import { MountMap } from "telegraf/typings/telegram-types";

export type MaybePromise<RTN> = Promise<RTN> | RTN
export type NullLike = null | undefined
export type StringMapLike<Value> = { [keys in string]: Value }

export type OptionalFor<Type, Keys extends keyof any> = { 
    [keys in Exclude<keyof Type, Keys>]: Type[keys]
} & { [keys in Extract<keyof Type, Keys>]?: Type[keys] }

export type RequiredFor<Type, Keys extends keyof any> = { 
    [keys in Exclude<keyof Type, Keys>]?: Type[keys]
} & { [keys in Extract<keyof Type, Keys>]: Type[keys] }

export type TelegrafCommandContext = NarrowedContext<Context<Update>, MountMap["text"]>
export type CommandHandler <RTN> = (ctx: TelegrafCommandContext, args: string[]) => MaybePromise<RTN>
