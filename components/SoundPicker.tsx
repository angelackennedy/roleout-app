'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Sound = {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
  created_at: string;
};

type SoundPickerProps = {
  selectedSoundId: string | null;
  onSelectSound: (sound: Sound | null) => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
};

export default function SoundPicker({ 
  selectedSoundId, 
  onSelectSound,
  audioRef: externalAudioRef 
}: SoundPickerProps) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const audioRef = externalAudioRef || internalAudioRef;

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

  const playPreview = (sound: Sound, event: React.MouseEvent) => {
    event.stopPropagation();
    
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

  const handleSelectSound = (sound: Sound) => {
    if (selectedSoundId === sound.id) {
      onSelectSound(null);
    } else {
      onSelectSound(sound);
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const selectedSound = sounds.find(s => s.id === selectedSoundId);

  return (
    <div className="w-full">
      {!externalAudioRef && (
        <audio
          ref={internalAudioRef}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      <div className="mb-2">
        <label className="block text-sm font-semibold mb-2 text-white">
          Sound Track (optional)
        </label>
        
        {selectedSound ? (
          <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-yellow-500">
            <button
              type="button"
              onClick={(e) => playPreview(selectedSound, e)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                playingId === selectedSound.id
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {playingId === selectedSound.id ? '⏸' : '▶'}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{selectedSound.title}</div>
              {selectedSound.artist && (
                <div className="text-sm text-gray-400 truncate">{selectedSound.artist}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectSound(null)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-left hover:border-yellow-500 transition text-gray-400"
          >
            Click to select a sound
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Select Sound</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Search by title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading sounds...</div>
              ) : filteredSounds.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'No sounds found' : 'No sounds available'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSounds.map((sound) => (
                    <div
                      key={sound.id}
                      onClick={() => {
                        handleSelectSound(sound);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        selectedSoundId === sound.id
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <button
                        onClick={(e) => playPreview(sound, e)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                          playingId === sound.id
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {playingId === sound.id ? '⏸' : '▶'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                          {sound.title}
                        </div>
                        {sound.artist && (
                          <div className="text-sm text-gray-400 truncate">
                            {sound.artist}
                          </div>
                        )}
                      </div>
                      {selectedSoundId === sound.id && (
                        <div className="text-yellow-500 font-bold">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
