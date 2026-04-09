'use client'

import { useTransition } from 'react'
import { useToast } from './ToastProvider'

interface RestoreButtonProps {
    action: () => Promise<{ error?: string }>
    label?: string
}

export default function RestoreButton({ action, label = 'Restore' }: RestoreButtonProps) {
    const [isPending, startTransition] = useTransition()
    const { addToast } = useToast()

    const handleRestore = () => {
        startTransition(async () => {
            const result = await action()
            if (result?.error) {
                addToast('error', result.error)
            } else {
                addToast('success', 'Restored successfully')
            }
        })
    }

    return (
        <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRestore}
            disabled={isPending}
        >
            {isPending ? 'Restoring…' : label}
        </button>
    )
}
