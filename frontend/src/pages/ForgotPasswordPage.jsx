import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi"; 

const BACKGROUND_IMAGE_PATH = require("../assets/philippine-barangay-community-hall.jpg");

// --- Reusable InputField Component (CLEANED UP) ---
const InputField = ({ label, type, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  // The inputType toggle remains for password visibility
  const inputType = isPassword && showPassword ? "text" : type;

  const renderIcon = () => {
    switch (type) {
      case "email":
        return <FiMail size={18} color="#777" />;
      case "password":
        return <FiLock size={18} color="#777" />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.inputWrapper}>
      <label style={styles.label}>{label}</label>
      {/* Uses the generic inputContainer now */}
      <div style={styles.inputContainer}> 
        {renderIcon()}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={styles.input} // Uses the generic input style
        />
        {isPassword && (
          <div onClick={() => setShowPassword(!showPassword)} style={styles.iconBtn}>
            {/* Note: In a real app, you'd use FiEye or FiEyeOff here for better UX */}
            <div style={{ ...styles.iconFade, opacity: showPassword ? 0 : 1 }}>
              <FiLock size={18} /> 
            </div>
            <div style={{ ...styles.iconFade, opacity: showPassword ? 1 : 0 }}>
              <FiLock size={18} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// --- END InputField Component ---

// --- NEW VerificationCodeInput Component ---
const VerificationCodeInput = ({ length = 6, value, onChange }) => {
    // Split the external value prop into an array of digits for rendering
    const [digits, setDigits] = useState(Array(length).fill(''));
    const inputsRef = useRef([]);

    // Sync external value prop with internal state when mounted or value changes
    useEffect(() => {
        // Ensure the internal state reflects the full 6-digit code coming from the parent state
        document.title = "Mawii Forgot Password";
        const currentCodeArray = value.split('');
        // Pad the array with empty strings if it's shorter than the required length
        const newDigits = Array(length).fill('').map((_, i) => currentCodeArray[i] || '');
        setDigits(newDigits);
    }, [value, length]);


    const handleChange = (index, e) => {
        // Only take the last character typed (for security/simplicity)
        const newDigit = e.target.value.slice(-1); 
        
        // Only allow digits (0-9)
        if (!/^\d*$/.test(newDigit)) return;

        const newDigits = [...digits];
        newDigits[index] = newDigit;
        setDigits(newDigits);

        const newValue = newDigits.join('');
        onChange({ target: { value: newValue } }); // Propagate the full 6-digit string up to the parent

        // Auto-focus to the next input field if a digit was entered
        if (newDigit && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle Backspace to clear current and move to previous input
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                // If the box is empty, move focus to the previous box
                inputsRef.current[index - 1]?.focus();
            } else if (digits[index]) {
                // If the box is not empty, clear the digit and propagate change
                e.preventDefault(); // Prevent default backspace behavior (moving back)
                const newDigits = [...digits];
                newDigits[index] = '';
                setDigits(newDigits);
                onChange({ target: { value: newDigits.join('') } });
            }
        }
    };

    return (
        <div style={styles.inputWrapper}>
            <label style={styles.label}>Verification Code</label>
            <div style={styles.codeDigitContainer}>
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength="1"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handleChange(index, e)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        ref={(el) => (inputsRef.current[index] = el)}
                        style={styles.singleCodeDigitInput}
                    />
                ))}
            </div>
        </div>
    );
};
// --- END NEW VerificationCodeInput Component ---


// --- Password Validation Utility (Copied from CreateAccountPage.jsx) ---
const PASSWORD_REQUIREMENTS_LIST = [
    "at least 8 characters",
    "at least 1 letter (uppercase or lowercase)",
    "at least 1 special character (!@#$...) or space",
    "at least 1 number"
];

const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push("at least 8 characters");
    }

    if (!/[a-zA-Z]/.test(password)) {
        errors.push("at least 1 letter (uppercase or lowercase)");
    }

    // Checking for special character or space
    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push("at least 1 special character (!@#$...) or space");
    }

    if (!/\d/.test(password)) {
        errors.push("at least 1 number");
    }

    return errors;
};
// --- END Password Validation Utility ---


const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    // Step 1: Request Code | Step 2: Verify Code | Step 3: Reset Password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    // Code state remains a single 6-digit string
    const [code, setCode] = useState(''); 
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => setFadeIn(true), []);

    // --- STEP 1: Request Code Handler ---
    const handleRequestCode = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!email) {
            setStatusMessage({ type: 'error', text: 'Please enter your email address.' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/password-reset/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                setStatusMessage({ type: 'success', text: data.message });
                setStep(2); // Move to code verification step
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Failed to request reset code.' });
            }
        } catch (error) {
            console.error("Request Code Error:", error);
            setStatusMessage({ type: 'error', text: 'Network error. Please try again later.' });
        }
        setIsLoading(false);
    };

    // --- STEP 2: Verify Code Handler ---
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        setIsLoading(true);

        // Check if the code is exactly 6 digits (the new component only allows digits)
        if (code.length !== 6) { 
            setStatusMessage({ type: 'error', text: 'The code must be 6 digits.' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/password-reset/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();

            if (response.ok) {
                setStatusMessage({ type: 'success', text: data.message });
                setStep(3); // Move to password reset step
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Invalid or expired code.' });
            }
        } catch (error) {
            console.error("Verify Code Error:", error);
            setStatusMessage({ type: 'error', text: 'Network error. Please try again later.' });
        }
        setIsLoading(false);
    };

    // --- STEP 3: Reset Password Handler ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });
        setIsLoading(true);
        
        // 1. Client-side Validation Checks
        const errors = validatePassword(newPassword);
        setPasswordErrors(errors);

        if (errors.length > 0) {
            setStatusMessage({ type: 'error', text: `Password is not strong enough. See requirements below.` });
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatusMessage({ type: 'error', text: "Passwords do not match!" });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/password-reset/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            });
            const data = await response.json();

            if (response.ok) {
                setStatusMessage({ type: 'success', text: data.message + " Redirecting to login..." });
                setTimeout(() => navigate('/login', { replace: true }), 2000);
            } else {
                setStatusMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            setStatusMessage({ type: 'error', text: 'Network error. Please try again later.' });
        }
        setIsLoading(false);
    };


    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h2 style={styles.title}>Forgot Password</h2>
                        <p style={styles.subtitle}>Enter your email address to receive a password reset code.</p>
                        <form onSubmit={handleRequestCode}>
                            <InputField
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g., example@email.com"
                            />
                            <button type="submit" style={styles.button} disabled={isLoading || !email}>
                                {isLoading ? "Sending Code..." : "Send Reset Code"}
                            </button>
                        </form>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 style={styles.title}>Verify Code</h2>
                        <p style={styles.subtitle}>A 6-digit code has been sent to: <strong style={{ color: '#2563eb' }}>{email}</strong></p>
                        <form onSubmit={handleVerifyCode}>
                            {/* --- NEW 6-BOX INPUT COMPONENT --- */}
                            <VerificationCodeInput
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                length={6}
                            />
                            {/* --- END NEW COMPONENT --- */}
                            <button type="submit" style={styles.button} disabled={isLoading || code.length !== 6}>
                                {isLoading ? "Verifying..." : "Verify Code"}
                            </button>
                            <div style={styles.resendRow}>
                                {/* Resetting email and code, and going back to step 1 */}
                                <span onClick={() => { setStep(1); setStatusMessage({ type: '', text: '' }); setCode(''); }} style={styles.link}>
                                    Change Email or Resend Code
                                </span>
                            </div>
                        </form>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 style={styles.title}>Reset Password</h2>
                        <p style={styles.subtitle}>Enter your new password.</p>
                        <form onSubmit={handleResetPassword}>
                            <InputField
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors(validatePassword(e.target.value)); }}
                                placeholder="Enter new password"
                            />
                            {newPassword && (
                                <div style={styles.passwordRequirements}>
                                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Password Requirements:</p>
                                    <ul style={styles.passwordList}>
                                        {PASSWORD_REQUIREMENTS_LIST.map((req) => (
                                            <li key={req} style={{ color: passwordErrors.includes(req) ? '#dc3545' : '#28a745' }}>
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <InputField
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                            />

                            <button type="submit" style={styles.button} disabled={isLoading || passwordErrors.length > 0 || !confirmPassword || newPassword !== confirmPassword}>
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div style={styles.pageContainer}>
            {/* --- ADDED BACKGROUND OVERLAY --- */}
            <div style={styles.backgroundOverlay} /> 
            {/* The background style is still applied to pageContainer implicitly via background,
                but for consistency with LoginPage, we add the overlay separately. */}
            <div style={{ ...styles.background, opacity: fadeIn ? 1 : 0 }} />
            {/* --- UPDATED Z-INDEX TO BE ABOVE OVERLAY --- */}
            <div style={{ ...styles.formContainer, opacity: fadeIn ? 1 : 0, zIndex: 2 }}> 
                {renderContent()}

                {statusMessage.text && (
                    <div
                        style={{
                            ...styles.statusMessage,
                            backgroundColor: statusMessage.type === 'error' ? '#f8d7da' : '#d4edda',
                            color: statusMessage.type === 'error' ? '#721c24' : '#155724',
                            borderColor: statusMessage.type === 'error' ? '#f5c6cb' : '#c3e6cb',
                        }}
                    >
                        {statusMessage.text}
                    </div>
                )}
                
                <div style={styles.signupRow}>
                    <Link to="/login" style={styles.link}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // The background image is typically applied here in LoginPage, but in this structure,
        // it's applied to the 'background' element with fixed positioning.
        position: 'relative', // Necessary for z-indexing
    },
    // --- NEW: MATCHING BACKGROUND OVERLAY STYLE ---
    backgroundOverlay: {
        position: "fixed", // Use fixed to cover the entire viewport
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(37, 99, 235, 0.4)", // Matching LoginPage
        zIndex: 1, // Place between background image and form container
    },
    background: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `url(${BACKGROUND_IMAGE_PATH})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "opacity 1s ease-in-out",
        zIndex: 0, // Base layer
    },
    formContainer: {
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        backgroundColor: "white",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        border: "1px solid #eee",
        transition: "opacity 0.5s ease-in-out",
        zIndex: 2, // Ensure it is above the overlay (zIndex: 1)
    },
    title: { fontSize: "24px", fontWeight: "800", marginBottom: "6px", textAlign: "center", color: "#333" },
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
    // --- NEW STYLES FOR 6-BOX CODE INPUT ---
    codeDigitContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '8px', 
        width: '100%',
    },
    singleCodeDigitInput: {
        width: '14%', 
        aspectRatio: '1 / 1', 
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: '700',
        padding: '10px 0',
        borderRadius: '8px',
        border: '1px solid #dcdcdc',
        outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:focus': { 
            borderColor: '#2563eb',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
        }
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
        cursor: 'pointer',
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
        cursor: 'pointer',
    },
    statusMessage: {
        marginTop: '20px',
        padding: '10px',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        textAlign: 'center',
        border: '1px solid',
    },
    passwordRequirements: {
        marginBottom: '18px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #eee',
    },
    passwordList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '13px',
    },
    resendRow: {
        marginTop: '20px',
        fontSize: '14px',
        textAlign: 'center',
        color: '#666',
    }
};

export default ForgotPasswordPage;