import React from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Photo } from '../types';

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
}) => {
  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex + 1) % photos.length);
  };

  return (
    <div
      id="photo-lightbox-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* Header buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <span className="text-xs font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          id="close-lightbox-btn"
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition"
          aria-label="Zavřít fotografii"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image View */}
      <div
        className="relative max-w-4xl max-h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.dataUrl}
          alt={`Dead drop foto ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl border border-zinc-800"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-lg backdrop-blur-sm -translate-x-2 transition"
              aria-label="Předchozí fotografie"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-lg backdrop-blur-sm translate-x-2 transition"
              aria-label="Další fotografie"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {photos.length > 1 && (
        <div
          className="flex items-center gap-2 mt-4 overflow-x-auto p-1"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => onSelectIndex(idx)}
              className={`w-14 h-14 rounded-md overflow-hidden border-2 transition ${
                currentIndex === idx
                  ? 'border-emerald-500 scale-105 ring-2 ring-emerald-500/20'
                  : 'border-zinc-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
