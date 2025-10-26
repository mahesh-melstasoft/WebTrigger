import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const authResult = await authMiddleware(request)
        if (!authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, callbackUrl } = body

        if (!name || !callbackUrl) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const created = await prisma.callback.create({
            data: {
                name,
                callbackUrl,
                userId: authResult.user.id,
            },
        })

        return NextResponse.json({ ok: true, id: created.id })
    } catch (err) {
        console.error('Error creating trigger:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
