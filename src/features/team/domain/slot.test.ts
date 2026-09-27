import { describe, expect, it } from "vitest";
import type { SpeciesInfo } from "@/core/pokedex/types";
import { DomainError } from "@/core/result";
import { applyPatch, destinationOf, emptySlot, evolve, placeSpecies, validateOrder } from "./slot";

const gastly: SpeciesInfo = { id: "gastly", name: "Gastly", abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const haunter: SpeciesInfo = { id: "haunter", name: "Haunter", abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const garchomp: SpeciesInfo = { id: "garchomp", name: "Garchomp", abilityIds: ["sandveil", "roughskin"], defaultAbilityId: "sandveil" };

const normal = { nuzlocke: false };
const nuzlocke = { nuzlocke: true };

describe("placeSpecies", () => {
  it("especie nueva con habilidad por defecto", () =>
    expect(placeSpecies(emptySlot(2), garchomp)).toMatchObject({ position: 2, species: "garchomp", ability: "sandveil", fainted: false }));
  it("reemplazo: reinicia los datos del anterior", () => {
    const prev = { ...placeSpecies(emptySlot(0), gastly), nickname: "Boo", moves: ["lick"] };
    expect(placeSpecies(prev, garchomp)).toMatchObject({ nickname: "", moves: [] });
  });
});

describe("evolve", () => {
  it("conserva mote y movimientos", () => {
    const base = { ...placeSpecies(emptySlot(0), gastly), nickname: "Shadow", moves: ["lick"] };
    expect(evolve(base, haunter)).toMatchObject({ species: "haunter", nickname: "Shadow", moves: ["lick"] });
  });
  it("falla en slot vacío", () => expect(() => evolve(emptySlot(0), haunter)).toThrow(DomainError));
});

describe("applyPatch (debilitado y Nuzlocke)", () => {
  const alive = placeSpecies(emptySlot(0), garchomp);
  const dead = { ...alive, fainted: true };

  it("debilitar", () => expect(applyPatch(alive, { fainted: true }, normal).fainted).toBe(true));
  it("sin Nuzlocke se puede revivir", () => expect(applyPatch(dead, { fainted: false }, normal).fainted).toBe(false));
  it("en Nuzlocke no se puede revivir", () => expect(() => applyPatch(dead, { fainted: false }, nuzlocke)).toThrow(DomainError));
  it("en Nuzlocke un muerto sí se puede editar", () =>
    expect(applyPatch(dead, { nickname: "RIP" }, nuzlocke)).toMatchObject({ nickname: "RIP", fainted: true }));
  it("máximo 4 movimientos", () => expect(applyPatch(alive, { moves: ["a", "b", "c", "d", "e"] }, normal).moves).toHaveLength(4));
});

describe("destinationOf", () => {
  const alive = placeSpecies(emptySlot(0), garchomp);
  it("vivo -> caja", () => expect(destinationOf(alive, nuzlocke)).toBe("box"));
  it("muerto en Nuzlocke -> Muertos", () => expect(destinationOf({ ...alive, fainted: true }, nuzlocke)).toBe("graveyard"));
  it("debilitado sin Nuzlocke -> caja", () => expect(destinationOf({ ...alive, fainted: true }, normal)).toBe("box"));
});

describe("validateOrder", () => {
  it("acepta permutaciones y rechaza lo demás", () => {
    expect(validateOrder([5, 4, 3, 2, 1, 0])).toEqual([5, 4, 3, 2, 1, 0]);
    expect(() => validateOrder([0, 0, 1, 2, 3, 4])).toThrow(DomainError);
    expect(() => validateOrder([0, 1, 2])).toThrow(DomainError);
  });
});
