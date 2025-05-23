import { useEffect, useState } from "react";
import TaskModal from "~/components/Modals/Task/TaskModal";
import CreateTaskModal from "~/components/Modals/Task/CreateTaskModal";
import { SprintTransitionModal } from "~/components/Modals/Sprint/SprintTransitionModal";
import { CreateSprintModal } from "~/components/Modals/Sprint/CreateSprintModal";
import SprintMigrationModal from "~/components/Modals/Sprint/SprintMigrationModal";
import useTaskStore from "~/store";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Tabs } from "./Tabs";
import { KanbanBoard } from "./KanbanBoard";
import { Table } from "./Table";
import { Pagination } from "./Pagination";
import type { Task, Sprint } from "~/types";
import { DivideModal } from "~/components/Modals/AI/DivideModal";
import ConfirmDeleteModal from "~/components/Modals/Task/ConfirmDeleteModal";
import { AIModal } from "~/components/Modals/AI/AIModal";
import { AITaskDivisionModal } from "~/components/Modals/AI/AITaskDivisionModal";

export default function TaskView() {
  const {
    tasks,
    currentUser,
    teams,
    isLoadingTasks,
    isInitialized,
    error,
    initializeData,
    fetchTasks,
    updateTaskStatus,
    selectTask,
    selectedTaskId,
    getTaskById,
    deleteTasks,
    sprints,
    selectedSprintId,
    selectSprint,
    fetchSprints,
    completeSprint,
    isLoadingSprints,
    getSprintsByTeam,
    getSprintById,
  } = useTaskStore();

  const enableLogs = false;
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const viewMode = useTaskStore((state) => state.viewMode);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isSprintTransitionModalOpen, setIsSprintTransitionModalOpen] =
    useState(false);
  const [isDivideModalOpen, setIsDivideModalOpen] = useState(false); // Renamed state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); // Added state
  const [isAITaskDivisionModalOpen, setIsAITaskDivisionModalOpen] =
    useState(false); // Added state
  const [tasksToBeProcessed, setTasksToBeProcessed] = useState<Task[]>([]); // Renamed state
  const [transitioningSprint, setTransitioningSprint] = useState<Sprint | null>(
    null,
  );
  const [initialSprintSelectionDone, setInitialSprintSelectionDone] =
    useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState<number[]>([]);
  const [isSprintMigrationModalOpen, setIsSprintMigrationModalOpen] =
    useState(false);

  const tasksPerPage = 30;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSprint = selectedSprintId
      ? task.sprintId === selectedSprintId
      : true;
    return matchesSearch && matchesSprint;
  });

  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + tasksPerPage,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / tasksPerPage),
  );

  const isManager = currentUser?.role === "manager";
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;
  const selectedSprint = selectedSprintId
    ? getSprintById(selectedSprintId)
    : null;

  useEffect(() => {
    if (sprints.length > 0 && isManager) {
      const today = new Date();
      const sprintToTransition = sprints.find((sprint) => {
        if (
          sprint.status !== "ACTIVE" ||
          sprint.id === transitioningSprint?.id
        ) {
          return false;
        }
        const endDate = new Date(sprint.endDate);
        endDate.setHours(23, 59, 59, 999);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysRemaining <= 3;
      });

      if (sprintToTransition && !isSprintTransitionModalOpen) {
        enableLogs &&
          console.log(
            "Triggering transition modal for sprint:",
            sprintToTransition.name,
          );
        setTransitioningSprint(sprintToTransition);
        setIsSprintTransitionModalOpen(true);
      }
    }
  }, [sprints, isManager, enableLogs]);

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchTasks(activeTab);

      selectSprint(null);
      setInitialSprintSelectionDone(false);

      if (activeTab !== "all" && activeTab !== "team") {
        fetchSprints(Number(activeTab));
      } else if (activeTab === "team" && !isManager && currentUser.teamId) {
        fetchSprints(currentUser.teamId);
      } else if (activeTab === "all" && isManager) {
        fetchSprints(undefined);
      } else {
        fetchSprints(currentUser.teamId);
      }
    }
  }, [
    isInitialized,
    currentUser,
    activeTab,
    fetchTasks,
    fetchSprints,
    isManager,
    teams,
  ]);

  useEffect(() => {
    if (!isLoadingSprints && !initialSprintSelectionDone) {
      enableLogs &&
        console.log(
          `Sprint selection for tab: ${activeTab}, isManager: ${isManager}, sprints count: ${sprints.length}`,
        );

      if (isManager && activeTab === "all") {
        enableLogs &&
          console.log("Manager on ALL tab - clearing sprint selection");
        selectSprint(null);
      } else if (sprints.length > 0) {
        const today = new Date();
        const sortedSprints = [...sprints].sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );

        enableLogs &&
          console.log(
            "Available sprints for selection:",
            sortedSprints.map(
              (s) => `${s.id}: ${s.name} (${s.startDate} to ${s.endDate})`,
            ),
          );

        const activeSprint = sortedSprints.find((sprint) => {
          const startDate = new Date(sprint.startDate);
          const endDate = new Date(sprint.endDate);
          endDate.setHours(23, 59, 59, 999);
          return today >= startDate && today <= endDate;
        });

        if (activeSprint) {
          enableLogs &&
            console.log(
              "Active sprint found:",
              activeSprint.name,
              "(ID:",
              activeSprint.id,
              ")",
            );
          selectSprint(activeSprint.id);
        } else if (sortedSprints.length > 0) {
          enableLogs &&
            console.log(
              "No active sprint found, selecting most recent:",
              sortedSprints[0].name,
              "(ID:",
              sortedSprints[0].id,
              ")",
            );
          selectSprint(sortedSprints[0].id);
        } else {
          enableLogs && console.log("No sprints available to select.");
          selectSprint(null);
        }
      } else {
        enableLogs && console.log("No sprints available to select.");
        selectSprint(null);
      }

      setInitialSprintSelectionDone(true);
    }
  }, [
    sprints,
    selectSprint,
    isLoadingSprints,
    initialSprintSelectionDone,
    isManager,
    activeTab,
    enableLogs,
  ]);

  const handleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleSelectAll = () => {
    setSelectedTasks((prev) =>
      prev.length === paginatedTasks.length
        ? []
        : paginatedTasks.map((task) => task.id),
    );
  };

  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  const handleTaskClick = (task: Task) => {
    selectTask(task.id);
  };

  const closeModal = () => {
    selectTask(null);
    setIsCreateModalOpen(false);
    setIsCreateSprintModalOpen(false);
    setIsSprintTransitionModalOpen(false);
    setTransitioningSprint(null);
    setIsDivideModalOpen(false);
    setIsAIModalOpen(false);
    setIsAITaskDivisionModalOpen(false);
  };

  const handleAddTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveNewTask = () => {
    closeModal();
  };

  const handleDeleteTasks = () => {
    if (selectedTasks.length === 0) return;

    setTasksToDelete(selectedTasks);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTasks = () => {
    console.log("Deleting tasks:", tasksToDelete);
    deleteTasks(tasksToDelete);
    setSelectedTasks([]);
    setIsDeleteConfirmOpen(false);
    setTasksToDelete([]);
  };

  const cancelDeleteTasks = () => {
    setIsDeleteConfirmOpen(false);
    setTasksToDelete([]);
  };

  const handleAIClick = () => {
    setIsAIModalOpen(true);
  };

  const handleGenerateTasksClick = () => {
    setIsAIModalOpen(false);
    // This would be implemented in the future
    // For now, just show a placeholder message
    alert(
      "La funcionalidad de generación de tareas estará disponible próximamente",
    );
  };

  const handleDivideTasksClick = () => {
    // This opens the AI task division modal where the AI will analyze and recommend tasks to divide
    setIsAIModalOpen(false);
    setIsAITaskDivisionModalOpen(true);
  };

  const handleDivideTasks = () => {
    if (selectedTasks.length === 0) return;

    // Get the full task objects for the selected task IDs
    const tasksToProcess = tasks.filter((task) =>
      selectedTasks.includes(task.id),
    );
    setTasksToBeProcessed(tasksToProcess);
    setIsDivideModalOpen(true);
  };

  const handleStatusChange = async (
    taskId: number,
    newStatus: string,
    taskData: Partial<Task>,
  ): Promise<void> => {
    try {
      await updateTaskStatus(taskId, newStatus, taskData);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const changeTab = (tab: string) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setCurrentPage(1);
      setSelectedTasks([]);
    }
  };

  const handleCompleteSprint = async (
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number,
  ) => {
    if (!transitioningSprint) return;

    try {
      await completeSprint(
        transitioningSprint.id,
        action,
        action === "moveToNextSprint" ? nextSprintId : undefined,
      );
      setIsSprintTransitionModalOpen(false);
      setTransitioningSprint(null);
    } catch (error) {
      console.error("Error completing sprint:", error);
    }
  };
  const handleCloseTransitionModal = () => {
    setIsSprintTransitionModalOpen(false);
    setTransitioningSprint(null);
  };

  const handleCloseDivideModal = () => {
    setIsDivideModalOpen(false);
    setTasksToBeProcessed([]);
    setSelectedTasks([]);
  };

  const getSelectorTeamId = (): number | undefined => {
    if (activeTab === "all") {
      return undefined;
    } else if (activeTab === "team" && currentUser?.teamId) {
      return currentUser.teamId;
    } else if (!isNaN(Number(activeTab))) {
      return Number(activeTab);
    }
    return undefined;
  };

  const selectorTeamId = getSelectorTeamId();
  const showSprintSelector = true;
  const showAssigneesColumn = true; // isManager || activeTab === "team";

  const handleMigrateTasks = () => {
    if (selectedSprintId === null) {
      alert("Por favor seleccione un sprint primero");
      return;
    }

    setIsSprintMigrationModalOpen(true);
  };

  const handleCloseMigrationModal = () => {
    setIsSprintMigrationModalOpen(false);
  };

  return (
    <div
      className="h-full bg-[#161411] p-6 pb-0"
      style={{
        backgroundImage:
          "url(https://static.oracle.com/cdn/apex/20.2.0.00.20/themes/theme_42/1.6/images/rw/textures/texture-13.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <Header currentUser={currentUser} />

        <Toolbar
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          setSearchTerm={setSearchTerm}
          setCurrentPage={setCurrentPage}
          handleAddTaskClick={handleAddTaskClick}
          showSprintSelector={showSprintSelector}
          selectorTeamId={selectorTeamId}
          selectedSprintId={selectedSprintId}
          selectSprint={selectSprint}
          isManager={isManager}
          setIsCreateSprintModalOpen={setIsCreateSprintModalOpen}
          isLoadingSprints={isLoadingSprints}
          selectedTasks={selectedTasks}
          handleDeleteTasks={handleDeleteTasks}
          handleDeselectAll={handleDeselectAll}
          handleDivideTasks={handleDivideTasks}
          handleMigrateTasks={handleMigrateTasks}
          isLoadingTasks={isLoadingTasks}
          viewMode={viewMode}
          setViewMode={setViewMode}
          teams={teams}
          handleAIClick={handleAIClick}
        />

        <div className="bg-oc-primary border-oc-outline-light flex flex-1 flex-col overflow-hidden rounded-lg border text-sm">
          <Tabs
            isManager={isManager}
            teams={teams}
            activeTab={activeTab}
            changeTab={changeTab}
            isLoadingTasks={isLoadingTasks}
            currentUser={currentUser}
            reloadTasks={() => {
              fetchTasks(activeTab);
            }}
          />

          {viewMode === "table" ? (
            <Table
              paginatedTasks={paginatedTasks}
              isLoadingTasks={isLoadingTasks}
              error={error}
              searchTerm={searchTerm}
              handleSelectAll={handleSelectAll}
              selectedTasks={selectedTasks}
              handleTaskSelection={handleTaskSelection}
              handleTaskClick={handleTaskClick}
              handleStatusChange={handleStatusChange}
              showAssigneesColumn={showAssigneesColumn}
              sprints={sprints}
              tasksPerPage={tasksPerPage}
            />
          ) : (
            <KanbanBoard
              isLoadingTasks={isLoadingTasks}
              error={error}
              searchTerm={searchTerm}
              handleSelectAll={handleSelectAll}
              selectedTasks={selectedTasks}
              handleTaskSelection={handleTaskSelection}
              handleTaskClick={handleTaskClick}
              handleStatusChange={handleStatusChange}
              showAssigneesColumn={showAssigneesColumn}
              sprints={sprints}
              tasks={filteredTasks}
            />
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          selectedTasks={selectedTasks}
          filteredTasks={filteredTasks}
          tasksPerPage={tasksPerPage}
          isLoadingTasks={isLoadingTasks}
          viewMode={viewMode}
        />
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={closeModal} />}

      {isCreateModalOpen && (
        <CreateTaskModal onClose={closeModal} onSave={handleSaveNewTask} />
      )}

      {isCreateSprintModalOpen && isManager && (
        <CreateSprintModal
          teamId={Number(activeTab)}
          onClose={() => setIsCreateSprintModalOpen(false)}
          onSave={() => {
            fetchSprints(Number(activeTab));
            setIsCreateSprintModalOpen(false);
          }}
        />
      )}

      {transitioningSprint && isSprintTransitionModalOpen && isManager && (
        <SprintTransitionModal
          sprint={transitioningSprint}
          onClose={handleCloseTransitionModal}
          onComplete={handleCompleteSprint}
        />
      )}

      {isDivideModalOpen && (
        <DivideModal
          onClose={handleCloseDivideModal}
          isVisible={isDivideModalOpen}
          initialTasks={tasksToBeProcessed}
        />
      )}
      {isAIModalOpen && (
        <AIModal
          onClose={() => setIsAIModalOpen(false)}
          isVisible={isAIModalOpen}
          onGenerateSelected={handleGenerateTasksClick}
          onDivideSelected={handleDivideTasksClick}
        />
      )}

      {isAITaskDivisionModalOpen && (
        <AITaskDivisionModal
          onClose={() => setIsAITaskDivisionModalOpen(false)}
          isVisible={isAITaskDivisionModalOpen}
          tasks={tasks}
        />
      )}

      {isDeleteConfirmOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteConfirmOpen}
          onClose={cancelDeleteTasks}
          onConfirm={confirmDeleteTasks}
          tasksCount={tasksToDelete.length}
        />
      )}

      {isSprintMigrationModalOpen && selectedSprint && (
        <SprintMigrationModal
          currentSprint={selectedSprint}
          onClose={handleCloseMigrationModal}
          preSelectedTaskIds={selectedTasks}
        />
      )}
    </div>
  );
}
