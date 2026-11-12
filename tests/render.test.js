const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "schedule.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8"), context);

const Rhythm = context.Rhythm;
const schedule = context.SCHEDULE;

function el() {
  return {
    textContent: "",
    innerHTML: "",
    dataset: {},
    listeners: {},
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  };
}

function makeDoc() {
  const ids = ["weekLabel","prevWeek","nextWeek","weekContent","extraTitle","extraDesc","extraHelp","switchExtra","prevMonth","nextMonth","monthName","calendar","avgPct","trackedDays","completedCount","bestDay","rating"];
  const elements = {};
  ids.forEach(function (id) { elements[id] = el(); });
  return { getElementById: function (id) { return elements[id]; }, _elements: elements };
}

function makeStorage(initial) {
  const store = Object.assign({}, initial || {});
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = v; },
    _store: store
  };
}

const now = Rhythm.parseLocalDate("2020-01-08");

// renderWeek
{
  const doc = makeDoc();
  const state = { checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 };
  Rhythm.renderWeek(doc, state, schedule, now);
  const wl = doc.getElementById("weekLabel").textContent;
  assert.match(wl, /2020/);
  assert.match(wl, /—/);
  assert.equal(doc.getElementById("extraTitle").textContent, "AI Engineering");
  assert.equal(doc.getElementById("extraDesc").textContent, "Изучение AI, LLM и инструментов");
  assert.equal(doc.getElementById("extraHelp").textContent, Rhythm.helpText(schedule.rotation));
  const wc = doc.getElementById("weekContent").innerHTML;
  assert.match(wc, /Понедельник/);
  assert.match(wc, /Пятница/);
  assert.match(wc, /Вечер отдыха\. Ниже — необязательная учебная сессия на 60 минут\./);
  assert.match(wc, /НЕОБЯЗАТЕЛЬНО/);
  assert.match(wc, /19:00–19:30/);
  assert.match(wc, /AI Engineering — изучение и практика/);
  assert.match(wc, /спортзал/);
  assert.doesNotMatch(wc, /Дополнительное направление/);
}

// renderMonth empty
{
  const doc = makeDoc();
  const state = { checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 };
  Rhythm.renderMonth(doc, state, schedule, now);
  assert.equal(doc.getElementById("avgPct").textContent, "—");
  assert.equal(doc.getElementById("trackedDays").textContent, "0");
  assert.equal(doc.getElementById("bestDay").textContent, "—");
  assert.match(doc.getElementById("calendar").innerHTML, /Пн/);
  const calLabels = doc.getElementById("calendar").innerHTML.match(/<div class="cal-label">/g) || [];
  assert.equal(calLabels.length, 7);
  assert.match(doc.getElementById("calendar").innerHTML, /<div class="cal-day[^"]*today[^"]*"><span class="num">8<\/span>/);
}

// renderMonth with one check
{
  const doc = makeDoc();
  const state = { checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 };
  state.checks["2020-01-06|mon-morning"] = true;
  Rhythm.renderMonth(doc, state, schedule, now);
  assert.equal(doc.getElementById("trackedDays").textContent, "1");
  assert.equal(doc.getElementById("completedCount").textContent, 1);
  assert.equal(doc.getElementById("avgPct").textContent, "11%");
}

// boot null
{
  const doc = makeDoc();
  const storage = makeStorage({});
  assert.doesNotThrow(function () { Rhythm.boot(doc, storage, null, now); });
  assert.notEqual(doc.getElementById("weekContent").textContent, "");
  assert.equal(doc.getElementById("calendar").innerHTML, "");
}

// boot real
{
  const doc = makeDoc();
  const storage = makeStorage({});
  Rhythm.boot(doc, storage, schedule, now);
  const switchExtra = doc.getElementById("switchExtra");
  const weekContent = doc.getElementById("weekContent");
  assert.equal(typeof switchExtra.listeners.click[0], "function");
  assert.equal(typeof weekContent.listeners.change[0], "function");
  switchExtra.listeners.click[0]();
  assert.equal(doc.getElementById("extraTitle").textContent, "KMP Installer");
  assert.equal(JSON.parse(storage.getItem("myRhythmSchedule_v3")).extras["2020-01-06"], "kmp-installer");
}

console.log("PASS");
