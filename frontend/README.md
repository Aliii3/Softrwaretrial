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

Copy `.env.example` to `.env.local` if your services are not on the default ports:

- User/auth: `NEXT_PUBLIC_USER_API=http://localhost:4001/graphql`
- Availability: `NEXT_PUBLIC_AVAILABILITY_API=http://localhost:4000/graphql`
- Study sessions: `NEXT_PUBLIC_SESSION_API=http://localhost:4002/graphql`
- Notifications: `NEXT_PUBLIC_NOTIFICATION_API=http://localhost:4003/graphql`
- Matching: `NEXT_PUBLIC_MATCHING_API=http://localhost:4004/graphql`
- Profile preferences: `NEXT_PUBLIC_PROFILE_API=http://localhost:4005/graphql`
