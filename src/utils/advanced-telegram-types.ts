import TelegramBot from 'node-telegram-bot-api'
import { I } from '../..'
import { escapeMarkdownV2 } from './utils'

export interface Delegated <Original> {
    getRaw(): Original
}

export class TelegramChat implements Delegated<TelegramBot.Chat> {
    private delegation: TelegramBot.Chat
    id: number
    name: string
    type: TelegramBot.ChatType

    constructor(delegation: TelegramBot.Chat) {
        this.delegation = delegation
        this.id = delegation.id
        this.type = delegation.type

        switch (delegation.type) {
            case 'group':
            case 'supergroup':
            case 'channel':
                this.name = delegation.title ?? ""
                break
            case 'private':
                this.name = delegation.username ?? delegation.first_name ?? ""
                break
        }
    }

    getRaw() {
        return this.delegation
    }

    /**
     * Send a message to this chat.
     * Unused markdown characters will be escaped automatically.
     * 
     * For example: '[' and ']' will be escaped to '\[' and '\]'.
     * But '*' and '_' will not be escaped. 
     * If you wan't to send '*' or other characters that is used in markdown, you need to escape them manually.
     * Or use `sendMessageRaw()` instead.
     * 
     * @param text Text with MarkdownV2 enabled
     * @returns message you've sent
     */
    async sendMessage(text: string) {
        return this.sendMessageParsed(escapeMarkdownV2(text), "MarkdownV2")
    }

    /**
     * Send a message to this chat.
     * **No** automatic escaping will be applied.
     * 
     * @param text Text with Markdown enabled
     * @returns message you've sent
     */
    async sendMessageLegacy(text: string) {
        return this.sendMessageParsed(text, "Markdown")
    }

    /**
     * Send a message to this chat.
     * **No** automatic escaping will be applied.
     * 
     * @param text Text with HTML enabled
     * @returns message you've sent
     */
    async sendMessageHTML(text: string) {
        return this.sendMessageParsed(text, "HTML")
    }

    /**
     * Send a message to this chat.
     * @param text Text without any parsing engine. No style will be applied.
     * @returns message you've sent
     */
    async sendMessageRaw(text: string) {
        return await I.getTelegram().sendMessage(this.id, text)
    }

    /**
     * Send a message to this chat.
     * **No** automatic escaping will be applied.
     * 
     * @param text Text with selected parsing engine
     * @returns message you've sent
     */
    async sendMessageParsed(text: string, parse: "MarkdownV2" | "Markdown" | "HTML") {
        await I.getTelegram().sendMessage(this.id, text, {
            parse_mode: parse
        })
    }

    async sendPhoto(photo: string | Buffer, caption?: string) {
        await I.getTelegram().sendPhoto(this.id, photo, {
            caption
        })
    }

    async sendSticker(sticker: string | Buffer) {
        await I.getTelegram().sendSticker(this.id, sticker)
    }

}

export class TelegramUser implements Delegated<TelegramBot.User> {
    private delegation: TelegramBot.User
    /**
     * Corresponding the source chat. May not the user's private chat.\
     */
    chat?: TelegramChat
    id: number
    name: string
    username: string

    constructor(delegation: TelegramBot.User, chat?: TelegramChat) {
        this.delegation = delegation
        this.chat = chat
        this.id = delegation.id
        this.name = delegation.first_name + delegation.last_name ? ` ${delegation.last_name}` : ""
        this.username = delegation.username ?? ""
    }

    getRaw() {
        return this.delegation
    }

    /**
     * Send private message. As same as `dm()`.
     * Somebody prefer `pm()` instead of `dm()` so this function is provided.
     * Personally I prefer `dm()`.
     * 
     * Unused markdown characters will be escaped automatically.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with MarkdownV2 enabled
     * @returns Message you've sent
     */
    async pm(text: string) {
        return this.dm(text)
    }

    /**
     * Send private message with Markdown Engine. As same as `dmLegacy()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmLegacy()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with Markdown enabled
     * @returns Message you've sent
     */
    async pmLegacy(text: string) {
        return this.dmLegacy(text)
    }

    /**
     * Send private message with HTML Engine. As same as `dmHTML()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmHTML()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with HTML enabled
     * @returns Message you've sent
     */
    async pmHTML(text: string) {
        return this.dmHTML(text)
    }

    /**
     * Send private message without any parsing engine. As same as `dmRaw()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmRaw()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text without any parsing engine. No style will be applied.
     * @returns Message you've sent
     */
    async pmRaw(text: string) {
        return this.dmRaw(text)
    }

    /**
     * Send direct message with MarkdownV2 Engine. As same as `pm()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pm()`.
     * Both of them do the same thing.
     * 
     * Unused markdown characters will be escaped automatically.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with MarkdownV2 enabled
     * @returns message you've sent
     */
    async dm(text: string) {
        return I.getTelegram().sendMessage(this.id, escapeMarkdownV2(text), {
            parse_mode: "MarkdownV2"
        })
    }

    /**
     * Send direct message with Markdown Engine. As same as `pmLegacy()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmLegacy()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with Markdown enabled
     * @returns Message you've sent
     */
    async dmLegacy(text: string) {
        return I.getTelegram().sendMessage(this.id, text, {
            parse_mode: "Markdown"
        })
    }

    /**
     * Send direct message with HTML Engine. As same as `pmHTML()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmHTML()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text with HTML enabled
     * @returns Message you've sent
     */
    async dmHTML(text: string) {
        return I.getTelegram().sendMessage(this.id, text, {
            parse_mode: "HTML"
        })
    }

    /**
     * Send direct message without any parsing engine. As same as `pmRaw()`.
     * Somebody prefer `pm` instead of `dm` so there is a function named `pmRaw()`.
     * Both of them do the same thing.
     * 
     * **No** automatic escaping will be applied.
     * 
     * pm: Private Message
     * dm: Direct Message
     * 
     * @param text Text without any parsing engine. No style will be applied.
     * @returns Message you've sent
     */
    async dmRaw(text: string) {
        return I.getTelegram().sendMessage(this.id, text)
    }
}
