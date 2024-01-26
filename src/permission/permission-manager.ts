import mongoose from 'mongoose'
import { BoteCommandContext } from '../command/controller'

export interface PermissionManager {
    rejectAction(ctx: BoteCommandContext): Promise<boolean>
    checkPermission(ctx: BoteCommandContext, node: string): Promise<boolean>
    grant(ctx: BoteCommandContext, node: string): Promise<void>
    revoke(ctx: BoteCommandContext, node: string): Promise<void>
}

export class PermissionManagerDefaultImpl implements PermissionManager {
    private readonly PermissionsDB = mongoose.model("permissions", new mongoose.Schema({
        group: Number,
        uid: Number,
        node: String,
        expire: Number
    }))

    async rejectAction(ctx: BoteCommandContext): Promise<boolean> {
        const perm = await this.PermissionsDB.findOne({ 
            group: ctx.chat.id, 
            uid: ctx.sender.id,
            node: `${ctx.command}.deny`, 
            expire: {
                $gt: Date.now()
            }
        })
        return Boolean(perm)
    }

    async checkPermission(ctx: BoteCommandContext, node: string): Promise<boolean> {
        const perms = await this.PermissionsDB.find({ 
            group: ctx.chat.id, uid: ctx.sender.id, 
            expire: {
                $gt: Date.now()
            }
        })        
        
        const perm = perms.find(it => this.genericTestPermission(it.node!, node))
        return Boolean(perm)
    }

    private genericTestPermission(source: string, target: string) {
        if (source === "*") {
            return true
        }

        if (source.indexOf("*") === -1) { 
            return source === target
        }

        const fixedParts = source.substring(0, source.indexOf("*") - 1)

        return target.startsWith(fixedParts)
    }

    async grant(ctx: BoteCommandContext, node: string): Promise<void> {
        const perm = await this.PermissionsDB.findOne({ group: ctx.chat.id, uid: ctx.sender.id, node })
        if (perm) {
            perm.expire = 0
            await perm.save()
        } else {
            await new this.PermissionsDB({ group: ctx.chat.id, uid: ctx.sender.id, node, expire: 0 }).save()
        }
    }

    async grantManually(group: number, uid: number, node: string): Promise<void> {
        const perm = await this.PermissionsDB.findOne({ group, uid, node })
        if (perm) {
            perm.expire = 0
            await perm.save()
        } else {
            await new this.PermissionsDB({ group, uid, node, expire: 0 }).save()
        }
    }

    async revoke(ctx: BoteCommandContext, node: string): Promise<void> {
        const perm = await this.PermissionsDB.findOne({ group: ctx.chat.id, uid: ctx.sender.id, node })
        if (perm) {
            perm.expire = Date.now()
            await perm.save()
        }
    }

    async revokeManually(group: number, uid: number, node: string): Promise<void> {
        const perm = await this.PermissionsDB.findOne({ group, uid, node })
        if (perm) {
            perm.expire = Date.now()
            await perm.save()
        }
    }
}

export class VoidPermissionManagerImpl implements PermissionManager {
    async rejectAction(ctx: BoteCommandContext): Promise<boolean> {
        return false
    }
    
    async checkPermission(ctx: BoteCommandContext, node: string): Promise<boolean> {
        return true
    }
    
    async grant(ctx: BoteCommandContext, node: string): Promise<void> { }
    async revoke(ctx: BoteCommandContext, node: string): Promise<void> { }
}