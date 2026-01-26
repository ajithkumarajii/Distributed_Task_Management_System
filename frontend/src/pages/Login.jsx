import { useState } from "react";
import { loginUser, registerUser, setToken } from "../services/api";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "inherit",
    padding: "20px",
  },
  contentWrapper: {
    display: "flex",
    width: "100%",
    maxWidth: "1200px",
    gap: "40px",
    alignItems: "center",
  },
  leftSection: {
    flex: 1,
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  brandContainer: {
    marginBottom: "40px",
  },
  logo: {
    fontSize: "48px",
    fontWeight: "800",
    marginBottom: "20px",
    letterSpacing: "-1px",
  },
  tagline: {
    fontSize: "24px",
    fontWeight: "300",
    marginBottom: "16px",
    opacity: "0.95",
  },
  description: {
    fontSize: "16px",
    opacity: "0.85",
    lineHeight: "1.6",
    marginBottom: "20px",
    maxWidth: "400px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    opacity: "0.9",
  },
  featureIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  rightSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
  },
  formWrapper: {
    backgroundColor: "white",
    padding: "48px",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
    width: "100%",
    maxWidth: "420px",
  },
  formHeader: {
    marginBottom: "32px",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontWeight: "600",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  },
  inputFocus: {
    borderColor: "#667eea",
    boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
  },
  button: {
    padding: "12px 16px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "24px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
  },
  toggleText: {
    textAlign: "center",
    marginTop: "24px",
    color: "#64748b",
    fontSize: "14px",
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "color 0.2s ease",
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    textAlign: "left",
    fontSize: "14px",
    border: "1px solid #fecaca",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successMessage: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    textAlign: "left",
    fontSize: "14px",
    border: "1px solid #86efac",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  iconText: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "20px 0",
    color: "#cbd5e1",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    padding: "0 12px",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  passwordStrength: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
  passwordBar: {
    height: "4px",
    backgroundColor: "#e2e8f0",
    borderRadius: "2px",
    marginTop: "4px",
    overflow: "hidden",
  },
  passwordBarFill: {
    height: "100%",
    transition: "all 0.3s ease",
  },
};

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/) || password.match(/[^a-zA-Z0-9]/)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 25) return "#ef4444";
    if (strength < 50) return "#f59e0b";
    if (strength < 75) return "#eab308";
    return "#10b981";
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return "Weak";
    if (strength < 50) return "Fair";
    if (strength < 75) return "Good";
    return "Strong";
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.name.trim()) {
          throw new Error("Name is required");
        }
        if (!formData.email.trim()) {
          throw new Error("Email is required");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const response = await registerUser(
          formData.name,
          formData.email,
          formData.password
        );

        setSuccess("Registration successful! Switching to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          setIsRegister(false);
          setSuccess("");
        }, 2000);
      } else {
        if (!formData.email.trim() || !formData.password.trim()) {
          throw new Error("Email and password are required");
        }

        const response = await loginUser(formData.email, formData.password);
        setToken(response.token);
        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Left Section - Branding */}
        <div style={styles.leftSection}>
          <div style={styles.brandContainer}>
            <div style={styles.logo}>DTMS</div>
            <div style={styles.tagline}>
              {isRegister ? "Join Our Team" : "Welcome Back"}
            </div>
            <p style={styles.description}>
              Manage your tasks efficiently with our distributed task management system. Collaborate with your team and boost productivity.
            </p>
          </div>

          <div style={styles.features}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✓</div>
              <span>Real-time task tracking</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✓</div>
              <span>Team collaboration tools</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✓</div>
              <span>Secure authentication</span>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✓</div>
              <span>Advanced analytics</span>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div style={styles.rightSection}>
          <div style={styles.formWrapper}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>
                {isRegister ? "Create Account" : "Sign In"}
              </h2>
              <p style={styles.formSubtitle}>
                {isRegister
                  ? "Join us and start managing your tasks"
                  : "Sign in to your account to continue"}
              </p>
            </div>

            {error && (
              <div style={styles.errorMessage}>
                <span style={styles.iconText}>✕</span>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.successMessage}>
                <span style={styles.iconText}>✓</span>
                {success}
              </div>
            )}

            <form style={styles.form} onSubmit={handleSubmit}>
              {isRegister && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    style={{
                      ...styles.input,
                      ...(focusedField === "name" ? styles.inputFocus : {}),
                    }}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  style={{
                    ...styles.input,
                    ...(focusedField === "email" ? styles.inputFocus : {}),
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={{
                    ...styles.input,
                    ...(focusedField === "password" ? styles.inputFocus : {}),
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  disabled={loading}
                />
                {isRegister && formData.password && (
                  <div style={styles.passwordStrength}>
                    <div style={styles.passwordBar}>
                      <div
                        style={{
                          ...styles.passwordBarFill,
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor(
                            passwordStrength
                          ),
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: getPasswordStrengthColor(passwordStrength),
                        fontWeight: "600",
                      }}
                    >
                      {getPasswordStrengthText(passwordStrength)} password
                    </span>
                  </div>
                )}
              </div>

              {isRegister && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    style={{
                      ...styles.input,
                      ...(focusedField === "confirmPassword"
                        ? styles.inputFocus
                        : {}),
                      ...(formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? styles.inputError
                        : {}),
                    }}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    disabled={loading}
                  />
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                        Passwords do not match
                      </div>
                    )}
                </div>
              )}

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                disabled={loading}
              >
                {loading
                  ? isRegister
                    ? "Creating Account..."
                    : "Signing In..."
                  : isRegister
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </form>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <div style={styles.dividerText}>or</div>
              <div style={styles.dividerLine} />
            </div>

            <div style={styles.toggleText}>
              {isRegister ? "Already have an account?" : "Don't have an account?"}
              <button
                style={{
                  ...styles.toggleButton,
                  marginLeft: "6px",
                }}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                  setSuccess("");
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                disabled={loading}
              >
                {isRegister ? "Sign In" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
