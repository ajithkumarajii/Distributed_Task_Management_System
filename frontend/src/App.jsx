import { useState, useEffect } from "react";
import Login from "./pages/Login";
import TaskCreationModal from "./components/TaskCreationModal";
import ProjectCreationModal from "./components/ProjectCreationModal";
import TaskList from "./components/TaskList";
import { getCurrentUser, logoutUser, getProjects } from "./services/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await getCurrentUser();
          setUser(response.user);
          setIsLoggedIn(true);
          // Load projects
          await loadProjects();
        } catch (err) {
          console.error("Failed to fetch user:", err);
          localStorage.removeItem("token");
          setIsLoggedIn(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsLoggedIn(false);
    setProjects([]);
    setSelectedProject(null);
  };

  const handleProjectCreated = (newProject) => {
    // Add new project to list
    setProjects((prev) => [newProject, ...prev]);
    // Set as selected project
    setSelectedProject(newProject._id);
  };

  const handleTaskCreated = () => {
    // Refresh task list
    setTaskRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoggedIn && user ? (
        <div style={styles.dashboardContainer}>
          <nav style={styles.navbar}>
            <div style={styles.navBrand}>
              <div style={styles.logoSection}>
                <span style={styles.logoIcon}>📊</span>
                <span style={styles.logoText}>DTMS</span>
              </div>
              <p style={styles.navSubtitle}>Distributed Task Management</p>
            </div>
            <div style={styles.navRight}>
              <div style={styles.userProfile}>
                <div style={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
                <div style={styles.userDetails}>
                  <p style={styles.userName}>{user.name}</p>
                  <p style={styles.userRole}>{user.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Sign Out
              </button>
            </div>
          </nav>

          <div style={styles.mainContent}>
            <div style={styles.headerSection}>
              <div>
                <h2 style={styles.welcomeTitle}>Welcome back, {user.name}! 👋</h2>
                <p style={styles.headerSubtitle}>Manage your team's tasks efficiently</p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  style={styles.createProjectButton}
                >
                  📁 Create Project
                </button>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  style={styles.createTaskButton}
                >
                  + Create Task
                </button>
              </div>
            </div>

            <div style={styles.projectSelector}>
              <label style={styles.projectLabel}>Current Project:</label>
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={styles.projectSelect}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.taskManagementSection}>
              <h3 style={styles.sectionTitle}>Task Management</h3>
              <TaskList projectId={selectedProject} refreshKey={taskRefreshKey} />
            </div>

            <div style={styles.comingSoonSection}>
              <h3 style={styles.comingSoonTitle}>🚀 Coming Soon</h3>
              <p style={styles.comingSoonText}>
                Advanced analytics, team collaboration features, and real-time notifications are being developed.
              </p>
            </div>
          </div>

          <TaskCreationModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onTaskCreated={handleTaskCreated}
          />

          <ProjectCreationModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            onProjectCreated={handleProjectCreated}
          />
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  spinnerContainer: {
    textAlign: "center",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  loadingText: {
    color: "white",
    fontSize: "18px",
    fontWeight: "500",
  },
  dashboardContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },
  navbar: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  },
  navBrand: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  logoIcon: {
    fontSize: "32px",
  },
  logoText: {
    background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  navSubtitle: {
    fontSize: "12px",
    opacity: "0.9",
    margin: 0,
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    border: "2px solid rgba(255, 255, 255, 0.5)",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
  },
  userRole: {
    margin: 0,
    fontSize: "12px",
    opacity: "0.8",
  },
  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "white",
    border: "2px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  mainContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
  },
  welcomeTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  headerSubtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  dateDisplay: {
    fontSize: "14px",
    color: "#94a3b8",
    backgroundColor: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
    border: "1px solid #e2e8f0",
  },
  cardIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
    margin: "0 0 12px 0",
  },
  cardNumber: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#667eea",
    margin: "0 0 8px 0",
  },
  cardDescription: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  },
  infoSection: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "20px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  comingSoonSection: {
    backgroundColor: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    padding: "32px",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
  },
  comingSoonTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#667eea",
    margin: "0 0 12px 0",
  },
  comingSoonText: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.6",
  },
  projectSelector: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "32px",
    padding: "16px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  projectLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    whiteSpace: "nowrap",
  },
  projectSelect: {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    backgroundColor: "white",
    color: "#1e293b",
    cursor: "pointer",
    minWidth: "200px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  createProjectButton: {
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
  },
  createTaskButton: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "700",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
  },
  taskManagementSection: {
    backgroundColor: "white",
    padding: "28px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    marginBottom: "28px",
  },
};

export default App;

