// app/views/TasksView.tsx
import { useEffect, useState } from "react";
import type { Task, Sprint } from "~/types";
import TaskModal from "~/components/Modals/Task/TaskModal";
import CreateTaskModal from "~/components/Modals/Task/CreateTaskModal";
import { SprintTransitionModal } from "~/components/Modals/Sprint/SprintTransitionModal";
import { CreateSprintModal } from "~/components/Modals/Sprint/CreateSprintModal";
import useTaskStore from "~/store";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { Tabs } from "./Tabs";
import { Table } from "./Table";
import { Pagination } from "./Pagination";

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
  } = useTaskStore();

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isSprintTransitionModalOpen, setIsSprintTransitionModalOpen] =
    useState(false);
  const [transitioningSprint, setTransitioningSprint] = useState<Sprint | null>(
    null
  );

  const tasksPerPage = 15;

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
    startIndex + tasksPerPage
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / tasksPerPage)
  );

  const isManager = currentUser?.role === "manager";
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

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
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining <= 3;
      });

      if (sprintToTransition && !isSprintTransitionModalOpen) {
        console.log(
          "Triggering transition modal for sprint:",
          sprintToTransition.name
        );
        setTransitioningSprint(sprintToTransition);
        setIsSprintTransitionModalOpen(true);
      }
    }
  }, [sprints, isManager]);

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchTasks(activeTab);

      if (activeTab !== "all" && activeTab !== "team") {
        fetchSprints(Number(activeTab));
      } else if (activeTab === "team" && !isManager && currentUser.teamId) {
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
  ]);

  const handleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTasks((prev) =>
      prev.length === paginatedTasks.length
        ? []
        : paginatedTasks.map((task) => task.id)
    );
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
  };

  const handleAddTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveNewTask = () => {
    setIsCreateModalOpen(false);
  };

  const handleDeleteTasks = () => {
    if (selectedTasks.length === 0) return;
    deleteTasks(selectedTasks)
      .then(() => {
        setSelectedTasks([]);
      })
      .catch((error) => {
        console.error("Error deleting tasks:", error);
      });
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskStatus(taskId, newStatus).catch((error) => {
      console.error("Error updating task status:", error);
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedTasks([]);
    selectSprint(null);
    setCurrentPage(1);
  };

  const handleCompleteSprint = async (
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number
  ) => {
    if (!transitioningSprint) return;
    try {
      await completeSprint(
        transitioningSprint.id,
        action,
        nextSprintId,
        activeTab
      );
    } catch (error) {
      console.error("Error completing sprint:", error);
    } finally {
      setIsSprintTransitionModalOpen(false);
      setTransitioningSprint(null);
    }
  };

  const handleCloseTransitionModal = () => {
    setIsSprintTransitionModalOpen(false);
  };

  const getSelectorTeamId = (): number | undefined => {
    if (activeTab === "all") {
      return undefined;
    } else if (activeTab === "team") {
      return isManager ? undefined : currentUser?.teamId;
    } else {
      return Number(activeTab);
    }
  };

  const selectorTeamId = getSelectorTeamId();
  const showSprintSelector = activeTab !== "all";
  const showAssigneesColumn =
    (isManager && activeTab !== "all") || (!isManager && activeTab === "team");

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
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
          isLoadingTasks={isLoadingTasks}
        />

        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm flex flex-col overflow-hidden">
          <Tabs
            isManager={isManager}
            teams={teams}
            activeTab={activeTab}
            changeTab={changeTab}
            isLoadingTasks={isLoadingTasks}
            currentUser={currentUser}
          />

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
        </div>

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          selectedTasks={selectedTasks}
          filteredTasks={filteredTasks}
          tasksPerPage={tasksPerPage}
          isLoadingTasks={isLoadingTasks}
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
    </div>
  );
}
