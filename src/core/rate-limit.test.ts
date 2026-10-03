import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("deja pasar hasta el máximo y luego corta", () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("a", 10)).toBe(true);
    expect(limiter.take("a", 20)).toBe(false);
  });

  it("cuenta cada clave por separado", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("b", 0)).toBe(true);
    expect(limiter.take("a", 0)).toBe(false);
  });

  it("reinicia al terminar la ventana", () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("a", 999)).toBe(false);
    expect(limiter.take("a", 1000)).toBe(true);
  });
});
