import { beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDatabaseUrl } from "../../../../test/db";

vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = ""; // sin login: el usuario es el local
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let getCurrentRun: typeof import("./current-run").getCurrentRun;
let repo: typeof import("./run.repository");

beforeAll(async () => {
  process.env.DATABASE_URL = await createTestDatabaseUrl(); // BD vacía: aún no existe ninguna run
  ({ getCurrentRun } = await import("./current-run"));
  repo = await import("./run.repository");
});

const opts = (claimOrphan: boolean) => ({ newToken: () => crypto.randomUUID(), claimOrphan });

describe("getCurrentRun", () => {
  it("lecturas concurrentes en el primer arranque crean UNA sola run", async () => {
    const ids = await Promise.all(Array.from({ length: 5 }, () => getCurrentRun().then((r) => r.id)));
    expect(new Set(ids).size).toBe(1);
  });
});

describe("runs por usuario", () => {
  it("cada correo tiene su propia run, siempre la misma", async () => {
    const a = await repo.findOrCreateRunForOwner("a@gmail.com", opts(false));
    const b = await repo.findOrCreateRunForOwner("b@gmail.com", opts(false));
    expect(a.id).not.toBe(b.id);
    expect((await repo.findOrCreateRunForOwner("a@gmail.com", opts(false))).id).toBe(a.id);
  });

  it("la run sin dueño solo la reclama quien tiene permiso", async () => {
    const { prisma } = await import("@/core/db/client");
    const orphan = await prisma.run.create({ data: { widgetToken: "huerfana" } });
    expect((await repo.findOrCreateRunForOwner("c@gmail.com", opts(false))).id).not.toBe(orphan.id);
    expect((await repo.findOrCreateRunForOwner("yo@gmail.com", opts(true))).id).toBe(orphan.id);
  });
});
