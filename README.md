# SimpleDay — To-Do List

A practical task-list web application built with Flask, HTML, CSS, JavaScript, SQLite, and browser `fetch()`.

## Features
- Create, edit, delete, and complete tasks.
- Filter by all, pending, and completed; search by task text/category.
- Category, optional note, and due date.
- Dashboard completion summary and progress indicator.
- Task idea button fetches a random task from the public DummyJSON API.
- REST API endpoints return JSON.
- SQLite stores tasks locally.
- Basic input validation, parameterized SQL queries, and safe DOM text rendering.
- CORS configuration, `.env` template, Render deployment files.
- WebAssembly module for a small completion-percentage calculation.
- WebNN API availability check in the compact “About this app” section. It does not run an ML model.

## Run locally (Windows PowerShell)
From the project folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Open `http://127.0.0.1:5000`.

If PowerShell blocks activation, run:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

## REST API
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks?status=active` | List pending tasks |
| GET | `/api/tasks?status=completed` | List completed tasks |
| POST | `/api/tasks` | Add a task |
| PUT | `/api/tasks/<id>` | Edit a task |
| PATCH | `/api/tasks/<id>/complete` | Toggle completion |
| DELETE | `/api/tasks/<id>` | Delete a task |

Example JSON for adding a task:
```json
{"title":"Finish assignment","notes":"Review module notes","category":"College","due_date":"2026-10-02"}
```

## Syllabus coverage (simple implementation)
- **Application/framework:** Flask.
- **REST APIs + Fetch:** Flask JSON endpoints called by browser `fetch()`.
- **Public API:** DummyJSON random todo endpoint, triggered by “Get a task idea.”
- **Security:** CORS is configured through `ALLOWED_ORIGIN`; user-provided text is inserted using `textContent`/DOM methods rather than HTML interpolation; SQL statements use parameters and input length is checked. This is a basic classroom implementation, not a security audit.
- **Environment variables:** `.env.example` documents PORT, debug, CORS origin, and optional database path. Do not commit a real `.env`.
- **Deployment:** `render.yaml` and `Procfile` are included.
- **WebAssembly:** Browser module is used for a small completion percentage calculation.
- **WebNN/hardware acceleration:** UI checks whether `navigator.ml` is exposed. It does not claim actual hardware acceleration or model inference; browser/device support varies.

## Deploy on Render
1. Push the project folder to a GitHub repository.
2. In Render, create a Web Service and connect the repository.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Deploy. Set `ALLOWED_ORIGIN` to the deployed site origin if needed.

Note: SQLite on a typical ephemeral hosting filesystem may not persist across restarts/redeploys. Use a persistent disk or managed database if durable hosted data is required.

## Demo checklist
1. Add a task with a category and due date.
2. Search, edit, complete, and delete tasks.
3. Switch between All, To do, and Completed.
4. Refresh the page to show local SQLite persistence.
5. Click “Get a task idea” to demonstrate the public API.
6. Open “About this app” to show the WebNN support check.
7. Show `/api/tasks` in browser DevTools → Network to demonstrate REST + Fetch.
