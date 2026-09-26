// Presentación de datos Pokémon (colores/nombres de tipos, barra de PS). Puro.

export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fire: "#e62829", Water: "#2980ef", Electric: "#fac000", Grass: "#3fa129",
  Ice: "#3dcef3", Fighting: "#ff8000", Poison: "#9141cb", Ground: "#915121", Flying: "#81b9ef",
  Psychic: "#ef4179", Bug: "#91a119", Rock: "#afa981", Ghost: "#704170", Dragon: "#5060e1",
  Dark: "#624d4e", Steel: "#60a1b8", Fairy: "#ef70ef", Stellar: "#40b5a5",
};

export const TYPE_ES: Record<string, string> = {
  Normal: "Normal", Fire: "Fuego", Water: "Agua", Electric: "Eléctrico", Grass: "Planta",
  Ice: "Hielo", Fighting: "Lucha", Poison: "Veneno", Ground: "Tierra", Flying: "Volador",
  Psychic: "Psíquico", Bug: "Bicho", Rock: "Roca", Ghost: "Fantasma", Dragon: "Dragón",
  Dark: "Siniestro", Steel: "Acero", Fairy: "Hada", Stellar: "Astral",
};

export const hpPercent = (current: number, max: number) =>
  max ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;

export function hpColor(current: number, max: number): string {
  const r = max ? current / max : 0;
  if (r > 0.5) return "var(--color-ok)";
  if (r > 0.2) return "var(--color-warn)";
  return "var(--color-bad)";
}
