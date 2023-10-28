import { Telegraf } from "telegraf"
import { EventManager } from "../event-system"

export const onStartup = new EventManager<null, null>()
export const onPostStartup = new EventManager<null, null>()
export const onFinalization = new EventManager<null, null>()

export const onBoteShutdown = new EventManager<null, NodeJS.Signals | null>()

export const onTelegrafError = new EventManager<unknown, Telegraf>()