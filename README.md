
# LearningManagementSys

**ACM Hackathon Fall 2026 — Two and a Half Programmers**

A locally hosted Learning Management System (LMS) built using React, FastAPI, and PostgreSQL.

The development environment is fully containerized using Docker Compose, allowing developers to build and run the entire application locally.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Python 3.12, FastAPI |
| Database | PostgreSQL 17 |
| ORM | SQLAlchemy |
| Containerization | Docker Compose |

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

- Git
- Docker Engine
- Docker Compose v2

Node.js and Python do not need to be installed locally because their dependencies run inside Docker containers.

Verify that Docker is installed and running:

```bash
docker --version
docker compose version
docker info
```

On Fedora Linux, start Docker if necessary:

```bash
sudo systemctl start docker
```

Depending on your Docker installation, you may need to configure Docker permissions for your user.

## Project Structure

```text
LearningManagementSys/
├── .env
├── .env.example
├── .gitignore
├── compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       └── database.py
│
├── database/
│   └── init/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        └── App.tsx
```

## Development Environment Setup

### 1. Clone the Repository

Clone the project repository and navigate into the project directory.

```bash
git clone <repository-url>
cd LearningManagementSys
```

If the repository is already on your machine, navigate to the root directory containing `compose.yml`.

### 2. Configure Environment Variables

The project uses a root `.env` file to store database credentials and backend authentication settings.

Create your local environment file using the provided template:

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:

```dotenv
# PostgreSQL Configuration
POSTGRES_USER=lms
POSTGRES_PASSWORD=your_database_password
POSTGRES_DB=lms_db

# JWT Authentication
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

You can generate a secure JWT secret using:

```bash
openssl rand -hex 32
```

Copy the generated value into `JWT_SECRET_KEY`.

**Important:**

- Never commit `.env` to Git.
- `.env.example` can be committed because it contains no real credentials.
- Authentication is not yet implemented in the initial project. The JWT variables are reserved for future development.
- The frontend should never receive database credentials or JWT signing secrets.

### 3. Build and Start the Containers

From the project root, validate your Docker Compose configuration:

```bash
docker compose config --quiet
```

Build and start all three containers:

```bash
docker compose up --build
```

Docker Compose will:

1. Download the PostgreSQL image.
2. Build the FastAPI backend image.
3. Build the React frontend image.
4. Create the internal Docker network.
5. Create a persistent PostgreSQL volume.
6. Start the services.

To run the containers in the background:

```bash
docker compose up -d --build
```

### 4. Access the Application

Once all containers are running, the following services will be available:

| Service | Address |
|---------|---------|
| React Frontend | http://localhost:5173 |
| FastAPI Backend | http://localhost:8000 |
| FastAPI Documentation | http://localhost:8000/docs |
| Backend Health Check | http://localhost:8000/api/health |

The PostgreSQL database is only accessible through Docker's internal network.

### 5. Verify the Development Environment

Check the status of all containers:

```bash
docker compose ps
```

All three services should be running:

- `frontend`
- `backend`
- `db`

The PostgreSQL container should report a healthy status.

Next, test the backend connection:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

This confirms that FastAPI is running and successfully communicating with PostgreSQL.

Finally, open:

http://localhost:5173

The frontend should display the development environment status, including the backend and database connections.

## Development Workflow

The frontend and backend source directories are mounted into their respective containers.

This allows developers to edit code locally without rebuilding the containers after every source-code change.

FastAPI uses Uvicorn's automatic reload functionality, while React uses Vite's development server.

### Common Docker Commands

**Start all containers:**

```bash
docker compose up -d
```

**Start containers and view logs:**

```bash
docker compose up
```

**View running containers:**

```bash
docker compose ps
```

**View logs for all services:**

```bash
docker compose logs -f
```

**View backend logs:**

```bash
docker compose logs -f backend
```

**View frontend logs:**

```bash
docker compose logs -f frontend
```

**Rebuild containers after dependency or Dockerfile changes:**

```bash
docker compose up -d --build
```

**Restart the backend:**

```bash
docker compose restart backend
```

**Stop and remove containers:**

```bash
docker compose down
```

This preserves the PostgreSQL database volume.

## Database Management

PostgreSQL runs inside the `db` Docker container.

The database is configured using the environment variables in the root `.env` file.

### Access PostgreSQL

Open the PostgreSQL command-line interface:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

You can now execute SQL commands directly.

For example:

```sql
SELECT current_database();
```

To list tables:

```sql
\dt
```

To exit:

```sql
\q
```

### Database Persistence

PostgreSQL stores its data in a Docker named volume called `postgres_data`.

The database persists when containers are stopped or recreated.

Running:

```bash
docker compose down
```

does not delete the stored database.

### Reset the Database

To completely delete the local database and start fresh:

```bash
docker compose down -v
docker compose up -d --build
```

**Warning:** This permanently deletes the data stored in the project's Docker volumes.

Only run this command when you intentionally want to reset your local development database.

### Database Initialization

The `database/init/` directory is reserved for optional PostgreSQL initialization scripts.

Scripts mounted into `/docker-entrypoint-initdb.d` are executed when PostgreSQL initializes a new, empty database directory.

They are not rerun automatically when an existing database volume is reused.

The backend currently configures SQLAlchemy's database engine and model base class. LMS-specific database models and migrations have not yet been implemented.

## Frontend and Backend Communication

The frontend communicates with the backend using HTTP requests.

React sends requests to endpoints beginning with `/api`.

For example:

```typescript
fetch('/api/health')
```

Vite is configured to forward these requests to the FastAPI backend container.

Request flow:

```text
Browser
   |
   v
React / Vite
localhost:5173
   |
   | /api/*
   v
FastAPI Backend
backend:8000
   |
   v
PostgreSQL Database
db:5432
```

Docker Compose automatically creates an internal network allowing services to communicate using their service names.

The frontend should not connect directly to PostgreSQL.

## Troubleshooting

### Docker Containers Fail to Start

Inspect the container status:

```bash
docker compose ps
```

Check service logs:

```bash
docker compose logs
```

Verify that your root `.env` file contains all required environment variables.

### Backend Cannot Connect to PostgreSQL

Check the database container:

```bash
docker compose logs db
```

Verify that the database reports a healthy status.

Confirm that the PostgreSQL credentials in `.env` are correct.

Changing PostgreSQL credentials in `.env` does not automatically change credentials in an already initialized database volume.

### Frontend Cannot Reach Backend

Verify that FastAPI is running:

```bash
curl http://localhost:8000/api/health
```

Check the frontend's Vite proxy configuration in:

```text
frontend/vite.config.ts
```

The proxy should target:

```text
http://backend:8000
```

The browser should make requests using relative paths such as `/api/health`.

### Frontend Dependency Installation Fails

Ensure the following files exist:

```text
frontend/package.json
frontend/package-lock.json
```

If dependencies were changed, update the lockfile and rebuild:

```bash
docker compose up -d --build frontend
```

### Source Code Changes Are Not Reflected

Check the frontend and backend logs:

```bash
docker compose logs -f frontend backend
```

Ensure the development containers are running and the source code directories are correctly mounted.

### Port Already in Use

The development environment uses ports:

- `5173` for React
- `8000` for FastAPI

If either port is occupied, stop the conflicting process or modify the host-side port mapping in `compose.yml`.

## Security Notes

This configuration is intended for local development only.

- Credentials are stored in the root `.env` file.
- `.env` should be excluded from version control.
- Do not include `.env` when publicly sharing project ZIP files.
- Do not expose PostgreSQL directly to the public network.
- Do not include secret credentials in React source code.
- JWT authentication is not active until it has been implemented in the backend.
- Development servers using hot reload should not be used as a production deployment.

## Planned LMS Features

The Learning Management System is being developed for the ACM Hackathon Fall 2026.

Planned core functionality includes:

- Student accounts
- Instructor accounts
- Course management
- Multiple-choice quizzes
- Automatic quiz grading
- Gradebook
- Course-specific to-do lists
- Instructor announcements

### Stretch Goals

- Text-based assignment submissions
- PDF assignment submissions

## Development Team

**Two and a Half Programmers**

ACM Hackathon Fall 2026
