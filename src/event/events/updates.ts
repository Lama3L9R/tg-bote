import TelegramBot from "node-telegram-bot-api"
import { BoteCommandContext, BoteMasterDispatcher, PluginCommand } from "../../command/controller"
import { Delegated, TelegramChat, TelegramUser } from "../../utils/advanced-telegram-types"
import { CancelableEvent, EventManager } from "../event-system"
import { telegram } from "../../bote"

export const preCommandProcess = new EventManager<EventPreCommandProcess, BoteMasterDispatcher>()
export const onCommandProcess = new EventManager<EventCommandProcess, BoteMasterDispatcher>()
export const onMessageUpdate = new EventManager<EventMessage, BoteMasterDispatcher>()

export class EventPreCommandProcess extends CancelableEvent {
    readonly ctx: EventMessage
    
    constructor(ctx: EventMessage) {
        super()

        this.ctx = ctx
    }
}

export class EventCommandProcess extends CancelableEvent {
    readonly ctx: BoteCommandContext
    command: PluginCommand
    args: string[]

    constructor(ctx: BoteCommandContext) {
        super()

        this.ctx = ctx
        this.command = ctx.command
        this.args = ctx.args
    }
}

export class EventMessage implements Delegated<TelegramBot.Message> {
    private readonly delegation: TelegramBot.Message
    message: string
    from: TelegramUser
    chat: TelegramChat

    constructor(delegation: TelegramBot.Message) {
        this.delegation = delegation
        this.message = delegation.text ?? ""
        this.chat = new TelegramChat(delegation.chat)
        this.from = new TelegramUser(delegation.from!, this.chat)
    }

    getRaw() {
        return this.delegation
    }
}

export class EventImageMessage extends EventMessage {
    images: TelegramBot.PhotoSize[]

    constructor(delegation: TelegramBot.Message) {
        super(delegation)
        this.images = delegation.photo ?? []
    }

    downloadImage(index: number): Promise<Buffer> {
        const rs = telegram.getFileStream(this.images[index].file_id)

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = []
            rs.on("data", chunk => chunks.push(chunk))
            rs.on("end", () => resolve(Buffer.concat(chunks)))
            rs.on("error", reject)
        })
    }
}