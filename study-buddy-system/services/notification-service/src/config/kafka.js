import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "kafka:9092").split(","),
});

const consumer = kafka.consumer({ groupId: "notification-service-group" });

export const connectConsumer = async (handleMessage) => {
  await consumer.connect();
  await consumer.subscribe({
    topics: [
      "MatchFound",
      "StudySessionCreated",
      "StudySessionUpdated",
      "StudySessionJoined",
      "StudySessionLeft",
      "StudySessionCancelled",
      "BuddyRequestCreated",
    ],
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
