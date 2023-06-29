import { MaybePromise } from '.'

export type EventHandlerFn<EventArg, Sender> = (args: EventArg, sender: Sender) => MaybePromise<void>
export class EventHandler<EventArg, Sender> {
    fn: EventHandlerFn<EventArg, Sender>
    uid: number
    priority: number

    constructor(fn: EventHandlerFn<EventArg, Sender>, uid: number, priority: number = 10) {
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

export class EventManager<EventArg, Sender> {
    private handlers: EventHandler<EventArg, Sender>[] = []

    subscribe(...fns: EventHandlerFn<EventArg, Sender>[]) {
        const id = this.assignUID()
        this.handlers.push(...fns.map((it, i) => new EventHandler(it, id, 10 + i)))
        return id
    }

    subscribePrior(priority: number, ...fns: EventHandlerFn<EventArg, Sender>[]) {
        const id = this.assignUID()
        this.handlers.push(...fns.map((it, i) => new EventHandler(it, id, priority + i)))
        return id
    }

    unsubscribe(...uids: number[]) {
        this.handlers = this.handlers.filter(it => uids.indexOf(it.uid) === -1)
    }

    async call(source: Sender, args: EventArg): Promise<EventArg> {
        for (const i of this.handlers) {
            await i.invoke(args, source)
        }

        return args
    }

    private assignUID(): number {
        const uid = (Math.random() * 100000000) ^ Date.now() << 5
        if (this.handlers.some(it => it.uid === uid)) {
            return this.assignUID()
        }
        return uid
    }
}