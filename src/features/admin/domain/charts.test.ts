import { describe, expect, it } from "vitest";
import type { AdminUser } from "../types";
import { WEEKS, buildFunnel, modeSummary, weekStart, weeklySignups } from "./charts";

const now = new Date("2026-09-30T12:00:00Z"); // miércoles

const user = (p: Partial<AdminUser>): AdminUser => ({
  email: "a@x.com",
  status: "active",
  invited: true,
  blocked: false,
  isAdmin: false,
  registeredAt: "2026-09-01T00:00:00Z",
  lastLoginAt: null,
  widgetsOnline: 0,
  ...p,
});

describe("buildFunnel", () => {
  it("cuenta cada etapa sin bloqueados", () => {
    const users = [
      user({ registeredAt: null, status: "invited" }),
      user({ lastLoginAt: "2026-09-29T00:00:00Z", widgetsOnline: 1 }),
      user({ lastLoginAt: "2026-07-01T00:00:00Z" }),
      user({ blocked: true, lastLoginAt: "2026-09-29T00:00:00Z" }),
    ];
    expect(buildFunnel(users, now).map((s) => s.value)).toEqual([3, 2, 1, 1]);
  });
});

describe("weeklySignups", () => {
  it("la semana empieza en lunes UTC", () => expect(weekStart(now).toISOString()).toBe("2026-09-28T00:00:00.000Z"));
  it("agrupa por semana, rellena con 0 e ignora lo que queda fuera", () => {
    const weeks = weeklySignups(["2026-09-28T01:00:00Z", "2026-09-30T00:00:00Z", "2026-09-27T23:00:00Z", "2020-01-01T00:00:00Z"], now);
    expect(weeks).toHaveLength(WEEKS);
    expect(weeks.at(-1)).toEqual({ week: "2026-09-28T00:00:00.000Z", count: 2 });
    expect(weeks.at(-2)?.count).toBe(1);
    expect(weeks.reduce((n, w) => n + w.count, 0)).toBe(3);
  });
});

describe("modeSummary", () => {
  it("separa modos y promedia las muertes de las Nuzlocke", () =>
    expect(
      modeSummary([
        { nuzlocke: true, deaths: 3 },
        { nuzlocke: true, deaths: 4 },
        { nuzlocke: false, deaths: 9 },
      ]),
    ).toEqual({ nuzlocke: 2, normal: 1, avgDeaths: 3.5, maxDeaths: 4 }));
  it("sin Nuzlocke no hay media", () => expect(modeSummary([{ nuzlocke: false, deaths: 0 }]).avgDeaths).toBeNull());
});
