import { IPluginManager } from './plugin'
import { BoteMasterDispatcher, EventCommandProcess, EventMessageUpdate, EventPreCommandProcess } from './plugin/command/command-telegraf-middleware'
import { EventManager } from './plugin/event-system'

export class Events {
    static onStartup = new EventManager<null, null>()
    static onPostStartup = new EventManager<null, null>()
    static onFinalization = new EventManager<null, null>()
    
    static preCommandProcess = new EventManager<EventPreCommandProcess, BoteMasterDispatcher>()
    static onCommandProcess = new EventManager<EventCommandProcess, BoteMasterDispatcher>()
    static onMessageUpdate = new EventManager<EventMessageUpdate, BoteMasterDispatcher>()

    /**
     * this event will trigger whenever someone tried to unload a plugin
     * if eventargs is your plugin descriptor then you need to get ready for unload
     * if eventargs is null or undefined then it means to unload all plugins
     * if none of above then you should do nothing
     * 
     * concution:
     * write this at first line of event handler:
     * if (!args || args === "your plugin descriptor") { <do unload> }
     */
    static onRequestUnload = new EventManager<string, IPluginManager>()
}