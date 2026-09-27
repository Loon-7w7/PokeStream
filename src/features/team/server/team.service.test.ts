// Integración: casos de uso de team contra una SQLite real (temporal) con las migraciones.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDatabaseUrl } from "../../../../test/db";

vi.hoisted(() => {
  process.env.ADMIN_TOKEN = ""; // sin login en tests
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let team: typeof import("./team.service");

beforeAll(async () => {
  process.env.DATABASE_URL = await createTestDatabaseUrl();
  team = await import("./team.service");
});

describe("team.service (integración)", () => {
  it("reemplaza, edita, evoluciona y reordena en una transacción", async () => {
    await team.replaceSpecies(0, "garchomp");
    await team.replaceSpecies(1, "gastly");
    await team.updateSlot(1, { nickname: "Shadow", item: "Leftovers", moves: ["Shadow Ball", "no-existe"] });
    await team.evolveSlot(1, "haunter");
    await team.reorderTeam([1, 0, 2, 3, 4, 5]);

    const view = await team.getTeamView();
    expect(view[0]).toMatchObject({ species: "haunter", nickname: "Shadow", item: "leftovers", moves: ["shadowball"], itemName: "Leftovers" });
    expect(view[1].species).toBe("garchomp");
  });

  it("lo que sale del equipo va a la caja y se puede devolver", async () => {
    await team.replaceSpecies(0, "pikachu"); // Shadow (Haunter) sale a la caja
    let storage = await team.getStorageView();
    expect(storage.box.map((b) => b.nickname)).toEqual(["Shadow"]);

    await team.withdrawFromBox(0, 0); // vuelve Shadow; Pikachu va a la caja
    expect((await team.getTeamView())[0]).toMatchObject({ species: "haunter", nickname: "Shadow", moves: ["shadowball"] });
    storage = await team.getStorageView();
    expect(storage.box.map((b) => b.speciesName)).toEqual(["Pikachu"]);

    await team.releaseStored("box", 0);
    expect((await team.getStorageView()).box).toEqual([]);
  });

  it("un error de dominio no deja cambios a medias", async () => {
    const before = await team.getTeamView();
    await expect(team.evolveSlot(5, "haunter")).rejects.toThrow("El slot está vacío");
    await expect(team.withdrawFromBox(7, 5)).rejects.toThrow("ya no está en la caja");
    expect(await team.getTeamView()).toEqual(before);
  });

  it("rechaza especies desconocidas", async () => {
    await expect(team.replaceSpecies(2, "fakemon")).rejects.toThrow("Pokémon desconocido");
  });
});
