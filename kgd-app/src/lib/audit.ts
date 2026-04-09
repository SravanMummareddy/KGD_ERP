import { prisma } from './prisma'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'CANCEL'

interface AuditOptions {
    entity: string
    entityId: string
    action: AuditAction
    performedBy: string
    oldValues?: Record<string, unknown>
    newValues?: Record<string, unknown>
    ip?: string
}

/**
 * Write an audit log entry.
 * Call this after successful data mutations on key entities.
 */
export async function writeAuditLog(opts: AuditOptions): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                entity: opts.entity,
                entityId: opts.entityId,
                action: opts.action,
                oldValues: opts.oldValues ?? undefined,
                newValues: opts.newValues ?? undefined,
                performedBy: opts.performedBy,
                ip: opts.ip ?? null,
            },
        })
    } catch (err) {
        // Audit failures should never crash the main operation
        console.error('[AuditLog] Failed to write audit log:', err)
    }
}
