import { MiddlewareFn, MiddlewareObj } from 'telegraf'
import { MessageEntity } from 'telegraf/typings/core/types/typegram'
import { TelegrafCommandContext } from '..'
import { Events } from '../../events'
import Logging from '../../logging'
import { Command } from './command'

export class BoteMasterDispatcher implements MiddlewareObj<TelegrafCommandContext> {
    private commands: { [keys: string]: Command<any> } = { }

    middleware(): MiddlewareFn<TelegrafCommandContext> {
        return async (ctx) => {
            const textReal = ctx.message.text.trim().split("")
            const entities = ctx.message.entities
    
            if (!entities || entities.length === 0 || entities[0].type !== "bot_command") {
                Events.onMessageUpdate.call(this, new EventMessageUpdate(ctx))
                return Logging.event("MsgUpdate", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            }

            
            if ((await Events.preCommandProcess.call(this, new EventPreCommandProcess(ctx))).cancelled) {
                Logging.event("CmdPreProcCancellation", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            } else {
                Logging.event("CmdPreProc", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            }

            const cmd = textReal.slice(entities[0].offset + 1, entities[0].offset + 1 + entities[0].length).join("").trim()
            if (!cmd) {
                return
            }

            if (!(cmd in this.commands)) {
                return
            }

            const args: string[] = []
            if (entities[0].length !== textReal.length) {
                let chunk = ""
                let entityIndex = 1
                let entity: MessageEntity | null = entities[entityIndex]
                for (let i = entities[0].length; i < textReal.length; i ++) {
                    redo: do {
                        if (entity && i >= entity.offset && i < entity.offset + entity.length) {
                            chunk += textReal[i]
                            break redo
                        } else if (entity && i >= entity.offset + entity.length) {
                            entityIndex += 1
                            entity = entities[entityIndex]
                            continue redo
                        } else {
                            if (textReal[i] === " ") {
                                args.push(chunk)
                                chunk = ""
                            } else {
                                chunk += textReal[i]
                            }
                            break redo
                        }
                    } while(true)
                }

                args.push(chunk)
            }

            const event = await Events.onCommandProcess.call(this, new EventCommandProcess(ctx, cmd, args.filter(it => it.length > 0)))
            
            if (event.cancelled) {
                return Logging.event("CmdDispatchCancellation", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            } else {
                Logging.event("CmdDispatch", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            }

            return this.commands[event.command].dispatch(event.args, ctx)
        }
    }

    register(cmd: Command<any>) {
        this.commands[cmd.getName()] = cmd
    }
}

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