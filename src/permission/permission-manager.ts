import mongoose from 'mongoose'
import { Logging } from '../logging'
import { BoteCommandContext } from '../command/command-telegraf-middleware'

export interface PermissionManager {
    rejectAction(ctx: BoteCommandContext): Promise<boolean>
    checkPermission(ctx: BoteCommandContext, node: string): Promise<boolean>
    grant(ctx: BoteCommandContext, node: string): Promise<void>
    revoke(ctx: BoteCommandContext, node: string): Promise<void>
}

export class PermissionManagerDefaultImpl {
    private static readonly PermissionsDB = mongoose.model("permissions", new mongoose.Schema({
        group: Number,
        uid: Number,
        node: String,
        expire: Number
    }))

    async rejectAction(ctx: BoteCommandContext): Promise<boolean> {
        const perm = await PermissionManagerDefaultImpl.PermissionsDB.findOne({ 
            group: ctx.ctx.chat.id, 
            uid: ctx.ctx.from.id, 
            node: `${ctx.command}.deny`, 
            expire: {
                $gt: Date.now()
            }
        })
        return !Boolean(perm)
    }

    async checkPermission(ctx: BoteCommandContext, node: string): Promise<boolean> {
        const perms = await PermissionManagerDefaultImpl.PermissionsDB.find({ 
            group: ctx.ctx.chat.id, uid: ctx.ctx.from.id, 
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
        const perm = await PermissionManagerDefaultImpl.PermissionsDB.findOne({ group: ctx.ctx.chat.id, uid: ctx.ctx.from.id, node })
        if (perm) {
            perm.expire = 0
            await perm.save()
        } else {
            await new PermissionManagerDefaultImpl.PermissionsDB({ group: ctx.ctx.chat.id, uid: ctx.ctx.from.id, node, expire: 0 }).save()
        }
    }

    async revoke(ctx: BoteCommandContext, node: string): Promise<void> {
        const perm = await PermissionManagerDefaultImpl.PermissionsDB.findOne({ group: ctx.ctx.chat.id, uid: ctx.ctx.from.id, node })
        if (perm) {
            perm.expire = Date.now()
            await perm.save()
        }
    }
}