// app/constants/mockData.ts
export interface Task {
  id: number;
  title: string;
  tag: "Feature" | "Issue";
  status: string;
  startDate: string;
  endDate: string | null;
  createdBy: string;
}

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Terminar mockup de frontend de React",
    tag: "Feature",
    status: "En Progreso",
    startDate: "21 Feb",
    endDate: "24 Feb",
    createdBy: "Rodolfo (Yo)",
  },
  {
    id: 2,
    title: "Terminar mockup de bot de Telegram",
    tag: "Feature",
    status: "En Progreso",
    startDate: "23 Feb",
    endDate: "28 Feb",
    createdBy: "Alfonso",
  },
  {
    id: 3,
    title: "Arreglar contenedor de Docker",
    tag: "Issue",
    status: "En Progreso",
    startDate: "2 Mar",
    endDate: "5 Mar",
    createdBy: "Alfonso",
  },
  {
    id: 4,
    title: "Terminar mockup de frontend de React",
    tag: "Feature",
    status: "En Progreso",
    startDate: "10 Mar",
    endDate: "12 Mar",
    createdBy: "Rodolfo (Yo)",
  },
  {
    id: 5,
    title: "Terminar mockup de bot de Telegram",
    tag: "Feature",
    status: "En Progreso",
    startDate: "15 Mar",
    endDate: "18 Mar",
    createdBy: "Alfonso",
  },
  {
    id: 6,
    title: "Arreglar contenedor de Docker",
    tag: "Issue",
    status: "En Progreso",
    startDate: "20 Mar",
    endDate: null,
    createdBy: "Alfonso",
  },
  {
    id: 7,
    title: "Terminar mockup de frontend de React",
    tag: "Feature",
    status: "En Progreso",
    startDate: "28 Mar",
    endDate: "29 Mar",
    createdBy: "Rodolfo (Yo)",
  },
  {
    id: 8,
    title: "Terminar mockup de bot de Telegram",
    tag: "Feature",
    status: "En Progreso",
    startDate: "4 Abr",
    endDate: "10 Abr",
    createdBy: "Alfonso",
  },
];
