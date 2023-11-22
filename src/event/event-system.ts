import { MaybePromise } from '../utils/common-types'
import { BotePluginModule } from '../plugin/plugin'

export type EventHandlerFn<EventArg, Sender> = (args: EventArg, sender: Sender) => MaybePromise<void>
export type EventHandlerUID = `${string}:${number}`

export class EventHandler<EventArg, Sender> {
    fn: EventHandlerFn<EventArg, Sender>
    uid: EventHandlerUID
    priority: number

    constructor(fn: EventHandlerFn<EventArg, Sender>, uid: EventHandlerUID, priority: number = 10) {
        this.fn = fn
        this.uid = uid

        if (priority > 9999) {
            this.priority = 9999
        } else {
            this.priority = priority
        }
    }

    async invoke(args: EventArg, sender: Sender): Promise<void> {
        return await this.fn.call(null, args, sender)
    }
}

export class CentralEventManager {
    private static references: Map<string, EventHandlerRef[]> = new Map()
    
    public static reportNewHandler({ plugin }: BotePluginModule, ref: EventHandlerRef) {
        if (CentralEventManager.references.has(plugin.name)) {
            CentralEventManager.references.get(plugin.name)!.push(ref)
        } else {
            CentralEventManager.references.set(plugin.name, [ref])
        }

        return ref
    }

    public static unsubscribeAll(plugin: string) {
        if (CentralEventManager.references.has(plugin)) {
            const arr = CentralEventManager.references.get(plugin)?.map(it => ({ manager: it.manager, uid: it.uid }))
            arr?.forEach(it => it.manager.unsubscribe(it.uid))
        }
    }
}

export class EventManager<EventArg, Sender> {
    private handlers: EventHandler<EventArg, Sender>[] = []

    subscribe(plugin: BotePluginModule, ...fns: EventHandlerFn<EventArg, Sender>[]) {
        const id = this.assignUID(plugin)
        this.handlers.push(...fns.map((it, i) => new EventHandler(it, id, 10 + i)))
        
        return CentralEventManager.reportNewHandler(plugin, new EventHandlerRef(plugin, this, id))
    }

    subscribePrior(plugin: BotePluginModule, priority: number, ...fns: EventHandlerFn<EventArg, Sender>[]) {
        const id = this.assignUID(plugin)
        this.handlers.push(...fns.map((it, i) => new EventHandler(it, id, priority + i)))
        return CentralEventManager.reportNewHandler(plugin, new EventHandlerRef(plugin, this, id))
    }

    async once(plugin: BotePluginModule) {
        return new Promise<EventArg>((resolve, reject) => {
            const id = this.assignUID(plugin)
            const handler = new EventHandler<EventArg, Sender>((args, sender) => {
                this.unsubscribe(id)
                resolve(args)
            }, id, 0)
            this.handlers.push(handler)
            CentralEventManager.reportNewHandler(plugin, new EventHandlerRef(plugin, this, id))
        })
    }

    unsubscribe(...uids: EventHandlerUID[]) {
        this.handlers = this.handlers.filter(it => uids.indexOf(it.uid) === -1)
    }

    async call(source: Sender, args: EventArg): Promise<EventArg> {
        for (const i of this.handlers) {
            await i.invoke(args, source)
        }

        return args
    }

    private assignUID(plugin: BotePluginModule): EventHandlerUID {
        const uid: EventHandlerUID = `${plugin.plugin.name}:${(Math.random() * 100000000) ^ Date.now() << 5}`
        if (this.handlers.some(it => it.uid === uid)) {
            return this.assignUID(plugin)
        }
        return uid
    }
}

export class EventHandlerRef {
    public readonly uid: `${string}:${number}`
    public readonly manager: EventManager<any, any>
    public readonly plugin: BotePluginModule
    private _isRegistered = true

    constructor(plugin: BotePluginModule, manager: EventManager<any, any>, uid: `${string}:${number}`) {
        this.plugin = plugin
        this.manager = manager
        this.uid = uid
    }

    unsubscribe() {
        this.manager.unsubscribe(this.uid)
        this._isRegistered = false
    }

    get isRegistered() {
        return this._isRegistered
    }
}

export class CancelableEvent {
    cancelled: boolean = false

    cancel(): void {
        this.cancelled = true
    }
}