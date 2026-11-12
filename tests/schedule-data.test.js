const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");

const source = fs.readFileSync(path.join(root, "js", "schedule.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const S = context.window.SCHEDULE;

// anchorMonday
assert.equal(S.anchorMonday, "2020-01-06");

// rotation
assert.equal(S.rotation.length, 2);
assert.equal(S.rotation[0].id, "ai-engineering");
assert.equal(S.rotation[1].id, "kmp-installer");
assert.equal(S.rotation[0].taskTitle, "AI Engineering — изучение и практика");
assert.equal(S.rotation[1].taskTitle, "KMP Installer — изучение и практика");
assert.equal(S.rotation[0].description, "Изучение AI, LLM и инструментов");
assert.equal(S.rotation[1].description, "Разработка KMP desktop installer");

// days
assert.equal(S.days.length, 7);
const names = S.days.map((d) => d.name);
assert.deepEqual(names, ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]);
const ids = S.days.map((d) => d.id);
assert.deepEqual(ids, ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

// markers
assert.deepEqual(S.days.find((d) => d.id === "mon").markers, ["спортзал"]);
assert.deepEqual(S.days.find((d) => d.id === "thu").markers, ["спортзал"]);
for (const d of S.days) {
  if (d.id !== "mon" && d.id !== "thu") {
    assert.equal(d.markers, undefined, `markers should be absent on ${d.id}`);
  }
}

// note
const fri = S.days.find((d) => d.id === "fri");
assert.equal(fri.note, "Вечер отдыха. Ниже — необязательная учебная сессия на 60 минут.");
for (const d of S.days) {
  if (d.id !== "fri") {
    assert.equal(d.note, undefined, `note should be absent on ${d.id}`);
  }
}

// Friday 9 tasks
assert.equal(fri.tasks.length, 9);
const opt = fri.tasks.find((t) => t.id === "fri-optional-study");
assert.equal(opt.optional, true);
assert.equal(opt.time, "18:00–19:00");
const friBreak = fri.tasks.find((t) => t.id === "fri-break");
assert.equal(friBreak.time, "19:00–19:30");
assert.equal(friBreak.title, "Перерыв");
const friFree = fri.tasks.find((t) => t.id === "fri-free");
assert.equal(friFree.time, "19:30–21:30");
assert.equal(friFree.title, "Свободное время");
const friSleep = fri.tasks.find((t) => t.id === "fri-sleep");
assert.equal(friSleep.time, "21:30–22:00");
assert.equal(friSleep.title, "Подготовка ко сну");

// Monday morning title differs from Thursday
const monMorning = S.days.find((d) => d.id === "mon").tasks.find((t) => t.id === "mon-morning");
const thuMorning = S.days.find((d) => d.id === "thu").tasks.find((t) => t.id === "thu-morning");
assert.equal(monMorning.title, "Утро, завтрак и сборы");
assert.equal(thuMorning.title, "Утро и сборы");

// Wednesday study title
const wedStudy = S.days.find((d) => d.id === "wed").tasks.find((t) => t.id === "wed-study");
assert.equal(wedStudy.title, "Android Skills Tree — практика и закрепление");
// Tuesday study title
const tueStudy = S.days.find((d) => d.id === "tue").tasks.find((t) => t.id === "tue-study");
assert.equal(tueStudy.title, "Android Skills Tree — изучение новой темы");

// sun-extra
const sunExtra = S.days.find((d) => d.id === "sun").tasks.find((t) => t.id === "sun-extra");
assert.equal(sunExtra.rotation, true);
assert.equal(sunExtra.time, "11:00–12:00");
assert.equal(Object.prototype.hasOwnProperty.call(sunExtra, "title"), false);

// unique task ids
const allIds = S.days.flatMap((d) => d.tasks.map((t) => t.id));
const unique = new Set(allIds);
assert.equal(unique.size, allIds.length, "task ids must be unique");

// every time contains short dash
for (const d of S.days) {
  for (const t of d.tasks) {
    assert.ok(t.time.includes("–"), `time missing short dash: ${t.id}`);
  }
}

// Android Skills Tree titles contain long dash
for (const d of S.days) {
  for (const t of d.tasks) {
    if (t.title && t.title.startsWith("Android Skills Tree")) {
      assert.ok(t.title.includes("—"), `long dash missing: ${t.id}`);
    }
  }
}

// source doesn't contain word function
assert.ok(!/\bfunction\b/.test(source), "source must not contain 'function'");

console.log("PASS");
