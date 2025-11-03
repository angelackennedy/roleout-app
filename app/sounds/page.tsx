'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

type Sound = {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
  duration_seconds: number | null;
  created_at: string;
};

export default function SoundsPage() {
  const { user } = useAuth();
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSounds();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSounds(sounds);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSounds(
        sounds.filter(
          (sound) =>
            sound.title.toLowerCase().includes(query) ||
            sound.artist?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, sounds]);

  const fetchSounds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sounds:', error);
      } else {
        setSounds(data || []);
        setFilteredSounds(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const playSound = (sound: Sound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sound.file_url;
        audioRef.current.play();
        setPlayingId(sound.id);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Sound Library</h1>
            <Link href="/" className="text-yellow-500 hover:text-yellow-400 text-sm underline">
              ← Back to Home
            </Link>
          </div>

          {user && (
            <Link
              href="/sounds/upload"
              className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition"
            >
              Upload Sound
            </Link>
          )}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading sounds...</div>
          </div>
        ) : filteredSounds.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🎵</div>
            <div className="text-xl">
              {searchQuery ? 'No sounds found' : 'No sounds in library yet'}
            </div>
            {!searchQuery && user && (
              <Link
                href="/sounds/upload"
                className="inline-block mt-4 text-yellow-500 hover:text-yellow-400 underline"
              >
                Upload the first sound
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSounds.map((sound) => (
              <div
                key={sound.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {sound.title}
                    </h3>
                    {sound.artist && (
                      <p className="text-sm text-gray-400 truncate">
                        {sound.artist}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => playSound(sound)}
                    className={`ml-2 w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                      playingId === sound.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {playingId === sound.id ? '⏸' : '▶'}
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(sound.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
