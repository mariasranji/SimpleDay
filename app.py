import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = os.getenv("DATABASE_PATH", str(BASE_DIR / "tasks.db"))

app = Flask(__name__)
allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://127.0.0.1:5000")
CORS(app, resources={r"/api/*": {"origins": allowed_origin}})


def connect_db():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with connect_db() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT 'Personal',
                due_date TEXT NOT NULL DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


def task_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "notes": row["notes"],
        "category": row["category"],
        "due_date": row["due_date"],
        "completed": bool(row["completed"]),
        "created_at": row["created_at"],
    }


@app.get("/")
def home():
    initialize_database()
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "application": "SimpleDay"})


@app.get("/api/tasks")
def get_tasks():
    status = request.args.get("status", "all")
    query = "SELECT * FROM tasks"
    if status == "active":
        query += " WHERE completed = 0"
    elif status == "completed":
        query += " WHERE completed = 1"
    query += " ORDER BY completed ASC, id DESC"
    with connect_db() as connection:
        rows = connection.execute(query).fetchall()
    return jsonify([task_to_dict(row) for row in rows])


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    notes = str(data.get("notes", "")).strip()
    category = str(data.get("category", "Personal")).strip() or "Personal"
    due_date = str(data.get("due_date", "")).strip()

    if not title:
        return jsonify({"error": "Please enter a task name."}), 400
    if len(title) > 120 or len(notes) > 500:
        return jsonify({"error": "Task name or notes are too long."}), 400

    with connect_db() as connection:
        cursor = connection.execute(
            "INSERT INTO tasks (title, notes, category, due_date) VALUES (?, ?, ?, ?)",
            (title, notes, category, due_date),
        )
        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return jsonify(task_to_dict(row)), 201


@app.put("/api/tasks/<int:task_id>")
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    notes = str(data.get("notes", "")).strip()
    category = str(data.get("category", "Personal")).strip() or "Personal"
    due_date = str(data.get("due_date", "")).strip()
    completed = 1 if data.get("completed") else 0

    if not title:
        return jsonify({"error": "Please enter a task name."}), 400
    if len(title) > 120 or len(notes) > 500:
        return jsonify({"error": "Task name or notes are too long."}), 400

    with connect_db() as connection:
        existing = connection.execute(
            "SELECT id FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        if existing is None:
            return jsonify({"error": "Task not found."}), 404
        connection.execute(
            """UPDATE tasks
               SET title = ?, notes = ?, category = ?, due_date = ?, completed = ?
               WHERE id = ?""",
            (title, notes, category, due_date, completed, task_id),
        )
        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
    return jsonify(task_to_dict(row))


@app.patch("/api/tasks/<int:task_id>/complete")
def toggle_task(task_id):
    with connect_db() as connection:
        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        if row is None:
            return jsonify({"error": "Task not found."}), 404
        new_status = 0 if row["completed"] else 1
        connection.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?", (new_status, task_id)
        )
        updated = connection.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
    return jsonify(task_to_dict(updated))


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    with connect_db() as connection:
        result = connection.execute(
            "DELETE FROM tasks WHERE id = ?", (task_id,)
        )
        if result.rowcount == 0:
            return jsonify({"error": "Task not found."}), 404
    return jsonify({"message": "Task deleted."})


if __name__ == "__main__":
    initialize_database()
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )
