export const typeDefs = `#graphql
  type Profile {
    userId: ID!
    courses: [String]
    topics: [String]
    studyPace: String
    studyMode: String
    groupSize: Int
    studyStyle: String
  }

  type Query {
    getProfile: Profile
  }

  type Mutation {
    updateProfile(
      courses: [String]
      topics: [String]
      studyPace: String
      studyMode: String
      groupSize: Int
      studyStyle: String
    ): Profile
  }
`;
