import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import type { ServiceKey } from "@/types/domain";

function makeClient(uri: string) {
  return new ApolloClient({
    link: new HttpLink({ uri }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: "no-cache", errorPolicy: "none" },
      mutate: { fetchPolicy: "no-cache", errorPolicy: "none" }
    }
  });
}

export const userClient = makeClient(
  process.env.NEXT_PUBLIC_USER_API || "https://user-service-production-ad5c.up.railway.app/graphql"
);

export const availabilityClient = makeClient(
  process.env.NEXT_PUBLIC_AVAILABILITY_API || "https://availability-service-production-95c1.up.railway.app/graphql"
);

export const sessionClient = makeClient(
  process.env.NEXT_PUBLIC_SESSION_API || "https://studysessionservice-production.up.railway.app/graphql"
);

export const notificationClient = makeClient(
  process.env.NEXT_PUBLIC_NOTIFICATION_API || "https://notificationservice-production-6cc2.up.railway.app/graphql"
);

export const matchingClient = makeClient(
  process.env.NEXT_PUBLIC_MATCHING_API || "https://matching-service-production-7bb4.up.railway.app/graphql"
);

export const profileClient = makeClient(
  process.env.NEXT_PUBLIC_PROFILE_API || "https://profile-production-14b5.up.railway.app/graphql"
);

const clients: Record<ServiceKey, ApolloClient> = {
  user: userClient,
  availability: availabilityClient,
  session: sessionClient,
  notification: notificationClient,
  matching: matchingClient,
  profile: profileClient
};

export const operations = {
  getMe: `query GetMe { getMe { id name email university academicYear phone } }`,
  getProfile: `query GetProfile {
    getProfile { userId courses topics studyPace studyMode groupSize studyStyle }
  }`,
  getStudySessions: `query GetStudySessions {
    getStudySessions {
      id title description topic startTime endTime durationMinutes sessionType status creatorId receiverId creatorContact receiverContact userId subject createdAt updatedAt
      participants { id sessionId userId contactInfo joinedAt }
    }
  }`,
  getAvailability: `query GetAvailability {
    getAvailability { id userId dayOfWeek startTime endTime }
  }`,
  getRecommendedMatches: `query GetRecommendedMatches($userId: String!) {
    getRecommendedMatches(userId: $userId) { id userId matchedUserId score reasons status createdAt updatedAt }
  }`,
  getNotifications: `query GetNotifications($userId: String!) {
    getNotifications(userId: $userId) { id userId type message isRead metadata createdAt }
  }`,
  register: `mutation Register($name: String!, $email: String!, $password: String!, $university: String!, $academicYear: Int!, $phone: String) {
    register(name: $name, email: $email, password: $password, university: $university, academicYear: $academicYear, phone: $phone) {
      id name email university academicYear phone
    }
  }`,
  login: `mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id name email university academicYear phone }
    }
  }`,
  createStudySession: `mutation CreateStudySession(
    $title: String!
    $description: String!
    $topic: String!
    $startTime: String!
    $endTime: String!
    $userId: String!
    $subject: String!
    $sessionType: String!
    $creatorContact: String!
  ) {
    createStudySession(
      title: $title
      description: $description
      topic: $topic
      startTime: $startTime
      endTime: $endTime
      userId: $userId
      subject: $subject
      sessionType: $sessionType
      creatorContact: $creatorContact
    ) {
      id title description topic startTime endTime durationMinutes sessionType status creatorId receiverId creatorContact receiverContact userId subject createdAt updatedAt
      participants { id sessionId userId contactInfo joinedAt }
    }
  }`,
  updateProfile: `mutation UpdateProfile($courses: [String], $topics: [String], $studyPace: String, $studyMode: String, $groupSize: Int, $studyStyle: String) {
    updateProfile(courses: $courses, topics: $topics, studyPace: $studyPace, studyMode: $studyMode, groupSize: $groupSize, studyStyle: $studyStyle) {
      userId courses topics studyPace studyMode groupSize studyStyle
    }
  }`,
  updateSlot: `mutation UpdateSlot($id: ID!, $dayOfWeek: String, $startTime: String, $endTime: String) {
    updateSlot(id: $id, dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime) { id userId dayOfWeek startTime endTime }
  }`,
  createSlot: `mutation CreateSlot($dayOfWeek: String!, $startTime: String!, $endTime: String!) {
    createSlot(dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime) { id userId dayOfWeek startTime endTime }
  }`,
  deleteSlot: `mutation DeleteSlot($id: ID!) {
    deleteSlot(id: $id) { id userId dayOfWeek startTime endTime }
  }`,
  markAllNotificationsAsRead: `mutation MarkAll($userId: String!) { markAllNotificationsAsRead(userId: $userId) }`,
  computeMatches: `mutation ComputeMatches($userId: String!) {
    computeMatches(userId: $userId) { id userId matchedUserId score reasons status createdAt updatedAt }
  }`
} as const;

function getOperationType(document: DocumentNode) {
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode => definition.kind === "OperationDefinition"
  );

  return operation?.operation || "query";
}

export async function graphQL<T>(
  service: ServiceKey,
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null
): Promise<T> {
  const client = clients[service];
  const document = gql(query);
  const context = {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  const result =
    getOperationType(document) === "mutation"
      ? await client.mutate<T>({ mutation: document, variables, context })
      : await client.query<T>({ query: document, variables, context });

  if (!result.data) {
    throw new Error("GraphQL response did not include data");
  }

  return result.data;
}
