import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi"; 
import { Link, useNavigate } from "react-router-dom";

// Access environment variables for default credentials
const ADMIN_USERNAME = process.env.REACT_APP_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

// Use the same background image path as LoginPage.jsx
const BACKGROUND_IMAGE_PATH = require("../assets/philippine-barangay-community-hall.jpg");

// --------------------------------------------------------
// Re-usable InputField Component (Copied from LoginPage.jsx)
// --------------------------------------------------------
const InputField = ({ label, type, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div style={styles.inputWrapper}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputContainer}>
        {/* Using FiLock for both inputs as the Admin is likely using a username/text field */}
        <FiLock size={18} color="#777" /> 
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={styles.input}
        />
        {isPassword && (
          <div onClick={() => setShowPassword(!showPassword)} style={styles.iconBtn}>
            <div style={{ ...styles.iconFade, opacity: showPassword ? 1 : 0 }}>
              <FiEyeOff size={18} />
            </div>
            <div style={{ ...styles.iconFade, opacity: showPassword ? 0 : 1 }}>
              <FiEye size={18} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --------------------------------------------------------
// AdminLoginPage Component (Updated)
// --------------------------------------------------------
export default function AdminLoginPage({ onAdminLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setFadeIn(true), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- Admin Authentication Logic using .env variables ---
    setTimeout(() => {
        setLoading(false);
        // Compare input against credentials loaded from .env
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            onAdminLoginSuccess(); // Call the prop to set isAdmin state
            navigate("/admin/dashboard");
        } else {
            setError('Invalid Admin Username or Password.');
        }
    }, 1000); // Simulate network delay
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOverlay}></div>
      <div style={styles.container}>
        {/* Left Panel - Same look as LoginPage */}
        <div style={styles.leftPanel}>
          <h1 style={{ ...styles.brandText, opacity: fadeIn ? 1 : 0 }}>Admin Portal</h1>
          <p style={{ ...styles.brandDescription, opacity: fadeIn ? 1 : 0 }}>
            Management interface for community resources, users, and content.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Admin Access</h2>
          <p style={styles.subtitle}>Log in using your administrator credentials</p>
          
          <InputField
            label="Admin Username"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          
          {error && <p style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            disabled={!username || !password || loading}
            style={{
              ...styles.button,
              opacity: username && password ? 1 : 0.6,
              cursor: username && password ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Verifying..." : "Admin Login"}
          </button>
          
          {/* Link back to regular login */}
          <div style={styles.signupRow}>
            <span>Looking for the user login?</span>
            <Link to="/login" style={styles.link}>
              User Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- STYLES (Copied verbatim from LoginPage.jsx) ----------
const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundImage: `url(${BACKGROUND_IMAGE_PATH})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "16px",
    position: "relative",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(37, 99, 235, 0.4)",
    zIndex: 1,
  },
  container: {
    display: "flex",
    width: "100%",
    maxWidth: "1200px",
    zIndex: 2,
    position: "relative",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  leftPanel: { flex: 1, minWidth: "300px", padding: "20px" },
  brandText: {
    fontSize: "48px",
    fontWeight: "900",
    color: "#FFD700",
    textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
    marginBottom: "16px",
    transition: "opacity 1s ease",
  },
  brandDescription: {
    fontSize: "18px",
    color: "#fff",
    lineHeight: "1.6",
    maxWidth: "600px",
    fontStyle: "italic",
    transition: "opacity 1.5s ease 0.3s",
  },
  form: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "380px",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    border: "1px solid #eee",
    position: "relative",
  },
  title: { fontSize: "26px", fontWeight: "800", marginBottom: "6px", textAlign: "center" },
  subtitle: { fontSize: "14px", color: "#666", marginBottom: "24px", textAlign: "center" },
  inputWrapper: { display: "flex", flexDirection: "column", marginBottom: "18px", width: "100%" },
  label: { fontSize: "14px", fontWeight: "500", marginBottom: "6px", color: "#333" },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dcdcdc",
    borderRadius: "12px",
    padding: "10px 14px",
    gap: "10px",
    backgroundColor: "white",
    transition: "border 0.2s ease",
  },
  input: { flex: 1, outline: "none", fontSize: "14px", border: "none", color: "#333" },
  iconBtn: { position: "relative", width: "24px", height: "24px", cursor: "pointer" },
  iconFade: { position: "absolute", top: 0, left: 0, transition: "opacity 0.25s ease" },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    padding: "12px 0",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "12px",
    border: "none",
    marginTop: "8px",
    transition: "background 0.2s ease",
  },
  signupRow: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#555",
  },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: "600", cursor: "pointer" },
};