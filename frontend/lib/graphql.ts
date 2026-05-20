import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import type { DocumentNode, OperationDefinitionNode } from "graphql";
import type { ServiceKey } from "@/types/domain";

const endpoints: Record<ServiceKey, string> = {
  user: process.env.NEXT_PUBLIC_USER_API || "https://user-service-production-ad5c.up.railway.app/graphql",
  availability: process.env.NEXT_PUBLIC_AVAILABILITY_API || "https://availability-service-production-95c1.up.railway.app/graphql",
  session: process.env.NEXT_PUBLIC_SESSION_API || "https://studysessionservice-production.up.railway.app/graphql",
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_API || "https://notificationservice-production-6cc2.up.railway.app/graphql",
  matching: process.env.NEXT_PUBLIC_MATCHING_API || "https://matching-service-production-7bb4.up.railway.app/graphql",
  profile: process.env.NEXT_PUBLIC_PROFILE_API || "https://profile-production-14b5.up.railway.app/graphql"
};

const clients = new Map<ServiceKey, ApolloClient>();

function getClient(service: ServiceKey) {
  const existing = clients.get(service);
  if (existing) return existing;

  const client = new ApolloClient({
    link: new HttpLink({ uri: endpoints[service] }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: "no-cache", errorPolicy: "none" },
      mutate: { fetchPolicy: "no-cache", errorPolicy: "none" }
    }
  });

  clients.set(service, client);
  return client;
}

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
  const client = getClient(service);
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
