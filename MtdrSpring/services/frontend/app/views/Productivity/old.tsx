// views/Productivity/index.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import useTaskStore from "~/store";
import type { KpiData } from "~/store/slices/productivitySlice";
import type { Team, Sprint } from "~/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card } from "~/components/Card";
import { Select } from "~/components/Select";

const OldProductivityView: React.FC = () => {
  const kpiData = useTaskStore((state) => state.kpiData);
  const isLoadingKpi = useTaskStore((state) => state.isLoadingKpi);
  const error = useTaskStore((state) => state.error);
  const fetchKpiData = useTaskStore((state) => state.fetchKpiData);
  const teams = useTaskStore((state) => state.teams);
  const sprints = useTaskStore((state) => state.sprints);
  const currentUser = useTaskStore((state) => state.currentUser);
  const statsViewMode = useTaskStore((state) => state.statsViewMode);
  const toggleStatsViewMode = useTaskStore(
    (state) => state.toggleStatsViewMode,
  );
  const initializeData = useTaskStore((state) => state.initializeData);
  const fetchTeams = useTaskStore((state) => state.fetchTeams);

  useEffect(() => {
    if (currentUser && teams.length === 0) {
      if (currentUser.role === "manager") {
        fetchTeams();
      } else {
        fetchTeams();
      }
    }
  }, [currentUser, teams.length, fetchTeams]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const [selectedTeamId, setSelectedTeamId] = useState<string | number>("all");
  const [selectedSprintId, setSelectedSprintId] = useState<string | number>(
    "all",
  );

  const isManager = currentUser?.role === "manager";
  const userTeamId = currentUser?.teamId || null;

  // Filter available teams *before* using it in useEffect
  const availableTeams = isManager
    ? teams
    : teams.filter((team) => team.id === userTeamId);

  // Default team selection logic
  useEffect(() => {
    if (!isManager && userTeamId) {
      setSelectedTeamId(userTeamId);
    } else if (
      isManager &&
      statsViewMode === "sprint" &&
      selectedTeamId === "all"
    ) {
      // If manager is in sprint view and 'all' is selected, default to the first available team
      if (availableTeams.length > 0) {
        // Ensure availableTeams has been populated before accessing its elements
        setSelectedTeamId(availableTeams[0].id);
      }
    }
    // If not manager and not in sprint view, 'all' is fine initially
    // If manager and not in sprint view, 'all' is fine
  }, [isManager, userTeamId, statsViewMode, availableTeams, teams]); // Added teams to dependencies

  useEffect(() => {
    const filters: {
      teamId?: number;
      sprintId?: number;
      isTeamView?: boolean; // Corresponds to 'aggregated' in backend
    } = {};
    const teamIdNum = parseInt(String(selectedTeamId), 10);
    const sprintIdNum = parseInt(String(selectedSprintId), 10);

    // Prevent fetching in 'Por Sprints' view if no specific team is selected
    if (statsViewMode === "sprint" && selectedTeamId === "all") {
      // Clear data or do nothing, handled by conditional rendering below
      // console.log("Select a team to view sprint data.");
      return;
    }

    if (!isNaN(teamIdNum) && selectedTeamId !== "all") {
      filters.teamId = teamIdNum;
    }
    if (!isNaN(sprintIdNum) && selectedSprintId !== "all") {
      filters.sprintId = sprintIdNum;
      // If filtering by a specific sprint, teamId might become redundant depending on API
      // Keep teamId for now unless API requires removing it when sprintId is present
      // delete filters.teamId;
    }

    // Set aggregation flag based on view mode
    if (statsViewMode === "sprint") {
      filters.isTeamView = true; // Request aggregated data (by sprint if teamId is present, by team otherwise)
    }

    fetchKpiData(filters);
  }, [fetchKpiData, selectedTeamId, selectedSprintId, statsViewMode]);

  const handleTeamChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTeamId(value === "all" ? "all" : parseInt(value, 10));
    setSelectedSprintId("all");
  };

  const handleSprintChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSprintId(value === "all" ? "all" : parseInt(value, 10));
  };

  const chartData = kpiData.map((item: KpiData) => {
    const actual = item.totalActualHours ?? 0;
    const estimated = item.totalEstimatedHours ?? 0;
    const completedTasks = item.completedTasks ?? 0;
    // Ratio calculation: Horas Reales / Horas Estimadas
    const ratio =
      estimated > 0 ? actual / estimated : actual > 0 ? Infinity : 1;
    const averageTime = completedTasks > 0 ? actual / completedTasks : null;

    // Determine name based on view mode
    // In sprint view, we should use sprint name; in member view, use member name
    let name = "Unknown";
    if (statsViewMode === "sprint") {
      name = item.sprintName || item.memberName || "Unknown";
    } else {
      name = item.memberName || "Unknown";
    }

    return {
      name: name,
      EstimatedHours: estimated,
      ActualHours: actual,
      CompletedTasks: completedTasks,
      EstimationRatio: ratio === Infinity ? null : ratio,
      AverageActualTime: averageTime,
    };
  });

  // Filter available sprints based on the *currently selected* team
  const availableSprints = sprints.filter((sprint: Sprint) => {
    const currentTeamId =
      typeof selectedTeamId === "string"
        ? parseInt(selectedTeamId, 10)
        : selectedTeamId;
    return selectedTeamId === "all" || sprint.teamId === currentTeamId;
  });

  // Options for the Team Select dropdown
  const teamSelectOptions = [
    // Conditionally include "Todos los Equipos" only if NOT in 'sprint' view or if user is not a manager
    // Update: Always remove "Todos los Equipos" when in 'sprint' view for managers
    ...(statsViewMode !== "sprint" && isManager
      ? [{ value: "all", label: "Todos los Equipos" }]
      : []),
    ...availableTeams.map((team: Team) => ({
      value: String(team.id),
      label: team.name,
    })),
  ];

  const tooltipContentStyle = {
    backgroundColor: "rgba(30, 27, 25, 0.9)",
    borderColor: "rgba(74, 70, 66, 0.8)",
    color: "#e2e8f0",
    borderRadius: "0.375rem",
    padding: "8px 12px",
    fontSize: "0.75rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  };

  const tooltipLabelStyle = {
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#f8fafc",
  };

  const axisTickStyle = {
    fontSize: 14,
    fill: "#ffffff",
  };

  const gridStrokeColor = "#646464";
  const legendStyle = {
    fontSize: "0.75rem",
    color: "#a0aec0",
  };

  return (
    <div
      className="h-[calc(100%-30px)] bg-[#181614]"
      style={{
        backgroundImage:
          "url(https://static.oracle.com/cdn/apex/20.2.0.00.20/themes/theme_42/1.6/images/rw/textures/texture-13.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between py-4 pt-0">
          <div className="ml-[1px] flex items-center gap-3">
            <div>
              <label htmlFor="team-select" className="sr-only">
                Filtrar por Equipo
              </label>
              <Select
                id="team-select"
                value={String(selectedTeamId)}
                onChange={handleTeamChange}
                className="bg-oc-primary outline-oc-outline-light/90 h-9 min-w-[180px]"
                // Disable if user is not a manager and has a team assigned
                disabled={!isManager && userTeamId !== null}
                options={teamSelectOptions} // Use the dynamically generated options
              />
            </div>
            {statsViewMode !== "sprint" && (
              <div>
                <label htmlFor="sprint-select" className="sr-only">
                  Filtrar por Sprint
                </label>
                <Select
                  id="sprint-select"
                  value={String(selectedSprintId)}
                  onChange={handleSprintChange}
                  // Disable if no specific team is selected OR if the selected team has no sprints
                  disabled={
                    selectedTeamId === "all" || availableSprints.length === 0
                  }
                  className="bg-oc-primary outline-oc-outline-light/90 h-9 min-w-[180px]"
                  options={[
                    // Adjust label based on context
                    {
                      value: "all",
                      label:
                        selectedTeamId === "all"
                          ? "Todos los Sprints (Equipo)"
                          : "Todos los Sprints del Equipo",
                    },
                    ...availableSprints.map((sprint: Sprint) => ({
                      value: String(sprint.id),
                      label: `${sprint.name}`,
                    })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-2">
            <div className="border-oc-outline-light flex flex-shrink-0 overflow-hidden rounded-lg border">
              {/* Button for "Por Sprints" view */}
              <button
                onClick={toggleStatsViewMode}
                className={`flex items-center p-2 text-sm 2xl:px-3 2xl:py-2 ${
                  statsViewMode === "sprint"
                    ? "bg-stone-700 text-white"
                    : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
                }`}
                title="Vista por Sprints (Equipo)" // Updated title
                aria-label="Vista por Sprints" // Updated aria-label
              >
                <i className="fa fa-calendar-alt 2xl:mr-2"></i>
                <span className="hidden 2xl:inline">Por Sprints</span>{" "}
                {/* Updated label */}
              </button>
              {/* Button for "Por Persona" view */}
              <button
                onClick={toggleStatsViewMode}
                className={`flex items-center p-2 text-sm 2xl:px-3 2xl:py-2 ${
                  statsViewMode === "member"
                    ? "bg-stone-700 text-white"
                    : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
                }`}
                title="Vista por Persona (Individual)" // Updated title
                aria-label="Vista por Persona" // Updated aria-label
              >
                <i className="fa fa-user 2xl:mr-2"></i>
                <span className="hidden 2xl:inline">Por Persona</span>{" "}
                {/* Updated label */}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-oc-primary border-oc-outline-light flex flex-1 flex-col overflow-hidden rounded-lg border text-sm">
          <div className="flex-grow overflow-y-auto p-4">
            {isLoadingKpi && (
              <div className="flex h-64 items-center justify-center">
                <p className="text-gray-400">Cargando datos de KPI...</p>
              </div>
            )}
            {error && (
              <div
                className="relative m-4 rounded border border-red-700 bg-red-900/50 px-4 py-3 text-red-300"
                role="alert"
              >
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            {/* Conditional Rendering: Prompt or Charts */}
            {!isLoadingKpi &&
              !error &&
              statsViewMode === "sprint" &&
              selectedTeamId === "all" && (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-gray-400">
                    Por favor, seleccione un equipo para ver las estadísticas
                    por sprints.
                  </p>
                </div>
              )}

            {/* Show charts only if not loading, no error, and (not in sprint view OR a team is selected) */}
            {!isLoadingKpi &&
              !error &&
              !(statsViewMode === "sprint" && selectedTeamId === "all") && (
                <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
                  <Card className="bg-oc-primary/80 border-oc-outline-light/60 flex h-full flex-col rounded-lg border p-4 backdrop-blur-sm">
                    <h2 className="mb-3 text-base font-medium text-gray-300">
                      Horas Reales
                    </h2>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStrokeColor}
                          />
                          <XAxis dataKey="name" tick={axisTickStyle} />
                          <YAxis tick={axisTickStyle} />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: "rgba(200, 200, 200, 0.1)" }}
                          />
                          <Legend wrapperStyle={legendStyle} />
                          {/* <Bar
                            dataKey="EstimatedHours"
                            fill="#a78bfa"
                            name="Estimadas"
                            unit="h"
                          /> */}
                          <Bar
                            dataKey="ActualHours"
                            fill="#6ee7b7"
                            name="Reales"
                            unit="h"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="bg-oc-primary/80 border-oc-outline-light/60 flex h-full flex-col rounded-lg border p-4 backdrop-blur-sm">
                    <h2 className="mb-3 text-base font-medium text-gray-300">
                      Horas Reales / Horas Estimadas {/* Updated Label */}
                    </h2>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStrokeColor}
                          />
                          <XAxis dataKey="name" tick={axisTickStyle} />
                          <YAxis domain={[0, "auto"]} tick={axisTickStyle} />
                          <ReferenceLine
                            y={1}
                            stroke="#e53e3e"
                            strokeDasharray="3 3"
                            label={{
                              value: "Objetivo",
                              position: "insideTopRight",
                              fill: "#e53e3e",
                              fontSize: 10,
                            }}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const ratio = data.EstimationRatio;
                                const tasks = data.CompletedTasks;
                                // Adjust tooltip label based on view mode
                                const entityLabel =
                                  statsViewMode === "sprint"
                                    ? "Sprint"
                                    : "Usuario";
                                return (
                                  <div
                                    style={tooltipContentStyle}
                                    className="text-sm"
                                  >
                                    <p
                                      style={tooltipLabelStyle}
                                    >{`${entityLabel}: ${label}`}</p>
                                    <p>{`Ratio: ${
                                      ratio !== null ? ratio.toFixed(2) : "N/A"
                                    }`}</p>
                                    <p className="opacity-80">{`(${tasks} tareas completadas)`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                            cursor={{ fill: "rgba(200, 200, 200, 0.1)" }}
                          />
                          <Legend wrapperStyle={legendStyle} />
                          <Bar
                            dataKey="EstimationRatio"
                            fill="#fbbf24"
                            name="Ratio Real/Est."
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Ratio &gt; 1 más largo que lo est. / &lt; 1 más rápido que
                      lo est.
                    </p>
                  </Card>

                  <Card className="bg-oc-primary/80 border-oc-outline-light/60 flex h-full flex-col rounded-lg border p-4 backdrop-blur-sm">
                    <h2 className="mb-3 text-base font-medium text-gray-300">
                      Tareas Completadas
                    </h2>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStrokeColor}
                          />
                          <XAxis dataKey="name" tick={axisTickStyle} />
                          <YAxis allowDecimals={false} tick={axisTickStyle} />
                          <Tooltip
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: "rgba(200, 200, 200, 0.1)" }}
                          />
                          <Legend wrapperStyle={legendStyle} />
                          <Bar
                            dataKey="CompletedTasks"
                            fill="#60a5fa"
                            name="Tareas Completadas"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="bg-oc-primary/80 border-oc-outline-light/60 flex h-full flex-col rounded-lg border p-4 backdrop-blur-sm">
                    <h2 className="mb-3 text-base font-medium text-gray-300">
                      Tiempo Promedio por Tarea
                    </h2>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridStrokeColor}
                          />
                          <XAxis dataKey="name" tick={axisTickStyle} />
                          <YAxis unit="h" tick={axisTickStyle} />
                          <Tooltip
                            formatter={(value: any) =>
                              typeof value === "number"
                                ? `${value.toFixed(1)}h`
                                : "N/A"
                            }
                            labelFormatter={(label: string) =>
                              `${statsViewMode === "sprint" ? "Sprint" : "Usuario"}: ${label}`
                            }
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: "rgba(200, 200, 200, 0.1)" }}
                          />
                          <Legend wrapperStyle={legendStyle} />
                          <Bar
                            dataKey="AverageActualTime"
                            fill="#f87171"
                            name="Tiempo Prom. / Tarea"
                            unit="h"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Promedio de horas por tarea completada.
                    </p>
                  </Card>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldProductivityView;
