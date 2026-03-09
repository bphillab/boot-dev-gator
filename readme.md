# Boot.dev Blog Aggregator

CLI RSS/blog aggregator built with TypeScript, Drizzle ORM, and Postgres.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your environment/config so `dbUrl` and `currentUserName` can be read by `src/config.ts`.

3. Generate and run DB migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. Run commands with:
```bash
npm run start -- <command> [args]
```

## Command Reference

### User commands

Register a new user (and set as current user):
```bash
npm run start -- register <username>
```

Log in as an existing user:
```bash
npm run start -- login <username>
```

List users (current user is marked):
```bash
npm run start -- users
```

Reset users table:
```bash
npm run start -- reset
```

### Feed commands

Add a feed (requires logged-in user):
```bash
npm run start -- addfeed "<feed-name>" "<feed-url>"
```

List all feeds:
```bash
npm run start -- feeds
```

Follow a feed by URL (requires logged-in user):
```bash
npm run start -- follow "<feed-url>"
```

Show feeds followed by current user (requires logged-in user):
```bash
npm run start -- following
```

Unfollow a feed by URL (requires logged-in user):
```bash
npm run start -- unfollow "<feed-url>"
```

### Aggregation and browsing

Continuously scrape feeds on an interval:
```bash
npm run start -- agg <duration>
```

Duration format examples:
- `500ms`
- `30s`
- `5m`
- `1h`

Browse latest posts from feeds followed by current user:
```bash
npm run start -- browse
npm run start -- browse <num-posts>
```

## Typical flow

```bash
npm run start -- register alice
npm run start -- addfeed "Hacker News" "https://news.ycombinator.com/rss"
npm run start -- following
npm run start -- agg 30s
# Ctrl+C after some posts have been scraped
npm run start -- browse 2
```

## Notes

- `browse` only shows posts from feeds the current user follows.
- If `browse` prints nothing, run `following` first and confirm posts have been scraped via `agg`.
