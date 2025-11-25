import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// User Components
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
import FindJobsPage from './pages/FindJobsPage'; 
import AboutPage from './pages/AboutPage'; 
import ContactPage from './pages/ContactPage'; 
import HotlinesPage from './pages/HotlinesPage';

// Admin Components
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage'; // <-- NEW
import AdminLayout from './admin/AdminLayout'; // <-- NEW

// --------------------------------------------------------
// Placeholder Component for incomplete pages
// --------------------------------------------------------
const Placeholder = ({ title }) => (
    <div style={{ padding: '30px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>{title} Page</h1>
        <p>This is a placeholder for the <strong>{title}</strong> content.</p>
    </div>
);

// --------------------------------------------------------
// Protected Route Component for Admin
// --------------------------------------------------------
const ProtectedAdminRoute = ({ isAdmin, children }) => {
    if (!isAdmin) {
        // Redirect non-admin users to the admin login route
        return <Navigate to="/admin" replace />; 
    }
    return children;
};

// --------------------------------------------------------
// Main App Component
// --------------------------------------------------------
const App = () => {
    // State initialization using localStorage for persistence
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
    const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "");
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "");
    const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
    const [profilePictureUrl, setProfilePictureUrl] = useState(() => localStorage.getItem("profilePictureUrl") || "");
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("isAdmin") === "true"); 
    
    // This state is just for triggering a refetch in Sidebar/Header if needed after a main action (like a new post)
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // Persist login info in localStorage 
    useEffect(() => {
        localStorage.setItem("isLoggedIn", isLoggedIn);
        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userId", userId);
        localStorage.setItem("profilePictureUrl", profilePictureUrl); 
        localStorage.setItem("isAdmin", isAdmin);
    }, [isLoggedIn, userName, userEmail, userId, profilePictureUrl, isAdmin]); 

    // User Login Handlers
    const handleLoginSuccess = (user) => {
        setIsLoggedIn(true);
        setUserName(user.name);
        setUserEmail(user.email);
        setUserId(user.id); 
        setIsAdmin(false); // Ensure regular user is not set as admin
    };
    
    // Admin Login Handler
    const handleAdminLoginSuccess = () => {
        setIsLoggedIn(true);
        setIsAdmin(true);
        setUserName("Admin Portal"); 
        setUserEmail("admin@portal.com");
    };
    
    // Common Logout Handler
    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserName('');
        setUserEmail('');
        setUserId(null); 
        setProfilePictureUrl(''); 
        setIsAdmin(false);
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

    // Component for the main application layout (user-facing)
    const AppLayout = () => (
        <>
            <Header 
                userName={userName} 
                profilePictureUrl={profilePictureUrl} 
                onLogout={handleLogout} 
                isAdmin={isAdmin} 
            />
            {/* The Sidebar is kept here as a global component */}
            <Sidebar refetchTrigger={refetchTrigger} /> 
            
            <div style={appStyles.contentArea}>
                <Routes>
                    {/* --- REGULAR USER ROUTES --- */}
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
                    <Route path="/saved" element={<SavedPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    <Route path="/search" element={<SearchResultsPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl}/>} />
                    <Route path="/profile" element={<ProfilePage userId={userId} userName={userName} userEmail={userEmail} onUpdateUser={handleUpdateUser} profilePictureUrl={profilePictureUrl}/>} />
                    <Route path="/documents" element={<DocumentsPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl}/>} />
                    <Route path="/announcements" element={<Placeholder title="Announcements" />} />
                    <Route path="/services" element={<ServicesPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    <Route path="/about" element={<AboutPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    <Route path="/hotlines" element={<HotlinesPage />} />
                    <Route path="/contact" element={<ContactPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    <Route path="/find-jobs" element={<FindJobsPage userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />} />
                    
                    {/* Default Route for AppLayout */}
                    <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
            </div>
        </>
    );

    return (
        <Router>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/signup" element={<CreateAccountPage />} />
                
                {/* ADMIN LOGIN ROUTE */}
                <Route path="/admin" element={<AdminLoginPage onAdminLoginSuccess={handleAdminLoginSuccess} />} />
                
                {/* --- ADMIN PROTECTED ROUTES --- */} 
                {/* The AdminLayout wraps all admin pages (Header, Sidebar, Content) */}
                <Route 
                    path="/admin/*" 
                    element={
                        <ProtectedAdminRoute isAdmin={isAdmin}>
                            <AdminLayout onLogout={handleLogout}> {/* Pass common logout handler */}
                                <Routes>
                                    <Route path="dashboard" element={<AdminDashboardPage />} />
                                    {/* Add more admin pages here: */}
                                    <Route path="users" element={<Placeholder title="Manage Users" />} />
                                    <Route path="posts" element={<Placeholder title="Manage Posts" />} />
                                    <Route path="settings" element={<Placeholder title="System Settings" />} />
                                    {/* Redirect admin root to dashboard */}
                                    <Route path="/" element={<Navigate to="dashboard" replace />} />
                                </Routes>
                            </AdminLayout>
                        </ProtectedAdminRoute>
                    } 
                />
                {/* ------------------------------- */}

                {/* USER PROTECTED ROUTE (Fallthrough for all other paths) */}
                <Route path="/*" element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

// Styles for the main user application layout
const appStyles = {
    contentArea: { 
        paddingTop: '60px', 
        marginLeft: '290px', // Standard offset for the Sidebar
        paddingRight: '20px', 
        minHeight: '100vh' 
    }
};

export default App;