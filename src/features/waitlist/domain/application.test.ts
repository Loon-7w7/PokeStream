import { describe, expect, it } from "vitest";
import { canReview, channelUrl, normalizeChannel, shouldSaveSubmission } from "./application";

describe("normalizeChannel", () => {
  it("se queda con el usuario aunque peguen la URL o una @", () => {
    expect(normalizeChannel("twitch", " https://www.twitch.tv/Ash_Ketchum/videos ")).toBe("Ash_Ketchum");
    expect(normalizeChannel("twitch", "twitch.tv/misty")).toBe("misty");
    expect(normalizeChannel("kick", "@brock")).toBe("brock");
    expect(normalizeChannel("youtube", "https://youtube.com/@oak")).toBe("oak");
  });

  it("no toca la URL de otra plataforma ni el texto de 'other'", () => {
    expect(normalizeChannel("twitch", "https://kick.com/gary")).toBe("https://kick.com/gary");
    expect(normalizeChannel("other", " https://tiktok.com/@red ")).toBe("https://tiktok.com/@red");
  });
});

describe("channelUrl", () => {
  it("arma el enlace de cada plataforma", () => {
    expect(channelUrl("twitch", "misty")).toBe("https://twitch.tv/misty");
    expect(channelUrl("youtube", "oak")).toBe("https://youtube.com/@oak");
  });

  it("nunca enlaza algo que no sea http(s) o un usuario válido", () => {
    expect(channelUrl("other", "javascript:alert(1)")).toBeNull();
    expect(channelUrl("other", "mi canal")).toBeNull();
    expect(channelUrl("kick", "a/b?c")).toBeNull();
  });
});

describe("reglas de la postulación", () => {
  it("un reenvío solo actualiza lo pendiente", () => {
    expect(shouldSaveSubmission(null)).toBe(true);
    expect(shouldSaveSubmission("pending")).toBe(true);
    expect(shouldSaveSubmission("approved")).toBe(false);
    expect(shouldSaveSubmission("rejected")).toBe(false);
  });

  it("se aprueba lo pendiente o rechazado y se rechaza solo lo pendiente", () => {
    expect(canReview("pending", "approved")).toBe(true);
    expect(canReview("rejected", "approved")).toBe(true);
    expect(canReview("approved", "approved")).toBe(false);
    expect(canReview("pending", "rejected")).toBe(true);
    expect(canReview("approved", "rejected")).toBe(false);
  });
});
