import { gql } from "apollo-server";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    university: String!
    academicYear: Int!
    phone: String
  }

  type AuthPayload {
    user: User
    token: String
  }

  type Query {
    getMe: User
  }

  type Mutation {
    register(
      name: String!
      email: String!
      password: String!
      university: String!
      academicYear: Int!
      phone: String
    ): User

    login(email: String!, password: String!): AuthPayload
  }
`;