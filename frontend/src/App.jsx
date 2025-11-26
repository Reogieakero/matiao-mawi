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
import DocumentsPage from './pages/DocumentsPage'; 
import ServicesPage from './pages/ServicesPage'; 
import HotlinesPage from './pages/HotlinesPage';
import FindJobsPage from './pages/FindJobsPage'; 
import AboutPage from './pages/AboutPage'; 
import ContactPage from './pages/ContactPage'; 
import AdminUsersPage from './admin/AdminUsersPage';

// --- NEW IMPORTS FOR ADMIN ---
import AdminLayout from './admin/AdminLayout';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
// NEW: Import AdminOfficialsPage
import AdminOfficialsPage from './admin/AdminOfficialsPage'; 

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
    
    // --- NEW STATE FOR ADMIN LOGIN ---
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem("isAdminLoggedIn") === "true");

    // 💥 FIX: Persist login info conditionally and handle cleanup here
    useEffect(() => {
        if (isLoggedIn) {
            // Persist user data only when logged in
            localStorage.setItem("isLoggedIn", "true"); // Must be 'true' string here
            localStorage.setItem("userName", userName);
            localStorage.setItem("userEmail", userEmail);
            localStorage.setItem("userId", userId);
            localStorage.setItem("profilePictureUrl", profilePictureUrl); 
        } else {
            // Cleanup: Remove all user-specific data from localStorage when logged out
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userName");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userId");
            localStorage.removeItem("profilePictureUrl");
        }
        
        // Persist admin login state in sessionStorage (safer for short-lived sessions)
        sessionStorage.setItem("isAdminLoggedIn", isAdminLoggedIn); 
    }, [isLoggedIn, userName, userEmail, userId, profilePictureUrl, isAdminLoggedIn]); 

    // This state is just for triggering a refetch in Sidebar/Header if needed after a main action (like a new post)
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const handleLoginSuccess = (user) => {
        setIsLoggedIn(true);
        setUserName(user.name);
        setUserEmail(user.email);
        setUserId(user.id); 
        
        // Ensure profile picture URL is set from the server response
        if (user.profilePictureUrl) {
            setProfilePictureUrl(user.profilePictureUrl);
            // Persistence is handled by the useEffect above
        }
    };

    const handleLogout = () => {
        // 💥 FIX: Simply clear the state. The useEffect will handle the localStorage cleanup.
        setIsLoggedIn(false); 
        setUserName('');
        setUserEmail('');
        setUserId(null); 
        setProfilePictureUrl(''); 
        
        // Removed explicit localStorage.removeItem() calls here.
    };
    
    // --- NEW HANDLERS FOR ADMIN ---
    const handleAdminLoginSuccess = () => {
        setIsAdminLoggedIn(true);
    };

    const handleAdminLogout = () => {
        setIsAdminLoggedIn(false);
        sessionStorage.removeItem("isAdminLoggedIn");
    };
    // ----------------------------

    // Function to handle user details update from ProfilePage (including picture)
    const handleUpdateUser = ({ name, profilePictureUrl }) => {
        if (name !== undefined) {
            setUserName(name);
            // Persistence is handled by the useEffect above
        }
        if (profilePictureUrl !== undefined) { 
            setProfilePictureUrl(profilePictureUrl);
            // Persistence is handled by the useEffect above
        }
    };


    const AppLayout = () => (
        <>
            <Header 
                userName={userName} 
                profilePictureUrl={profilePictureUrl} 
                onLogout={handleLogout} // <--- Pass the logout handler
            />
            {/* The Sidebar is kept here as a global component */}
            <Sidebar refetchTrigger={refetchTrigger} /> 
            
            <div style={appStyles.contentArea}>
                <Routes>
                    <Route 
                        path="/home" 
                        element={
                            <HomePage 
                                userName={userName} 
                                userEmail={userEmail} 
                                profilePictureUrl={profilePictureUrl} 
                                setRefetchTrigger={setRefetchTrigger}
                            />
                        } 
                    />
                    
                    <Route 
                        path="/saved" 
                        element={<SavedPage 
                            userName={userName} 
                            userEmail={userEmail} 
                            profilePictureUrl={profilePictureUrl} 
                        />} 
                    />
                    <Route path="/search" element={<SearchResultsPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl}/>} />

                    <Route 
                        path="/profile" 
                        element={<ProfilePage 
                            userId={userId} 
                            userName={userName} 
                            userEmail={userEmail}
                            onUpdateUser={handleUpdateUser} 
                            profilePictureUrl={profilePictureUrl}
                        />} 
                    />

                    {/* DOCUMENT PAGE ROUTE */}
                    <Route 
                        path="/documents" 
                        element={<DocumentsPage 
                            userName={userName} 
                            userEmail={userEmail} 
                            profilePictureUrl={profilePictureUrl}
                        />} 
                    />
                    
                    {/* Placeholder Routes */}
                    <Route path="/announcements" element={<Placeholder title="Announcements" />} />
                    <Route path="/services" element={<ServicesPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    
                    {/* UPDATED: Route to the actual AboutPage component */}
                    <Route 
                        path="/about" 
                        element={<AboutPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} 
                    />
                    
                    <Route 
                        path="/hotlines" 
                        element={<HotlinesPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} 
                    />
                    
                    {/* UPDATED: Route to the actual ContactPage component */}
                    <Route 
                        path="/contact" 
                        element={<ContactPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} 
                    />
                    
                    {/* Route to the actual FindJobsPage component */}
                    <Route 
                        path="/find-jobs" 
                        element={<FindJobsPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} 
                    />
                    
                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
        </>
    );

    // --- NEW ADMIN ROUTES WRAPPED IN AdminLayout ---
    const AdminRoutes = () => (
        <AdminLayout onLogout={handleAdminLogout}>
            <Routes>
                {/* Main Dashboard */}
                <Route path="/dashboard" element={<AdminDashboardPage />} />
                
                {/* Placeholder Routes for Admin */}
                <Route path="/users" element={<AdminUsersPage />} />
                {/* NEW: Route for Manage Officials - REPLACED Placeholder with AdminOfficialsPage */}
                <Route path="/officials" element={<AdminOfficialsPage />} /> 
                <Route path="/posts" element={<Placeholder title="Admin Content Posts" />} />
                <Route path="/jobs" element={<Placeholder title="Admin Job Listings" />} />
                <Route path="/news" element={<Placeholder title="Admin News Management" />} />
                <Route path="/announcements" element={<Placeholder title="Admin Announcements" />} />
                <Route path="/documents" element={<Placeholder title="Admin Documents Requests" />} />
                <Route path="/services" element={<Placeholder title="Admin Services Management" />} />
                <Route path="/hotlines" element={<Placeholder title="Admin Hotlines Management" />} />
                <Route path="/contacts" element={<Placeholder title="Admin Contacts Management" />} />
                
                {/* Default Admin Route */}
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </AdminLayout>
    );
    // ----------------------------------------------------

    return (
        <Router>
            <Routes>
                {/* User Routes */}
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/signup" element={<CreateAccountPage />} />
                <Route path="/*" element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />} />
                
                {/* Admin Routes */}
                <Route 
                    path="/admin" 
                    element={isAdminLoggedIn ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage onAdminLoginSuccess={handleAdminLoginSuccess} />} 
                />
                <Route 
                    path="/admin/*" 
                    element={isAdminLoggedIn ? <AdminRoutes /> : <Navigate to="/admin" replace />} 
                />
            </Routes>
        </Router>
    );
};

const appStyles = {
    contentArea: { 
        paddingTop: '60px', 
        marginLeft: '290px', // Standard offset for the Sidebar
        paddingRight: '20px', 
        minHeight: '100vh' 
    }
};

export default App;