import type { ServiceKey } from "@/types/domain";

const endpoints: Record<ServiceKey, string> = {
  user: process.env.NEXT_PUBLIC_USER_API || "https://user-service-production-ad5c.up.railway.app/graphql",
  availability: process.env.NEXT_PUBLIC_AVAILABILITY_API || "https://availability-service-production-95c1.up.railway.app/graphql",
  session: process.env.NEXT_PUBLIC_SESSION_API || "https://studysessionservice-production.up.railway.app/graphql",
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_API || "https://notificationservice-production-6cc2.up.railway.app/graphql",
  matching: process.env.NEXT_PUBLIC_MATCHING_API || "https://matching-service-production-7bb4.up.railway.app/graphql",
  profile: process.env.NEXT_PUBLIC_PROFILE_API || "https://profile-production-14b5.up.railway.app/graphql"
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
