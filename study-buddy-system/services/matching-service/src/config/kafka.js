import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "matching-service",
  brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "kafka:9092").split(","),
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "matching-service-group" });

export const connectProducer = async () => {
  await producer.connect();
};

export const sendEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
};

export const connectConsumer = async (handleMessage) => {
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
};
