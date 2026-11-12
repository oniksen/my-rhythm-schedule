# Мой ритм — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разложить одностраничное расписание в статический сайт без сборки, с одним редактируемым файлом недели.

**Architecture:** `index.html` и `css/styles.css` повторяют текущую страницу. `js/schedule.js` только кладёт данные в `window.SCHEDULE`. `js/app.js` считает даты, ротацию и статистику чистыми функциями на `window.Rhythm`, затем рисует неделю и месяц. Тесты — обычные скрипты `node:assert`, без npm.

**Tech Stack:** HTML, CSS, классические скрипты (не ES-модули), `localStorage`, Node.js только для тестов.

**Spec:** `docs/superpowers/specs/2026-11-12-rhythm-schedule-design.md`

## Global Constraints

- UTF-8. Интерфейс по-русски. Тексты копировать из спеки, не перефразировать.
- Времена используют `–` (U+2013). В названиях учёбы и в подписи недели — `—` (U+2014).
- Ключи дат — локальный `YYYY-MM-DD`. `toISOString` и `new Date("YYYY-MM-DD")` запрещены.
- Неделя с понедельника. Якорь ротации `2020-01-06`.
- Ключ storage: `myRhythmSchedule_v3`. Ключ `myRhythmSchedule_v2` не читать.
- В `extras` лежит id занятия, ключ — понедельник недели.
- Необязательный пункт входит в процент дня. «Лучший день» — процент, не дата.
- `my_rhythm_schedule_updated.html` не менять и не удалять.
- Не создавать `package.json`, `vercel.json`, сборку. Не запускать `git init`, `git add`, `git commit`. Репозиторий не создавать.
- Других файлов приложения нет: `index.html`, `css/styles.css`, `js/schedule.js`, `js/app.js`, `README.md`, `.nojekyll`, плюс тесты в `tests/`.
- `js/schedule.js` без функций. `js/app.js` не дробить.
- Исполнитель задач — модель `opencode-go/beam-free`. После каждой задачи оркестратор сверяет главный узел и не идёт дальше, пока он не сошёлся.

## Review Focus

- Прошлая неделя (индекс −1 от якоря) должна показать KMP Installer, а не пустое занятие и не исключение. Тест: Task 3, `rotationIndex` / `activityFor` для `2019-12-30`.
- Ручной выбор, записанный на воскресенье, не должен менять неделю; выбор на понедельник должен совпасть с заголовком воскресного пункта. Тест: Task 3, `activityFor` игнорирует ключ воскресенья; Task 4, `sun-extra` равен `#extraTitle`.
- Строка `2020-01-06` должна остаться понедельником 6 января в локальной зоне, а не сдвинуться на 5-е. Тест: Task 3, `parseLocalDate`.
- День без галочек не входит в среднее; одна галочка из девяти даёт 11%, и необязательный пункт сидит в знаменателе. Тест: Task 3, `summarize` и `dayPercent`.
- Битый или отсутствующий `SCHEDULE` показывает текст в `#weekContent` и не бросает исключение; неизвестный id в storage игнорируется. Тест: Task 3, `activityFor` + `validateSchedule`; Task 4, `boot` с `schedule = null`.

---

### Task 1: Оболочка и стили

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `.nojekyll`
- Create: `tests/shell.test.js`
- Modify: none
- Test: `tests/shell.test.js`

**Interfaces:**
- Consumes: разметку и `<style>` из `my_rhythm_schedule_updated.html`; тексты из спеки.
- Produces: элемент `id="extraHelp"` на абзаце подсказки под кнопкой занятия (в исходнике id нет; он нужен, чтобы Task 4 подставлял текст из списка). Остальные id без изменений: `weekLabel`, `prevWeek`, `nextWeek`, `weekContent`, `extraTitle`, `extraDesc`, `switchExtra`, `prevMonth`, `nextMonth`, `monthName`, `calendar`, `avgPct`, `trackedDays`, `completedCount`, `bestDay`, `rating`. В `<head>` ссылка `css/styles.css`. Перед `</body>` ровно эти два тега, в этом порядке: `<script src="js/schedule.js"></script>` затем `<script src="js/app.js"></script>`.

- [ ] **Step 1: Write the failing test**

Создать `tests/shell.test.js`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/shell.test.js`
Expected: FAIL, `index.html` отсутствует.

- [ ] **Step 3: Extract the shell**

Скопировать тело и шапку исходного html. Вынести содержимое `<style>` в `css/styles.css` байт в байт, без тега `style`. Удалить встроенный `<script>`. Добавить ссылку на css и два script-тега из Interfaces. На абзац подсказки, который начинается с «Переключай между», поставить `id="extraHelp"`. Текст этого абзаца пока оставить исходным. Создать пустой `.nojekyll`. Исходный html не открывать на запись.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/shell.test.js`
Expected: PASS, без вывода ошибок.

- [ ] **Step 5: Stop**

Не коммитить. Не запускать git.

### Task 2: Файл расписания

**Files:**
- Create: `js/schedule.js`
- Create: `tests/schedule-data.test.js`
- Test: `tests/schedule-data.test.js`

**Interfaces:**
- Consumes: таблицы дней и блок `rotation` из спеки, раздел «Содержимое недели» и «Файл расписания».
- Produces: `window.SCHEDULE` со свойствами `anchorMonday`, `rotation`, `days`. У занятия поля `id`, `title`, `description`, `taskTitle`. У дня `id`, `name`, необязательные `markers` и `note`, массив `tasks`. У пункта `id`, `time`, плюс `title` и/или `rotation: true`, плюс необязательный `optional: true`. Id занятий: `ai-engineering`, `kmp-installer`. Rotation-пункт ровно один: `sun-extra`.

- [ ] **Step 1: Write the failing test**

Создать `tests/schedule-data.test.js`. Загрузить `js/schedule.js` через `node:vm` в контексте `{ window: {} }` и читать `context.window.SCHEDULE`.

Проверки:

- `anchorMonday === "2020-01-06"`
- `rotation` длины 2, id по порядку `ai-engineering`, `kmp-installer`
- `taskTitle` первого: `AI Engineering — изучение и практика`
- `taskTitle` второго: `KMP Installer — изучение и практика`
- `description` первого: `Изучение AI, LLM и инструментов`
- `description` второго: `Разработка KMP desktop installer`
- `days.length === 7`, имена по порядку: Понедельник, Вторник, Среда, Четверг, Пятница, Суббота, Воскресенье
- id дней: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- `markers` только у `mon` и `thu`, значение `["спортзал"]`
- `note` только у пятницы и равен `Вечер отдыха. Ниже — необязательная учебная сессия на 60 минут.`
- пятница: 9 пунктов; `fri-optional-study` имеет `optional: true`, время `18:00–19:00`; следом `fri-break` `19:00–19:30` `Перерыв`, `fri-free` `19:30–21:30` `Свободное время`, `fri-sleep` `21:30–22:00` `Подготовка ко сну`
- понедельничное утро: `Утро, завтрак и сборы`; четверговое утро: `Утро и сборы`
- `sun-extra` имеет `rotation: true`, время `11:00–12:00`, и не имеет используемого title (свойство отсутствует)
- все id пунктов уникальны; каждое `time` содержит `–` и не содержит дефис между часами
- названия с «Android Skills Tree» содержат `—`
- в файле нет `function`

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/schedule-data.test.js`
Expected: FAIL, файл отсутствует.

- [ ] **Step 3: Write `js/schedule.js`**

Скопировать дни из спеки без сокращений. Вверху комментарий по-русски: править только этот файл; новый пункт — новый id; старый id не переименовывать; новое занятие добавлять в конец `rotation`; ровно один пункт с `rotation: true`. Присвоить объект в `window.SCHEDULE`. Функций не добавлять.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/schedule-data.test.js`
Expected: PASS.

- [ ] **Step 5: Stop**

Не коммитить.

### Task 3: Чистая логика

**Files:**
- Create: `js/app.js`
- Create: `tests/logic.test.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `window.SCHEDULE` из Task 2, когда тест его загружает. Сам `app.js` данные не вшивает.
- Produces: `window.Rhythm` с функциями ниже. Если `document` нет, файл не должен трогать DOM и не должен бросать.

```javascript
Rhythm.storageKey // "myRhythmSchedule_v3"
Rhythm.parseLocalDate(iso) // Date, локальная полночь
Rhythm.dateKey(date) // "YYYY-MM-DD"
Rhythm.addDays(date, days) // новый Date, исходный не мутировать
Rhythm.mondayOf(date) // локальный понедельник
Rhythm.daysBetween(later, earlier) // целое число дней, later минус earlier
Rhythm.weekIndex(monday, anchorMonday) // anchorMonday — строка YYYY-MM-DD
Rhythm.rotationIndex(weekIndex, length) // 0 .. length-1, в том числе для отрицательных
Rhythm.activityFor(schedule, monday, extras) // элемент rotation
Rhythm.nextActivityId(rotation, currentId) // id следующего по кругу
Rhythm.checkKey(dateKey, taskId) // "date|id"
Rhythm.toggleCheck(checks, key, checked) // новый объект; false удаляет ключ; вход не мутировать
Rhythm.dayPercent(done, total) // Math.round(done / total * 100)
Rhythm.ratingFor(avg) // avg === null или число; строка из спеки
Rhythm.summarize(dayResults) // { avgText, trackedDays, completedCount, bestDayText, rating }
Rhythm.helpText(rotation)
Rhythm.resolveTaskTitle(task, activity)
Rhythm.dayMeta(date, markers)
Rhythm.weekLabel(start, end)
Rhythm.validateSchedule(schedule) // string[]; пустой массив значит годно
Rhythm.loadState(storage) // { checks, extras, weekOffset, monthOffset }
Rhythm.saveState(storage, state)
```

`summarize`: день учитывается, только если `done > 0`. `completedCount` — сумма `done`. Процент дня считается через `dayPercent`. Среднее — `Math.round` среднего этих процентов. `avgText` и `bestDayText` — `—`, если учитываемых дней нет, иначе число и `%`. `rating` — `ratingFor(null)` или `ratingFor(округлённое среднее)`.

`activityFor`: индекс от `schedule.anchorMonday`; если `extras[dateKey(monday)]` есть в `rotation`, вернуть его, иначе автоматический. Чужой ключ и неизвестный id игнорировать.

`helpText`: `По кругу: ${titles.join(" → ")}. Кнопка ставит следующее занятие на выбранную неделю. Выбор хранится отдельно для каждой недели.`

`validateSchedule` отклоняет объект, если нарушено любое правило из спеки, раздел «Проверка файла при старте». Сообщения — непустые русские строки. Годный объект даёт `[]`.

Обёртка файла, её не заменять на модули:

```javascript
(function (root) {
  const Rhythm = { storageKey: "myRhythmSchedule_v3" };
  root.Rhythm = Rhythm;
  if (!root.document) return;
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 1: Write the failing test**

Создать `tests/logic.test.js`. Загрузить `js/app.js` в `vm` с контекстом `{ window: {}, console }`, где `window` — сам контекст, чтобы `typeof window !== "undefined"`. `document` не задавать.

Обязательные утверждения:

```javascript
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
assert.deepEqual(toggled, {});
assert.deepEqual(checks, { "2020-01-06|mon-morning": true });
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
```

Плюс: `validateSchedule` на объекте без `rotation` даёт непустой массив; на объекте с двумя `rotation: true` — непустой; на `anchorMonday: "2020-01-07"` — непустой. Загрузить `js/schedule.js` в тот же `window` и ожидать `validateSchedule(window.SCHEDULE)` глубоко равным `[]`.

`loadState` при отсутствии ключа возвращает `{ checks: {}, extras: {}, weekOffset: 0, monthOffset: 0 }`. Если storage содержит только `myRhythmSchedule_v2` с галочками, `checks` всё равно `{}`. `saveState` пишет JSON в `myRhythmSchedule_v3`. Битый JSON даёт значения по умолчанию, без исключения.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/logic.test.js`
Expected: FAIL, `Rhythm` или файл отсутствует.

- [ ] **Step 3: Implement the functions in `js/app.js`**

Реализовать сигнатуры из Interfaces. Разницу дней считать через `Date.UTC` компонентов локальной даты и `Math.round`. Положительный модуль: `((index % length) + length) % length`. DOM не рисовать: при отсутствии `document` выйти после публикации `Rhythm`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/logic.test.js`
Expected: PASS.

- [ ] **Step 5: Stop**

Не коммитить.

### Task 4: Рендер и события

**Files:**
- Modify: `js/app.js`
- Create: `tests/render.test.js`
- Test: `tests/render.test.js`

**Interfaces:**
- Consumes: `window.Rhythm` из Task 3, `window.SCHEDULE` из Task 2, id из Task 1.
- Produces:

```javascript
Rhythm.tasksForDate(schedule, date, extras)
// массив { id, time, title, optional? } для локальной даты; title уже разрешён
Rhythm.renderWeek(doc, state, schedule, now)
Rhythm.renderMonth(doc, state, schedule, now)
Rhythm.boot(doc, storage, schedule, now)
```

`boot` вызывает `validateSchedule`. Если `schedule` пустой или ошибки непусты, пишет их в `#weekContent` через `textContent`, соединённые `\n`, не бросает, календарь не заполняет, слушатели не вешает. Иначе `loadState`, затем оба рендера, затем слушатели.

Слушатели: `#prevWeek` / `#nextWeek` меняют `weekOffset` на −1 / +1, сохраняют, рисуют неделю. `#prevMonth` / `#nextMonth` так же для `monthOffset` и рисуют месяц. `#switchExtra` пишет следующий id в `extras[dateKey(понедельник открытой недели)]` и рисует неделю. `change` на `#weekContent`: если у цели есть `dataset.key`, вызвать `toggleCheck`, сохранить, нарисовать неделю и месяц.

Классы разметки дня и пункта — как в исходнике: `section.day`, `day-head`, `day-name`, `day-meta`, `day-percent`, `day-empty`, `label.task`, `done`, `optional`, `task-main`, `task-time`, `task-title`, `optional-tag` с текстом `НЕОБЯЗАТЕЛЬНО`. Календарь: `cal-label`, `cal-day`, `empty`, `has-data`, `today`, `num`, `pct`.

- [ ] **Step 1: Write the failing test**

Создать `tests/render.test.js`. Собрать документ-заглушку: `getElementById` возвращает объект `{ textContent: "", innerHTML: "", dataset: {}, listeners: {}, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); } }` для каждого id из Task 1. Загрузить `js/schedule.js` и `js/app.js` в `vm`. Контекст: `window` равен контексту, `document` можно не задавать глобально — в рендер передаётся заглушка.

`now = Rhythm.parseLocalDate("2020-01-08")`. Пустой state. После `renderWeek`:

- `#weekLabel` содержит `2020` и `—`
- `#extraTitle` равен `AI Engineering`
- `#extraDesc` равен `Изучение AI, LLM и инструментов`
- `#extraHelp` равен строке `helpText`
- `#weekContent` содержит `Понедельник`, `Пятница`, текст пятничной note, `НЕОБЯЗАТЕЛЬНО`, `19:00–19:30`, `AI Engineering — изучение и практика`, `спортзал`
- `#weekContent` не содержит `Дополнительное направление` как название пункта

`renderMonth` при пустых галочках: `#avgPct` равен `—`, `#trackedDays` равен `0`, `#bestDay` равен `—`, `#calendar` содержит `Пн` и класс `today` на клетке с числом 8.

Поставить одну галочку `2020-01-06|mon-morning` и снова нарисовать месяц: `#trackedDays` равен `1`, `#completedCount` равен `1`, `#avgPct` равен `11%`.

`boot(doc, storage, null, now)` не бросает, `#weekContent.textContent` непустой, `#calendar.innerHTML` остаётся `""`.

`boot` с настоящим `SCHEDULE` вешает `click` на `#switchExtra` и `change` на `#weekContent`. Вызов click-слушателя меняет `#extraTitle` на `KMP Installer` и пишет в storage id `kmp-installer` по ключу `2020-01-06`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/render.test.js`
Expected: FAIL, `renderWeek` не определена.

- [ ] **Step 3: Implement render and boot in `js/app.js`**

Не дублировать формулы процента, ротации и оценки: звать функции Task 3. Неделя открытого экрана — `addDays(mondayOf(now), state.weekOffset * 7)`. Месяц — `new Date(now.getFullYear(), now.getMonth() + state.monthOffset, 1)`. Сегодня в календаре сравнивать с `dateKey(now)`, не с новым `new Date()` внутри рендера, чтобы тест с замороженным `now` был стабилен. Автозапуск только внутри ветки, где `root.document` уже есть: `boot(root.document, root.localStorage, root.SCHEDULE, new Date())`. В тесте без `document` эта строка не выполняется.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/logic.test.js` и `node tests/render.test.js`
Expected: оба PASS. Логика Task 3 не сломана.

- [ ] **Step 5: Stop**

Не коммитить.

### Task 5: README

**Files:**
- Create: `README.md`
- Create: `tests/readme.test.js`
- Test: `tests/readme.test.js`

**Interfaces:**
- Consumes: правила хостинга и правки из спеки, раздел README.
- Produces: `README.md` на русском.

- [ ] **Step 1: Write the failing test**

```javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const readme = fs.readFileSync(path.join(__dirname, "..", "README.md"), "utf8");
assert.match(readme, /index\.html/);
assert.match(readme, /js\/schedule\.js/);
assert.match(readme, /Vercel/);
assert.match(readme, /GitHub Pages/);
assert.match(readme, /\.nojekyll/);
assert.match(readme, /id/);
assert.doesNotMatch(readme, /npm install/);
assert.doesNotMatch(readme, /npm run build/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/readme.test.js`
Expected: FAIL, файла нет.

- [ ] **Step 3: Write the README**

Коротко: что это; двойной щелчок по `index.html`; править только `js/schedule.js`, новый id, новое занятие в конец списка; Vercel — framework None, пустая команда сборки, корень; GitHub Pages — папка `/ (root)`, `.nojekyll` уже в корне; данные только в этом браузере.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/readme.test.js` и затем все `node tests/*.test.js`
Expected: PASS.

- [ ] **Step 5: Stop**

Не коммитить.
