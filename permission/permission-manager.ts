import mongoose from 'mongoose'
import Logging from '../logging'

export interface IPermissionManager {
    check(userIdentifier: string, node: string): Promise<boolean>
    grant(userIdentifier: string, node: string): Promise<void>
    revoke(userIdentifier: string, node: string): Promise<void>
    list(userIdentifier: string): Promise<string[]>
    save(): Promise<void>
    sync(): Promise<void>
}

const Permissions = mongoose.model("userpermissions", new mongoose.Schema({
    userId: String,
    permissions: [String]
}))

export class BotePermissionManagerImpl implements IPermissionManager {
    private defaultPermissions: string[]

    constructor(defaultPermissions: string[] = []) {
        this.defaultPermissions = defaultPermissions
    }

    async check(userIdentifier: string, node: string): Promise<boolean> {
        const user = await this.getUser(userIdentifier)
        for (const i of user.permissions) {
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
    }

    async grant(userIdentifier: string, node: string): Promise<void> {
        if (!(await this.exist(userIdentifier))) {
            await new Permissions({ userId: userIdentifier, permissions: this.defaultPermissions }).save()
        }
    
        await Permissions.updateOne({ userId: userIdentifier }, { 
            $push: {
                permissions: node
            }
        })
    }

    async revoke(userIdentifier: string, node: string): Promise<void> {
        if (!(await this.exist(userIdentifier))) {
            await new Permissions({ userId: userIdentifier, permissions: this.defaultPermissions }).save()
        }
    
        await Permissions.updateOne({ userId: userIdentifier }, { 
            $pull: {
                permissions: node
            }
        })
    }

    async list(userIdentifier: string): Promise<string[]> {
        const user = await this.getUser(userIdentifier)

        return user.permissions
    }

    async save(): Promise<void> { }

    async sync(): Promise<void> { }

    async getUser(uid: string) {
        let r = await Permissions.findOne({ userId: uid})
        if (r) {
            return r
        }

        r = new Permissions({ userId: uid, permissions: this.defaultPermissions })
        await r.save()

        return r
    }

    async exist(uid: string) {
        return (await Permissions.count({ userId: uid })) > 0
    }
}