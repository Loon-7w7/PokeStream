// Integración: casos de uso de team contra una SQLite real (temporal) con las migraciones.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDatabaseUrl } from "../../../../test/db";

vi.hoisted(() => {
  process.env.ADMIN_TOKEN = ""; // sin login en tests
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let team: typeof import("./team.service");
let run: typeof import("@/features/run");

beforeAll(async () => {
  process.env.DATABASE_URL = createTestDatabaseUrl();
  team = await import("./team.service");
  run = await import("@/features/run");
});

describe("team.service (integración)", () => {
  it("reemplaza, edita, reordena y registra historial en una transacción", async () => {
    await team.replaceSpecies(0, "garchomp");
    await team.replaceSpecies(1, "gastly");
    await team.updateSlot(1, { nickname: "Shadow", item: "Leftovers", moves: ["Shadow Ball", "no-existe"] });
    await team.evolveSlot(1, "haunter");
    await team.reorderTeam([1, 0, 2, 3, 4, 5]);

    const view = await team.getTeamView();
    expect(view[0]).toMatchObject({ species: "haunter", nickname: "Shadow", item: "leftovers", moves: ["shadowball"], itemName: "Leftovers" });
    expect(view[1].species).toBe("garchomp");

    const { history } = await run.getRunOverview();
    expect(history.map((h) => h.message)).toEqual(
      expect.arrayContaining(["Garchomp entró al slot 1", "Shadow evolucionó a Haunter", "Equipo reordenado"]),
    );
  });

  it("un error de dominio no deja cambios a medias", async () => {
    const before = await team.getTeamView();
    await expect(team.evolveSlot(5, "haunter")).rejects.toThrow("El slot está vacío");
    expect(await team.getTeamView()).toEqual(before);
  });

  it("rechaza especies desconocidas", async () => {
    await expect(team.replaceSpecies(2, "fakemon")).rejects.toThrow("Pokémon desconocido");
  });
});

