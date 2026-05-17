# Study Buddy Frontend

Next.js implementation of the Stitch Study Buddy designs, wired to the GraphQL microservices in `../study-buddy-system`.

## Run

```bash
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`.

If the app loads without styles after switching between `npm run dev` and `npm run build`, stop the dev server, delete `.next`, and start it again:

```bash
Remove-Item -Recurse -Force .next
npm run dev -- --port 3000
```

## Backend URLs

Copy `.env.example` to `.env.local` if you need to override the deployed backend URLs:

- User/auth: `NEXT_PUBLIC_USER_API=https://user-service-production-ad5c.up.railway.app/graphql`
- Availability: `NEXT_PUBLIC_AVAILABILITY_API=https://availability-service-production-95c1.up.railway.app/graphql`
- Study sessions: `NEXT_PUBLIC_SESSION_API=https://studysessionservice-production.up.railway.app/graphql`
- Notifications: `NEXT_PUBLIC_NOTIFICATION_API=https://notificationservice-production-6cc2.up.railway.app/graphql`
- Matching: `NEXT_PUBLIC_MATCHING_API=https://matching-service-production-7bb4.up.railway.app/graphql`
- Profile preferences: `NEXT_PUBLIC_PROFILE_API=https://profile-production-14b5.up.railway.app/graphql`
