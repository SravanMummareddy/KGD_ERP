/**
 * Format a number as Indian Rupees (₹)
 * e.g. 12500 → "₹12,500.00"
 */
export function formatCurrency(amount: number | string | { toString(): string }): string {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount))
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(num)
}

/**
 * Format a date as DD/MM/YYYY (standard Indian business format)
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d)
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d)
}

/**
 * Generate a sequential invoice number
 * Format: KGD-YYYY-NNNN (e.g. KGD-2024-0001)
 */
export function generateInvoiceNumber(year: number, sequence: number): string {
    return `KGD-${year}-${String(sequence).padStart(4, '0')}`
}

/**
 * Safely convert Prisma Decimal to JS number for display
 */
export function toNumber(val: unknown): number {
    if (val == null) return 0
    return Number(val)
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

/**
 * Map payment method enum to human-readable label
 */
export function paymentMethodLabel(method: string): string {
    const map: Record<string, string> = {
        CASH: 'Cash',
        UPI: 'UPI',
        BANK_TRANSFER: 'Bank Transfer',
        CHEQUE: 'Cheque',
        OTHER: 'Other',
    }
    return map[method] ?? method
}

/**
 * Map invoice status enum to human-readable label and color class
 */
export function invoiceStatusInfo(status: string): { label: string; color: string } {
    const map: Record<string, { label: string; color: string }> = {
        UNPAID: { label: 'Unpaid', color: 'badge-red' },
        PARTIAL: { label: 'Partial', color: 'badge-amber' },
        PAID: { label: 'Paid', color: 'badge-green' },
        CANCELLED: { label: 'Cancelled', color: 'badge-gray' },
    }
    return map[status] ?? { label: status, color: 'badge-gray' }
}
