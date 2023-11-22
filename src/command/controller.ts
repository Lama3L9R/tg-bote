import { Events } from '../event/events'
import { Logging } from '../logging'
import { Command } from './command'
import { BotePluginModule } from '../plugin/plugin'
import { I } from '../..'
import { EventCommandProcess, EventMessage, EventImageMessage, EventPreCommandProcess } from '../event/events/updates'
import { StringMapLike, TelegramRawMessageUpdate } from '../utils/common-types'
import { TelegramChat, TelegramUser } from '../utils/advanced-telegram-types'
import { MessageEntity } from 'node-telegram-bot-api'
import { escapeMarkdownV2 } from '../utils/utils'

export class BoteMasterDispatcher {
    private commands: StringMapLike<PluginCommand> = { }

    async handleUpdate(ctx: TelegramRawMessageUpdate) {
        const textReal = ctx.text?.trim().split("") ?? []
        const entities = ctx.entities

        if (textReal.length === 0 || !entities || entities.length === 0 || entities[0].type !== "bot_command") {
            if (ctx.photo) {
                Events.onMessageUpdate.call(this, new EventImageMessage(ctx))
                return Logging.event("MsgIUpdate", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
            } else {
                Events.onMessageUpdate.call(this, new EventMessage(ctx))
                return Logging.event("MsgUpdate", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
            }
        }

        
        if ((await Events.preCommandProcess.call(this, new EventPreCommandProcess(new EventMessage(ctx)))).cancelled) {
            Logging.event("CmdPreProcCancellation", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
        } else {
            Logging.event("CmdPreProc", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
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

        const commandCtx = new BoteCommandContext(ctx, this.commands[cmd], args.filter(it => it.length > 0))
        const event = await Events.onCommandProcess.call(this, new EventCommandProcess(commandCtx))
        
        if (event.cancelled) {
            return Logging.event("CmdDispatchCancellation", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
        } else {
            if (await I.getPermissionManager().rejectAction(commandCtx)) {
                return Logging.event("CmdDispatchRejected", textReal.join("") + " | Permission denied", `${ctx.chat.id}:${ctx.from.id}`)
            }

            Logging.event("CmdDispatch", textReal.join(""), `${ctx.chat.id}:${ctx.from.id}`)
        }

        try {
            return await event.command.dispatch(event.args, commandCtx)
        } catch(err: any) {
            Logging.error(err)
        }

        return null
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

    dispatch(args: string[], ctx: BoteCommandContext) {
        return this.command.dispatch(args, ctx)
    }
}

export class BoteCommandContext {
    readonly update: TelegramRawMessageUpdate
    readonly chat: TelegramChat
    readonly sender: TelegramUser
    readonly command: PluginCommand
    readonly args: string[]

    constructor(update: TelegramRawMessageUpdate, command: PluginCommand, args: string[]) {
        this.update = update
        this.chat = new TelegramChat(update.chat)
        this.sender = new TelegramUser(update.from, this.chat)
        this.command = command
        this.args = args
    }

    reply(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, escapeMarkdownV2(text), {
            parse_mode: "MarkdownV2",
            reply_to_message_id: this.update.message_id
        })
    }

    replyHTML(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, text, {
            parse_mode: "HTML",
            reply_to_message_id: this.update.message_id
        })
    }

    replyRaw(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, text, {
            reply_to_message_id: this.update.message_id
        })
    }

    replyParsed(text: string, parse: "MarkdownV2" | "Markdown" | "HTML") {
        return I.getTelegram().sendMessage(this.chat.id, text, {
            parse_mode: parse,
            reply_to_message_id: this.update.message_id
        })
    }

    sendText(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, escapeMarkdownV2(text), {
            parse_mode: "MarkdownV2"
        })
    }

    sendHTML(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, text, {
            parse_mode: "HTML"
        })
    }

    sendRaw(text: string) {
        return I.getTelegram().sendMessage(this.chat.id, text)
    }
}

