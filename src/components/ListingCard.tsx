'use client';

import { Listing } from '@prisma/client';
import { Heart, EyeOff, MapPin, Home, Maximize, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import ky from 'ky';
import { useState } from 'react';

interface ListingCardProps {
    listing: Listing;
    onUpdate: (id: string, updates: Partial<Listing>) => void;
}

export function ListingCard({ listing, onUpdate }: ListingCardProps) {
    const [loading, setLoading] = useState(false);

    const toggleFavorite = async () => {
        setLoading(true);
        try {
            const updated = await ky.patch(`/api/listings/${listing.id}`, {
                json: { isFavorite: !listing.isFavorite }
            }).json<Listing>();
            onUpdate(listing.id, { isFavorite: updated.isFavorite });
        } finally {
            setLoading(false);
        }
    };

    const hideListing = async () => {
        if (!confirm('Hide this listing?')) return;
        setLoading(true);
        try {
            const updated = await ky.patch(`/api/listings/${listing.id}`, {
                json: { isHidden: true }
            }).json<Listing>();
            onUpdate(listing.id, { isHidden: true });
        } finally {
            setLoading(false);
        }
    };

    // Format price
    const price = listing.price ? `₪${listing.price.toLocaleString()}` : 'Price not listed';

    return (
        <div className={clsx("bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow", loading && "opacity-70 pointer-events-none")}>
            <div className="relative h-48 bg-gray-200">
                {listing.coverImage ? (
                    <img src={listing.coverImage} alt="Property" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={toggleFavorite}
                        className={clsx("p-2 rounded-full shadow-sm transition-colors", listing.isFavorite ? "bg-red-50 text-red-500" : "bg-white text-gray-400 hover:text-red-500")}
                    >
                        <Heart className={clsx("w-5 h-5", listing.isFavorite && "fill-current")} />
                    </button>
                    <button
                        onClick={hideListing}
                        className="p-2 rounded-full bg-white text-gray-400 shadow-sm hover:text-gray-700 transition-colors"
                    >
                        <EyeOff className="w-5 h-5" />
                    </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {new Date(listing.firstSeenAt).toLocaleDateString()}
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-900">{price}</h3>
                        {listing.yad2Id && (
                            <a href={`https://www.yad2.co.il/item/${listing.id}`} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{listing.street} {listing.houseNumber}, {listing.city}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 ml-5">
                        {listing.neighborhood}
                    </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        <span>{listing.rooms} rms</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        <span>{listing.squareMeters}m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium">Flr {listing.floor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
