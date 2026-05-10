import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "study-session-service",
  brokers: ["kafka:9092"], // Docker later
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