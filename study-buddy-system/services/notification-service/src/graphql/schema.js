import { gql } from "apollo-server";

export const typeDefs = gql`
  type Notification {
    id: ID!
    userId: String!
    type: String!
    message: String!
    isRead: Boolean!
    metadata: String
    createdAt: String!
  }

  type Query {
    getNotifications(userId: String!): [Notification!]!
    getUnreadNotifications(userId: String!): [Notification!]!
  }

  type Mutation {
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead(userId: String!): Boolean!
  }
`;
