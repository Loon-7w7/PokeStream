import { describe, expect, it } from "vitest";
import type { SpeciesInfo } from "@/core/pokedex/types";
import { DomainError } from "@/core/result";
import { emptySlot, placeSpecies } from "./slot";
import { BOX_LIMIT, addToBox, removeStored, stash, takeFromBox } from "./storage";

const pikachu: SpeciesInfo = { id: "pikachu", name: "Pikachu", abilityIds: ["static"], defaultAbilityId: "static" };
const empty = { box: [], graveyard: [] };
const alive = { ...placeSpecies(emptySlot(3), pikachu), nickname: "Chispa" };

describe("stash", () => {
  it("guarda el set sin posición ni debilitado e ignora slots vacíos", () => {
    const s = stash(empty, [alive, emptySlot(1)], { nuzlocke: false });
    expect(s.box).toHaveLength(1);
    expect(s.box[0]).not.toHaveProperty("position");
    expect(s.box[0]).not.toHaveProperty("fainted");
    expect(s.box[0].nickname).toBe("Chispa");
  });
  it("muerto en Nuzlocke va a Muertos", () => {
    const s = stash(empty, [{ ...alive, fainted: true }], { nuzlocke: true });
    expect(s).toMatchObject({ box: [], graveyard: [{ species: "pikachu" }] });
  });
});

describe("takeFromBox / removeStored", () => {
  const full = stash(empty, [alive, { ...alive, nickname: "Otro" }], { nuzlocke: false });
  it("saca el elegido y deja el resto", () => {
    const { set, storage } = takeFromBox(full, 1);
    expect(set.nickname).toBe("Otro");
    expect(storage.box.map((b) => b.nickname)).toEqual(["Chispa"]);
  });
  it("índice inexistente falla", () => {
    expect(() => takeFromBox(full, 9)).toThrow(DomainError);
    expect(() => removeStored(full, "graveyard", 0)).toThrow(DomainError);
  });
});

describe("addToBox", () => {
  it("no deja pasar del tope de la caja", () => {
    const [set] = stash(empty, [alive], { nuzlocke: false }).box;
    const full = { box: Array.from({ length: BOX_LIMIT }, () => set), graveyard: [] };
    expect(() => addToBox(full, [set])).toThrow(DomainError);
    expect(addToBox(empty, [set]).box).toHaveLength(1);
  });
});
