import { beforeAll, describe, expect, it } from "vitest";
import { createTestDatabaseUrl } from "../../../../test/db";

let getCurrentRun: typeof import("./current-run").getCurrentRun;

beforeAll(async () => {
  process.env.DATABASE_URL = await createTestDatabaseUrl(); // BD vacía: aún no existe ninguna run
  ({ getCurrentRun } = await import("./current-run"));
});

describe("getCurrentRun", () => {
  it("lecturas concurrentes en el primer arranque crean UNA sola run", async () => {
    const ids = await Promise.all(Array.from({ length: 5 }, () => getCurrentRun().then((r) => r.id)));
    expect(new Set(ids).size).toBe(1);
  });
});
