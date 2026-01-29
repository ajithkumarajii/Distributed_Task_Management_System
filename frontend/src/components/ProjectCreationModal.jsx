import { useState, useEffect } from "react";
import styles from "./ProjectCreationModal.module.css";
import { createProject } from "../services/api";

export default function ProjectCreationModal({ isOpen, onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
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
      const response = await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      setFormData({
        name: "",
        description: "",
      });
      setErrors({});
      onProjectCreated(response.data || response);
      onClose();
    } catch (error) {
      setGeneralError(
        error.message || "Failed to create project. Please try again."
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
          <h2 className={styles.title}>📁 Create New Project</h2>
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

          {/* Project Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              📝 Project Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name (e.g., Website Redesign)"
              className={`${styles.input} ${
                errors.name ? styles.inputError : ""
              }`}
              disabled={isLoading}
            />
            <span className={styles.charCount}>
              {formData.name.length}/100
            </span>
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
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
              placeholder="Describe your project (optional)"
              className={styles.textarea}
              disabled={isLoading}
            />
            <span className={styles.charCount}>
              {formData.description.length}/500
            </span>
          </div>

          {/* Info Box */}
          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>💡 After creating:</p>
            <ul className={styles.infoList}>
              <li>You'll be the project owner</li>
              <li>You can add team members later</li>
              <li>Start creating tasks immediately</li>
            </ul>
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
              {isLoading ? "Creating..." : "✓ Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
