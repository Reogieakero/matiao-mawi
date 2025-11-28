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
import NewsPage from './pages/NewsPage';
import ServicesPage from './pages/ServicesPage'; 
import HotlinesPage from './pages/HotlinesPage';
import FindJobsPage from './pages/FindJobsPage'; 
import AboutPage from './pages/AboutPage'; 
import ContactPage from './pages/ContactPage'; 
import AdminUsersPage from './admin/AdminUsersPage';

// --- IMPORTS FOR ADMIN ---
import AdminLayout from './admin/AdminLayout';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import AdminOfficialsPage from './admin/AdminOfficialsPage'; 
import AdminContentManagementPage from './admin/AdminContentManagementPage';
import AdminJobsPage from './admin/AdminJobsPage';
import AdminNewsPage from './admin/AdminNewsPage';
import AdminAnnouncementsPage from './admin/AdminAnnouncementsPage';




// --- Placeholder Component for missing pages ---
const Placeholder = ({ title }) => (
    <div style={{ paddingTop: '80px', paddingLeft: '290px', padding: '100px 30px', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
        <h1 style={{ color: '#2563eb' }}>{title} Page</h1>
        <p>This is a placeholder for the <strong>{title}</strong> content.</p>
    </div>
);
// ---------------------------------------------


const App = () => {
    const [currentUser, setCurrentUser] = useState(null); 
    // CRITICAL FIX 1: New loading state
    const [isLoading, setIsLoading] = useState(true); 
    
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem("isAdminLoggedIn") === "true");

    const isLoggedIn = !!currentUser; 

    /**
     * Fetches the user profile data from the backend using the stored email.
     */
    const fetchUserProfile = async (email) => {
        if (!email) {
            // CRITICAL FIX 2: If no email is found, finish loading immediately.
            setIsLoading(false); 
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/user/profile/${email}`);
            
            if (!response.ok) {
                console.error("Failed to fetch user profile:", response.status);
                handleLogout(false);
            } else {
                const profileData = await response.json();
                setCurrentUser(profileData); 
            }
        } catch (error) {
            console.error("Network or parsing error fetching profile:", error);
            handleLogout(false);
        } finally {
            // CRITICAL FIX 3: Set loading to false once the API call finishes (success or failure)
            setIsLoading(false); 
        }
    };

    const handleLoginSuccess = (user) => {
        localStorage.setItem("userEmail", user.email);
        // Start the loading state while fetching the profile after login
        setIsLoading(true); 
        fetchUserProfile(user.email);
    };

    const handleLogout = (clearLocalStorage = true) => {
        setCurrentUser(null);
        if (clearLocalStorage) {
            localStorage.removeItem("userEmail");
        }
        sessionStorage.removeItem("isAdminLoggedIn");
        setIsAdminLoggedIn(false);
    };
    
    // Admin handlers remain the same...
    const handleAdminLoginSuccess = () => {
        sessionStorage.setItem("isAdminLoggedIn", 'true');
        setIsAdminLoggedIn(true);
    };

    const handleAdminLogout = () => {
        setIsAdminLoggedIn(false);
        sessionStorage.removeItem("isAdminLoggedIn");
    };
    
    const handleUpdateUser = ({ name, profilePictureUrl }) => {
        setCurrentUser(prevUser => ({
            ...prevUser,
            name: name !== undefined ? name : prevUser.name,
            profilePictureUrl: profilePictureUrl !== undefined ? profilePictureUrl : prevUser.profilePictureUrl,
        }));
    };
    
    // Effect hook to check for a previously logged-in user on component mount.
    useEffect(() => {
        const storedUserEmail = localStorage.getItem("userEmail");
        const storedAdminLogin = sessionStorage.getItem("isAdminLoggedIn") === "true";

        if (storedUserEmail) {
            // If email exists, fetch profile, which will set isLoading=false in fetchUserProfile
            fetchUserProfile(storedUserEmail); 
        } else {
            // If no email exists, there's no need to fetch, so we finish loading immediately.
            setIsLoading(false); 
        }
        
        if (storedAdminLogin) {
            setIsAdminLoggedIn(true);
        }
    }, []);

    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // --- RENDER CHECK ---
    // Show a loading screen while we wait for the authentication check to complete
    if (isLoading) {
        return (
            <div style={appStyles.loadingScreen}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h2 style={{ color: '#2563eb' }}>Loading Application...</h2>
            </div>
        );
    }
    // --------------------


    // --- Application Layout for Authenticated Users ---
    const AppLayout = () => (
        <>
            <Header 
                currentUser={currentUser} 
                onLogout={handleLogout} 
            />
            
            <Sidebar refetchTrigger={refetchTrigger} /> 
            
            <div style={appStyles.contentArea}>
                <Routes>
                                    {/* Use optional chaining (currentUser?.) to safely access properties */}
                                    <Route 
                                        path="/home" 
                                        element={
                                            <HomePage 
                                                userName={currentUser?.name} 
                                                userEmail={currentUser?.email} 
                                                profilePictureUrl={currentUser?.profilePictureUrl} 
                                                setRefetchTrigger={setRefetchTrigger}
                                            />
                                        } 
                                    />
                                    
                                    <Route 
                                        path="/saved" 
                                        element={<SavedPage 
                                            userName={currentUser?.name} 
                                            userEmail={currentUser?.email} 
                                            profilePictureUrl={currentUser?.profilePictureUrl} 
                                        />} 
                                    />
                                    <Route path="/search" element={<SearchResultsPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl}/>} />
                
                                    <Route 
                                        path="/profile" 
                                        element={<ProfilePage 
                                            userId={currentUser?.id} 
                                            userName={currentUser?.name} 
                                            userEmail={currentUser?.email}
                                            onUpdateUser={handleUpdateUser} 
                                            profilePictureUrl={currentUser?.profilePictureUrl}
                                        />} 
                                    />
                
                                    <Route 
                                        path="/documents" 
                                        element={<DocumentsPage 
                                            userName={currentUser?.name} 
                                            userEmail={currentUser?.email} 
                                            profilePictureUrl={currentUser?.profilePictureUrl}
                                        />} 
                                    />
                                    
                                    {/* Placeholder and other static routes */}
                                    <Route path="/announcements" element={<Placeholder title="Announcements" />} />
                                    <Route path="/news" element={<NewsPage/>} />
                                    <Route path="/services" element={<ServicesPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl} />} />
                                    
                                    <Route 
                                        path="/about" 
                                        element={<AboutPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl} />} 
                                    />
                                    
                                    <Route 
                                        path="/hotlines" 
                                        element={<HotlinesPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl} />} 
                                    />
                                    
                                    <Route 
                                        path="/contact" 
                                        element={<ContactPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl} />} 
                                    />
                                    
                                    <Route 
                                        path="/find-jobs" 
                                        element={<FindJobsPage userName={currentUser?.name} userEmail={currentUser?.email} profilePictureUrl={currentUser?.profilePictureUrl} />} 
                                    />
                                    
                                    {/* Default Route */}
                                    <Route path="/*" element={<Navigate to="/login" replace />} />
                                </Routes>
            </div>
        </>
    );

    // --- Admin Routes Layout ---
    const AdminRoutes = () => (
        <AdminLayout onLogout={handleAdminLogout}>
                    <Routes>
                        <Route path="/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/users" element={<AdminUsersPage />} />
                        <Route path="/officials" element={<AdminOfficialsPage />} /> 
                        <Route path="/content-management" element={<AdminContentManagementPage />} />
                        <Route path="/jobs" element={<AdminJobsPage />} />
                        <Route path="/news" element={<AdminNewsPage/>} />
                        <Route path="/announcements" element={<AdminAnnouncementsPage/>} />
                        <Route path="/documents" element={<Placeholder title="Admin Documents Requests" />} />
                        <Route path="/services" element={<Placeholder title="Admin Services Management" />} />
                        <Route path="/hotlines" element={<Placeholder title="Admin Hotlines Management" />} />
                        <Route path="/contacts" element={<Placeholder title="Admin Contacts Management" />} />
                        
                        {/* Default Admin Route */}
                        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                </AdminLayout>
    );

    return (
            <Router>
                <Routes>
                    {/* User Authentication Routes */}
                    <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/signup" element={<CreateAccountPage />} />
                    
                    {/* Protected User Routes: Redirects to /login if not logged in */}
                    <Route path="/*" element={isLoggedIn ? <AppLayout /> : <Navigate to="/login" replace />} />
                    
                    {/* Admin Authentication and Protected Routes */}
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
        marginLeft: '290px', 
        paddingRight: '20px', 
        minHeight: '100vh' 
    },
    loadingScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8f8f8',
        gap: '20px',
        fontSize: '24px',
    }
};

export default App;