// Менять расписание нужно только в этом файле.
// Новый пункт получает новый id. Старый id не переименовывать и не отдавать другому пункту: по нему лежат галочки.
// Порядок rotation — это порядок по неделям. Новое занятие добавлять в конец, иначе сдвинутся уже прошедшие недели.
// У занятия есть title (панель справа), description (подзаголовок панели) и taskTitle (текст пункта в воскресенье).
// Ровно один пункт недели помечен rotation: true. Его title не используется.

window.SCHEDULE = {
  anchorMonday: "2020-01-06",
  rotation: [
    {
      id: "ai-engineering",
      title: "AI Engineering",
      description: "Изучение AI, LLM и инструментов",
      taskTitle: "AI Engineering — изучение и практика"
    },
    {
      id: "kmp-installer",
      title: "KMP Installer",
      description: "Разработка KMP desktop installer",
      taskTitle: "KMP Installer — изучение и практика"
    }
  ],
  days: [
    {
      id: "mon",
      name: "Понедельник",
      markers: ["спортзал"],
      tasks: [
        { id: "mon-morning", time: "06:00–07:20", title: "Утро, завтрак и сборы" },
        { id: "mon-commute-in", time: "07:20–08:00", title: "Дорога на работу" },
        { id: "mon-work", time: "08:00–16:30", title: "Работа" },
        { id: "mon-commute-out", time: "16:30–17:10", title: "Дорога домой" },
        { id: "mon-snack", time: "17:10–17:40", title: "Перекус и отдых" },
        { id: "mon-gym", time: "17:40–19:30", title: "Спортзал" },
        { id: "mon-shower", time: "19:30–20:15", title: "Душ и ужин" },
        { id: "mon-free", time: "20:15–21:30", title: "Свободное время" },
        { id: "mon-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    },
    {
      id: "tue",
      name: "Вторник",
      tasks: [
        { id: "tue-morning", time: "06:00–07:20", title: "Утро и сборы" },
        { id: "tue-commute-in", time: "07:20–08:00", title: "Дорога на работу" },
        { id: "tue-work", time: "08:00–16:30", title: "Работа" },
        { id: "tue-commute-out", time: "16:30–17:10", title: "Дорога домой" },
        { id: "tue-dinner", time: "17:10–18:00", title: "Отдых и ужин" },
        { id: "tue-study", time: "18:00–19:30", title: "Android Skills Tree — изучение новой темы" },
        { id: "tue-break", time: "19:30–20:00", title: "Перерыв" },
        { id: "tue-free", time: "20:00–21:30", title: "Свободное время" },
        { id: "tue-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    },
    {
      id: "wed",
      name: "Среда",
      tasks: [
        { id: "wed-morning", time: "06:00–07:20", title: "Утро и сборы" },
        { id: "wed-commute-in", time: "07:20–08:00", title: "Дорога на работу" },
        { id: "wed-work", time: "08:00–16:30", title: "Работа" },
        { id: "wed-commute-out", time: "16:30–17:10", title: "Дорога домой" },
        { id: "wed-dinner", time: "17:10–18:00", title: "Отдых и ужин" },
        { id: "wed-study", time: "18:00–19:30", title: "Android Skills Tree — практика и закрепление" },
        { id: "wed-break", time: "19:30–20:00", title: "Перерыв" },
        { id: "wed-free", time: "20:00–21:30", title: "Свободное время" },
        { id: "wed-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    },
    {
      id: "thu",
      name: "Четверг",
      markers: ["спортзал"],
      tasks: [
        { id: "thu-morning", time: "06:00–07:20", title: "Утро и сборы" },
        { id: "thu-commute-in", time: "07:20–08:00", title: "Дорога на работу" },
        { id: "thu-work", time: "08:00–16:30", title: "Работа" },
        { id: "thu-commute-out", time: "16:30–17:10", title: "Дорога домой" },
        { id: "thu-snack", time: "17:10–17:40", title: "Перекус и отдых" },
        { id: "thu-gym", time: "17:40–19:30", title: "Спортзал" },
        { id: "thu-shower", time: "19:30–20:15", title: "Душ и ужин" },
        { id: "thu-free", time: "20:15–21:30", title: "Свободное время" },
        { id: "thu-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    },
    {
      id: "fri",
      name: "Пятница",
      note: "Вечер отдыха. Ниже — необязательная учебная сессия на 60 минут.",
      tasks: [
        { id: "fri-morning", time: "06:00–07:20", title: "Утро и сборы" },
        { id: "fri-commute-in", time: "07:20–08:00", title: "Дорога на работу" },
        { id: "fri-work", time: "08:00–16:30", title: "Работа" },
        { id: "fri-commute-out", time: "16:30–17:10", title: "Дорога домой" },
        { id: "fri-dinner", time: "17:10–18:00", title: "Отдых и ужин" },
        { id: "fri-optional-study", time: "18:00–19:00", title: "Android Skills Tree — необязательное закрепление", optional: true },
        { id: "fri-break", time: "19:00–19:30", title: "Перерыв" },
        { id: "fri-free", time: "19:30–21:30", title: "Свободное время" },
        { id: "fri-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    },
    {
      id: "sat",
      name: "Суббота",
      tasks: [
        { id: "sat-morning", time: "07:30–09:00", title: "Подъём, завтрак и бытовые дела" },
        { id: "sat-study", time: "09:00–11:00", title: "Android Skills Tree — углублённое изучение и практика" },
        { id: "sat-walk", time: "11:00–12:00", title: "Прогулка и перерыв" },
        { id: "sat-lunch", time: "12:00–13:00", title: "Обед" },
        { id: "sat-rest", time: "13:00–14:00", title: "Отдых" },
        { id: "sat-finflow", time: "14:00–15:30", title: "FinFlow — разработка" },
        { id: "sat-free", time: "15:30–22:00", title: "Свободное время и хобби" }
      ]
    },
    {
      id: "sun",
      name: "Воскресенье",
      tasks: [
        { id: "sun-morning", time: "07:30–09:30", title: "Подъём, завтрак и свободное время" },
        { id: "sun-study", time: "09:30–10:30", title: "Развитие Android Skills Tree" },
        { id: "sun-break", time: "10:30–11:00", title: "Перерыв" },
        { id: "sun-extra", time: "11:00–12:00", rotation: true },
        { id: "sun-lunch", time: "12:00–14:00", title: "Обед и бытовые дела" },
        { id: "sun-rest", time: "14:00–18:00", title: "Отдых, прогулка и игры" },
        { id: "sun-prep", time: "18:00–18:30", title: "Подготовка к рабочей неделе" },
        { id: "sun-free", time: "18:30–21:30", title: "Свободное время" },
        { id: "sun-sleep", time: "21:30–22:00", title: "Подготовка ко сну" }
      ]
    }
  ]
};
