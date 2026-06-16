import amqp from "amqplib";

const EXCHANGE = "snabbmat";
let channel: any = null;

export async function connectRabbit() {
  const url = process.env.RABBITMQ_URL ?? "amqp://localhost";
  const connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("Connected to RabbitMQ");
  return channel;
}

export async function consumeEvents(
  queueName: string,
  pattern: string,
  handler: (routingKey: string, payload: any) => void
) {
  const q = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(q.queue, EXCHANGE, pattern);
  await channel.consume(q.queue, (msg: any) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
    handler(msg.fields.routingKey, payload);
    channel.ack(msg);
  });
  console.log(`Listening for "${pattern}" on queue "${queueName}"`);
}