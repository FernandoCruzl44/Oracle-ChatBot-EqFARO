// views/Productivity/index.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import useTaskStore from "~/store";
import { generateAvatarColor } from "~/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Select } from "~/components/Select";
import { useSprintPerformance } from "./hooks/useSprintPerformance";
import { useDeveloperSprints } from "./hooks/useDeveloperSprints";
import { useLastSprint } from "./hooks/useLastSprint";
import OldProductivityView from "./old";
import { Modal } from "~/components/Modal";

const chartTheme = {
  chart: {
    margin: { top: -5, right: 0, left: 0, bottom: -15 },
    modalMargin: { top: 0, right: 30, left: 30, bottom: 20 },
  },

  tooltip: {
    contentStyle: {
      backgroundColor: "rgba(30, 27, 25, 1)",
      borderColor: "rgba(74, 70, 66, 0.8)",
      color: "#e2e8f0",
      borderRadius: "0.375rem",
      padding: "8px 12px",
      fontSize: "0.9rem",
      fontWeight: "600",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    },
    labelStyle: {
      fontWeight: "bold",
      marginBottom: "4px",
      color: "#f8fafc",
    },
    cursor: {
      fill: "rgba(200, 200, 200, 0.1)",
    },
  },

  axis: {
    tick: {
      fontSize: 14,
      fill: "#a0aec0",
    },
    label: {
      fill: "#ffffff",
      fontSize: 14,
    },
  },

  grid: {
    stroke: "#646464",
    strokeDasharray: "3 3",
  },

  legend: {
    style: {
      fontSize: "1rem",
      color: "#dfe5ee",
      paddingBottom: "5px",
    },
    iconType: "circle" as const,
    iconSize: 10,
  },

  modal_legend: {
    style: {
      fontSize: "1.15rem",
      color: "#dfe5ee",
      paddingBottom: "5px",
    },
    iconType: "circle" as const,
    iconSize: 12,
  },

  barLabel: {
    position: "insideBottom" as const,
    fill: "#0000008f",
    fontSize: 11,
    fontWeight: "900",
  },
  modal_barLabel: {
    position: "insideBottom" as const,
    fill: "#0000008f",
    fontSize: 14,
    fontWeight: "900",
  },

  bar: {
    radius: [5, 5, 0, 0] as [number, number, number, number],
    opacity: 1,
  },
};

const ProductivityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const sprints = useTaskStore((state) => state.sprints);
  const [selectedSprintId, setSelectedSprintId] = useState<string | number>(
    sprints.reduce((newest, current) => {
      const newestDate = new Date(newest.startDate);
      const currentDate = new Date(current.startDate);
      return currentDate > newestDate ? current : newest;
    }, sprints[0])?.id || "",
  );
  const sprintPerformance = useSprintPerformance("all");
  const developerSprints = useDeveloperSprints("all");
  const lastSprintData = useLastSprint(selectedSprintId);
  const initializeData = useTaskStore((state) => state.initializeData);

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Effect to update selectedSprintId when sprints change
  useEffect(() => {
    if (sprints.length > 0) {
      const newestSprint = sprints.reduce((newest, current) => {
        const newestDate = new Date(newest.startDate);
        const currentDate = new Date(current.startDate);
        return currentDate > newestDate ? current : newest;
      }, sprints[0]);
      setSelectedSprintId(newestSprint.id);
    }
  }, [sprints]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSprintChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSprintId(
      e.target.value === "all" ? "all" : parseInt(e.target.value, 10),
    );
  };

  const allMembers = new Set<string>();
  (sprintPerformance.isLoading
    ? sprintPerformance.loadingData
    : sprintPerformance.data
  ).forEach((sprint) => {
    Object.keys(sprint.memberHours).forEach((member) => allMembers.add(member));
  });
  const membersList = Array.from(allMembers);

  const sprintPerformanceData = sprintPerformance.isLoading
    ? sprintPerformance.loadingData
    : sprintPerformance.data;
  const developerSprintsData = developerSprints.isLoading
    ? developerSprints.loadingData
    : developerSprints.data;
  const lastSprintTableData = lastSprintData.isLoading
    ? lastSprintData.loadingData
    : lastSprintData.data;

  const renderAxisLabel = (
    value: string,
    angle: number,
    position: "insideLeft" | "bottom",
  ) => ({
    value,
    angle,
    position,
    style: chartTheme.axis.label,
  });

  const formatBarLabel = (value: number, type: "number" | "integer") => {
    if (value <= 0) return "";
    return type === "integer" ? value.toString() : value.toFixed(1);
  };

  return (
    <div
      className="h-full bg-[#181614] p-6"
      style={{
        backgroundImage:
          "url(https://static.oracle.com/cdn/apex/20.2.0.00.20/themes/theme_42/1.6/images/rw/textures/texture-13.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-white">Productividad</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-oc-outline-light/60 my-4 border-b">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("new")}
              className={`pb-2 text-sm font-medium transition-colors duration-150 ease-in-out ${
                activeTab === "new"
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              KPIs Principales
            </button>
            <button
              onClick={() => setActiveTab("old")}
              className={`pb-2 text-sm font-medium transition-colors duration-150 ease-in-out ${
                activeTab === "old"
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Otros
            </button>
          </div>
        </div>
      </div>

      {activeTab === "new" ? (
        <div className="flex h-[calc(100%-90px)] gap-4">
          <div className="flex w-2/3 flex-col gap-4">
            <div className="bg-oc-primary/80 border-oc-outline-light/60 flex h-1/3 flex-col rounded-lg border p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-medium text-gray-200">
                  Horas Trabajadas por Sprint
                </h2>
                <button
                  onClick={() => setActiveModal("hoursPerSprint")}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa fa-expand"></i>
                </button>
              </div>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sprintPerformanceData}
                    margin={chartTheme.chart.margin}
                  >
                    <CartesianGrid
                      strokeDasharray={chartTheme.grid.strokeDasharray}
                      stroke={chartTheme.grid.stroke}
                    />
                    <XAxis
                      dataKey="sprintName"
                      tick={chartTheme.axis.tick}
                      height={40}
                      interval={0}
                      textAnchor="middle"
                      style={{
                        fill: chartTheme.axis.label.fill,
                      }}
                    />
                    <YAxis
                      label={renderAxisLabel("Horas", -90, "insideLeft")}
                      tick={chartTheme.axis.tick}
                    />
                    <Tooltip
                      contentStyle={chartTheme.tooltip.contentStyle}
                      labelStyle={chartTheme.tooltip.labelStyle}
                      cursor={chartTheme.tooltip.cursor}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={chartTheme.legend.style}
                      iconType={chartTheme.legend.iconType}
                      iconSize={chartTheme.legend.iconSize}
                    />
                    <Bar
                      dataKey="totalHours"
                      fill="#aaaaaa"
                      radius={chartTheme.bar.radius}
                      name="Horas Trabajadas"
                      label={{
                        ...chartTheme.barLabel,
                        formatter: (value: number) =>
                          formatBarLabel(value, "number"),
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-oc-primary/80 border-oc-outline-light/60 flex h-1/3 flex-col rounded-lg border p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-200">
                  Horas Trabajadas por Sprint y Usuario
                </h2>
                <button
                  onClick={() => setActiveModal("hoursPerSprintUser")}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa fa-expand"></i>
                </button>
              </div>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sprintPerformanceData}
                    margin={chartTheme.chart.margin}
                  >
                    <CartesianGrid
                      strokeDasharray={chartTheme.grid.strokeDasharray}
                      stroke={chartTheme.grid.stroke}
                    />
                    <XAxis
                      dataKey="sprintName"
                      tick={chartTheme.axis.tick}
                      height={40}
                      interval={0}
                      textAnchor="middle"
                      style={{
                        fill: chartTheme.axis.label.fill,
                      }}
                    />
                    <YAxis
                      label={renderAxisLabel("Horas", -90, "insideLeft")}
                      tick={chartTheme.axis.tick}
                    />
                    <Tooltip
                      contentStyle={chartTheme.tooltip.contentStyle}
                      labelStyle={chartTheme.tooltip.labelStyle}
                      cursor={chartTheme.tooltip.cursor}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={chartTheme.legend.style}
                      iconType={chartTheme.legend.iconType}
                      iconSize={chartTheme.legend.iconSize}
                    />
                    {membersList.map((member, index) => (
                      <Bar
                        key={member}
                        dataKey={(data) => data.memberHours[member] || 0}
                        name={member}
                        radius={chartTheme.bar.radius}
                        fill={generateAvatarColor(member).chartColor}
                        opacity={chartTheme.bar.opacity}
                        label={{
                          ...chartTheme.barLabel,
                          formatter: (value: number) =>
                            formatBarLabel(value, "number"),
                        }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-oc-primary/80 border-oc-outline-light/60 flex h-1/3 flex-col rounded-lg border p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-200">
                  Tareas Completadas por Developer por Sprint
                </h2>
                <button
                  onClick={() => setActiveModal("tasksPerSprintUser")}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fa fa-expand"></i>
                </button>
              </div>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={developerSprintsData}
                    margin={chartTheme.chart.margin}
                  >
                    <CartesianGrid
                      strokeDasharray={chartTheme.grid.strokeDasharray}
                      stroke={chartTheme.grid.stroke}
                    />
                    <XAxis
                      dataKey="sprintName"
                      tick={chartTheme.axis.tick}
                      height={40}
                      interval={0}
                      textAnchor="middle"
                      style={{
                        fill: chartTheme.axis.label.fill,
                      }}
                    />
                    <YAxis
                      label={renderAxisLabel("Tareas", -90, "insideLeft")}
                      tick={chartTheme.axis.tick}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={chartTheme.tooltip.contentStyle}
                      labelStyle={chartTheme.tooltip.labelStyle}
                      cursor={chartTheme.tooltip.cursor}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={chartTheme.legend.style}
                      iconType={chartTheme.legend.iconType}
                      iconSize={chartTheme.legend.iconSize}
                    />
                    {membersList.map((member, index) => (
                      <Bar
                        key={member}
                        dataKey={(data) => data.memberTasks[member] || 0}
                        name={member}
                        radius={chartTheme.bar.radius}
                        opacity={chartTheme.bar.opacity}
                        fill={generateAvatarColor(member).chartColor}
                        label={{
                          ...chartTheme.barLabel,
                          formatter: (value: number) =>
                            formatBarLabel(value, "integer"),
                        }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="w-2/5">
            <div className="bg-oc-primary/80 border-oc-outline-light/60 flex h-full flex-col rounded-lg border p-3 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-200">
                  Reporte de Sprint
                </h2>
                <Select
                  value={String(selectedSprintId)}
                  onChange={handleSprintChange}
                  className="bg-oc-primary outline-oc-outline-light/90 h-9 min-w-[180px]"
                  options={sprints.map((sprint) => ({
                    value: String(sprint.id),
                    label: sprint.name,
                  }))}
                />
              </div>
              <div className="flex-grow overflow-auto">
                {lastSprintData.isLoading || sprints.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-lg text-gray-400">Cargando datos...</p>
                  </div>
                ) : Object.keys(lastSprintTableData.developerTasks).length ===
                  0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-lg text-gray-400">
                      No hay tareas para mostrar en este sprint.
                    </p>
                  </div>
                ) : (
                  <table className="w-full table-fixed border-separate border-spacing-x-2">
                    <thead className="bg-oc-primary sticky top-0 z-10 text-left text-gray-300">
                      <tr className="border-oc-outline-light/60 border-b">
                        <th className="pb-2 text-base">Tarea</th>
                        <th className="w-20 pb-2 text-base">Dev</th>
                        <th className="w-15 pb-2 text-base">H. Est.</th>
                        <th className="w-15 pb-2 text-base">H. Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(lastSprintTableData.developerTasks).map(
                        ([developer, data]) =>
                          data.tasks.map((task) => (
                            <tr
                              key={`${developer}-${task.taskTitle}`}
                              className="border-oc-outline-light/60 border-b"
                            >
                              <td className="py-2">
                                <div className="line-clamp-1 text-sm font-medium text-white">
                                  {task.taskTitle}
                                </div>
                              </td>
                              <td className="py-2 text-base text-gray-300">
                                <span
                                  style={{
                                    backgroundColor: `${generateAvatarColor(developer).backgroundColor}`,
                                    color: `${generateAvatarColor(developer).color}`,
                                  }}
                                  className="rounded-full px-2 py-0.5 text-sm font-bold"
                                >
                                  {developer}
                                </span>
                              </td>
                              <td className="py-2 text-base font-bold text-gray-300">
                                {task.totalEstimatedHours?.toFixed(1) || "N/A"}
                              </td>
                              <td className="py-2 text-base font-bold text-gray-300">
                                {task.totalActualHours?.toFixed(1) || "N/A"}
                              </td>
                            </tr>
                          )),
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100%-60px)]">
          <OldProductivityView />
        </div>
      )}

      <Modal
        isVisible={activeModal === "hoursPerSprint"}
        onClose={() => setActiveModal(null)}
        handleClose={() => setActiveModal(null)}
        className="w-[90vw] max-w-[1200px] p-6"
      >
        <div className="flex h-full w-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="pt-5 pl-5 text-xl font-medium text-white">
              Horas Trabajadas por Sprint
            </h2>
          </div>
          <div className="h-[70vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sprintPerformanceData}
                margin={chartTheme.chart.modalMargin}
              >
                <CartesianGrid
                  strokeDasharray={chartTheme.grid.strokeDasharray}
                  stroke={chartTheme.grid.stroke}
                />
                <XAxis
                  dataKey="sprintName"
                  tick={chartTheme.axis.tick}
                  height={40}
                  interval={0}
                  textAnchor="middle"
                />
                <YAxis
                  label={renderAxisLabel("Horas", -90, "insideLeft")}
                  tick={chartTheme.axis.tick}
                />
                <Tooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  labelStyle={chartTheme.tooltip.labelStyle}
                  cursor={chartTheme.tooltip.cursor}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={chartTheme.modal_legend.style}
                  iconType={chartTheme.modal_legend.iconType}
                  iconSize={chartTheme.modal_legend.iconSize}
                />
                <Bar
                  dataKey="totalHours"
                  fill="#aaaaaa"
                  name="Horas trabajadas"
                  radius={chartTheme.bar.radius}
                  opacity={chartTheme.bar.opacity}
                  label={{
                    ...chartTheme.modal_barLabel,
                    formatter: (value: number) =>
                      formatBarLabel(value, "number"),
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Modal>

      <Modal
        isVisible={activeModal === "hoursPerSprintUser"}
        onClose={() => setActiveModal(null)}
        handleClose={() => setActiveModal(null)}
        className="w-[90vw] max-w-[1200px] p-6"
      >
        <div className="flex h-full w-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="pt-5 pl-5 text-xl font-medium text-white">
              Horas Trabajadas por Sprint y Usuario
            </h2>
          </div>
          <div className="h-[70vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sprintPerformanceData}
                margin={chartTheme.chart.modalMargin}
              >
                <CartesianGrid
                  strokeDasharray={chartTheme.grid.strokeDasharray}
                  stroke={chartTheme.grid.stroke}
                />
                <XAxis
                  dataKey="sprintName"
                  tick={chartTheme.axis.tick}
                  height={40}
                  interval={0}
                  textAnchor="middle"
                />
                <YAxis
                  label={renderAxisLabel("Horas", -90, "insideLeft")}
                  tick={chartTheme.axis.tick}
                />
                <Tooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  labelStyle={chartTheme.tooltip.labelStyle}
                  cursor={chartTheme.tooltip.cursor}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={chartTheme.modal_legend.style}
                  iconType={chartTheme.modal_legend.iconType}
                  iconSize={chartTheme.modal_legend.iconSize}
                />
                {membersList.map((member, index) => (
                  <Bar
                    key={member}
                    dataKey={(data) => data.memberHours[member] || 0}
                    name={member}
                    radius={chartTheme.bar.radius}
                    opacity={chartTheme.bar.opacity}
                    fill={generateAvatarColor(member).chartColor}
                    label={{
                      ...chartTheme.modal_barLabel,
                      formatter: (value: number) =>
                        formatBarLabel(value, "number"),
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Modal>

      <Modal
        isVisible={activeModal === "tasksPerSprintUser"}
        onClose={() => setActiveModal(null)}
        handleClose={() => setActiveModal(null)}
        className="w-[90vw] max-w-[1200px] p-6"
      >
        <div className="flex h-full w-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="pt-5 pl-5 text-xl font-medium text-white">
              Tareas Completadas por Developer por Sprint
            </h2>
          </div>
          <div className="h-[70vh] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={developerSprintsData}
                margin={chartTheme.chart.modalMargin}
              >
                <CartesianGrid
                  strokeDasharray={chartTheme.grid.strokeDasharray}
                  stroke={chartTheme.grid.stroke}
                />
                <XAxis
                  dataKey="sprintName"
                  tick={chartTheme.axis.tick}
                  height={40}
                  interval={0}
                  textAnchor="middle"
                />
                <YAxis
                  label={renderAxisLabel("Tareas", -90, "insideLeft")}
                  tick={chartTheme.axis.tick}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={chartTheme.tooltip.contentStyle}
                  labelStyle={chartTheme.tooltip.labelStyle}
                  cursor={chartTheme.tooltip.cursor}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={chartTheme.modal_legend.style}
                  iconType={chartTheme.modal_legend.iconType}
                  iconSize={chartTheme.modal_legend.iconSize}
                />
                {membersList.map((member, index) => (
                  <Bar
                    key={member}
                    dataKey={(data) => data.memberTasks[member] || 0}
                    name={member}
                    radius={chartTheme.bar.radius}
                    opacity={chartTheme.bar.opacity}
                    fill={generateAvatarColor(member).chartColor}
                    label={{
                      ...chartTheme.modal_barLabel,
                      formatter: (value: number) =>
                        formatBarLabel(value, "integer"),
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductivityView;
