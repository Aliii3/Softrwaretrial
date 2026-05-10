import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'profile-service',
  brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
});

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const publishEvent = async (event, payload) => {
  await producer.send({
    topic: event,
    messages: [{ value: JSON.stringify(payload) }],
  });
};
