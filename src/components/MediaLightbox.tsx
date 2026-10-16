import React from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasMultiple?: boolean;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  caption,
  onNext,
  onPrev,
  hasMultiple,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* BOTÃO FECHAR */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* NAVEGAÇÃO ANTERIOR */}
      {hasMultiple && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* NAVEGAÇÃO PRÓXIMA */}
      {hasMultiple && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* CONTEÚDO */}
      <div className="max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
        {mediaType === 'video' ? (
          mediaUrl && mediaUrl.trim() !== '' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
            />
          ) : null
        ) : mediaUrl && mediaUrl.trim() !== '' ? (
          <img
            src={mediaUrl}
            alt={caption || 'Mídia da Irmandade'}
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/escudo_oficial.jpg';
            }}
          />
        ) : null}

        {caption && (
          <p className="mt-3 text-white/90 text-sm font-medium text-center bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
