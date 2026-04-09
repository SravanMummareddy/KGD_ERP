'use client'

import { useTransition } from 'react'
import { toggleUserActive } from '@/actions/users'
import { useToast } from '@/components/ui/ToastProvider'

export default function ToggleActiveButton({
    userId,
    isActive,
    userName,
}: {
    userId: string
    isActive: boolean
    userName: string
}) {
    const [isPending, startTransition] = useTransition()
    const { addToast } = useToast()

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleUserActive(userId, isActive)
            if (result?.error) {
                addToast('error', result.error)
            } else {
                addToast('success', isActive ? `${userName} deactivated` : `${userName} activated`)
            }
        })
    }

    return (
        <button
            type="button"
            className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleToggle}
            disabled={isPending}
        >
            {isPending ? '…' : isActive ? 'Deactivate' : 'Activate'}
        </button>
    )
}
