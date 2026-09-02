export interface BackgroundPreset {
  id: string;
  url: string;
  label: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "highway-sunset",
    // This is a high-quality, moody highway background similar to your screenshot
    url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop",
    label: "Highway",
  },
  {
    id: "city-night",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop",
    label: "City Night",
  }
];