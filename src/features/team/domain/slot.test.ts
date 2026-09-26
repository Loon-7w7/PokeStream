import { describe, expect, it } from "vitest";
import type { SpeciesInfo } from "@/core/pokedex/types";
import { DomainError } from "@/core/result";
import { applyPatch, emptySlot, evolve, placeSpecies, validateOrder } from "./slot";

const gastly: SpeciesInfo = { id: "gastly", name: "Gastly", abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const haunter: SpeciesInfo = { id: "haunter", name: "Haunter", abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const garchomp: SpeciesInfo = { id: "garchomp", name: "Garchomp", abilityIds: ["sandveil", "roughskin"], defaultAbilityId: "sandveil" };

const normal = { nuzlocke: false };
const nuzlocke = { nuzlocke: true };

describe("placeSpecies", () => {
  it("slot vacío: nivel 50, habilidad por defecto", () => {
    const { slot, message } = placeSpecies(emptySlot(2), garchomp, "");
    expect(slot).toMatchObject({ position: 2, species: "garchomp", level: 50, ability: "sandveil", fainted: false });
    expect(message).toBe("Garchomp entró al slot 3");
  });
  it("reemplazo: conserva el nivel y reinicia lo demás", () => {
    const prev = { ...placeSpecies(emptySlot(0), gastly, "").slot, level: 30, nickname: "Boo", moves: ["lick"] };
    const { slot, message } = placeSpecies(prev, garchomp, "Gastly");
    expect(slot).toMatchObject({ level: 30, nickname: "", moves: [] });
    expect(message).toBe("Garchomp reemplazó a Boo (slot 1)");
  });
});

describe("evolve", () => {
  it("conserva mote y nivel", () => {
    const base = { ...placeSpecies(emptySlot(0), gastly, "").slot, nickname: "Shadow", level: 25 };
    const { slot } = evolve(base, haunter, "Gastly");
    expect(slot).toMatchObject({ species: "haunter", nickname: "Shadow", level: 25 });
  });
  it("falla en slot vacío", () => expect(() => evolve(emptySlot(0), haunter, "")).toThrow(DomainError));
});

describe("applyPatch (debilitado y Nuzlocke)", () => {
  const alive = placeSpecies(emptySlot(0), garchomp, "").slot;
  const dead = { ...alive, fainted: true };

  it("debilitar", () => {
    const { slot, message } = applyPatch(alive, { fainted: true }, "Garchomp", normal);
    expect(slot.fainted).toBe(true);
    expect(message).toBe("Garchomp se debilitó");
  });
  it("sin Nuzlocke se puede revivir", () => {
    const { slot, message } = applyPatch(dead, { fainted: false }, "Garchomp", normal);
    expect(slot.fainted).toBe(false);
    expect(message).toBe("Garchomp volvió al combate");
  });
  it("en Nuzlocke morir queda en el historial", () =>
    expect(applyPatch(alive, { fainted: true }, "Garchomp", nuzlocke).message).toBe("Garchomp murió (Nuzlocke)"));
  it("en Nuzlocke no se puede revivir", () =>
    expect(() => applyPatch(dead, { fainted: false }, "Garchomp", nuzlocke)).toThrow(DomainError));
  it("en Nuzlocke un muerto sí se puede editar", () =>
    expect(applyPatch(dead, { nickname: "RIP" }, "Garchomp", nuzlocke).slot).toMatchObject({ nickname: "RIP", fainted: true }));
  it("cambio de nivel", () => {
    const { slot, message } = applyPatch(alive, { level: 60 }, "Garchomp", normal);
    expect(slot.level).toBe(60);
    expect(message).toBe("Garchomp subió a Nv. 60");
  });
  it("máximo 4 movimientos", () =>
    expect(applyPatch(alive, { moves: ["a", "b", "c", "d", "e"] }, "Garchomp", normal).slot.moves).toHaveLength(4));
});

describe("validateOrder", () => {
  it("acepta permutaciones y rechaza lo demás", () => {
    expect(validateOrder([5, 4, 3, 2, 1, 0])).toEqual([5, 4, 3, 2, 1, 0]);
    expect(() => validateOrder([0, 0, 1, 2, 3, 4])).toThrow(DomainError);
    expect(() => validateOrder([0, 1, 2])).toThrow(DomainError);
  });
});
