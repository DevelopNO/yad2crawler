
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const url = process.env.POSTGRES_PRISMA_URL;
    const directUrl = process.env.POSTGRES_URL_NON_POOLING;

    const allKeys = Object.keys(process.env).filter(key => key.startsWith('POSTGRES') || key.startsWith('DATABASE'));

    return NextResponse.json({
        hasUrl: !!url,
        urlLength: url?.length,
        urlStart: url ? url.substring(0, 10) + '...' : null,
        hasDirectUrl: !!directUrl,
        visibleKeys: allKeys
    });
}
