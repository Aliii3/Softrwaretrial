import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "study-session-service",
  brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "kafka:9092").split(","),
});

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const sendEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
};
