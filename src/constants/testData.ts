import { TaskItem } from "@/src/types/tasks";

export const MOCK_TASKS: TaskItem[] = [
  {
    id: "1",
    title: "Изучить Vue",
    status: "todo",
    note: "Цель на квартал — уверенно писать на Vue 3 + Composition API",
    children: [
      {
        id: "1-1",
        title: "Разобраться в стилизации",
        status: "done",
        note: null,
        children: [],
      },
      {
        id: "1-2",
        title: "Разобраться в Nuxt",
        status: "todo",
        note: "Начать с официальной документации, потом посмотреть примеры с vue-router и pinia",
        children: [
          {
            id: "1-2-1",
            title: "Прочитать документацию",
            status: "done",
            note: null,
            children: [],
          },
          {
            id: "1-2-2",
            title: "Сделать тестовый проект",
            status: "todo",
            note: "Маленький блог с SSR и одним API-эндпоинтом",
            children: [],
          },
        ],
      },
      {
        id: "1-3",
        title: "Написать простой сайт на Vue",
        status: "todo",
        note: null,
        children: [],
      },
    ],
  },
  {
    id: "2",
    title: "Прокачать физическую форму",
    status: "todo",
    note: null,
    children: [
      {
        id: "2-1",
        title: "Сходить в спортзал",
        status: "failed",
        note: "Не успел из-за работы, перенести на следующую неделю",
        children: [],
      },
      {
        id: "2-2",
        title: "Пробежать 5 км",
        status: "paused",
        note: null,
        children: [],
      },
    ],
  },
  {
    id: "3",
    title: "Прочитать книгу «Атомные привычки»",
    status: "done",
    note: "Очень зашла идея про «правило двух минут» — применять в ежедневных задачах",
    children: [],
  },
];
