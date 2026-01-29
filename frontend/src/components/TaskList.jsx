import { useState, useEffect } from "react";
import { getProjectTasks, updateTaskStatus, deleteTask } from "../services/api";
import styles from "./TaskList.module.css";

export default function TaskList({ projectId, refreshKey }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("TODO");

  useEffect(() => {
    loadTasks();
  }, [projectId, refreshKey]);

  const loadTasks = async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getProjectTasks(projectId, {
        status: filter,
      });
      setTasks(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    const transitions = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };

    const newStatus = transitions[currentStatus];

    try {
      await updateTaskStatus(taskId, newStatus);
      loadTasks();
    } catch (err) {
      setError(err.message || "Failed to update task status");
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (err) {
      setError(err.message || "Failed to delete task");
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "TODO":
        return "#94a3b8";
      case "IN_PROGRESS":
        return "#f59e0b";
      case "DONE":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "HIGH":
        return "🔴";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "⚪";
    }
  };

  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        <p>Select a project to view tasks</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No tasks found in {filter} status</p>
      </div>
    );
  }

  return (
    <div className={styles.taskListContainer}>
      <div className={styles.filterButtons}>
        {["TODO", "IN_PROGRESS", "DONE"].map((status) => (
          <button
            key={status}
            className={`${styles.filterButton} ${
              filter === status ? styles.active : ""
            }`}
            onClick={() => setFilter(status)}
          >
            {status === "TODO" && "📋"}
            {status === "IN_PROGRESS" && "⚙️"}
            {status === "DONE" && "✅"}
            {status}
          </button>
        ))}
      </div>

      <div className={styles.tasksList}>
        {tasks.map((task) => (
          <div key={task._id} className={styles.taskCard}>
            <div className={styles.taskHeader}>
              <div className={styles.taskTitleSection}>
                <span className={styles.priority}>
                  {getPriorityIcon(task.priority)}
                </span>
                <h3 className={styles.taskTitle}>{task.title}</h3>
              </div>
              <div className={styles.taskActions}>
                <button
                  className={styles.statusButton}
                  onClick={() =>
                    handleStatusChange(task._id, task.status)
                  }
                  style={{ color: getStatusColor(task.status) }}
                >
                  {task.status}
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteTask(task._id)}
                >
                  🗑️
                </button>
              </div>
            </div>

            {task.description && (
              <p className={styles.taskDescription}>{task.description}</p>
            )}

            <div className={styles.taskFooter}>
              {task.assignedTo && (
                <span className={styles.assignedTo}>
                  👤 {task.assignedTo.name}
                </span>
              )}
              {task.dueDate && (
                <span className={styles.dueDate}>
                  📅 {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(task.status) }}
              >
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
