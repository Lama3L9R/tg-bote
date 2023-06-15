import { BoteMasterDispatcher, EventCommandProcess, EventMessageUpdate, EventPreCommandProcess } from './plugin/command/command-telegraf-middleware'
import { EventManager } from './plugin/event-system'


export class Events {
    static onStartup = new EventManager<null, null>()
    static onPostStartup = new EventManager<null, null>()
    static onFinalization = new EventManager<null, null>()
    
    static preCommandProcess = new EventManager<EventPreCommandProcess, BoteMasterDispatcher>()
    static onCommandProcess = new EventManager<EventCommandProcess, BoteMasterDispatcher>()
    static onMessageUpdate = new EventManager<EventMessageUpdate, BoteMasterDispatcher>()

}