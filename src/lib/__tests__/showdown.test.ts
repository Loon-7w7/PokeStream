import { describe, expect, it } from "vitest";
import { calcMaxHp, getSpecies, toSlotView } from "../dex";
import { exportSlots, importTeam } from "../showdown";
import { spriteCandidates } from "../sprites";
import type { SlotData } from "../types";

const ignis: SlotData = {
  position: 0,
  species: "charizard",
  nickname: "Ignis",
  level: 54,
  hpCurrent: 82,
  hpMax: 165,
  ability: "solarpower",
  item: "heavydutyboots",
  nature: "timid",
  teraType: "Fire",
  gender: "",
  shiny: false,
  fainted: false,
  moves: ["flamethrower", "airslash"],
  evs: null,
  ivs: null,
};

describe("Showdown", () => {
  it("exporta con nombres legibles", () => {
    const txt = exportSlots([ignis]);
    expect(txt).toContain("Ignis (Charizard) @ Heavy-Duty Boots");
    expect(txt).toContain("Ability: Solar Power");
    expect(txt).toContain("Level: 54");
    expect(txt).toContain("Tera Type: Fire");
    expect(txt).toContain("Timid Nature");
    expect(txt).toContain("- Air Slash");
  });

  it("omite slots vacíos", () => {
    expect(exportSlots([{ ...ignis, species: "" }])).toBe("");
  });

  it("importa y vuelve a exportar igual (ida y vuelta)", () => {
    const txt = exportSlots([ignis]);
    const { slots, warnings } = importTeam(txt);
    expect(warnings).toEqual([]);
    expect(slots[0]).toMatchObject({ species: "charizard", nickname: "Ignis", item: "heavydutyboots", moves: ["flamethrower", "airslash"] });
  });

  it("avisa de especies desconocidas y limita a 6", () => {
    const mons = ["Pikachu", "Fakemon", "Eevee", "Mew", "Abra", "Onix", "Zubat", "Geodude"].join("\n\n");
    const { slots, warnings } = importTeam(mons);
    expect(slots).toHaveLength(6);
    expect(warnings.some((w) => w.includes("Fakemon"))).toBe(true);
  });
});

describe("Dex", () => {
  it("calcula PS con 31 IVs / 0 EVs", () => {
    expect(calcMaxHp(getSpecies("garchomp")!, 100)).toBe(357);
    expect(calcMaxHp(getSpecies("shedinja")!, 50)).toBe(1);
  });

  it("genera el spriteId de Showdown para formas", () => {
    expect(toSlotView({ ...ignis, species: "charizardmegax" }).spriteId).toBe("charizard-megax");
    expect(toSlotView({ ...ignis, species: "mrmime" }).spriteId).toBe("mrmime");
    expect(toSlotView({ ...ignis, species: "urshifurapidstrike" }).spriteId).toBe("urshifu-rapidstrike");
  });

  it("construye URLs concatenando la base", () => {
    expect(spriteCandidates("https://x.test/sprites", "pikachu", { animated: true })[0]).toBe("https://x.test/sprites/ani/pikachu.gif");
  });
});
