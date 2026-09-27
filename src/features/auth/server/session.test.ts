import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE, createSessionValue, readSessionValue } from "./session";

const secret = "x".repeat(32);

describe("sesión firmada", () => {
  it("lee una sesión recién creada", () => {
    expect(readSessionValue(createSessionValue("yo@gmail.com", secret), secret)?.email).toBe("yo@gmail.com");
  });

  it("rechaza una firma alterada o de otro secreto", () => {
    const value = createSessionValue("yo@gmail.com", secret);
    expect(readSessionValue(`${value}x`, secret)).toBeNull();
    expect(readSessionValue(value, "y".repeat(32))).toBeNull();
  });

  it("rechaza un payload cambiado con la firma de otro", () => {
    const [, signature] = createSessionValue("yo@gmail.com", secret).split(".");
    const forged = Buffer.from(JSON.stringify({ email: "otro@gmail.com", exp: 9e9 })).toString("base64url");
    expect(readSessionValue(`${forged}.${signature}`, secret)).toBeNull();
  });

  it("rechaza una sesión expirada o vacía", () => {
    const value = createSessionValue("yo@gmail.com", secret, 0);
    expect(readSessionValue(value, secret, (SESSION_MAX_AGE + 1) * 1000)).toBeNull();
    expect(readSessionValue(undefined, secret)).toBeNull();
  });
});
