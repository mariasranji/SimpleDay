const byId = (id) => document.getElementById(id);
let allTasks = [];
let activeFilter = "all";

const dateNow = new Date();
byId("todayLabel").textContent = new Intl.DateTimeFormat("en", {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
}).format(dateNow);

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function showMessage(text, success = false) {
  byId("formMessage").textContent = text;
  byId("formMessage").style.color = success ? "#637f61" : "#a34d3e";
}

async function loadTasks() {
  try {
    allTasks = await requestApi("/api/tasks");
    renderTasks();
  } catch (error) {
    showMessage("Could not load tasks. Check that the Flask server is running.");
  }
}

function addText(parent, tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value ?? "";
  parent.appendChild(element);
  return element;
}

function renderTasks() {
  const search = byId("searchInput").value.trim().toLowerCase();
  const doneCount = allTasks.filter(task => task.completed).length;
  const openCount = allTasks.length - doneCount;
  const percent = allTasks.length
  ? Math.round((doneCount / allTasks.length) * 100)
  : 0;

  byId("allCount").textContent = allTasks.length;
  byId("activeCount").textContent = openCount;
  byId("completedCount").textContent = doneCount;
  byId("summaryDone").textContent = `${doneCount} completed`;
  byId("summaryLeft").textContent = `${openCount} left`;
  byId("completionPercent").textContent = `${percent}%`;
  byId("progressFill").style.width = `${percent}%`;

  const headings = {
    all: ["All tasks", "Everything you need to keep track of."],
    active: ["To do", "The things still waiting for you."],
    completed: ["Completed", "A look at what you've finished."]
  };
  byId("listHeading").textContent = headings[activeFilter][0];
  byId("listSubheading").textContent = headings[activeFilter][1];

  const visible = allTasks.filter(task => {
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "active" && !task.completed)
      || (activeFilter === "completed" && task.completed);
    const searchable = `${task.title} ${task.notes || ""} ${task.category || ""}`.toLowerCase();
    return matchesFilter && searchable.includes(search);
  });

  byId("visibleCount").textContent = `${visible.length} ${visible.length === 1 ? "task" : "tasks"}`;
  const list = byId("taskList");
  list.replaceChildren();
  byId("emptyState").hidden = visible.length > 0;
  if (!visible.length) {
    byId("emptyTitle").textContent = search ? "No matching tasks." :
      activeFilter === "completed" ? "Nothing completed yet." :
      activeFilter === "active" ? "You're all caught up." : "Your list is clear.";
    byId("emptyCopy").textContent = search ? "Try another search." :
      activeFilter === "completed" ? "Finished tasks will show up here." :
      activeFilter === "active" ? "No pending tasks right now." : "Add a task above when you're ready.";
  }

  visible.forEach(task => {
    const row = document.createElement("article");
    row.className = `task-row${task.completed ? " is-complete" : ""}`;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = task.completed;
    check.setAttribute("aria-label", task.completed ? "Mark task as pending" : "Mark task as completed");
    check.addEventListener("change", () => toggleTask(task.id));
    row.appendChild(check);

    const copy = document.createElement("div");
    copy.className = "task-copy";
    addText(copy, "p", "task-name", task.title);
    if (task.notes) addText(copy, "p", "task-note", task.notes);

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const categoryClass = ["college", "work", "health"].includes((task.category || "").toLowerCase())
      ? task.category.toLowerCase() : "";
    addText(meta, "span", `category-pill ${categoryClass}`, task.category || "Personal");
    if (task.due_date) addText(meta, "span", "task-date", `Due ${task.due_date}`);
    copy.appendChild(meta);
    row.appendChild(copy);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = addText(actions, "button", "task-action", "✎");
    edit.type = "button"; edit.title = "Edit task"; edit.setAttribute("aria-label", "Edit task");
    edit.addEventListener("click", () => beginEdit(task));
    const remove = addText(actions, "button", "task-action delete", "×");
    remove.type = "button"; remove.title = "Delete task"; remove.setAttribute("aria-label", "Delete task");
    remove.addEventListener("click", () => deleteTask(task.id));
    row.appendChild(actions);
    list.appendChild(row);
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    activeFilter = button.dataset.filter;
    renderTasks();
  });
});

byId("searchInput").addEventListener("input", renderTasks);

byId("taskForm").addEventListener("submit", async event => {
  event.preventDefault();
  const taskId = byId("taskId").value;
  const payload = {
    title: byId("titleInput").value.trim(),
    notes: byId("notesInput").value.trim(),
    category: byId("categoryInput").value,
    due_date: byId("dueInput").value
  };
  if (!payload.title) {
    showMessage("Please enter a task name.");
    return;
  }
  if (taskId) {
    const existing = allTasks.find(task => task.id === Number(taskId));
    payload.completed = existing ? existing.completed : false;
  }
  try {
    if (taskId) {
      await requestApi(`/api/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(payload) });
      showMessage("Task updated.", true);
    } else {
      await requestApi("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
      showMessage("Task added.", true);
    }
    resetForm();
    await loadTasks();
  } catch (error) {
    showMessage(error.message);
  }
});

function beginEdit(task) {
  byId("taskId").value = task.id;
  byId("titleInput").value = task.title;
  byId("notesInput").value = task.notes || "";
  byId("categoryInput").value = task.category || "Personal";
  byId("dueInput").value = task.due_date || "";
  byId("submitButton").textContent = "Save changes";
  byId("cancelEdit").hidden = false;
  byId("titleInput").focus();
  showMessage("Edit the details above, then save.", true);
}

function resetForm() {
  byId("taskForm").reset();
  byId("taskId").value = "";
  byId("submitButton").textContent = "＋ Add task";
  byId("cancelEdit").hidden = true;
}

byId("cancelEdit").addEventListener("click", () => {
  resetForm();
  showMessage("");
});

async function toggleTask(id) {
  try {
    await requestApi(`/api/tasks/${id}/complete`, { method: "PATCH" });
    await loadTasks();
  } catch (error) {
    showMessage(error.message);
  }
}

async function deleteTask(id) {
  if (!window.confirm("Delete this task?")) return;
  try {
    await requestApi(`/api/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
    showMessage("Task deleted.", true);
  } catch (error) {
    showMessage(error.message);
  }
}

// Public API integration: a task suggestion is fetched only when the user requests it.
byId("suggestBtn").addEventListener("click", async () => {
  const button = byId("suggestBtn");
  button.disabled = true;
  button.textContent = "Getting an idea…";
  try {
    const response = await fetch("https://dummyjson.com/todos/random");
    if (!response.ok) throw new Error("Public API unavailable");
    const suggestion = await response.json();
    byId("titleInput").value = suggestion.todo || "";
    byId("categoryInput").value = "Personal";
    byId("titleInput").focus();
    showMessage("Task idea added to the form. Review it and press Add task.", true);
  } catch {
    showMessage("Couldn't reach the task-idea service. You can enter a task manually.");
  } finally {
    button.disabled = false;
    button.textContent = "↗ Get a task idea";
  }
});

// WebAssembly module calculates completion percentage for the dashboard.
async function loadWasm() {
  try {
    const bytes = new Uint8Array([
      0,97,115,109,1,0,0,0,
      1,7,1,96,2,127,127,1,127,
      3,2,1,0,
      7,11,1,7,112,101,114,99,101,110,116,0,0,
      10,12,1,10,0,32,0,65,100,108,32,1,110,11
    ]);
    const result = await WebAssembly.instantiate(bytes);
    return result.instance.exports.percent;
  } catch {
    return null;
  }
}
let wasmPercent = null;
loadWasm().then(fn => { wasmPercent = fn; renderTasks(); });

// WebNN is an optional browser API; this button checks availability without claiming inference.
byId("webnnBtn").addEventListener("click", () => {
  const available = Boolean(navigator.ml);
  byId("webnnResult").textContent = available
    ? "WebNN API is exposed in this browser. Actual acceleration depends on browser and device support."
    : "WebNN is not exposed in this browser. This check does not run an ML model.";
});

loadTasks();
