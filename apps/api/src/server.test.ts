import { describe, expect, it } from "vitest";
import { buildServer } from "./server.js";

const ok = (status: number) => status >= 200 && status < 300;

describe("api routes", () => {
  it("health responds", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("geoblock route returns json", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/geoblock" });
    expect(ok(res.statusCode)).toBe(true);
    expect(() => res.json()).not.toThrow();
  });

  it("bridge supported-assets returns json", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/bridge/supported-assets" });
    expect(ok(res.statusCode)).toBe(true);
    expect(() => res.json()).not.toThrow();
  });

  it("gamma markets returns json", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/gamma/markets?limit=1" });
    expect(ok(res.statusCode)).toBe(true);
    expect(() => res.json()).not.toThrow();
  });

  it("clob markets returns json", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/clob/markets" });
    expect(ok(res.statusCode)).toBe(true);
    expect(() => res.json()).not.toThrow();
  });
});
