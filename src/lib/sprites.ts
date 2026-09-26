// URLs de sprites de Showdown. Puro, se usa en servidor y cliente.
// URL final = {base}{carpeta}/{spriteId}.{ext}
// Si una variante no existe, <Sprite> prueba la siguiente de la lista.

export const DEFAULT_SPRITES_BASE_URL = "https://play.pokemonshowdown.com/sprites/";

export function spriteCandidates(
  base: string,
  spriteId: string,
  opts: { shiny?: boolean; animated?: boolean } = {},
): string[] {
  const b = base.endsWith("/") ? base : `${base}/`;
  const s = opts.shiny ? "-shiny" : "";
  const list = [
    `${b}gen5${s}/${spriteId}.png`,
    `${b}dex${s}/${spriteId}.png`,
  ];
  if (opts.animated) list.unshift(`${b}ani${s}/${spriteId}.gif`);
  // Último recurso: versión normal si la shiny no existe
  if (opts.shiny) list.push(`${b}gen5/${spriteId}.png`);
  return list;
}

/** ID de sprite de Showdown: baseSpecies + "-" + forma. Ej. "charizard-megax", "urshifu-rapidstrike". */
export function toSpriteId(baseSpecies: string, name: string, forme: string): string {
  const id = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return baseSpecies !== name && forme ? `${id(baseSpecies)}-${id(forme)}` : id(baseSpecies);
}
