import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const json = await request.json();
    const { isFavorite, isHidden } = json;

    try {
        const listing = await prisma.listing.update({
            where: { id },
            data: {
                ...(isFavorite !== undefined && { isFavorite }),
                ...(isHidden !== undefined && { isHidden })
            }
        });
        return NextResponse.json(listing);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
