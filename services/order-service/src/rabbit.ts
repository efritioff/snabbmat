import amqp from "amqplib";

// "Brevlådan" i RabbitMQ som alla våra events går genom.
const EXCHANGE = "snabbmat";
let channel: any = null;   // sparar kanalen så publishEvent når den

export async function connectRabbit() {
  // Adressen till RabbitMQ kommer från docker-compose (miljövariabeln).
  const url = process.env.RABBITMQ_URL ?? "amqp://localhost";

  const connection = await amqp.connect(url);        // 1. ring upp
  channel = await connection.createChannel();   // 2. öppna en lina
  await channel.assertExchange(EXCHANGE, "topic", { durable: true }); // 3. se till att brevlådan finns

  console.log("Connected to RabbitMQ");
  return channel;
}

// Skicka ett event. routingKey = etiketten, t.ex. "order.created".
// payload = själva datan (vårt order-objekt).
export function publishEvent(routingKey: string, payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload));   // 1. gör om objektet till text→bytes
  channel.publish(EXCHANGE, routingKey, body);          // 2. lägg brevet i brevlådan med etiketten
  console.log(`Published event "${routingKey}"`);       // 3. logga så vi ser att det hände
}