const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
const original = fs.readFileSync(path.join(root, "my_rhythm_schedule_updated.html"), "utf8");
assert.equal(fs.readFileSync(path.join(root, ".nojekyll"), "utf8"), "");
for (const id of ["weekLabel","prevWeek","nextWeek","weekContent","extraTitle","extraDesc","extraHelp","switchExtra","prevMonth","nextMonth","monthName","calendar","avgPct","trackedDays","completedCount","bestDay","rating"]) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.doesNotMatch(html, /<style[\s>]/i);
assert.doesNotMatch(html, /myRhythmSchedule_v2/);
assert.match(html, /href="css\/styles\.css"/);
assert.match(html, /<script src="js\/schedule\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/);
assert.match(html, /Мой ритм — расписание/);
assert.match(html, /Переключай между AI Engineering и KMP Installer/);
assert.match(html, /Главный фокус сейчас/);
assert.match(html, /Пн и Чт — спортзал/);
assert.match(html, /Данные хранятся локально в этом браузере/);
assert.match(html, /aria-label="Предыдущая неделя"/);
assert.match(css, /--olive:#526b55/);
assert.match(css, /\.task\.optional/);
assert.doesNotMatch(css, /<style/i);
assert.match(original, /myRhythmSchedule_v2/);
