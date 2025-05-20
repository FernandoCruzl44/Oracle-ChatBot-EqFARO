export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getSprintName(
  sprints: any[],
  sprintId?: number | null,
): string {
  if (!sprintId) return "—";
  const sprint = sprints.find((s) => s.id === sprintId);
  return sprint ? sprint.name : "—";
}

export const generateAvatarColor = (
  name?: string | null,
): {
  backgroundColor: string;
  color: string;
  chartColor: string;
  tableColor: string;
} => {
  if (!name) {
    return {
      backgroundColor: `hsl(0, 0%, 80%)`,
      color: `hsl(0, 0%, 30%)`,
      chartColor: `hsl(0, 0%, 80%)`,
      tableColor: `hsla(0, 0%, 80%, 0.100)`,
    };
  }
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = (hash * 37) % 360;

  return {
    backgroundColor: `hsl(${hue}, 60%, 80%)`,
    color: `hsl(${hue}, 50%, 30%)`,
    chartColor: `hsl(${hue}, 38%, 60%)`,
    tableColor: `hsla(${hue}, 50%, 80%, 1)`,
  };
};
