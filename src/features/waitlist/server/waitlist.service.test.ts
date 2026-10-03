// Integración: preregistro contra una SQLite real (temporal) con las migraciones.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/core/result";
import { createTestDatabaseUrl } from "../../../../test/db";

vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = ""; // sin login en tests: el único usuario es admin
});
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let service: typeof import("./waitlist.service");

const form = (email: string, extra: Partial<import("./waitlist.service").Submission> = {}) => ({
  email,
  name: "",
  platform: "twitch" as const,
  channel: "https://twitch.tv/misty",
  message: "",
  website: "",
  ...extra,
});

beforeAll(async () => {
  process.env.DATABASE_URL = await createTestDatabaseUrl();
  service = await import("./waitlist.service");
});

const find = async (email: string) => (await service.listApplications()).find((a) => a.email === email);

describe("preregistro", () => {
  it("guarda la postulación con el canal normalizado y la actualiza mientras está pendiente", async () => {
    await service.submitApplication(form("misty@x.com"), "ip-1");
    expect(await find("misty@x.com")).toMatchObject({ channel: "misty", channelUrl: "https://twitch.tv/misty", status: "pending", name: null });

    await service.submitApplication(form("misty@x.com", { name: "Misty" }), "ip-1");
    expect((await find("misty@x.com"))?.name).toBe("Misty");
  });

  it("ignora en silencio a los bots (campo trampa)", async () => {
    await service.submitApplication(form("bot@x.com", { website: "spam" }), "ip-2");
    expect(await find("bot@x.com")).toBeUndefined();
  });

  it("limita los envíos por IP", async () => {
    for (let i = 0; i < 5; i++) await service.submitApplication(form(`flood${i}@x.com`), "ip-3");
    await expect(service.submitApplication(form("flood5@x.com"), "ip-3")).rejects.toThrow(DomainError);
  });

  it("aprobar invita el correo y un reenvío ya no cambia nada", async () => {
    const auth = await import("@/features/auth");
    await service.submitApplication(form("brock@x.com"), "ip-4");
    await service.reviewApplication("brock@x.com", "approved");

    expect(await find("brock@x.com")).toMatchObject({ status: "approved" });
    expect((await auth.getAccessOverview()).entries.find((e) => e.email === "brock@x.com")?.invited).toBe(true);

    await service.submitApplication(form("brock@x.com", { name: "Otro" }), "ip-4");
    expect(await find("brock@x.com")).toMatchObject({ status: "approved", name: null });
    await expect(service.reviewApplication("brock@x.com", "rejected")).rejects.toThrow(DomainError);
  });

  it("un rechazado se puede aprobar después", async () => {
    await service.submitApplication(form("gary@x.com"), "ip-5");
    await service.reviewApplication("gary@x.com", "rejected");
    await service.reviewApplication("gary@x.com", "approved");
    expect((await find("gary@x.com"))?.status).toBe("approved");
  });
});
