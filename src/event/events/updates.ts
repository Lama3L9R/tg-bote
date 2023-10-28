import { TelegrafCommandContext } from '../../utils/common-types'
import { BoteMasterDispatcher } from "../../command/command-telegraf-middleware"
import { EventManager } from "../event-system"

export const preCommandProcess = new EventManager<EventPreCommandProcess, BoteMasterDispatcher>()
export const onCommandProcess = new EventManager<EventCommandProcess, BoteMasterDispatcher>()
export const onMessageUpdate = new EventManager<EventMessageUpdate, BoteMasterDispatcher>()

export class EventPreCommandProcess {
    cancelled: boolean = false
    readonly ctx: TelegrafCommandContext
    
    constructor(ctx: TelegrafCommandContext) {
        this.ctx = ctx
    }
}

export class EventCommandProcess {
    cancelled: boolean = false
    readonly ctx: TelegrafCommandContext
    command: string
    args: string[]

    constructor(ctx: TelegrafCommandContext, command: string, args: string[]) {
        this.ctx = ctx
        this.command = command
        this.args = args
    }
}

export class EventMessageUpdate {
    ctx: TelegrafCommandContext

    constructor(ctx: TelegrafCommandContext) {
        this.ctx = ctx
    }
}