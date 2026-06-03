# Y - Website

Frontend for the Y social media platform.

Built with [Preact](https://preactjs.com/) and TypeScript. A client-side rendered application with routing, JWT authentication, and a responsive UI styled with Tailwind CSS.

## Prerequisites

- Node.js 18+
- pnpm
- The [API](../api/README.md) running at `http://localhost:8000` (or configure `VITE_API_BASE_URL`)

> **Using Docker?** Run `docker compose up --build` from the repository root - no manual setup needed. See the [root README](../README.md).

## Setup

```bash
# 1. Install dependencies (from the website/ directory)
pnpm install

# 2. Configure the API URL (optional - defaults to http://localhost:8000)
# Edit .env.local and set VITE_API_BASE_URL if your API runs elsewhere

# 3. Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Environment variables

| Variable            | Description                 | Default                 |
| ------------------- | --------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base URL of the API backend | `http://localhost:8000` |

## Scripts

| Command        | Description                            |
| -------------- | -------------------------------------- |
| `pnpm dev`     | Start the development server           |
| `pnpm build`   | Build for production (output: `dist/`) |
| `pnpm preview` | Preview the production build locally   |

## Pages and routes

| Path                         | Auth       | Description                                          |
| ---------------------------- | ---------- | ---------------------------------------------------- |
| `/`                          | -          | Redirects to `/feed` (logged in) or `/login` (guest) |
| `/login`                     | Guest only | Login form                                           |
| `/register`                  | Guest only | Registration form                                    |
| `/feed`                      | Required   | Posts from followed users                            |
| `/explore`                   | Required   | Discover all posts                                   |
| `/posts/:id`                 | Required   | Single post with comments                            |
| `/profile`                   | Required   | Own profile and settings                             |
| `/search`                    | Required   | Search posts and users                               |
| `/users/:username`           | -          | Public user profile                                  |
| `/users/:username/followers` | Required   | A user's followers                                   |
| `/users/:username/following` | Required   | Who a user follows                                   |
| `/about`                     | -          | About page                                           |

## Authentication

Access tokens are kept in memory only (never localStorage) to protect against XSS. The refresh token is stored in an httpOnly cookie set by the server. On a 401 response the client automatically requests a new access token and retries the original request. Logout clears the cookie server-side.

## License

Licensed under MIT, see [LICENSE](../LICENSE) file for more details.
