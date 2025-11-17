import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import SavedPage from './pages/SavedPage'; 
import SearchResultsPage from './pages/SearchResultsPage'; // ⭐ NEW IMPORT: Search Results Page

const Placeholder = ({ title }) => (
    <div style={{ paddingTop: '80px', paddingLeft: '290px', padding: '100px 30px', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
        <h1 style={{ color: '#2563eb' }}>{title} Page</h1>
        <p>This is a placeholder for the <strong>{title}</strong> content.</p>
    </div>
);

const App = () => {
    // Include userId in state/localStorage
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
    const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "");
    // Initialize userId from localStorage
    const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);

    // Persist login info in localStorage (including userId)
    useEffect(() => {
        localStorage.setItem("isLoggedIn", isLoggedIn);
        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userId", userId);
    }, [isLoggedIn, userName, userEmail, userId]);

    const handleLoginSuccess = (user) => {
        // user = { id, name, email } from backend
        setIsLoggedIn(true);
        setUserName(user.name);
        setUserEmail(user.email);
        setUserId(user.id); // Save the user ID (this is the key to posting)
    };

    const AppLayout = () => (
        <>
            <Header />
            <Sidebar /> 
            <div style={appStyles.contentArea}>
                <Routes>
                    {/* Primary Routes */}
                    <Route path="/home" element={<HomePage userName={userName} userEmail={userEmail} />} />
                    <Route path="/saved" element={<SavedPage userName={userName} userEmail={userEmail} />} />

                    {/* ⭐ NEW SEARCH ROUTE: Handles URL like /search?q=query */}
                    <Route path="/search" element={<SearchResultsPage />} /> 
                    
                    {/* Placeholder Routes */}
                    <Route path="/news" element={<Placeholder title="News" />} />
                    <Route path="/announcements" element={<Placeholder title="Announcements" />} />
                    <Route path="/documents" element={<Placeholder title="Documents" />} />
                    <Route path="/services" element={<Placeholder title="Services" />} />
                    <Route path="/about" element={<Placeholder title="About" />} />
                    <Route path="/hotlines" element={<Placeholder title="Hotlines" />} />
                    <Route path="/contact" element={<Placeholder title="Contact" />} />
                    <Route path="/profile" element={<Placeholder title="Profile" />} />
                    <Route path="/find-jobs" element={<Placeholder title="Find Jobs" />} />
                    
                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
        </>
    );

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/signup" element={<CreateAccountPage />} />
                <Route path="/*" element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

const appStyles = {
    contentArea: { 
        // Adjusted padding to account for fixed Header and Sidebar
        paddingTop: '60px', 
        marginLeft: '290px', 
        paddingRight: '20px', 
        minHeight: '100vh' 
    }
};

export default App;