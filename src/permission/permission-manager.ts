import mongoose from 'mongoose'

export interface IPermissionManager {
    check(userIdentifier: string, node: string): boolean
    grant(userIdentifier: string, node: string): void
    revoke(userIdentifier: string, node: string): void
    list(userIdentifier: string): string[]
    save(): Promise<void>
    sync(): Promise<void>
    diff(): number | null
}

const Permissions = mongoose.model("userpermissions", new mongoose.Schema({
    userId: String,
    permissions: [String]
}))

export class BotePermissionManagerImpl implements IPermissionManager {
    private userPermissionsCache: { [key: string]: string[] } = {}
    private delta: string[] = []
    private creations: string[] = []
    private defaultPermissions: string[]

    constructor(defaultPermissions: string[] = []) {
        this.defaultPermissions = defaultPermissions
    }

    check(userIdentifier: string, node: string): boolean {
        if (userIdentifier in this.userPermissionsCache) {
            for (const i of this.userPermissionsCache[userIdentifier]) {
                const check = node.split(".")
                const own = i.split(".")
        
                for (let i = 0; i < Math.min(check.length, own.length); i ++) {
                    if (i >= check.length || i >= own.length) {
                        return false
                    }
        
                    if (own[i] === "*") {
                        return true
                    }
        
                    if (check[i] !== own[i]) {
                        return false
                    }
                }
        
                return true
            }
            return false
        } else {
            this.creations.push(userIdentifier)
            this.userPermissionsCache[userIdentifier] = this.defaultPermissions
            return this.check(userIdentifier, node)
        }
    }

    grant(userIdentifier: string, node: string): void {
        if (!(userIdentifier in this.userPermissionsCache)) {
            this.creations.push(userIdentifier)
            this.userPermissionsCache[userIdentifier] = this.defaultPermissions
            return this.grant(userIdentifier, node)
        }

        this.userPermissionsCache[userIdentifier].push(node)
        this.delta.push(userIdentifier)
    }

    revoke(userIdentifier: string, node: string): void {
        if (!(userIdentifier in this.userPermissionsCache)) {
            this.creations.push(userIdentifier)
            this.userPermissionsCache[userIdentifier] = this.defaultPermissions
            return this.revoke(userIdentifier, node)
        }

        this.userPermissionsCache[userIdentifier] = this.userPermissionsCache[userIdentifier].filter(it => it !== node)
        this.delta.push(userIdentifier)    
    }

    list(userIdentifier: string): string[] {
        return this.userPermissionsCache[userIdentifier] ?? this.defaultPermissions
    }

    async save(): Promise<void> {
        for (const i of this.creations) {
            await (new Permissions({ userId: i, permissions: this.userPermissionsCache[i] })).save()
        }
    }

    async sync(): Promise<void> {   
        for (const i of new Set(this.delta)) {
            await Permissions.updateOne({ userId: i }, { $set: { permissions: this.userPermissionsCache[i] } })
        }

        (await Permissions.find({})).forEach(it => {
            this.userPermissionsCache[it.userId!] = Array.from(it.permissions.values())
        })
    }

    diff() {
        return this.delta.length
    }
}