// Integración: reglas de la run contra una SQLite real (temporal) con las migraciones.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/core/result";
import { createTestDatabaseUrl } from "../../../../test/db";

vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = ""; // sin login en tests
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let service: typeof import("./run.service");

beforeAll(async () => {
  process.env.DATABASE_URL = await createTestDatabaseUrl();
  service = await import("./run.service");
});

describe("modo Nuzlocke", () => {
  it("se activa y ya no se puede desactivar", async () => {
    await service.updateRunInfo({ nuzlocke: true });
    await expect(service.updateRunInfo({ nuzlocke: false })).rejects.toThrow(DomainError);
    expect((await service.getRunOverview()).info.nuzlocke).toBe(true);
  });

  it("solo una nueva partida (resetRunInfo) lo apaga", async () => {
    const { mutateRun } = await import("./unit-of-work");
    await mutateRun((ctx) => service.resetRunInfo(ctx));
    expect((await service.getRunOverview()).info.nuzlocke).toBe(false);
  });
});

describe("usuario bloqueado por el admin", () => {
  it("su token de widget deja de valer y vuelve al desbloquearlo", async () => {
    const auth = await import("@/features/auth");
    const repo = await import("./run.repository");
    const run = await repo.findOrCreateRunForOwner("streamer@x.com", { newToken: () => "B".repeat(24), claimOrphan: false });

    expect(await service.findRunIdByWidgetToken(run.widgetToken)).toBe(run.id);
    await auth.setBlocked("streamer@x.com", true);
    expect(await service.findRunIdByWidgetToken(run.widgetToken)).toBeNull();
    expect((await service.getWidgetRun(run.id, { withAccess: true }))?.access).toEqual({ token: run.widgetToken, blocked: true });

    await auth.setBlocked("streamer@x.com", false);
    expect(await service.findRunIdByWidgetToken(run.widgetToken)).toBe(run.id);
  });
});
