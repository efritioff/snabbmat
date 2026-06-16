import { describe, it, expect } from "vitest";
import { app } from "./index.js";

// Testar den riktiga POST /orders-rutten med Fastifys inbyggda inject().
// inject() "låtsas-skickar" ett HTTP-anrop till appen i minnet — ingen riktig
// server och ingen RabbitMQ behövs.
describe("POST /orders", () => {
  it("skapar en order med status PENDING", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { items: [{ productId: 1, quantity: 2 }] },
    });

    expect(response.statusCode).toBe(201);
    const order = response.json();
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.id).toMatch(/^ord-/); // id:t ska börja med "ord-"
  });
});

describe("GET /health", () => {
  it("svarar att tjänsten lever", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "order-service" });
  });
});
