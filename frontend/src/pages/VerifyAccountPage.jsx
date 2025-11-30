import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiCheckCircle, FiLock } from "react-icons/fi"; // FiLock is used for the single code input in the original file

const BACKGROUND_IMAGE_PATH = require("../assets/philippine-barangay-community-hall.jpg");

// --- START NEW VerificationCodeInput Component (Copied from ForgotPasswordPage.jsx) ---
const VerificationCodeInput = ({ length = 6, value, onChange }) => {
    // Split the external value prop into an array of digits for rendering
    const [digits, setDigits] = useState(Array(length).fill(''));
    const inputsRef = useRef([]);

    // Sync external value prop with internal state when mounted or value changes
    useEffect(() => {
        // Ensure the internal state reflects the full 6-digit code coming from the parent state
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


const VerifyAccountPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const userEmail = location.state?.email; 

    // Changed state name to match ForgotPasswordPage's 'code' state for consistency
    const [code, setCode] = useState(''); 
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);


    useEffect(() => setFadeIn(true), []);

    useEffect(() => {
        if (!userEmail) {
            setTimeout(() => navigate('/signup', { replace: true }), 1000); 
        }
    }, [userEmail, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setIsLoading(true);

        // Simple validation
        if (code.length !== 6) { // Check against the updated 'code' state
            setStatusMessage('Code must be 6 digits.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    code: code // Use the updated 'code' state
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMessage(data.message);
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/login'); 
                }, 3000);
            } else {
                setStatusMessage(data.message || 'Verification failed. Please check the code.');
            }
        } catch (error) {
            console.error('Verification API error:', error);
            setStatusMessage('Network error. Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!userEmail) {
        return (
            <div style={{ ...styles.page, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' }}>
                <div style={styles.form}>Redirecting to Signup...</div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.backgroundOverlay}></div>
            <div style={styles.container}>
                {/* Left Panel - Brand Info (Consistent with other pages) */}
                <div style={styles.leftPanel}>
                    <h1 style={{ ...styles.brandText, opacity: fadeIn ? 1 : 0 }}>Community Mawii</h1>
                    <p style={{ ...styles.brandDescription, opacity: fadeIn ? 1 : 0 }}>
                        A vibrant community initiative connecting citizens, resources, and services.
                    </p>
                </div>
                
                {/* Right Panel - Verification Form (Consistent styling) */}
                <div style={styles.form}>
                    <h2 style={styles.title}>Account Verification</h2>
                    <p style={styles.subtitle}>
                        A 6-digit verification code has been sent to: 
                        <br />
                        <strong style={{color: '#2563eb'}}>{userEmail}</strong>
                    </p>

                    <form onSubmit={handleVerify} style={styles.codeForm}>
                        {/* --- NEW 6-BOX INPUT COMPONENT --- */}
                        <VerificationCodeInput
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            length={6}
                        />
                        {/* --- END NEW COMPONENT --- */}

                        <button 
                            type="submit" 
                            style={{
                                ...styles.button,
                                // Condition updated to check `code.length` against 6 digits
                                opacity: code.length === 6 && !isLoading && !isSuccess ? 1 : 0.6,
                                cursor: code.length === 6 && !isLoading && !isSuccess ? "pointer" : "not-allowed",
                            }}
                            disabled={isLoading || code.length !== 6 || isSuccess}
                        >
                            {isLoading 
                                ? 'Verifying...' 
                                : isSuccess 
                                    ? (<>Verified <FiCheckCircle size={18} style={{marginLeft: '8px'}}/></>) 
                                    : 'Verify Account'
                            }
                        </button>
                    </form>

                    {statusMessage && (
                        <p style={{
                            ...styles.statusMessage, 
                            color: isSuccess ? '#10b981' : '#ef4444',
                            backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2'
                        }}>
                            {statusMessage}
                        </p>
                    )}
                    
                    <div style={styles.resendRow}>
                        Didn't receive the code? 
                        <a href="#" style={styles.link} onClick={() => alert('Resend functionality not yet implemented.')}>
                            Resend Code
                        </a>
                    </div>
                    <div style={styles.loginHint}>
                        <Link to="/login" style={styles.link}>Go to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Merged and adapted styles for consistency (Includes styles from ForgotPasswordPage.jsx for the code input)
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
    leftPanel: { 
        flex: 1, 
        minWidth: "300px", 
        padding: "20px" 
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
        textAlign: "center" 
    },
    subtitle: { 
        fontSize: "14px", 
        color: "#666", 
        marginBottom: "24px", 
        textAlign: "center" 
    },
    codeForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        alignItems: 'center',
    },
    // --- Styles needed for VerificationCodeInput ---
    inputWrapper: { display: "flex", flexDirection: "column", marginBottom: "18px", width: "100%" },
    label: { fontSize: "14px", fontWeight: "500", marginBottom: "6px", color: "#333" },
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
    // --- End Styles needed for VerificationCodeInput ---

    // inputContainer is no longer used for the 6-box input but kept for consistency if other inputs use it
    inputContainer: { 
        display: "none", // Hide the old single input container
        alignItems: "center",
        border: "1px solid #dcdcdc",
        borderRadius: "12px",
        padding: "10px 14px",
        gap: "10px",
        backgroundColor: "white",
        transition: "border 0.2s ease",
        width: '100%',
    },
    code_input: {
        flex: 1,
        outline: 'none',
        fontSize: '18px',
        border: 'none',
        textAlign: 'center',
        letterSpacing: '5px',
        color: '#333',
        padding: '0',
        display: 'none', // Hide the old single input
    },
    button: {
        width: "100%",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#2563eb",
        color: "white",
        padding: "12px 0",
        fontSize: "15px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "none",
        marginTop: "8px",
        transition: "background 0.2s ease",
        boxSizing: 'border-box',
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
    resendRow: {
        marginTop: '20px',
        fontSize: '14px',
        color: '#666',
        textAlign: 'center',
    },
    loginHint: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#666',
        textAlign: 'center',
    },
    link: {
        color: '#2563eb',
        textDecoration: 'none',
        marginLeft: '5px',
        fontWeight: '600',
        cursor: 'pointer',
    }
};

export default VerifyAccountPage;