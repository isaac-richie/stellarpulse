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
  }, 15000);

  it("analysis requires payment proof", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/analysis/unlock",
      payload: {
        actorType: "user",
        market: {
          id: "m1",
          question: "Will BTC close above $100k this year?",
          outcomes: [{ name: "Yes", price: 54 }, { name: "No", price: 46 }]
        }
      }
    });
    expect(res.statusCode).toBe(402);
    expect(res.json().error).toBe("payment_required");
  });

  it("analysis quote advertises x402 requirements", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/analysis/quote" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.x402Version).toBe(2);
    expect(Array.isArray(body.accepts)).toBe(true);
    expect(body.accepts.length).toBeGreaterThan(0);
  });
});
