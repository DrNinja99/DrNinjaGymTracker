/* =========================
   GYM TRACKER
   ========================= */

const STORAGE_KEY = "gymTrackerFinal";

const schedule = {
  1: {
    name: "Back + Biceps",
    groups: ["Back", "Biceps"],
    template: "A"
  },
  2: {
    name: "Chest + Triceps",
    groups: ["Chest", "Triceps"],
    template: "B"
  },
  3: {
    name: "Shoulders + Legs",
    groups: ["Shoulders", "Legs"],
    template: "C"
  },
  4: {
    name: "Back + Biceps",
    groups: ["Back", "Biceps"],
    template: "A"
  },
  5: {
    name: "Chest + Triceps",
    groups: ["Chest", "Triceps"],
    template: "B"
  },
  6: {
    name: "Shoulders + Legs",
    groups: ["Shoulders", "Legs"],
    template: "C"
  },
  0: {
    name: "Rest Day",
    groups: [],
    template: null
  }
};

const defaultRoutine = {
  A: {
    Back: ["", "", ""],
    Biceps: ["", "", ""]
  },

  B: {
    Chest: ["", "", ""],
    Triceps: ["", "", ""]
  },

  C: {
    Shoulders: ["", "", ""],
    Legs: ["", "", ""]
  }
};

let data = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        routine: JSON.parse(JSON.stringify(defaultRoutine)),
        logs: {}
      };
    }

    const parsed = JSON.parse(saved);

    return {
      routine: parsed.routine || JSON.parse(JSON.stringify(defaultRoutine)),
      logs: parsed.logs || {}
    };

  } catch (error) {
    return {
      routine: JSON.parse(JSON.stringify(defaultRoutine)),
      logs: {}
    };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


/* =========================
   DATE FUNCTIONS
   ========================= */

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayNumber(date = new Date()) {
  return date.getDay();
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function mondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + difference);
  d.setHours(0, 0, 0, 0);

  return d;
}

function weekKey(date = new Date()) {
  return localDateKey(mondayOfWeek(date));
}


/* =========================
   HEADER
   ========================= */

function updateHeader() {
  const today = new Date();
  const day = getDayNumber(today);
  const workout = schedule[day];

  document.getElementById("todayDate").textContent =
    formatDate(today);

  document.getElementById("dayBadge").textContent =
    day === 0 ? "REST" : workout.name.toUpperCase();

  document.getElementById("todayTitle").textContent =
    workout.name;

  document.getElementById("todaySubtitle").textContent =
    day === 0
      ? "Recovery is part of the plan."
      : "2 sets × 8 reps • Complete each set";
}


/* =========================
   LOG MANAGEMENT
   ========================= */

function getTodayLog() {
  const key = localDateKey();

  if (!data.logs[key]) {
    data.logs[key] = {
      finished: false,
      sets: {}
    };
  }

  return data.logs[key];
}

function saveTodayLog() {
  saveData();
}

function setDone(exerciseId, setNumber) {
  const log = getTodayLog();

  if (!log.sets[exerciseId]) {
    log.sets[exerciseId] = [];
  }

  log.sets[exerciseId][setNumber - 1] =
    !log.sets[exerciseId][setNumber - 1];

  updateFinishedStatus();

  saveTodayLog();
  renderHome();
  renderWeek();
  renderProgress();
}

function updateFinishedStatus() {
  const today = new Date();
  const day = getDayNumber(today);

  if (day === 0) return;

  const workout = schedule[day];
  const log = getTodayLog();

  let totalSets = workout.groups.length * 3 * 2;
  let completed = 0;

  workout.groups.forEach(group => {

    const exercises = data.routine[workout.template][group] || [];

    exercises.forEach((name, index) => {

      const id = `${workout.template}-${group}-${index}`;

      if (log.sets[id]) {
        completed += log.sets[id].filter(Boolean).length;
      }

    });

  });

  log.finished = completed === totalSets && totalSets > 0;
}


/* =========================
   HOME
   ========================= */

function renderHome() {
  const container = document.getElementById("homeWorkout");

  const day = getDayNumber();
  const workout = schedule[day];

  if (day === 0) {
    container.innerHTML = `
      <div class="rest-day">
        <div class="emoji">☕</div>
        <h3>Sunday Rest</h3>
        <p>Take the day to recover and come back stronger.</p>
      </div>
    `;

    return;
  }

  const log = getTodayLog();

  let html = "";

  workout.groups.forEach((group, groupIndex) => {

    const exercises =
      data.routine[workout.template][group] || [];

    const accent =
      groupIndex % 2 === 0 ? "var(--saffron)" : "var(--purple)";

    html += `
      <div class="muscle-card">
        <div class="muscle-title">
          <h3 style="color:${accent}">${group.toUpperCase()}</h3>
          <span>3 exercises • 2 × 8</span>
        </div>
    `;

    exercises.forEach((name, index) => {

      const displayName =
        name.trim() || `Exercise ${index + 1}`;

      const id =
        `${workout.template}-${group}-${index}`;

      const sets = log.sets[id] || [false, false];

      html += `
        <div class="exercise-row">

          <div class="exercise-name">
            ${escapeHtml(displayName)}
          </div>

          <div class="sets">

            <button
              class="set-btn ${sets[0] ? "done" : ""}"
              onclick="setDone('${escapeJs(id)}',1)"
            >
              ${sets[0] ? "✓" : "SET 1"} • 8
            </button>

            <button
              class="set-btn ${sets[1] ? "done" : ""}"
              onclick="setDone('${escapeJs(id)}',2)"
            >
              ${sets[1] ? "✓" : "SET 2"} • 8
            </button>

          </div>

        </div>
      `;

    });

    html += `</div>`;
  });

  container.innerHTML = html;
}


/* =========================
   ROUTINE EDITOR
   ========================= */

let selectedTemplate = "A";

function renderRoutine() {

  const container =
    document.getElementById("routineEditor");

  const templateNames = {
    A: "Mon + Thu",
    B: "Tue + Fri",
    C: "Wed + Sat"
  };

  let html = `
    <div class="template-tabs">
      ${["A","B","C"].map(t => `
        <button
          class="template-tab ${selectedTemplate === t ? "active" : ""}"
          onclick="selectTemplate('${t}')"
        >
          ${templateNames[t]}
        </button>
      `).join("")}
    </div>
  `;

  const groups =
    Object.keys(data.routine[selectedTemplate]);

  groups.forEach(group => {

    html += `
      <div class="muscle-card">

        <div class="muscle-title">
          <h3>${group.toUpperCase()}</h3>
          <span>3 exercises</span>
        </div>
    `;

    data.routine[selectedTemplate][group]
      .forEach((exercise, index) => {

        html += `
          <div class="exercise-row">

            <input
              class="exercise-name"
              value="${escapeHtml(exercise)}"
              placeholder="Exercise ${index + 1}"
              data-template="${selectedTemplate}"
              data-group="${group}"
              data-index="${index}"
              onchange="updateExercise(this)"
            >

          </div>
        `;

      });

    html += `</div>`;
  });

  html += `
    <button
      class="primary-btn save-routine"
      onclick="saveRoutine()"
    >
      Save Routine
    </button>
  `;

  container.innerHTML = html;
}

function selectTemplate(template) {
  selectedTemplate = template;
  renderRoutine();
}

function updateExercise(input) {

  const template = input.dataset.template;
  const group = input.dataset.group;
  const index = Number(input.dataset.index);

  data.routine[template][group][index] =
    input.value;

  saveData();
}

function saveRoutine() {
  saveData();
  renderHome();

  alert("Routine saved!");
}


/* =========================
   WEEK HISTORY
   ========================= */

function renderWeek() {

  const container =
    document.getElementById("weekList");

  const currentMonday =
    mondayOfWeek();

  const weeks = [];

  // Show current week + previous 11 weeks
  for (let i = 0; i < 12; i++) {

    const monday = new Date(currentMonday);

    monday.setDate(
      monday.getDate() - (i * 7)
    );

    weeks.push(monday);
  }

  let html = "";

  weeks.forEach((monday, weekIndex) => {

    const sunday = new Date(monday);

    sunday.setDate(
      sunday.getDate() + 6
    );

    const label =
      weekIndex === 0
        ? "CURRENT WEEK"
        : `WEEK OF ${monday.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
          })}`;

    html += `
      <div class="card">
        <div class="muscle-title">
          <h3>${label}</h3>
          <span>
            ${monday.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short"
            })}
            –
            ${sunday.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short"
            })}
          </span>
        </div>
    `;

    for (let i = 0; i < 7; i++) {

      const date = new Date(monday);

      date.setDate(
        monday.getDate() + i
      );

      html += renderHistoryDay(date);

    }

    html += `</div>`;
  });

  container.innerHTML = html;
}

function renderHistoryDay(date) {

  const key = localDateKey(date);
  const day = date.getDay();
  const workout = schedule[day];

  if (day === 0) {

    return `
      <div class="day-history">
        <button class="day-header">
          <strong>Sunday</strong>
          <span>Rest</span>
        </button>
      </div>
    `;

  }

  const log = data.logs[key];

  let completedSets = 0;
  let totalSets =
    workout.groups.length * 3 * 2;

  let exerciseHtml = "";

  workout.groups.forEach(group => {

    const exercises =
      data.routine[workout.template][group] || [];

    exercises.forEach((name, index) => {

      const id =
        `${workout.template}-${group}-${index}`;

      const sets =
        log?.sets?.[id] || [false, false];

      const count =
        sets.filter(Boolean).length;

      completedSets += count;

      if (name.trim()) {

        exerciseHtml += `
          <div class="history-exercise">
            <b>${escapeHtml(name)}</b>
            <div class="history-sets">
              ${count}/2 sets completed
            </div>
          </div>
        `;

      }

    });

  });

  const percentage =
    totalSets
      ? Math.round((completedSets / totalSets) * 100)
      : 0;

  const status =
    percentage === 100
      ? "✓ Complete"
      : `${percentage}%`;

  const dateText =
    date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short"
    });

  const id =
    "history-" + key.replaceAll("-", "");

  return `
    <div class="day-history">

      <button
        class="day-header"
        onclick="toggleHistory('${id}')"
      >
        <strong>${dateText}</strong>
        <span>${status}</span>
      </button>

      <div id="${id}" class="history-content">
        ${exerciseHtml || `
          <div class="empty">
            No exercises added yet.
          </div>
        `}
      </div>

    </div>
  `;
}

function toggleHistory(id) {

  const element =
    document.getElementById(id);

  if (element) {
    element.classList.toggle("open");
  }
}


/* =========================
   PROGRESS
   ========================= */

function renderProgress() {

  const logs =
    Object.entries(data.logs)
      .sort((a,b) => b[0].localeCompare(a[0]));

  let workouts = 0;
  let sets = 0;
  let activeDays = 0;

  logs.forEach(([date, log]) => {

    if (log.finished) {
      workouts++;
    }

    let daySets = 0;

    Object.values(log.sets || {})
      .forEach(arr => {
        daySets +=
          (arr || []).filter(Boolean).length;
      });

    sets += daySets;

    if (daySets > 0) {
      activeDays++;
    }

  });

  document.getElementById("statWorkouts").textContent =
    workouts;

  document.getElementById("statSets").textContent =
    sets;

  document.getElementById("statDays").textContent =
    activeDays;

  document.getElementById("statStreak").textContent =
    calculateStreak();

  const recent =
    document.getElementById("recentActivity");

  const recentLogs =
    logs.filter(([date, log]) => {

      return Object.keys(log.sets || {}).length > 0;

    }).slice(0, 8);

  if (!recentLogs.length) {

    recent.innerHTML = `
      <div class="empty">
        Your completed workouts will appear here.
      </div>
    `;

    return;
  }

  recent.innerHTML =
    recentLogs.map(([date, log]) => {

      let completed = 0;

      Object.values(log.sets || {})
        .forEach(arr => {
          completed +=
            (arr || []).filter(Boolean).length;
        });

      return `
        <div class="activity-row">
          <strong>
            ${new Date(date + "T12:00:00")
              .toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
          </strong>

          <small>
            ${completed} sets completed
            ${log.finished ? " • Workout complete ✓" : ""}
          </small>
        </div>
      `;

    }).join("");
}

function calculateStreak() {

  let streak = 0;

  const date = new Date();

  // Sunday is not counted as a workout day
  if (date.getDay() === 0) {
    date.setDate(date.getDate() - 1);
  }

  while (true) {

    const key =
      localDateKey(date);

    const log =
      data.logs[key];

    if (!log || !log.finished) {
      break;
    }

    streak++;

    date.setDate(
      date.getDate() - 1
    );

    // Skip Sunday
    if (date.getDay() === 0) {
      date.setDate(
        date.getDate() - 1
      );
    }
  }

  return streak;
}


/* =========================
   BACKUP / RESTORE
   ========================= */

document
  .getElementById("backupBtn")
  .addEventListener("click", () => {

    const backup = {
      app: "Gym Tracker",
      version: 1,
      exportedAt: new Date().toISOString(),
      routine: data.routine,
      logs: data.logs
    };

    const blob =
      new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `gym-tracker-backup-${localDateKey()}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  });


document
  .getElementById("restoreFile")
  .addEventListener("change", event => {

    const file =
      event.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = e => {

      try {

        const backup =
          JSON.parse(e.target.result);

        if (!backup.routine || !backup.logs) {
          throw new Error("Invalid backup");
        }

        data = {
          routine: backup.routine,
          logs: backup.logs
        };

        saveData();

        renderAll();

        alert("Backup restored successfully!");

      } catch (error) {

        alert(
          "This file is not a valid Gym Tracker backup."
        );

      }

    };

    reader.readAsText(file);
  });


/* =========================
   NAVIGATION
   ========================= */

document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const page =
        button.dataset.page;

      document
        .querySelectorAll(".page")
        .forEach(p => {
          p.classList.remove("active");
        });

      document
        .getElementById(page)
        .classList.add("active");

      document
        .querySelectorAll(".nav-btn")
        .forEach(btn => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      if (page === "week") {
        renderWeek();
      }

      if (page === "routine") {
        renderRoutine();
      }

      if (page === "progress") {
        renderProgress();
      }

    });

  });


/* =========================
   SECURITY / TEXT HELPERS
   ========================= */

function escapeHtml(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(text) {

  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}


/* =========================
   INITIALIZE
   ========================= */

function renderAll() {

  updateHeader();
  renderHome();
  renderWeek();
  renderRoutine();
  renderProgress();

}

renderAll();