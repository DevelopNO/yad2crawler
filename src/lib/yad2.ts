
import ky from 'ky';
import { prisma } from './prisma';

interface Yad2Response {
    data: {
        markers: Yad2Marker[];
    };
}

interface Yad2Marker {
    token: string;
    orderId: number;
    price: number;
    address: {
        city: { text: string };
        neighborhood: { text: string };
        area: { text: string };
        street: { text: string };
        house: { number: number; floor: number };
        coords: { lon: number; lat: number };
    };
    additionalDetails: {
        property: { text: string };
        roomsCount: number;
        squareMeter: number;
    };
    metaData: {
        coverImage: string;
        images: string[];
        squareMeterBuild: number;
    };
}

export async function fetchYad2Listings() {
    const url = 'https://gw.yad2.co.il/realestate-feed/forsale/map?city=0831&area=89&topArea=43&minRooms=3&maxRooms=3&zoom=12';

    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
        'Origin': 'https://www.yad2.co.il',
        'Referer': 'https://www.yad2.co.il/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
    };

    try {
        const response = await ky.get(url, { headers }).json<Yad2Response>();
        const markers = response.data.markers;

        console.log(`Fetched ${markers.length} listings from Yad2`);

        for (const marker of markers) {
            await prisma.listing.upsert({
                where: { id: marker.token },
                update: {
                    lastSeenAt: new Date(),
                    price: marker.price,
                    // Update other mutable fields if needed
                },
                create: {
                    id: marker.token,
                    yad2Id: marker.orderId,
                    price: marker.price,
                    city: marker.address.city.text,
                    neighborhood: marker.address.neighborhood?.text,
                    area: marker.address.area?.text,
                    street: marker.address.street?.text,
                    houseNumber: marker.address.house?.number,
                    floor: marker.address.house?.floor,
                    rooms: marker.additionalDetails.roomsCount,
                    squareMeters: marker.additionalDetails.squareMeter || marker.metaData.squareMeterBuild,
                    propertyType: marker.additionalDetails.property?.text,
                    coverImage: marker.metaData.coverImage,
                    images: JSON.stringify(marker.metaData.images || []),
                    lat: marker.address.coords.lat,
                    lon: marker.address.coords.lon,
                    rawData: JSON.stringify(marker),
                    firstSeenAt: new Date(),
                    lastSeenAt: new Date(),
                }
            });
        }

        await prisma.syncLog.create({
            data: {
                status: 'SUCCESS',
                itemsCount: markers.length,
                message: 'Successfully updated listings',
            }
        });

        return { success: true, count: markers.length };

    } catch (error: any) {
        console.error('Error fetching Yad2 listings:', error);
        await prisma.syncLog.create({
            data: {
                status: 'FAILURE',
                message: error.message || 'Unknown error',
            }
        });
        throw error;
    }
}
