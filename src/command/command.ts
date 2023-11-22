import { BoteCommandContext, I, MaybePromise } from '../..'

export type CommandHandler <RTN> = (ctx: BoteCommandContext, args: string[]) => MaybePromise<RTN>

export class Command <RTN> { 
    private name: string
    private commands: { [keys: string]: Command<any> } = { }
    private requiredPermission: string | null = null
    private rootHandler: CommandHandler<RTN> | null 

    constructor(name: string, rootHandler: CommandHandler<RTN> | null = null) {
        this.name = name
        this.rootHandler = rootHandler
    }

    permission(permission: string): Command<RTN> {
        this.requiredPermission = permission
        return this
    }

    command <R> (handler: Command<R>): Command<RTN> {
        this.commands[handler.getName()] = handler
        return this
    }

    async dispatch(args: string[], ctx: BoteCommandContext): Promise<any> {
        const cmd = args[0]

        if (!cmd || !(cmd in this.commands)) {
            if (this.requiredPermission) {
                if (await I.getPermissionManager().rejectAction(ctx)) {
                    return await ctx.reply("You don't have permission to do this.")
                }
            }

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