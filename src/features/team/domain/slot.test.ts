import { describe, expect, it } from "vitest";
import type { SpeciesInfo } from "@/core/pokedex/types";
import { DomainError } from "@/core/result";
import { applyPatch, calcMaxHp, emptySlot, evolve, heal, placeSpecies, validateOrder } from "./slot";

const gastly: SpeciesInfo = { id: "gastly", name: "Gastly", baseHp: 30, abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const haunter: SpeciesInfo = { id: "haunter", name: "Haunter", baseHp: 45, abilityIds: ["levitate"], defaultAbilityId: "levitate" };
const garchomp: SpeciesInfo = { id: "garchomp", name: "Garchomp", baseHp: 108, abilityIds: ["sandveil", "roughskin"], defaultAbilityId: "sandveil" };

describe("calcMaxHp", () => {
  it("usa 31 IVs / 0 EVs", () => expect(calcMaxHp(108, 100)).toBe(357));
  it("Shedinja siempre 1", () => expect(calcMaxHp(1, 80)).toBe(1));
});

describe("placeSpecies", () => {
  it("slot vacío: nivel 50, PS llenos, habilidad por defecto", () => {
    const { slot, message } = placeSpecies(emptySlot(2), garchomp, "");
    expect(slot).toMatchObject({ position: 2, species: "garchomp", level: 50, ability: "sandveil", hpCurrent: slot.hpMax });
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
  it("conserva mote y escala PS en proporción", () => {
    const base = placeSpecies(emptySlot(0), gastly, "").slot;
    const half = { ...base, nickname: "Shadow", hpCurrent: Math.round(base.hpMax / 2) };
    const { slot } = evolve(half, haunter, "Gastly");
    expect(slot.nickname).toBe("Shadow");
    expect(slot.hpCurrent / slot.hpMax).toBeCloseTo(0.5, 1);
  });
  it("falla en slot vacío", () => expect(() => evolve(emptySlot(0), haunter, "")).toThrow(DomainError));
});

describe("applyPatch (reglas de PS y debilitado)", () => {
  const alive = placeSpecies(emptySlot(0), garchomp, "").slot;

  it("PS a 0 => debilitado", () => expect(applyPatch(alive, { hpCurrent: 0 }, garchomp).slot.fainted).toBe(true));
  it("marcar debilitado => PS 0", () => expect(applyPatch(alive, { fainted: true }, garchomp).slot.hpCurrent).toBe(0));
  it("desmarcar debilitado => PS al máximo", () => {
    const dead = applyPatch(alive, { fainted: true }, garchomp).slot;
    const back = applyPatch(dead, { fainted: false }, garchomp).slot;
    expect(back.hpCurrent).toBe(back.hpMax);
  });
  it("curar a un debilitado lo revive", () => {
    const dead = applyPatch(alive, { fainted: true }, garchomp).slot;
    expect(applyPatch(dead, { hpCurrent: 10 }, garchomp).slot.fainted).toBe(false);
  });
  it("subir de nivel recalcula PS máx.", () => {
    const { slot, message } = applyPatch(alive, { level: 60 }, garchomp);
    expect(slot.hpMax).toBe(calcMaxHp(108, 60));
    expect(message).toBe("Garchomp subió a Nv. 60");
  });
  it("PS nunca superan el máximo ni bajan de 0", () => {
    expect(applyPatch(alive, { hpCurrent: 9999 }, garchomp).slot.hpCurrent).toBe(alive.hpMax);
    expect(applyPatch(alive, { hpCurrent: -5 }, garchomp).slot.hpCurrent).toBe(0);
  });
  it("máximo 4 movimientos", () =>
    expect(applyPatch(alive, { moves: ["a", "b", "c", "d", "e"] }, garchomp).slot.moves).toHaveLength(4));
});

describe("heal / validateOrder", () => {
  it("no cura debilitados", () => {
    const dead = applyPatch(placeSpecies(emptySlot(0), garchomp, "").slot, { fainted: true }, garchomp).slot;
    expect(heal(dead).hpCurrent).toBe(0);
  });
  it("acepta permutaciones y rechaza lo demás", () => {
    expect(validateOrder([5, 4, 3, 2, 1, 0])).toEqual([5, 4, 3, 2, 1, 0]);
    expect(() => validateOrder([0, 0, 1, 2, 3, 4])).toThrow(DomainError);
    expect(() => validateOrder([0, 1, 2])).toThrow(DomainError);
  });
});
