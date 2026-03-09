import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="app-shell">
            <Sidebar
                userName={session.user.name}
                userRole={session.user.role}
            />
            <div className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    )
}
