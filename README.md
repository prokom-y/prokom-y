# Y

A social media platform: write short posts, follow people, comment, and like.

This is a monorepo containing two independently runnable projects:

| Project                | Stack               | Description      |
| ---------------------- | ------------------- | ---------------- |
| [`api/`](api/)         | Django + DRF        | REST API backend |
| [`website/`](website/) | Preact + TypeScript | CSR frontend     |

## Quick start

### Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

Migrations run automatically on startup. Database data is persisted in a named Docker volume.

### Manual

Start the API first, then the website. See each project's README for full setup details.

- [API setup and docs](api/README.md)
- [Website setup and docs](website/README.md)

## License

Licensed under MIT, see [LICENSE](LICENSE) file for more details.
