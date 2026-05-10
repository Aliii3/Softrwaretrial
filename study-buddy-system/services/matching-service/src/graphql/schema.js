import { gql } from "apollo-server";

export const typeDefs = gql`
  type Match {
    id: ID!
    userId: String!
    matchedUserId: String!
    score: Float!
    reasons: [String!]!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type UserProfile {
    id: ID!
    userId: String!
    courses: [String!]!
    topics: [String!]!
    studyPace: String
    studyMode: String
    groupSize: Int
    studyStyle: String
  }

  type AvailabilitySlot {
    userId: String!
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  input AvailabilitySlotInput {
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  type Query {
    getRecommendedMatches(userId: String!): [Match!]!
    getMatch(id: ID!): Match
    getUserProfile(userId: String!): UserProfile
  }

  type Mutation {
    # Manually sync profile data (used for testing or direct API calls)
    syncUserProfile(
      userId: String!
      courses: [String!]
      topics: [String!]
      studyPace: String
      studyMode: String
      groupSize: Int
      studyStyle: String
    ): UserProfile!

    # Manually sync availability data
    syncUserAvailability(
      userId: String!
      slots: [AvailabilitySlotInput!]!
    ): [AvailabilitySlot!]!

    # Trigger matching computation for a specific user
    computeMatches(userId: String!): [Match!]!
  }
`;
