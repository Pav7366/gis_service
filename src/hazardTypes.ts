import type { HazardTypeMeta } from './types';

// There is deliberately no hardcoded type list here.
//
// The set of hazard types is not fixed: a fired rule broadcasts its own
// `event_type` verbatim, so adding/renaming/removing a rule YAML changes the
// types that exist. The only authority on which types are real is the backend
// (`/api/hazard-types/`, which merges the GIS registry with the distinct `type`
// values actually stored in the `events` table).
//
// So the registry starts EMPTY and is populated from the backend, plus whatever
// the live feed contains. Anything still unknown is styled on demand by
// `autoStyle` below, which is deterministic per type name -- so a brand-new rule
// type is visible and keeps a stable color without anyone registering it.
//
// An empty registry is a valid, correct state (backend up, nothing seen yet) and
// renders as an empty legend rather than inventing types that may not exist.

// Unregistered type names get a color derived procedurally from their name, the
// same way the backend does it (gis/app/hazard_types.py), so server and client
// agree on a type's color without either holding a shared list.
//
// A fixed palette would put a hard ceiling on the number of distinct types: with
// dynamic rules every rule contributes its own `event_type`, so beyond the
// palette size two different types would be forced to share a color. Instead we
// step around the hue circle by the golden angle (137.508 deg) -- the
// maximal-separation sequence -- giving an effectively unbounded space.
const GOLDEN_ANGLE = 137.508;
const SATURATIONS = [68, 78, 58, 88];
const LIGHTNESSES = [46, 56, 38];

const FALLBACK_RADIUS = 3;

function stableHash(typeName: string): number {
  let total = 0;
  for (const ch of typeName) {
    total = (total * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  }
  return total;
}

function hslToRgb(hue: number, sat: number, light: number): [number, number, number] {
  const h = (hue % 360) / 360;
  const s = sat / 100;
  const l = light / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const channel = (t: number): number => {
    const tt = ((t % 1) + 1) % 1;
    if (tt < 1 / 6) return Math.round((p + (q - p) * 6 * tt) * 255);
    if (tt < 1 / 2) return Math.round(q * 255);
    if (tt < 2 / 3) return Math.round((p + (q - p) * (2 / 3 - tt) * 6) * 255);
    return Math.round(p * 255);
  };

  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}

function autoStyle(type: string): HazardTypeMeta {
  const hv = stableHash(type);
  const rgb = hslToRgb(
    (hv * GOLDEN_ANGLE) % 360,
    SATURATIONS[hv % SATURATIONS.length],
    LIGHTNESSES[Math.floor(hv / SATURATIONS.length) % LIGHTNESSES.length],
  );
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
    if (!json || typeof json !== 'object') return {};
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
    return normalized;
  } catch (err) {
    console.error('Failed to fetch hazard types.', err);
    return {};
  }
}
