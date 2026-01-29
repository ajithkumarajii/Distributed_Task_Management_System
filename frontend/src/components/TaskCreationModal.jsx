import { useState, useEffect } from "react";
import { createTask, getProjects, getProjectMembers } from "../services/api";
import styles from "./TaskCreationModal.module.css";

export default function TaskCreationModal({ isOpen, onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: null,
    dueDate: "",
    projectId: "",
  });

  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, loading projects...");
      loadProjects();
      setErrors({});
      setGeneralError("");
      // Prevent background scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable background scroll
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (formData.projectId) {
      console.log("Loading members for project:", formData.projectId);
      loadProjectMembers(formData.projectId);
    } else {
      setProjectMembers([]);
      setFormData((prev) => ({ ...prev, assignedTo: null }));
    }
  }, [formData.projectId]);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      const projectsData = response.data || response || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setGeneralError("Failed to load projects: " + error.message);
    }
  };

  const loadProjectMembers = async (projectId) => {
    try {
      console.log("Loading members for project:", projectId);
      const response = await getProjectMembers(projectId);
      console.log("Members response:", response);
      const membersData = response.data || response || [];
      console.log("Members data after extraction:", membersData);
      setProjectMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error("Failed to load project members:", error);
      setProjectMembers([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (!formData.projectId) {
      newErrors.projectId = "Project is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await createTask(formData.projectId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate || undefined,
      });

      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: null,
        dueDate: "",
        projectId: "",
      });
      setErrors({});
      onTaskCreated();
      onClose();
    } catch (error) {
      setGeneralError(
        error.message ||
          "Failed to create task. Please check your input and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>✨ Create New Task</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {generalError && (
            <div className={styles.errorAlert}>
              <span>⚠️</span>
              <span>{generalError}</span>
            </div>
          )}

          {/* Project Selection */}
          <div className={styles.formGroup}>
            <label htmlFor="project" className={styles.label}>
              📁 Project *
            </label>
            <select
              id="project"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.projectId ? styles.inputError : ""
              }`}
            >
              <option value="">
                {projects.length === 0 ? "No projects available" : "Select a project"}
              </option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <span className={styles.errorText}>{errors.projectId}</span>
            )}
            {projects.length === 0 && !generalError && (
              <span className={styles.errorText} style={{ color: "#667eea" }}>
                Create a project first to add tasks
              </span>
            )}
          </div>

          {/* Title and Priority Row */}
          <div className={styles.formRow}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                📝 Title *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                className={`${styles.input} ${
                  errors.title ? styles.inputError : ""
                }`}
              />
              <span className={styles.charCount}>
                {formData.title.length}/200
              </span>
              {errors.title && (
                <span className={styles.errorText}>{errors.title}</span>
              )}
            </div>

            {/* Priority */}
            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                🎯 Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={styles.input}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              📋 Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add more details about this task..."
              className={`${styles.textarea} ${
                errors.description ? styles.inputError : ""
              }`}
            />
            <span className={styles.charCount}>
              {formData.description.length}/1000
            </span>
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          {/* Assign To and Due Date Row */}
          <div className={styles.formRow}>
            {/* Assign To */}
            <div className={styles.formGroup}>
              <label htmlFor="assignedTo" className={styles.label}>
                👤 Assign To
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo || ""}
                onChange={handleChange}
                className={styles.input}
                disabled={!formData.projectId || projectMembers.length === 0}
              >
                <option value="">
                  {projectMembers.length === 0 ? "No team members" : "Unassigned"}
                </option>
                {Array.isArray(projectMembers) && projectMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {formData.projectId && projectMembers.length === 0 && (
                <span style={{ fontSize: "12px", color: "#667eea", marginTop: "6px", display: "block" }}>
                  ℹ️ Add team members to this project to assign tasks
                </span>
              )}
            </div>

            {/* Due Date */}
            <div className={styles.formGroup}>
              <label htmlFor="dueDate" className={styles.label}>
                📅 Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={styles.input}
                disabled={!formData.projectId}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "✓ Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
