import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { FiMail, FiLock } from "react-icons/fi"; // Added for potential future icon use if needed

const BACKGROUND_IMAGE_PATH = require("../assets/philippine-barangay-community-hall.jpg");

const VerifyAccountPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Attempt to get the email from the registration page's navigation state
    const userEmail = location.state?.email; 

    const [verificationCode, setVerificationCode] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);


    useEffect(() => setFadeIn(true), []);

    useEffect(() => {
        // Redirect to signup if email is missing (e.g., user navigated directly)
        if (!userEmail) {
            // Give a moment for the fade-in to complete before navigating
            setTimeout(() => navigate('/signup', { replace: true }), 1000); 
        }
    }, [userEmail, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setIsLoading(true);

        // Simple validation
        if (verificationCode.length !== 6) {
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
                    code: verificationCode
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMessage(data.message);
                setIsSuccess(true);
                // Redirect user to the login page after a short delay
                setTimeout(() => {
                    navigate('/login'); 
                }, 3000);
            } else {
                // Display error message from the server (e.g., 'Invalid verification code.')
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
        // Show a loading/redirecting message if email is missing
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
                        <div style={styles.inputContainer}>
                            <FiLock size={18} color="#777" /> {/* Using an icon for context */}
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit Code"
                                style={styles.code_input}
                                maxLength="6"
                                disabled={isLoading || isSuccess}
                            />
                        </div>

                        <button 
                            type="submit" 
                            style={{
                                ...styles.button,
                                opacity: verificationCode.length === 6 && !isLoading && !isSuccess ? 1 : 0.6,
                                cursor: verificationCode.length === 6 && !isLoading && !isSuccess ? "pointer" : "not-allowed",
                            }}
                            disabled={isLoading || verificationCode.length !== 6 || isSuccess}
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

// Merged and adapted styles for consistency
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
    inputContainer: {
        display: "flex",
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
        padding: '0', // Resetting padding from original input for better fit
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