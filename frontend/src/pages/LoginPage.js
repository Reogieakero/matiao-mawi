import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const BACKGROUND_IMAGE_PATH = require("../assets/philippine-barangay-community-hall.jpg");

const InputField = ({ label, type, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div style={styles.inputWrapper}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputContainer}>
        {type === "email" && <FiMail size={18} color="#777" />}
        {type === "password" && <FiLock size={18} color="#777" />}
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

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setFadeIn(true), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Pass the entire user object (id, name, email) to App.jsx
        onLoginSuccess({ id: data.user.id, name: data.user.name, email: data.user.email });
        navigate("/home");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please check your network connection and server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOverlay}></div>
      <div style={styles.container}>
        <div style={styles.leftPanel}>
          <h1 style={{ ...styles.brandText, opacity: fadeIn ? 1 : 0 }}>Community Mawii</h1>
          <p style={{ ...styles.brandDescription, opacity: fadeIn ? 1 : 0 }}>
            A vibrant community initiative connecting citizens, resources, and services.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Welcome Back!</h2>
          <p style={styles.subtitle}>Login to continue to your dashboard</p>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <button
            type="submit"
            disabled={!email || !password || loading}
            style={{
              ...styles.button,
              opacity: email && password ? 1 : 0.6,
              cursor: email && password ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div style={styles.signupRow}>
            <span>Don’t have an account?</span>
            <Link to="/signup" style={styles.link}>
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- STYLES (unchanged) ----------
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