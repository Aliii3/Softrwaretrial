import { gql } from "apollo-server";

export const typeDefs = gql`
  type StudySessionParticipant {
    id: ID!
    sessionId: String!
    userId: String!
    contactInfo: String
    joinedAt: String!
  }

  type StudySession {
    id: ID!
    title: String!
    description: String
    topic: String!
    startTime: String!
    endTime: String!
    durationMinutes: Int!
    sessionType: String!
    status: String!
    creatorId: String!
    receiverId: String
    creatorContact: String!
    receiverContact: String
    userId: String!
    subject: String!
    participants: [StudySessionParticipant!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getStudySessions: [StudySession!]!
    getStudySession(id: ID!): StudySession
  }

  type Mutation {
    createStudySession(
      title: String!
      description: String
      topic: String!
      startTime: String!
      endTime: String!
      userId: String!
      subject: String!
      sessionType: String!
      creatorContact: String!
      receiverId: String
      receiverContact: String
    ): StudySession!

    updateStudySession(
      id: ID!
      title: String
      description: String
      topic: String
      startTime: String
      endTime: String
      subject: String
      sessionType: String
      receiverId: String
      creatorContact: String
      receiverContact: String
    ): StudySession

    joinStudySession(id: ID!, userId: String!, contactInfo: String): StudySession!
    leaveStudySession(id: ID!, userId: String!): StudySession!
    cancelStudySession(id: ID!): StudySession!
    deleteStudySession(id: ID!): Boolean!
  }
`;
