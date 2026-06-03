# Y - API

REST API backend for the Y social media platform.

Built with [Django 5](https://www.djangoproject.com/) and [Django REST Framework](https://www.django-rest-framework.org/). Provides authentication, user profiles, posts, comments, likes, and follows.

## Prerequisites

- Python 3.10+
- PostgreSQL (running and accessible)

> **Using Docker?** Run `docker compose up --build` from the repository root - no manual setup needed. See the [root README](../README.md).

## Setup

```bash
# 1. Create and activate a virtual environment (from the api/ directory)
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the env file
cp src/.env.example src/.env
# Edit src/.env and fill in your values (see Environment variables below)

# 4. Apply database migrations
python3 src/manage.py migrate

# 5. (Optional) Create a superuser for the admin panel
python3 src/manage.py createsuperuser

# 6. Start the development server
python3 src/manage.py runserver
```

The API will be available at `http://localhost:8000`.

## Environment variables

All variables are defined in `src/.env.example`.

| Variable               | Description                   | Example                   |
| ---------------------- | ----------------------------- | ------------------------- |
| `SECRET_KEY`           | Django secret key             | `change-me-in-production` |
| `DEBUG`                | Debug mode                    | `True`                    |
| `ALLOWED_HOSTS`        | Comma-separated allowed hosts | `localhost,127.0.0.1`     |
| `DB_NAME`              | Database name                 | `y`                       |
| `DB_USER`              | Database user                 | `postgres`                |
| `DB_PASSWORD`          | Database password             | `password`                |
| `DB_HOST`              | Database host                 | `localhost`               |
| `DB_PORT`              | Database port                 | `5432`                    |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins          | `http://localhost:3000`   |

## API documentation

Interactive documentation is available once the server is running:

| URL       | Description                           |
| --------- | ------------------------------------- |
| `/docs`   | Swagger UI: browse and test endpoints |
| `/redoc`  | ReDoc: clean read-only reference      |
| `/schema` | Raw OpenAPI 3.0 schema (YAML)         |
| `/admin`  | Django admin panel                    |

## Endpoints

All protected endpoints require a `Bearer` JWT access token in the `Authorization` header.

Paginated endpoints return 20 items per page. Use `?page=N` to navigate.

### Auth

| Method | Path             | Auth     | Description                                 |
| ------ | ---------------- | -------- | ------------------------------------------- |
| POST   | `/auth/register` | -        | Register a new user                         |
| POST   | `/auth/login`    | -        | Obtain access token + set refresh cookie    |
| POST   | `/auth/refresh`  | -        | Refresh access token (uses httpOnly cookie) |
| POST   | `/auth/logout`   | Required | Blacklist refresh token and clear cookie    |

**Rate limits:** login 10/min, register 5/hour, refresh 30/min, logout 20/min.

### Accounts

| Method | Path                                   | Auth     | Description                          |
| ------ | -------------------------------------- | -------- | ------------------------------------ |
| GET    | `/accounts/profile`                    | Required | Get own profile                      |
| PATCH  | `/accounts/profile`                    | Required | Update own profile (bio, avatar_url) |
| GET    | `/accounts/users/search?q=`            | Required | Search users by username             |
| GET    | `/accounts/users/{username}`           | -        | Get a user's public profile          |
| GET    | `/accounts/users/{username}/followers` | Required | List a user's followers              |
| GET    | `/accounts/users/{username}/following` | Required | List who a user follows              |
| POST   | `/accounts/users/{username}/follow`    | Required | Follow a user                        |
| DELETE | `/accounts/users/{username}/follow`    | Required | Unfollow a user                      |

### Posts

| Method | Path                               | Auth     | Description                    |
| ------ | ---------------------------------- | -------- | ------------------------------ |
| GET    | `/posts`                           | Required | List all posts (paginated)     |
| POST   | `/posts`                           | Required | Create a post (max 500 chars)  |
| GET    | `/posts/feed`                      | Required | Posts from followed users      |
| GET    | `/posts/search?q=`                 | Required | Search posts by content        |
| GET    | `/posts/{id}`                      | Required | Get a post                     |
| PATCH  | `/posts/{id}`                      | Required | Update a post (author only)    |
| DELETE | `/posts/{id}`                      | Required | Delete a post (author only)    |
| POST   | `/posts/{id}/like`                 | Required | Like a post                    |
| DELETE | `/posts/{id}/like`                 | Required | Unlike a post                  |
| GET    | `/posts/{id}/comments`             | Required | List comments on a post        |
| POST   | `/posts/{id}/comments`             | Required | Add a comment (max 300 chars)  |
| GET    | `/posts/{id}/comments/{commentId}` | Required | Get a comment                  |
| PATCH  | `/posts/{id}/comments/{commentId}` | Required | Update a comment (author only) |
| DELETE | `/posts/{id}/comments/{commentId}` | Required | Delete a comment (author only) |

## Running tests

```bash
python3 src/manage.py test
```

## License

Licensed under MIT, see [LICENSE](../LICENSE) file for more details.
