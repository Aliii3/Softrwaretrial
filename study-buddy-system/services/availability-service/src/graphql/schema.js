import { gql } from 'apollo-server';

const typeDefs = gql`
  type AvailabilitySlot {
    id: ID!
    userId: String!
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  type Query {
    getAvailability: [AvailabilitySlot]
    getSlotById(id: ID!): AvailabilitySlot
  }

  type Mutation {
    createSlot(
      dayOfWeek: String!
      startTime: String!
      endTime: String!
    ): AvailabilitySlot

    updateSlot(
      id: ID!
      dayOfWeek: String
      startTime: String
      endTime: String
    ): AvailabilitySlot

    deleteSlot(id: ID!): AvailabilitySlot
  }
`;

export default typeDefs;
