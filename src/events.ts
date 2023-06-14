import { BoteMasterDispatcher } from './plugin/command/command-telegraf-middleware'
import { EventManager } from './plugin/event-system'

export const onCommandRegister = new EventManager<BoteMasterDispatcher, null>()
export const onStartup = new EventManager<null, null>()
export const onPostStartup = new EventManager<null, null>()
