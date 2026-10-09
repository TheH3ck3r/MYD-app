import { TaskItem } from "@/types/tasks";

export const MOCK_TASKS: TaskItem[] = [
  {
    id: "1",
    title: "Изучить Vue",
    status: "todo",
    children: [
      {
        id: "1-1",
        title: "Разобраться в стилизации",
        status: "done",
        children: [],
      },
      {
        id: "1-2",
        title: "Разобраться в Nuxt",
        status: "todo",
        children: [
          {
            id: "1-2-1",
            title: "Прочитать документацию",
            status: "done",
            children: [],
          },
          {
            id: "1-2-2",
            title: "Сделать тестовый проект",
            status: "todo",
            children: [],
          },
        ],
      },
      {
        id: "1-3",
        title: "Написать простой сайт на Vue",
        status: "todo",
        children: [],
      },
    ],
  },
  {
    id: "2",
    title: "Прокачать физическую форму",
    status: "todo",
    children: [
      {
        id: "2-1",
        title: "Сходить в спортзал",
        status: "failed",
        children: [],
      },
      {
        id: "2-2",
        title: "Пробежать 5 км",
        status: "paused",
        children: [],
      },
    ],
  },
  {
    id: "3",
    title: "Прочитать книгу «Атомные привычки»",
    status: "done",
    children: [],
  },
];
