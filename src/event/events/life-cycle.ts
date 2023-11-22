import { EventManager } from "../event-system"

export const onStartup = new EventManager<null, null>()
export const onPostStartup = new EventManager<null, null>()
export const onFinalization = new EventManager<null, null>()

export const onBoteShutdown = new EventManager<NodeJS.Signals | null, null>()

export const onBotError = new EventManager<Error, null>()