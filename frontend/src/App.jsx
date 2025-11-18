import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import SavedPage from './pages/SavedPage'; 
import SearchResultsPage from './pages/SearchResultsPage'; 
import ProfilePage from './pages/ProfilePage'; 

const Placeholder = ({ title }) => (
    <div style={{ paddingTop: '80px', paddingLeft: '290px', padding: '100px 30px', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
        <h1 style={{ color: '#2563eb' }}>{title} Page</h1>
        <p>This is a placeholder for the <strong>{title}</strong> content.</p>
    </div>
);

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
    const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "");
    const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
    const [profilePictureUrl, setProfilePictureUrl] = useState(() => localStorage.getItem("profilePictureUrl") || "");

    // Persist login info in localStorage 
    useEffect(() => {
        localStorage.setItem("isLoggedIn", isLoggedIn);
        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userId", userId);
        localStorage.setItem("profilePictureUrl", profilePictureUrl); 
    }, [isLoggedIn, userName, userEmail, userId, profilePictureUrl]); 

    const handleLoginSuccess = (user) => {
        setIsLoggedIn(true);
        setUserName(user.name);
        setUserEmail(user.email);
        setUserId(user.id); 
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserName('');
        setUserEmail('');
        setUserId(null); 
        setProfilePictureUrl(''); 
        localStorage.clear();
    };

    // Function to handle user details update from ProfilePage (including picture)
    const handleUpdateUser = ({ name, profilePictureUrl }) => {
        if (name !== undefined) {
            setUserName(name);
            localStorage.setItem("userName", name);
        }
        if (profilePictureUrl !== undefined) { 
            setProfilePictureUrl(profilePictureUrl);
            localStorage.setItem("profilePictureUrl", profilePictureUrl);
        }
    };


    const AppLayout = () => (
        <>
            <Header 
                userName={userName} 
                profilePictureUrl={profilePictureUrl} // Pass prop to Header
                onLogout={handleLogout} 
            />
            <Sidebar profilePictureUrl={profilePictureUrl} />
            <div style={appStyles.contentArea}>
                <Routes>
                    <Route 
                        path="/home" 
                        element={<HomePage 
                            userName={userName} 
                            userEmail={userEmail} 
                            profilePictureUrl={profilePictureUrl} // Pass prop to HomePage
                        />} 
                    />
                    {/* 👇 MODIFIED: Pass user props to SavedPage */}
                    <Route 
                        path="/saved" 
                        element={<SavedPage 
                            userName={userName} 
                            userEmail={userEmail} 
                            profilePictureUrl={profilePictureUrl} 
                        />} 
                    />
                    {/* 👆 END MODIFIED */}
                    <Route path="/search" element={<SearchResultsPage userName={userName} userEmail={userEmail} />} />

                    <Route 
                        path="/profile" 
                        element={<ProfilePage 
                            userId={userId} 
                            userName={userName} 
                            userEmail={userEmail}
                            onUpdateUser={handleUpdateUser} 
                        />} 
                    />

                    {/* Placeholder Routes */}
                    <Route path="/announcements" element={<Placeholder title="Announcements" />} />
                    <Route path="/documents" element={<Placeholder title="Documents" />} />
                    <Route path="/services" element={<Placeholder title="Services" />} />
                    <Route path="/about" element={<Placeholder title="About" />} />
                    <Route path="/hotlines" element={<Placeholder title="Hotlines" />} />
                    <Route path="/contact" element={<Placeholder title="Contact" />} />
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
        paddingTop: '60px', 
        marginLeft: '290px', 
        paddingRight: '20px', 
        minHeight: '100vh' 
    }
};

export default App;