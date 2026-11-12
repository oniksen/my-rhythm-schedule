(function (root) {
  const Rhythm = { storageKey: "myRhythmSchedule_v3" };
  root.Rhythm = Rhythm;

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim() !== "";
  }

  Rhythm.parseLocalDate = function (iso) {
    const parts = String(iso).split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return new Date(y, m, d);
  };

  Rhythm.dateKey = function (date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  };

  Rhythm.addDays = function (date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  };

  Rhythm.mondayOf = function (date) {
    return Rhythm.addDays(date, -((date.getDay() + 6) % 7));
  };

  Rhythm.daysBetween = function (later, earlier) {
    return Math.round((Date.UTC(later.getFullYear(), later.getMonth(), later.getDate()) - Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate())) / 86400000);
  };

  Rhythm.weekIndex = function (monday, anchorMonday) {
    return Rhythm.daysBetween(monday, Rhythm.parseLocalDate(anchorMonday)) / 7;
  };

  Rhythm.rotationIndex = function (weekIndex, length) {
    return ((weekIndex % length) + length) % length;
  };

  Rhythm.activityFor = function (schedule, monday, extras) {
    const rotation = schedule.rotation;
    const key = Rhythm.dateKey(monday);
    const manualId = extras ? extras[key] : undefined;
    if (manualId && rotation.some(function (r) { return r.id === manualId; })) {
      return rotation.filter(function (r) { return r.id === manualId; })[0];
    }
    const wi = Rhythm.weekIndex(monday, schedule.anchorMonday);
    const idx = Rhythm.rotationIndex(wi, rotation.length);
    return rotation[idx];
  };

  Rhythm.nextActivityId = function (rotation, currentId) {
    const i = rotation.findIndex(function (r) { return r.id === currentId; });
    const nextIndex = i < 0 ? 0 : (i + 1) % rotation.length;
    return rotation[nextIndex].id;
  };

  Rhythm.checkKey = function (dateKey, taskId) {
    return dateKey + "|" + taskId;
  };

  Rhythm.toggleCheck = function (checks, key, checked) {
    const out = Object.assign({}, checks || {});
    if (checked) out[key] = true;
    else delete out[key];
    return out;
  };

  Rhythm.dayPercent = function (done, total) {
    return Math.round(done / total * 100);
  };

  Rhythm.ratingFor = function (avg) {
    if (avg === null) return "Отмечай пункты расписания, чтобы увидеть оценку регулярности.";
    if (avg >= 85) return "Очень хорошее соблюдение расписания. Сохраняй темп, не увеличивая нагрузку автоматически.";
    if (avg >= 65) return "Хороший результат. Большая часть плана выполняется; оставляй место для восстановления.";
    if (avg >= 40) return "Нестабильный, но полезный прогресс. Посмотри, какие блоки чаще всего оказываются слишком сложными.";
    return "План выполняется нерегулярно. Это повод упростить расписание, а не компенсировать пропуски дополнительной нагрузкой.";
  };

  Rhythm.summarize = function (dayResults) {
    let trackedDays = 0;
    let completedCount = 0;
    let sumPct = 0;
    let best = null;
    (dayResults || []).forEach(function (d) {
      completedCount += (d && d.done) ? d.done : 0;
      if (d && d.done > 0) {
        trackedDays += 1;
        const pct = Rhythm.dayPercent(d.done, d.total);
        sumPct += pct;
        if (best === null || pct > best) best = pct;
      }
    });
    if (trackedDays === 0) {
      return { trackedDays: 0, completedCount: completedCount, avgText: "—", bestDayText: "—", rating: Rhythm.ratingFor(null) };
    }
    const avg = Math.round(sumPct / trackedDays);
    return { trackedDays: trackedDays, completedCount: completedCount, avgText: avg + "%", bestDayText: best + "%", rating: Rhythm.ratingFor(avg) };
  };

  Rhythm.helpText = function (rotation) {
    const titles = (rotation || []).map(function (r) { return r.title; });
    return "По кругу: " + titles.join(" → ") + ". Кнопка ставит следующее занятие на выбранную неделю. Выбор хранится отдельно для каждой недели.";
  };

  Rhythm.resolveTaskTitle = function (task, activity) {
    if (task && task.rotation) return activity.taskTitle;
    return task.title;
  };

  Rhythm.dayMeta = function (date, markers) {
    const base = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    if (markers && markers.length) return base + " · " + markers.join(" · ");
    return base;
  };

  Rhythm.weekLabel = function (start, end) {
    const s = start.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const e = end.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    return s + " — " + e;
  };

  Rhythm.validateSchedule = function (schedule) {
    const errors = [];
    if (!schedule || typeof schedule !== "object") {
      errors.push("Расписание должно быть объектом.");
      return errors;
    }
    if (typeof schedule.anchorMonday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(schedule.anchorMonday)) {
      errors.push("anchorMonday должен быть датой в формате YYYY-MM-DD.");
    } else {
      const d = Rhythm.parseLocalDate(schedule.anchorMonday);
      if (Rhythm.dateKey(d) !== schedule.anchorMonday) {
        errors.push("anchorMonday содержит несуществующую дату.");
      } else if (d.getDay() !== 1) {
        errors.push("anchorMonday должен быть понедельником.");
      }
    }
    if (!Array.isArray(schedule.rotation) || schedule.rotation.length === 0) {
      errors.push("rotation должен быть непустым массивом.");
    } else {
      const seen = new Set();
      schedule.rotation.forEach(function (item) {
        if (!item || typeof item !== "object") {
          errors.push("Элемент rotation должен быть объектом.");
          return;
        }
        if (!isNonEmptyString(item.id)) errors.push("У занятия rotation пустой id.");
        if (!isNonEmptyString(item.title)) errors.push("У занятия rotation пустой title.");
        if (!isNonEmptyString(item.description)) errors.push("У занятия rotation пустой description.");
        if (!isNonEmptyString(item.taskTitle)) errors.push("У занятия rotation пустой taskTitle.");
        if (isNonEmptyString(item.id)) {
          if (seen.has(item.id)) errors.push("id занятий rotation должны быть уникальны.");
          seen.add(item.id);
        }
      });
    }
    let rotationItemCount = 0;
    const allTaskIds = new Set();
    let duplicateTaskId = false;
    if (!Array.isArray(schedule.days) || schedule.days.length !== 7) {
      errors.push("days должен быть массивом из 7 элементов.");
    } else {
      const dayIds = new Set();
      let dayIdDup = false;
      schedule.days.forEach(function (day) {
        if (!day || typeof day !== "object") {
          errors.push("День должен быть объектом.");
          return;
        }
        if (!isNonEmptyString(day.id)) errors.push("У дня пустой id.");
        if (!isNonEmptyString(day.name)) errors.push("У дня пустое name.");
        if (isNonEmptyString(day.id)) {
          if (dayIds.has(day.id)) dayIdDup = true;
          dayIds.add(day.id);
        }
        if (!Array.isArray(day.tasks) || day.tasks.length === 0) {
          errors.push("У дня должен быть непустой массив tasks.");
          return;
        }
        const times = new Set();
        let timeDup = false;
        day.tasks.forEach(function (task) {
          if (!task || typeof task !== "object") {
            errors.push("Пункт должен быть объектом.");
            return;
          }
          if (!isNonEmptyString(task.id)) errors.push("У пункта пустой id.");
          if (!isNonEmptyString(task.time)) errors.push("У пункта пустое time.");
          if (isNonEmptyString(task.id)) {
            if (allTaskIds.has(task.id)) duplicateTaskId = true;
            allTaskIds.add(task.id);
          }
          if (isNonEmptyString(task.time)) {
            if (times.has(task.time)) timeDup = true;
            times.add(task.time);
          }
          const hasTitle = isNonEmptyString(task.title);
          const isRotation = task.rotation === true;
          if (!hasTitle && !isRotation) errors.push("У пункта нет непустого title или rotation: true.");
          if (Object.prototype.hasOwnProperty.call(task, "optional") && task.optional !== true) {
            errors.push("optional может быть только true.");
          }
          if (isRotation) rotationItemCount += 1;
        });
        if (timeDup) errors.push("time пунктов должны быть уникальны в пределах дня.");
      });
      if (dayIdDup) errors.push("id дней должны быть уникальны.");
    }
    if (duplicateTaskId) errors.push("id пунктов должны быть уникальны в пределах недели.");
    if (Array.isArray(schedule.days) && schedule.days.length === 7) {
      if (rotationItemCount !== 1) errors.push("В неделе должен быть ровно один пункт с rotation: true.");
    }
    return errors;
  };

  Rhythm.loadState = function (storage) {
    const def = { checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 };
    if (!storage || typeof storage.getItem !== "function") return def;
    let raw = null;
    try { raw = storage.getItem(Rhythm.storageKey); } catch (e) { return def; }
    if (raw == null) return def;
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return def; }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return def;
    return {
      checks: (parsed.checks && typeof parsed.checks === "object" && !Array.isArray(parsed.checks)) ? parsed.checks : {},
      extras: (parsed.extras && typeof parsed.extras === "object" && !Array.isArray(parsed.extras)) ? parsed.extras : {},
      weekOffset: (typeof parsed.weekOffset === "number" && isFinite(parsed.weekOffset)) ? parsed.weekOffset : 0,
      monthOffset: (typeof parsed.monthOffset === "number" && isFinite(parsed.monthOffset)) ? parsed.monthOffset : 0
    };
  };

  Rhythm.saveState = function (storage, state) {
    storage.setItem(Rhythm.storageKey, JSON.stringify(state));
  };

  Rhythm.tasksForDate = function (schedule, date, extras) {
    const index = (date.getDay() + 6) % 7;
    const day = schedule.days[index];
    const activity = Rhythm.activityFor(schedule, Rhythm.mondayOf(date), extras);
    return (day.tasks || []).map(function (task) {
      const out = { id: task.id, time: task.time, title: Rhythm.resolveTaskTitle(task, activity) };
      if (task.optional === true) out.optional = true;
      return out;
    });
  };

  Rhythm.renderWeek = function (doc, state, schedule, now) {
    const weekOffset = (state && typeof state.weekOffset === "number") ? state.weekOffset : 0;
    const weekMonday = Rhythm.addDays(Rhythm.mondayOf(now), weekOffset * 7);
    const activity = Rhythm.activityFor(schedule, weekMonday, state ? state.extras : undefined);
    const start = weekMonday;
    const end = Rhythm.addDays(weekMonday, 6);

    doc.getElementById("weekLabel").textContent = Rhythm.weekLabel(start, end);
    doc.getElementById("extraTitle").textContent = activity.title;
    doc.getElementById("extraDesc").textContent = activity.description;
    doc.getElementById("extraHelp").textContent = Rhythm.helpText(schedule.rotation);

    const checks = (state && state.checks) ? state.checks : {};
    let html = "";
    for (let i = 0; i < 7; i++) {
      const date = Rhythm.addDays(weekMonday, i);
      const dk = Rhythm.dateKey(date);
      const dayIndex = (date.getDay() + 6) % 7;
      const daySchedule = schedule.days[dayIndex];
      const tasks = Rhythm.tasksForDate(schedule, date, state ? state.extras : undefined);

      let done = 0;
      tasks.forEach(function (t) {
        if (checks[Rhythm.checkKey(dk, t.id)]) done += 1;
      });
      const total = tasks.length;
      const pct = Rhythm.dayPercent(done, total);
      const meta = Rhythm.dayMeta(date, daySchedule.markers);
      const note = daySchedule.note;

      let section = '<section class="day"><div class="day-head"><div><div class="day-name">' + daySchedule.name + '</div><div class="day-meta">' + meta + '</div></div><div class="day-percent">' + pct + '%</div></div>';
      if (note) section += '<div class="day-empty">' + note + '</div>';
      tasks.forEach(function (t) {
        const key = Rhythm.checkKey(dk, t.id);
        const checked = !!checks[key];
        const classes = "task" + (checked ? " done" : "") + (t.optional ? " optional" : "");
        let label = '<label class="' + classes + '"><input type="checkbox" data-key="' + key + '"';
        if (checked) label += " checked";
        label += '><span class="task-main"><span class="task-time">' + t.time + '</span><span class="task-title">' + t.title + '</span>';
        if (t.optional) label += '<span class="optional-tag">НЕОБЯЗАТЕЛЬНО</span>';
        label += '</span></label>';
        section += label;
      });
      section += "</section>";
      html += section;
    }
    doc.getElementById("weekContent").innerHTML = html;
  };

  Rhythm.renderMonth = function (doc, state, schedule, now) {
    const monthOffset = (state && typeof state.monthOffset === "number") ? state.monthOffset : 0;
    const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = month.getFullYear();
    const mon = month.getMonth();
    const firstDayIndex = (month.getDay() + 6) % 7;
    const checks = (state && state.checks) ? state.checks : {};

    const dayResults = [];
    let cells = "";
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mon, d);
      const dk = Rhythm.dateKey(date);
      const tasks = Rhythm.tasksForDate(schedule, date, state ? state.extras : undefined);
      let done = 0;
      tasks.forEach(function (t) {
        if (checks[Rhythm.checkKey(dk, t.id)]) done += 1;
      });
      dayResults.push({ done: done, total: tasks.length });
      const hasData = done > 0;
      const isToday = dk === Rhythm.dateKey(now);
      const classes = "cal-day" + (hasData ? " has-data" : "") + (isToday ? " today" : "");
      const pctText = hasData ? (Rhythm.dayPercent(done, tasks.length) + "%") : "·";
      cells += '<div class="' + classes + '"><span class="num">' + d + '</span><span class="pct">' + pctText + '</span></div>';
    }
    const emptyCells = Array.from({ length: firstDayIndex }, function () { return '<div class="cal-day empty"></div>'; }).join("");
    const label = '<div class="cal-label">Пн</div><div class="cal-label">Вт</div><div class="cal-label">Ср</div><div class="cal-label">Чт</div><div class="cal-label">Пт</div><div class="cal-label">Сб</div><div class="cal-label">Вс</div>';
    doc.getElementById("calendar").innerHTML = label + emptyCells + cells;

    const summary = Rhythm.summarize(dayResults);
    doc.getElementById("avgPct").textContent = summary.avgText;
    doc.getElementById("trackedDays").textContent = String(summary.trackedDays);
    doc.getElementById("completedCount").textContent = summary.completedCount;
    doc.getElementById("bestDay").textContent = summary.bestDayText;
    doc.getElementById("rating").textContent = summary.rating;
    doc.getElementById("monthName").textContent = month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  };

  Rhythm.boot = function (doc, storage, schedule, now) {
    const errors = schedule ? Rhythm.validateSchedule(schedule) : ["Расписание не задано."];
    const weekContent = doc.getElementById("weekContent");
    if (errors && errors.length) {
      weekContent.textContent = errors.join("\n");
      return;
    }
    const state = Rhythm.loadState(storage);
    Rhythm.renderWeek(doc, state, schedule, now);
    Rhythm.renderMonth(doc, state, schedule, now);

    const rerenderWeek = function () { Rhythm.renderWeek(doc, state, schedule, now); };
    const rerenderMonth = function () { Rhythm.renderMonth(doc, state, schedule, now); };

    const prevWeek = doc.getElementById("prevWeek");
    if (prevWeek) prevWeek.addEventListener("click", function () { state.weekOffset -= 1; Rhythm.saveState(storage, state); rerenderWeek(); });
    const nextWeek = doc.getElementById("nextWeek");
    if (nextWeek) nextWeek.addEventListener("click", function () { state.weekOffset += 1; Rhythm.saveState(storage, state); rerenderWeek(); });
    const prevMonth = doc.getElementById("prevMonth");
    if (prevMonth) prevMonth.addEventListener("click", function () { state.monthOffset -= 1; Rhythm.saveState(storage, state); rerenderMonth(); });
    const nextMonth = doc.getElementById("nextMonth");
    if (nextMonth) nextMonth.addEventListener("click", function () { state.monthOffset += 1; Rhythm.saveState(storage, state); rerenderMonth(); });
    const switchExtra = doc.getElementById("switchExtra");
    if (switchExtra) switchExtra.addEventListener("click", function () {
      const monday = Rhythm.addDays(Rhythm.mondayOf(now), state.weekOffset * 7);
      const current = Rhythm.activityFor(schedule, monday, state.extras);
      const nextId = Rhythm.nextActivityId(schedule.rotation, current.id);
      state.extras[Rhythm.dateKey(monday)] = nextId;
      Rhythm.saveState(storage, state);
      rerenderWeek();
    });
    const wc = doc.getElementById("weekContent");
    if (wc) wc.addEventListener("change", function (event) {
      const key = event && event.target && event.target.dataset ? event.target.dataset.key : undefined;
      if (key) {
        const checked = !!(event && event.target && event.target.checked);
        state.checks = Rhythm.toggleCheck(state.checks, key, checked);
        Rhythm.saveState(storage, state);
        Rhythm.renderWeek(doc, state, schedule, now);
        Rhythm.renderMonth(doc, state, schedule, now);
      }
    });
  };

  if (!root.document) return;
  Rhythm.boot(root.document, root.localStorage, root.SCHEDULE, new Date());
})(typeof window !== "undefined" ? window : globalThis);