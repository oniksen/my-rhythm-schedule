const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8"), context);
const Rhythm = context.Rhythm;
const emptyObjVm = vm.runInContext("({})", context);
const emptyArrVm = vm.runInContext("([])", context);
const defaultStateVm = vm.runInContext("({ checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 })", context);
const anchor = Rhythm.parseLocalDate("2020-01-06");
assert.equal(anchor.getFullYear(), 2020);
assert.equal(anchor.getMonth(), 0);
assert.equal(anchor.getDate(), 6);
assert.equal(anchor.getDay(), 1);
assert.equal(Rhythm.dateKey(anchor), "2020-01-06");
assert.equal(Rhythm.weekIndex(anchor, "2020-01-06"), 0);
assert.equal(Rhythm.weekIndex(Rhythm.parseLocalDate("2020-01-13"), "2020-01-06"), 1);
assert.equal(Rhythm.weekIndex(Rhythm.parseLocalDate("2020-01-20"), "2020-01-06"), 2);
assert.equal(Rhythm.weekIndex(Rhythm.parseLocalDate("2019-12-30"), "2020-01-06"), -1);
assert.equal(Rhythm.rotationIndex(-1, 2), 1);
assert.equal(Rhythm.rotationIndex(-2, 2), 0);
assert.equal(Rhythm.daysBetween(Rhythm.parseLocalDate("2020-01-13"), anchor), 7);
const wed = Rhythm.parseLocalDate("2020-01-08");
assert.equal(Rhythm.dateKey(Rhythm.mondayOf(wed)), "2020-01-06");
assert.equal(Rhythm.dateKey(Rhythm.addDays(anchor, 6)), "2020-01-12");
assert.equal(anchor.getDate(), 6);

const schedule = {
  anchorMonday: "2020-01-06",
  rotation: [
    { id: "ai-engineering", title: "AI Engineering", description: "Изучение AI, LLM и инструментов", taskTitle: "AI Engineering — изучение и практика" },
    { id: "kmp-installer", title: "KMP Installer", description: "Разработка KMP desktop installer", taskTitle: "KMP Installer — изучение и практика" }
  ]
};
assert.equal(Rhythm.activityFor(schedule, anchor, {}).id, "ai-engineering");
assert.equal(Rhythm.activityFor(schedule, Rhythm.parseLocalDate("2020-01-13"), {}).id, "kmp-installer");
assert.equal(Rhythm.activityFor(schedule, Rhythm.parseLocalDate("2019-12-30"), {}).id, "kmp-installer");
assert.equal(Rhythm.activityFor(schedule, anchor, { "2020-01-06": "kmp-installer" }).id, "kmp-installer");
assert.equal(Rhythm.activityFor(schedule, anchor, { "2020-01-06": "gone" }).id, "ai-engineering");
assert.equal(Rhythm.activityFor(schedule, anchor, { "2020-01-12": "kmp-installer" }).id, "ai-engineering");
assert.equal(Rhythm.nextActivityId(schedule.rotation, "ai-engineering"), "kmp-installer");
assert.equal(Rhythm.nextActivityId(schedule.rotation, "kmp-installer"), "ai-engineering");
assert.equal(Rhythm.resolveTaskTitle({ rotation: true }, schedule.rotation[0]), "AI Engineering — изучение и практика");
assert.equal(Rhythm.resolveTaskTitle({ title: "Работа" }, schedule.rotation[0]), "Работа");
assert.equal(Rhythm.dayPercent(1, 9), 11);
assert.equal(Rhythm.dayPercent(1, 2), 50);
const checks = { "2020-01-06|mon-morning": true };
const toggled = Rhythm.toggleCheck(checks, "2020-01-06|mon-morning", false);
assert.deepStrictEqual(toggled, emptyObjVm);assert.deepEqual(checks, { "2020-01-06|mon-morning": true });
assert.equal(Rhythm.checkKey("2020-01-06", "mon-morning"), "2020-01-06|mon-morning");
assert.equal(Rhythm.helpText(schedule.rotation), "По кругу: AI Engineering → KMP Installer. Кнопка ставит следующее занятие на выбранную неделю. Выбор хранится отдельно для каждой недели.");
assert.equal(Rhythm.ratingFor(null), "Отмечай пункты расписания, чтобы увидеть оценку регулярности.");
assert.match(Rhythm.ratingFor(85), /^Очень хорошее соблюдение/);
assert.match(Rhythm.ratingFor(65), /^Хороший результат/);
assert.match(Rhythm.ratingFor(40), /^Нестабильный/);
assert.match(Rhythm.ratingFor(39), /^План выполняется нерегулярно/);
const one = Rhythm.summarize([{ done: 0, total: 9 }, { done: 1, total: 2 }]);
assert.equal(one.trackedDays, 1);
assert.equal(one.completedCount, 1);
assert.equal(one.avgText, "50%");
assert.equal(one.bestDayText, "50%");
const none = Rhythm.summarize([{ done: 0, total: 9 }]);
assert.equal(none.trackedDays, 0);
assert.equal(none.avgText, "—");
assert.equal(none.bestDayText, "—");
assert.equal(none.completedCount, 0);
assert.match(Rhythm.weekLabel(anchor, Rhythm.addDays(anchor, 6)), /—/);
assert.match(Rhythm.weekLabel(anchor, Rhythm.addDays(anchor, 6)), /2020/);
assert.match(Rhythm.dayMeta(anchor, ["спортзал"]), / · спортзал$/);

// validateSchedule cases
function makeValid() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({ id: "d" + i, name: "Day" + i, tasks: [{ id: "t" + i, time: "10:00", title: "Task" }] });
  }
  days[6].tasks.push({ id: "rot", time: "11:00", rotation: true });
  return { anchorMonday: "2020-01-06", rotation: [{ id: "r", title: "T", description: "D", taskTitle: "TT" }], days: days };
}
assert.deepStrictEqual(Rhythm.validateSchedule(makeValid()), emptyArrVm);assert.ok(Rhythm.validateSchedule({ anchorMonday: "2020-01-06" }).length > 0);
const noRotation = makeValid();
noRotation.rotation = [];
assert.ok(Rhythm.validateSchedule(noRotation).length > 0);
const twoRot = makeValid();
twoRot.days[0].tasks.push({ id: "rot2", time: "12:00", title: "x", rotation: true });
assert.ok(Rhythm.validateSchedule(twoRot).length > 0);
const badAnchor = makeValid();
badAnchor.anchorMonday = "2020-01-07";
assert.ok(Rhythm.validateSchedule(badAnchor).length > 0);

// real schedule
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "schedule.js"), "utf8"), context);
assert.deepStrictEqual(Rhythm.validateSchedule(context.SCHEDULE), emptyArrVm);
// loadState / saveState
function makeStorage(initial) {
  const store = Object.assign({}, initial || {});
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = v; },
    _store: store
  };
}
const stEmpty = makeStorage({});
assert.deepStrictEqual(Rhythm.loadState(stEmpty), defaultStateVm);
const stV2 = makeStorage({ myRhythmSchedule_v2: JSON.stringify({ checks: { "x": true } }) });
assert.deepStrictEqual(Rhythm.loadState(stV2), defaultStateVm);
const stBad = makeStorage({ myRhythmSchedule_v3: "{bad" });
assert.deepStrictEqual(Rhythm.loadState(stBad), defaultStateVm);
const stSave = makeStorage({});
Rhythm.saveState(stSave, { checks: { a: true }, extras: {}, weekOffset: 1, monthOffset: 2 });
assert.equal(stSave.getItem("myRhythmSchedule_v3"), JSON.stringify({ checks: { a: true }, extras: {}, weekOffset: 1, monthOffset: 2 }));

console.log("PASS");