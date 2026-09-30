import { describe, expect, it } from "vitest";
import { canEnter, parseEmailList } from "./access";

const entry = (invited: boolean, blocked = false) => ({ email: "a@x.com", invited, blocked });

describe("canEnter", () => {
  it("el admin siempre entra, aunque esté bloqueado", () => expect(canEnter({ isAdmin: true, entry: entry(false, true), registrationOpen: false })).toBe(true));
  it("bloqueado no entra ni con registro abierto", () => expect(canEnter({ isAdmin: false, entry: entry(true, true), registrationOpen: true })).toBe(false));
  it("registro abierto: entra cualquiera", () => expect(canEnter({ isAdmin: false, entry: null, registrationOpen: true })).toBe(true));
  it("solo invitados: entra el invitado", () => expect(canEnter({ isAdmin: false, entry: entry(true), registrationOpen: false })).toBe(true));
  it("solo invitados: el resto no", () => {
    expect(canEnter({ isAdmin: false, entry: null, registrationOpen: false })).toBe(false);
    expect(canEnter({ isAdmin: false, entry: entry(false), registrationOpen: false })).toBe(false);
  });
});

describe("parseEmailList", () => {
  it("separa por comas, espacios o líneas, normaliza y quita duplicados", () =>
    expect(parseEmailList(" A@x.com, b@x.com\nb@X.com;  ")).toEqual(["a@x.com", "b@x.com"]));
});
