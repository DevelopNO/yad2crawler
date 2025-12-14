'use client';

import { useEffect, useState } from 'react';
import ky from 'ky';
import { Listing } from '@prisma/client';
import { ListingCard } from '@/components/ListingCard';
import { Filter, RefreshCw, Loader2 } from 'lucide-react';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [showHidden, setShowHidden] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minRooms, setMinRooms] = useState<number | ''>('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (showHidden) searchParams.set('showHidden', 'true');
      if (favoritesOnly) searchParams.set('favorites', 'true');
      if (minPrice) searchParams.set('minPrice', minPrice.toString());
      if (maxPrice) searchParams.set('maxPrice', maxPrice.toString());
      if (minRooms) searchParams.set('minRooms', minRooms.toString());

      const data = await ky.get('/api/listings', { searchParams }).json<Listing[]>();
      setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [showHidden, favoritesOnly, minPrice, maxPrice, minRooms]);

  const handleUpdate = (id: string, updates: Partial<Listing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    // If we just hid it or unfavorited it, and we are filtering by that, re-fetch or filter locally
    if (updates.isHidden && !showHidden) {
      setListings(prev => prev.filter(l => l.id !== id));
    }
    if (updates.isFavorite === false && favoritesOnly) {
      setListings(prev => prev.filter(l => l.id !== id));
    }
  };

  const triggerCron = async () => {
    setRefreshing(true);
    try {
      await ky.get('/api/cron');
      await fetchListings();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-orange-600">Yad2Viewer</h1>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{listings.length} Results</span>
            </div>

            <button
              onClick={triggerCron}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh Data'}
            </button>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex flex-wrap gap-4 items-center text-sm">
            <div className="flex items-center gap-2 border-r pr-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Filters:</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-white border px-3 py-1.5 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={e => setFavoritesOnly(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>Favorites Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-white border px-3 py-1.5 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={e => setShowHidden(e.target.checked)}
                className="text-gray-400 focus:ring-gray-500"
              />
              <span className="text-gray-600">Show Hidden</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-2 py-1.5 border rounded-md text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-2 py-1.5 border rounded-md text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min Rooms"
                value={minRooms}
                onChange={e => setMinRooms(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-2 py-1.5 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading && listings.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onUpdate={handleUpdate} />
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No listings found. Try adjusting filters or refreshing data.
          </div>
        )}
      </main>
    </div>
  );
}
