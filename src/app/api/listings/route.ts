import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const showHidden = searchParams.get('showHidden') === 'true';
    const showFavoritesOnly = searchParams.get('favorites') === 'true';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minRooms = searchParams.get('minRooms') ? Number(searchParams.get('minRooms')) : undefined;
    const maxRooms = searchParams.get('maxRooms') ? Number(searchParams.get('maxRooms')) : undefined;

    const where: any = {};

    if (!showHidden) {
        where.isHidden = false;
    }

    if (showFavoritesOnly) {
        where.isFavorite = true;
    }

    if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };

    if (minRooms !== undefined) where.rooms = { ...where.rooms, gte: minRooms };
    if (maxRooms !== undefined) where.rooms = { ...where.rooms, lte: maxRooms };

    const listings = await prisma.listing.findMany({
        where,
        orderBy: [
            { isFavorite: 'desc' }, // Favorites first
            { firstSeenAt: 'desc' } // Newest first
        ]
    });

    return NextResponse.json(listings);
}
