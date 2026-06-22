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

export function publishEvent(routingKey: string, payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload));
  channel.publish(EXCHANGE, routingKey, body);
  console.log(`Published event "${routingKey}"`);
}

// NYTT: lyssna på event som matchar ett mönster (t.ex. "order.created").
// queueName = köets namn, pattern = vilken etikett vi vill ha,
// handler = funktionen som körs för varje meddelande.
export async function consumeEvents(
  queueName: string,
  pattern: string,
  handler: (routingKey: string, payload: any) => void | Promise<void>
) {
  const q = await channel.assertQueue(queueName, { durable: true }); // 1. skapa vår kö
  await channel.bindQueue(q.queue, EXCHANGE, pattern);               // 2. koppla kön till etiketten
  await channel.consume(q.queue, async (msg: any) => {              // 3. plocka meddelanden
    if (!msg) return;

    // Trasigt meddelande (går inte att tolka som JSON) -> släng det, lägg inte
    // tillbaka det (annars loopar det för evigt).
    let payload: any;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error("Malformed message, dropping:", err);
      channel.nack(msg, false, false);
      return;
    }

    // Kör hanteraren. Lyckas den -> kvittera (ack). Misslyckas den (t.ex. DB nere)
    // -> lägg tillbaka i kön (requeue) så den kan försökas igen senare.
    try {
      await handler(msg.fields.routingKey, payload);
      channel.ack(msg);                                            // 4. kvittera (klar!)
    } catch (err) {
      console.error(`Handler failed for "${msg.fields.routingKey}", requeueing:`, err);
      channel.nack(msg, false, true);
    }
  });
  console.log(`Listening for "${pattern}" on queue "${queueName}"`);
}