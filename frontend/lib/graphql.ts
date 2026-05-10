import type { ServiceKey } from "@/types/domain";

const endpoints: Record<ServiceKey, string> = {
  user: process.env.NEXT_PUBLIC_USER_API || "http://localhost:4001/graphql",
  availability: process.env.NEXT_PUBLIC_AVAILABILITY_API || "http://localhost:4000/graphql",
  session: process.env.NEXT_PUBLIC_SESSION_API || "http://localhost:4002/graphql",
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_API || "http://localhost:4003/graphql",
  matching: process.env.NEXT_PUBLIC_MATCHING_API || "http://localhost:4004/graphql",
  profile: process.env.NEXT_PUBLIC_PROFILE_API || "http://localhost:4005/graphql"
};

export type GraphQLErrorPayload = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorPayload[];
};

export async function graphQL<T>(
  service: ServiceKey,
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null
): Promise<T> {
  const response = await fetch(endpoints[service], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.map((error) => error.message).join(", ") || "GraphQL request failed");
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data");
  }

  return payload.data;
}
