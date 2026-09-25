import type { HazardTypeMeta } from './types';

// Client-side mirror of the backend registry (jj_devops/gis/app/hazard_types.py).
// Used as a fallback when the /api/hazard-types/ endpoint is unreachable so the
// map never loses its colors. Auto-fallback colors match the backend palette so
// a type that is not registered anywhere still gets a stable, distinct color.
const FALLBACK_REGISTRY: Record<string, HazardTypeMeta> = {
  pothole: { type: 'pothole', label: 'Pothole', color_rgb: [220, 38, 38], color_hex: '#dc2626', radius: 4 },
  crack: { type: 'crack', label: 'Crack', color_rgb: [249, 115, 22], color_hex: '#ea580c', radius: 3 },
  garbage_dump: { type: 'garbage_dump', label: 'Garbage Dump', color_rgb: [147, 51, 234], color_hex: '#9333ea', radius: 6 },
  waterlogging: { type: 'waterlogging', label: 'Waterlogging', color_rgb: [2, 132, 199], color_hex: '#0284c7', radius: 5 },
  sign_damage: { type: 'sign_damage', label: 'Sign Damage', color_rgb: [5, 150, 105], color_hex: '#059669', radius: 4 },
  vehicle_count: { type: 'vehicle_count', label: 'Vehicle Count', color_rgb: [109, 40, 217], color_hex: '#6d28d9', radius: 3 },
  school_children: { type: 'school_children', label: 'School Children', color_rgb: [217, 119, 6], color_hex: '#d97706', radius: 5 },
  incident_anpr: { type: 'incident_anpr', label: 'Incident (ANPR)', color_rgb: [190, 18, 60], color_hex: '#be123c', radius: 6 },
};

// Same palette as the backend _AUTO_PALETTE, so fallback colors are stable and
// consistent across server and client.
const AUTO_PALETTE: [number, number, number][] = [
  [37, 99, 235],
  [22, 163, 74],
  [202, 138, 4],
  [13, 148, 136],
  [225, 29, 72],
  [124, 58, 237],
  [224, 242, 254],
  [234, 88, 12],
  [76, 29, 149],
  [20, 184, 166],
  [192, 132, 252],
  [100, 116, 139],
];

const FALLBACK_RADIUS = 3;

function stableIndex(typeName: string): number {
  let total = 0;
  for (const ch of typeName) {
    total = (total * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  }
  return total % AUTO_PALETTE.length;
}

function autoStyle(type: string): HazardTypeMeta {
  const rgb = AUTO_PALETTE[stableIndex(type)];
  const hex = `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return {
    type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    color_rgb: rgb,
    color_hex: hex,
    radius: FALLBACK_RADIUS,
  };
}

export function getHazardStyle(type: string | undefined, registry: Record<string, HazardTypeMeta>): HazardTypeMeta {
  const key = (type || 'unknown').toLowerCase();
  return registry[key] || autoStyle(key);
}

export async function fetchHazardTypes(apiBase: string): Promise<Record<string, HazardTypeMeta>> {
  try {
    const res = await fetch(`${apiBase}/api/hazard-types/`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json: unknown = await res.json();
    if (!json || typeof json !== 'object') return { ...FALLBACK_REGISTRY };
    const normalized: Record<string, HazardTypeMeta> = {};
    for (const [key, value] of Object.entries(json as Record<string, Partial<HazardTypeMeta>>)) {
      normalized[key] = {
        type: key,
        label: value.label || key.replace(/_/g, ' '),
        color_rgb: (value.color_rgb as [number, number, number]) || [148, 163, 184],
        color_hex: value.color_hex || '#94a3b8',
        radius: typeof value.radius === 'number' ? value.radius : FALLBACK_RADIUS,
      };
    }
    return Object.keys(normalized).length ? normalized : { ...FALLBACK_REGISTRY };
  } catch (err) {
    console.error('Failed to fetch hazard types.', err);
    return { ...FALLBACK_REGISTRY };
  }
}