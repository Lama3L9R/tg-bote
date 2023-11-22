import TelegramBot from 'node-telegram-bot-api'
import https from 'node:https'


export type MaybePromise<RTN> = Promise<RTN> | RTN
export type NullLike = null | undefined
export type StringMapLike<Value> = { [keys in string]: Value }

export type OptionalFor<Type, Keys extends keyof any> = { 
    [keys in Exclude<keyof Type, Keys>]: Type[keys]
} & { [keys in Extract<keyof Type, Keys>]?: Type[keys] }

export type RequiredFor<Type, Keys extends keyof any> = { 
    [keys in Exclude<keyof Type, Keys>]?: Type[keys]
} & { [keys in Extract<keyof Type, Keys>]: Type[keys] }

export type TelegramBotWebhookCfg = {
    host?: string | undefined;
    port?: number | undefined;
    key?: string | undefined;
    cert?: string | undefined;
    pfx?: string | undefined;
    autoOpen?: boolean | undefined;
    https?: https.ServerOptions | undefined;
    healthEndpoint?: string | undefined;
}

export type TelegramRawMessageUpdate = TelegramBot.Message & { from: TelegramBot.User }