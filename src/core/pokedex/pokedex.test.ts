import { describe, expect, it } from "vitest";
import { describeSet, getSpeciesInfo } from "./server";
import { formatShowdown, parseShowdown } from "./showdown";
import { spriteCandidates } from "./sprites";
import type { PokemonSetData } from "./types";

const ignis: PokemonSetData = {
  species: "charizard",
  nickname: "Ignis",
  level: 54,
  ability: "solarpower",
  item: "heavydutyboots",
  nature: "timid",
  teraType: "Fire",
  gender: "",
  shiny: false,
  moves: ["flamethrower", "airslash"],
  evs: null,
  ivs: null,
};

describe("Showdown", () => {
  it("exporta con nombres legibles", () => {
    const txt = formatShowdown([ignis]);
    for (const line of ["Ignis (Charizard) @ Heavy-Duty Boots", "Ability: Solar Power", "Level: 54", "Tera Type: Fire", "Timid Nature", "- Air Slash"])
      expect(txt).toContain(line);
  });
  it("ida y vuelta sin pérdidas", () => {
    const { sets, warnings } = parseShowdown(formatShowdown([ignis]));
    expect(warnings).toEqual([]);
    expect(sets[0]).toEqual(ignis);
  });
  it("avisa de especies desconocidas y limita a 6", () => {
    const { sets, warnings } = parseShowdown(["Pikachu", "Fakemon", "Eevee", "Mew", "Abra", "Onix", "Zubat", "Geodude"].join("\n\n"));
    expect(sets).toHaveLength(6);
    expect(warnings.some((w) => w.includes("Fakemon"))).toBe(true);
  });
});

describe("Pokédex", () => {
  it("spriteId de Showdown para formas", () => {
    const sprite = (id: string) => describeSet({ species: id, ability: "", item: "", nature: "", moves: [] }).spriteId;
    expect(sprite("charizardmegax")).toBe("charizard-megax");
    expect(sprite("mrmime")).toBe("mrmime");
    expect(sprite("urshifurapidstrike")).toBe("urshifu-rapidstrike");
  });
  it("excluye Pokémon inventados (CAP)", () => expect(getSpeciesInfo("syclant")).toBeNull());
  it("URLs concatenando la base", () =>
    expect(spriteCandidates("https://x.test/sprites", "pikachu", { animated: true })[0]).toBe("https://x.test/sprites/ani/pikachu.gif"));
});
