
export async function pause(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export async function pauseRejection(ms: number, err?: Error | (new (promises: Promise<any>[]) => any)) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(err), ms)
    })
}

export class PromiseTimeout <T>  extends Error {
    promises: Promise<T>[]

    constructor(promises: Promise<T>[]) {
        super("Promise(s) timeout")

        this.promises = promises
    }
}

export async function timeout <T> (promises: Promise<T>[] | Promise<T>, ms: number) {
    return Promise.race([Promise.all(('length' in promises) ? promises : [promises]), pauseRejection(ms, PromiseTimeout)])
}