import { MiddlewareFn, MiddlewareObj } from 'telegraf'
import { MessageEntity } from 'telegraf/typings/core/types/typegram'
import { TelegrafCommandContext } from '../utils/common-types'
import { Events } from '../event/events'
import { Logging } from '../logging'
import { Command } from './command'
import { BotePluginModule } from '../plugin/plugin'
import { I } from '../..'
import { EventCommandProcess, EventMessageUpdate, EventPreCommandProcess } from '../event/events/updates'
import { StringMapLike } from '../utils/common-types'

export class BoteMasterDispatcher implements MiddlewareObj<TelegrafCommandContext> {
    private commands: StringMapLike<PluginCommand> = { }

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
                if (await I.getPermissionManager().rejectAction(new BoteCommandContext(ctx, this.commands[event.command], event.args))) {
                    return Logging.event("CmdDispatchRejected", textReal.join("") + " | Permission denied", `${ctx.message.chat.id}:${ctx.message.from.id}`)
                }

                Logging.event("CmdDispatch", textReal.join(""), `${ctx.message.chat.id}:${ctx.message.from.id}`)
            }

            try {
                return await this.commands[event.command].dispatch(event.args, ctx)
            } catch(err: any) {
                Logging.error(err)
            }

            return null
        }
    }

    register(plugin: BotePluginModule, cmd: Command<any>) {
        this.commands[cmd.getName()] = new PluginCommand(plugin, cmd)
    }

    deRegister(...cmd: string[]) {
        cmd.forEach(it => delete this.commands[it])
    }

    deRegisterAll(plugin: BotePluginModule) {
        for (const i in this.commands) {
            if (this.commands[i].plugin === plugin) {
                delete this.commands[i]
            }
        }
    }
}

export class PluginCommand {
    readonly plugin: BotePluginModule
    readonly command: Command<any>

    constructor(plugin: BotePluginModule, command: Command<any>) {
        this.plugin = plugin
        this.command = command
    }

    dispatch(args: string[], ctx: TelegrafCommandContext) {
        return this.command.dispatch(args, ctx)
    }
}

export class BoteCommandContext {
    readonly ctx: TelegrafCommandContext
    readonly command: PluginCommand
    readonly args: string[]

    constructor(ctx: TelegrafCommandContext, command: PluginCommand, args: string[]) {
        this.ctx = ctx
        this.command = command
        this.args = args
    }
}

