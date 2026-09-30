import { describe, expect, it } from "vitest";
import { buildAdminUsers } from "./users";

const owner = (email: string, runId: string) => ({ runId, email, createdAt: "2026-09-01T00:00:00.000Z" });
const entry = (email: string, invited: boolean, blocked = false) => ({ email, invited, blocked, lastLoginAt: null });

describe("buildAdminUsers", () => {
  const build = (registrationOpen: boolean) =>
    buildAdminUsers({
      access: {
        registrationOpen,
        admins: ["admin@x.com"],
        entries: [entry("inv@x.com", true), entry("act@x.com", true), entry("bad@x.com", false, true)],
      },
      owners: [owner("act@x.com", "r1"), owner("bad@x.com", "r2"), owner("old@x.com", "r3"), owner("admin@x.com", "r4")],
      obs: new Map([
        ["r1", 2],
        ["r2", 1],
      ]),
    });

  it("calcula el estado de cada usuario (solo invitados)", () => {
    const status = Object.fromEntries(build(false).users.map((u) => [u.email, u.status]));
    expect(status).toEqual({ "admin@x.com": "admin", "act@x.com": "active", "inv@x.com": "invited", "old@x.com": "no-access", "bad@x.com": "blocked" });
  });

  it("con registro abierto, el registrado sin invitación sigue activo", () =>
    expect(build(true).users.find((u) => u.email === "old@x.com")?.status).toBe("active"));

  it("ordena por estado y suma estadísticas", () => {
    const { users, stats } = build(false);
    expect(users.map((u) => u.status)).toEqual(["admin", "active", "invited", "no-access", "blocked"]);
    expect(stats).toEqual({ registered: 4, pendingInvites: 1, widgetsOnline: 3, blocked: 1 });
  });
});
