import { CommandHandler, MaybePromise, TelegrafCommandContext } from '..'
import Logging from '../../logging'

export class Command <RTN> { 
    private name: string
    private commands: { [keys: string]: Command<any> } = { }
    private rootHandler: CommandHandler<RTN> | null

    constructor(name: string, rootHandler: CommandHandler<RTN> | null = null) {
        this.name = name
        this.rootHandler = rootHandler
    }

    command <R> (handler: Command<R>): Command<RTN> {
        this.commands[handler.getName()] = handler
        return this
    }

    async dispatch(args: string[], ctx: TelegrafCommandContext): Promise<any> {
        const cmd = args[0]

        if (!cmd || !(cmd in this.commands)) {
            return await (this.rootHandler ?? (() => {}))(ctx, args)
        }
        return await (this.commands[cmd] ?? (() => {})).dispatch(args.slice(1), ctx)
    }

    getCommands() {
        return this.commands
    }

    removeCommand(cmd: string) {
        delete this.commands[cmd]
    }

    getName() {
        return this.name
    }
}