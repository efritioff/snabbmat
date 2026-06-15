import Fastify from "fastify";

const app = Fastify({ logger: true });

const products = [
  { id: 1, name: "Cheeseburger", price: 49, category: "burgers" },
  { id: 2, name: "Double Bacon Burger", price: 79, category: "burgers" },
  { id: 3, name: "Veggie Burger", price: 65, category: "burgers" },
  { id: 4, name: "Fries", price: 29, category: "sides" },
  { id: 5, name: "Onion Rings", price: 35, category: "sides" },
  { id: 6, name: "Cola", price: 25, category: "drinks" },
  { id: 7, name: "Milkshake", price: 39, category: "drinks" },
];

app.get("/health", async () => {
  return { status: "ok", service: "product-service" };
});

app.get("/products", async () => {
  return products;
});

app.get("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return reply.code(404).send({ error: "Product not found" });
  }
  return product;
});

const port = Number(process.env.PORT) || 3000;
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`product-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
