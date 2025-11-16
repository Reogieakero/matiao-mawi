import React, { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

// --- InputField Component ---
const InputField = ({ label, type, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const renderIcon = () => {
    switch (type) {
      case "email":
        return <FiMail size={18} color="#777" />;
      case "password":
        return <FiLock size={18} color="#777" />;
      default:
        return label === "Full Name" ? <FiUser size={18} color="#777" /> : null;
    }
  };

  return (
    <div style={styles.inputWrapper}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputContainer}>
        {renderIcon()}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={styles.input}
        />
        {isPassword && (
          <div onClick={() => setShowPassword(!showPassword)} style={styles.iconBtn}>
            <div style={{ ...styles.iconFade, opacity: showPassword ? 0 : 1 }}>
              <FiEye size={18} />
            </div>
            <div style={{ ...styles.iconFade, opacity: showPassword ? 1 : 0 }}>
              <FiEyeOff size={18} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CreateAccount Main Component ---
export default function CreateAccount() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // The API URL remains correct: backend is on 3000
  const API_URL = "http://localhost:5000/api/register"; 

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // 1. Send data to the backend API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      // 2. Handle the server's response
      if (response.ok) {
        alert(data.message || "Account created successfully!");
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        navigate("/login"); 
      } else {
        // Display error message from the server (e.g., "Email already exists")
        alert(`Registration failed: ${data.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Network or API call error:", error);
      // The alert you saw in the screenshot comes from this line:
      alert("Could not connect to the server. Please check the backend service."); 
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && email && password && confirmPassword;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOverlay}></div>

      <div style={styles.container}>
        {/* Left Panel - Brand Info */}
        <div style={styles.leftPanel}>
          <h1 style={{ ...styles.brandText, opacity: fadeIn ? 1 : 0 }}>
            Community Mawii
          </h1>
          <p style={{ ...styles.brandDescription, opacity: fadeIn ? 1 : 0 }}>
            A vibrant community initiative connecting citizens, resources, and services for a better
            and empowered neighborhood experience. Join us to engage, collaborate, and thrive together.
          </p>
        </div>

        {/* Right Panel - Registration Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to join the Community Mawii</p>

          <InputField
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
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
          <InputField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isFormValid && !loading ? 1 : 0.6,
              cursor: isFormValid && !loading ? "pointer" : "not-allowed",
            }}
            disabled={!isFormValid || loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div style={styles.signupRow}>
            <span>Already have an account?</span>
            <Link to="/login" style={styles.link}>Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// ---------- STYLES (Your original styles) ----------
// ------------------------------------------------------------------
const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundImage: `url(${require("../assets/philippine-barangay-community-hall.jpg")})`, 
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
  leftPanel: {
    flex: 1,
    minWidth: "300px",
    padding: "20px",
  },
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
  title: {
    fontSize: "26px",
    fontWeight: "800",
    marginBottom: "6px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px",
    textAlign: "center",
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "18px",
    width: "100%",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "6px",
    color: "#333",
  },
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
  input: {
    flex: 1,
    outline: "none",
    fontSize: "14px",
    border: "none",
    color: "#333",
  },
  iconBtn: {
    position: "relative",
    width: "24px",
    height: "24px",
    cursor: "pointer",
  },
  iconFade: {
    position: "absolute",
    top: 0,
    left: 0,
    transition: "opacity 0.25s ease",
  },
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
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
    cursor: "pointer",
  },
};