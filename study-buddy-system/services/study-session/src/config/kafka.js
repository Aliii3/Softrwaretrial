import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "study-session-service",
  brokers,
});

const producer = kafka.producer();
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
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
  return true;
};
