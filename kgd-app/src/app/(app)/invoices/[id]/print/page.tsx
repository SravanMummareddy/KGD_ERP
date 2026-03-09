import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            customer: { include: { contacts: { where: { isPrimary: true }, take: 1 } } },
            items: { orderBy: { sortOrder: 'asc' } },
        },
    })

    if (!invoice) notFound()

    type PrintItemRow = typeof invoice.items[number]

    const contact = invoice.customer.contacts[0]

    return (
        <>
            <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .print-page { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 24px; max-width: 700px; margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 16px; }
          .brand { font-size: 22px; font-weight: 800; letter-spacing: -1px; }
          .brand span { color: #1d4ed8; }
          .meta { text-align: right; }
          .inv-no { font-size: 16px; font-weight: 700; }
          .section { margin-bottom: 16px; }
          .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #666; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th { background: #f1f5f9; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; }
          td { padding: 7px 8px; border: 1px solid #e2e8f0; vertical-align: middle; }
          .num { text-align: right; font-variant-numeric: tabular-nums; }
          .totals { float: right; min-width: 240px; margin-top: 8px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .totals-row.balance { font-size: 15px; font-weight: 800; border-top: 2px solid #111; margin-top: 4px; padding-top: 6px; color: #dc2626; }
          .footer { text-align: center; font-size: 11px; color: #666; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            .print-page { padding: 16px; }
            @page { margin: 1cm; }
          }
        `}</style>
            <div className="print-page">
                {/* Header */}
                <div className="header">
                    <div>
                        <div className="brand">KGD <span>Accounts</span></div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Paper Plate Manufacturing</div>
                    </div>
                    <div className="meta">
                        <div className="inv-no">{invoice.invoiceNumber}</div>
                        <div style={{ color: '#666', marginTop: 4 }}>Date: {formatDate(invoice.invoiceDate)}</div>
                        {invoice.dueDate && <div style={{ color: '#dc2626', fontSize: 11 }}>Due: {formatDate(invoice.dueDate)}</div>}
                    </div>
                </div>

                {/* Bill To */}
                <div className="section">
                    <div className="label">Bill To</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{invoice.customer.name}</div>
                    {invoice.customer.businessName && <div>{invoice.customer.businessName}</div>}
                    {invoice.customer.address && <div style={{ color: '#555' }}>{invoice.customer.address}</div>}
                    {invoice.customer.city && <div style={{ color: '#555' }}>{invoice.customer.city}</div>}
                    {contact && contact.phone && <div style={{ marginTop: 4 }}>Phone: {contact.phone} ({contact.name})</div>}
                </div>

                {/* Items */}
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Description</th>
                            <th className="num">Qty</th>
                            <th>Unit</th>
                            <th className="num">Rate (Rs)</th>
                            <th className="num">Amount (Rs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: PrintItemRow, i: number) => (
                            <tr key={item.id}>
                                <td style={{ color: '#888', width: 24 }}>{i + 1}</td>
                                <td>
                                    <div>{item.description}</div>
                                    {item.remarks && <div style={{ fontSize: 11, color: '#888' }}>{item.remarks}</div>}
                                </td>
                                <td className="num">{Number(item.quantity)}</td>
                                <td style={{ color: '#666' }}>{item.unit}</td>
                                <td className="num">{formatCurrency(item.rate)}</td>
                                <td className="num" style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="totals">
                    <div className="totals-row"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                    {Number(invoice.discountAmount) > 0 && (
                        <div className="totals-row" style={{ color: '#16a34a' }}>
                            <span>Discount</span>
                            <span>- {formatCurrency(invoice.discountAmount)}</span>
                        </div>
                    )}
                    <div className="totals-row" style={{ fontWeight: 700, borderTop: '1px solid #ccc', paddingTop: 6, marginTop: 4 }}>
                        <span>Total</span>
                        <span>{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <div className="totals-row" style={{ color: '#16a34a' }}>
                        <span>Paid</span>
                        <span>{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    {Number(invoice.balanceDue) > 0 && (
                        <div className="totals-row balance">
                            <span>Balance Due</span>
                            <span>{formatCurrency(invoice.balanceDue)}</span>
                        </div>
                    )}
                </div>

                <div style={{ clear: 'both' }} />

                {invoice.remarks && (
                    <div style={{ marginTop: 24, padding: '8px 12px', background: '#f8fafc', borderRadius: 4, borderLeft: '3px solid #e2e8f0' }}>
                        <div className="label">Remarks</div>
                        <div style={{ marginTop: 2 }}>{invoice.remarks}</div>
                    </div>
                )}

                <div className="footer">
                    Thank you for your business - KGD Paper Plate Manufacturing
                </div>

                {/* Auto-print on load */}
                <script dangerouslySetInnerHTML={{ __html: 'window.onload = () => window.print()' }} />
            </div>
        </>
    )
}
