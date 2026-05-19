import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "matching-service",
  brokers,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "matching-service-group" });
let producerConnected = false;

export const connectProducer = async () => {
  if (!brokers.length) return false;
  await producer.connect();
  producerConnected = true;
  return true;
};

export const sendEvent = async (topic, message) => {
  if (!producerConnected) return false;
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  return true;
};

export const connectConsumer = async (handleMessage) => {
  if (!brokers.length) return false;
  await consumer.connect();
  await consumer.subscribe({
    topics: ["UserPreferencesUpdated", "availability-events"],
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        await handleMessage(topic, data);
      } catch (err) {
        console.error(`Error processing Kafka message on topic ${topic}:`, err.message);
      }
    },
  });
  return true;
};
