import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getProjectTasks,
  patchTask,
  getTask,
  getCurrentUser,
} from "../services/api";
import styles from "./TaskDashboard.module.css";

const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
};

const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

/**
 * TaskDashboard - Production-style task management component
 * Features:
 * - Pagination with configurable page size
 * - Sorting by priority, creation date, due date
 * - Filtering by status
 * - Role-based action visibility
 * - Optimistic UI updates
 * - Error handling and edge cases
 * - Loading skeletons for better UX
 */
export default function TaskDashboard({ projectId, user }) {
  // State for tasks and pagination
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Filter and Sort State
  const [filters, setFilters] = useState({
    status: null,
    priority: null,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal State for task editing
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load tasks when filters, sort, or page changes
  useEffect(() => {
    loadTasks();
  }, [projectId, filters, sortBy, sortOrder, pagination.page]);

  /**
   * Fetch tasks from backend with filters and sorting
   */
  const loadTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        order: sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
      };

      const response = await getProjectTasks(projectId, queryParams);

      if (response.data && Array.isArray(response.data)) {
        setTasks(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError(err.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, sortBy, sortOrder, pagination.page, pagination.limit]);

  /**
   * Check if user can perform certain actions
   */
  const canUserEdit = useCallback((task) => {
    if (!user) return false;
    // ADMIN can always edit
    if (user.role === "ADMIN") return true;
    // Assigned user can edit their own tasks
    if (task.assignedTo?._id === user.id) return true;
    // Creator can edit
    if (task.createdBy?._id === user.id) return true;
    return false;
  }, [user]);

  const canUserChangeStatus = useCallback((task) => {
    if (!user) return false;
    // ADMIN can always change status
    if (user.role === "ADMIN") return true;
    // Assigned user can change their task status
    if (task.assignedTo?._id === user.id) return true;
    return false;
  }, [user]);

  const canUserDelete = useCallback((task) => {
    if (!user) return false;
    // ADMIN can delete
    if (user.role === "ADMIN") return true;
    // Creator can delete
    if (task.createdBy?._id === user.id) return true;
    return false;
  }, [user]);

  /**
   * Handle status change with optimistic UI update
   */
  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      if (!canUserChangeStatus(tasks.find((t) => t._id === taskId))) {
        setError("You don't have permission to change this task's status");
        return;
      }

      // Optimistic update
      const originalTasks = tasks;
      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
      setUpdating((prev) => ({ ...prev, [taskId]: true }));

      try {
        await patchTask(taskId, { status: newStatus });
        setSuccessMessage("Task status updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        // Revert optimistic update on error
        setTasks(originalTasks);
        setError(err.message || "Failed to update task status");
        console.error(err);
      } finally {
        setUpdating((prev) => ({ ...prev, [taskId]: false }));
      }
    },
    [tasks, canUserChangeStatus]
  );

  /**
   * Handle priority change
   */
  const handlePriorityChange = useCallback(
    async (taskId, newPriority) => {
      if (!canUserEdit(tasks.find((t) => t._id === taskId))) {
        setError("You don't have permission to edit this task");
        return;
      }

      const originalTasks = tasks;
      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? { ...task, priority: newPriority } : task
      );
      setTasks(updatedTasks);
      setUpdating((prev) => ({ ...prev, [taskId]: true }));

      try {
        await patchTask(taskId, { priority: newPriority });
        setSuccessMessage("Task priority updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setTasks(originalTasks);
        setError(err.message || "Failed to update task priority");
        console.error(err);
      } finally {
        setUpdating((prev) => ({ ...prev, [taskId]: false }));
      }
    },
    [tasks, canUserEdit]
  );

  /**
   * Handle task description update via modal
   */
  const handleSaveTaskDetails = useCallback(
    async (taskId, updates) => {
      const originalTasks = tasks;
      const updatedTasks = tasks.map((task) =>
        task._id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
      setUpdating((prev) => ({ ...prev, [taskId]: true }));

      try {
        await patchTask(taskId, updates);
        setSuccessMessage("Task updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
        setIsModalOpen(false);
      } catch (err) {
        setTasks(originalTasks);
        setError(err.message || "Failed to update task");
        console.error(err);
      } finally {
        setUpdating((prev) => ({ ...prev, [taskId]: false }));
      }
    },
    [tasks]
  );

  /**
   * Handle task deletion
   */
  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!window.confirm("Are you sure you want to delete this task?")) {
        return;
      }

      const originalTasks = tasks;
      const updatedTasks = tasks.filter((task) => task._id !== taskId);
      setTasks(updatedTasks);

      try {
        await patchTask(taskId, { deleted: true });
        // In real app, would call deleteTask endpoint
        await loadTasks();
        setSuccessMessage("Task deleted successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setTasks(originalTasks);
        setError(err.message || "Failed to delete task");
        console.error(err);
      }
    },
    [tasks, loadTasks]
  );

  /**
   * Filter and sort helper functions
   */
  const getPriorityLevel = (priority) => {
    const levels = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return levels[priority] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      TODO: "#64748b",
      IN_PROGRESS: "#f59e0b",
      DONE: "#10b981",
    };
    return colors[status] || "#94a3b8";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: "#ef4444",
      MEDIUM: "#eab308",
      LOW: "#22c55e",
    };
    return colors[priority] || "#6b7280";
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      HIGH: "🔴 High",
      MEDIUM: "🟡 Medium",
      LOW: "🟢 Low",
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status) => {
    const labels = {
      TODO: "📋 To Do",
      IN_PROGRESS: "⚙️ In Progress",
      DONE: "✅ Done",
    };
    return labels[status] || status;
  };

  /**
   * Handle pagination
   */
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  /**
   * Render task skeleton loader
   */
  const renderTaskSkeleton = () => (
    <div className={styles.taskCard + " " + styles.skeleton}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonBadge}></div>
      </div>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLine + " " + styles.short}></div>
    </div>
  );

  /**
   * Render the component
   */
  if (!projectId) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.emptyState}>
          <p>📁 Select a project to view tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Task Dashboard</h2>
        <p className={styles.subtitle}>
          Total Tasks: {pagination.total} | Page {pagination.page} of{" "}
          {pagination.pages || 1}
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className={styles.successMessage}>✅ {successMessage}</div>
      )}
      {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

      {/* Controls Section */}
      <div className={styles.controlsSection}>
        <div className={styles.filterGroup}>
          <label>Filter by Status:</label>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value || null,
              }))
            }
          >
            <option value="">All Statuses</option>
            <option value={TASK_STATUS.TODO}>To Do</option>
            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TASK_STATUS.DONE}>Done</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Filter by Priority:</label>
          <select
            value={filters.priority || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priority: e.target.value || null,
              }))
            }
          >
            <option value="">All Priorities</option>
            <option value={TASK_PRIORITY.HIGH}>High</option>
            <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
            <option value={TASK_PRIORITY.LOW}>Low</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Created Date</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className={styles.tasksContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            {[...Array(3)].map((_, i) => (
              <div key={i}>{renderTaskSkeleton()}</div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              📭 No tasks found
              {filters.status || filters.priority
                ? " matching your filters"
                : ""}
            </p>
          </div>
        ) : (
          <div className={styles.tasksList}>
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`${styles.taskCard} ${
                  task.status === TASK_STATUS.DONE ? styles.completed : ""
                }`}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.titleSection}>
                    <h3>{task.title}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div className={styles.prioritySection}>
                    <span
                      className={styles.priorityBadge}
                      style={{
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>
                </div>

                <p className={styles.description}>
                  {task.description || "No description"}
                </p>

                <div className={styles.taskMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Assigned to:</span>
                    <span className={styles.metaValue}>
                      {task.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>

                  {task.dueDate && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Due:</span>
                      <span className={styles.metaValue}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created by:</span>
                    <span className={styles.metaValue}>
                      {task.createdBy?.name || "System"}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className={styles.actionBar}>
                  {canUserChangeStatus(task) && (
                    <div className={styles.statusControl}>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        disabled={updating[task._id]}
                        className={styles.statusSelect}
                      >
                        <option value={TASK_STATUS.TODO}>To Do</option>
                        <option value={TASK_STATUS.IN_PROGRESS}>
                          In Progress
                        </option>
                        <option value={TASK_STATUS.DONE}>Done</option>
                      </select>
                    </div>
                  )}

                  {canUserEdit(task) && (
                    <>
                      <div className={styles.priorityControl}>
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            handlePriorityChange(task._id, e.target.value)
                          }
                          disabled={updating[task._id]}
                          className={styles.prioritySelect}
                        >
                          <option value={TASK_PRIORITY.LOW}>Low</option>
                          <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
                          <option value={TASK_PRIORITY.HIGH}>High</option>
                        </select>
                      </div>

                      <button
                        className={styles.editButton}
                        onClick={() => {
                          setSelectedTask(task);
                          setEditingTask(task);
                          setIsModalOpen(true);
                        }}
                        disabled={updating[task._id]}
                      >
                        ✎ Edit
                      </button>
                    </>
                  )}

                  {canUserDelete(task) && (
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTask(task._id)}
                      disabled={updating[task._id]}
                    >
                      🗑 Delete
                    </button>
                  )}

                  {updating[task._id] && (
                    <span className={styles.updating}>Updating...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={handlePrevPage}
            disabled={pagination.page <= 1}
            className={styles.pageButton}
          >
            ← Previous
          </button>

          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={pagination.page >= pagination.pages}
            className={styles.pageButton}
          >
            Next →
          </button>
        </div>
      )}

      {/* Task Edit Modal */}
      {isModalOpen && editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
            setEditingTask(null);
          }}
          onSave={handleSaveTaskDetails}
          isUpdating={updating[editingTask._id]}
        />
      )}
    </div>
  );
}

/**
 * TaskEditModal - Inline modal for editing task details
 */
function TaskEditModal({ task, onClose, onSave, isUpdating }) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title cannot exceed 200 characters";
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(task._id, {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>Edit Task</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isUpdating}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
              disabled={isUpdating}
              className={errors.title ? styles.inputError : ""}
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
              disabled={isUpdating}
              rows={4}
              className={errors.description ? styles.inputError : ""}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, priority: e.target.value }))
              }
              disabled={isUpdating}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className={styles.submitButton}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
