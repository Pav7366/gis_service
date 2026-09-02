import React, { useRef } from 'react';
import { Image as ImageIcon, Sparkles, Sliders, Upload, Check } from 'lucide-react';
import { BACKGROUND_PRESETS } from '../data/backgrounds';

interface BackgroundCustomizerProps {
  currentBgUrl: string;
  onSelectBg: (url: string) => void;
  overlayDarkness: number;
  onOverlayChange: (val: number) => void;
  blurAmount: number;
  onBlurChange: (val: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  currentBgUrl,
  onSelectBg,
  overlayDarkness,
  onOverlayChange,
  blurAmount,
  onBlurChange,
  isOpen,
  onToggle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectBg(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        id="bg-settings-toggle-btn"
        onClick={onToggle}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium transition-all shadow-lg hover:scale-105"
        title="Background & Scenic View Controls"
      >
        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Scenic Background</span>
        <Sliders className="w-3.5 h-3.5 opacity-70" />
      </button>

      {isOpen && (
        <div
          id="bg-settings-panel"
          className="absolute right-0 top-12 w-80 bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl z-50 text-white space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Background & Ambiance</span>
            </div>
            <button
              type="button"
              id="bg-settings-close-btn"
              onClick={onToggle}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-300">Scenic Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_PRESETS.map((preset) => {
                const isSelected = currentBgUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectBg(preset.url)}
                    className={`relative rounded-lg overflow-hidden h-14 border transition-all text-left group ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                        : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-medium leading-tight line-clamp-1 text-white">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              id="bg-upload-custom-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-medium transition text-slate-200 hover:text-white"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Photo</span>
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Overlay Shading</span>
                <span>{Math.round(overlayDarkness * 100)}%</span>
              </div>
              <input
                id="overlay-slider"
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={overlayDarkness}
                onChange={(e) => onOverlayChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Background Blur</span>
                <span>{blurAmount}px</span>
              </div>
              <input
                id="blur-slider"
                type="range"
                min="0"
                max="12"
                step="1"
                value={blurAmount}
                onChange={(e) => onBlurChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
