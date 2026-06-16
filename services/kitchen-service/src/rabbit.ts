import amqp from "amqplib";

const EXCHANGE = "snabbmat";
let channel: any = null;

// Samma som i order-service: anslut och säkerställ exchangen.
export async function connectRabbit() {
  const url = process.env.RABBITMQ_URL ?? "amqp://localhost";
  const connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("Connected to RabbitMQ");
  return channel;
}

// NYTT: lyssna på event som matchar ett mönster (t.ex. "order.created").
// queueName = köets namn, pattern = vilken etikett vi vill ha,
// handler = funktionen som körs för varje meddelande.
export async function consumeEvents(
  queueName: string,
  pattern: string,
  handler: (routingKey: string, payload: any) => void
) {
  const q = await channel.assertQueue(queueName, { durable: true }); // 1. skapa vår kö
  await channel.bindQueue(q.queue, EXCHANGE, pattern);               // 2. koppla kön till etiketten
  await channel.consume(q.queue, (msg: any) => {                     // 3. plocka meddelanden
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());             // gör bytes → objekt igen
    handler(msg.fields.routingKey, payload);                        // kör vår hanterare
    channel.ack(msg);                                               // 4. kvittera (klar!)
  });
  console.log(`Listening for "${pattern}" on queue "${queueName}"`);
}