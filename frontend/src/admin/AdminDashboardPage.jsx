// frontend/src/admin/AdminDashboardPage.jsx

import React, { useState, useEffect } from 'react'; // ADDED useEffect
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; // ADDED axios for API calls
import { 
    Users, FileText, BarChart, Briefcase, MessageSquare, 
    Newspaper, Bell, Settings, Phone, Mail 
} from 'lucide-react';

// --- StatCard Component (No functional changes, minor update for readability) ---
const StatCard = ({ icon: Icon, title, value, color, to }) => { 
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate(); 
    
    const hoverStyle = isHovered ? styles.statCardHover : {};

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <div 
            style={{ ...styles.statCard, ...hoverStyle }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick} 
        >
            <div style={styles.statHeader}>
                <p style={styles.statLabel}>{title}</p>
                <Icon size={24} color={color} />
            </div>
            {/* Display value using locale string for thousands separators */}
            <h2 style={styles.statNumber}>{value.toLocaleString()}</h2> 
            
            <div style={styles.statFooter}>
                <span style={{ fontSize: '12px', color: 'transparent' }}>.</span> 
            </div>
        </div>
    );
};

// --- AdminDashboardPage Component ---
const AdminDashboardPage = () => {
    // NEW: State to hold fetched statistics. Initialize to 0.
    const [stats, setStats] = useState({
        totalResidents: 0,
        totalPosts: 0,
        totalJobs: 0,
        totalNews: 0,
        totalAnnouncements: 0,
        pendingDocuments: 0,
        totalServices: 0,
        totalHotlines: 0,
        totalContacts: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // NEW: useEffect to fetch data on component mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch data from the new admin stats endpoint
                // Adjust the base URL as necessary (e.g., http://localhost:5000)
                const response = await axios.get('http://localhost:5000/api/admin/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                // On error, the stats will remain at the initialized 0 values
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []); // Empty dependency array ensures this runs only once on mount

    if (isLoading) {
        // Simple loading indicator while waiting for the API call
        return <div style={styles.container}><h2 style={{color: '#64748B'}}>Loading Dashboard...</h2></div>;
    }
    
    return (
        <div style={styles.container}>
            {/* 1. Statistics Grid - NOW USING FETCHED DATA */}
            <div style={styles.statsGrid}>
                
                {/* ADMIN / USER MANAGEMENT */}
                <StatCard 
                    icon={Users} 
                    title="Total Registered Residents" 
                    value={stats.totalResidents} // UPDATED to use state
                    color="#3B82F6" 
                    to="/admin/users" 
                />
                
                {/* CONTENT MANAGEMENT - POSTS */}
                <StatCard 
                    icon={MessageSquare} 
                    title="Total Posted Threads" 
                    value={stats.totalPosts} // UPDATED to use state
                    color="#F59E0B" 
                    to="/admin/posts" 
                />

                {/* CONTENT MANAGEMENT - JOB LISTINGS */}
                <StatCard 
                    icon={Briefcase} 
                    title="Active Job Postings" 
                    value={stats.totalJobs} // UPDATED to use state
                    color="#6366F1" 
                    to="/admin/jobs" 
                />
                
                {/* PUBLIC FACING CONTENT - News */}
                <StatCard 
                    icon={Newspaper} 
                    title="Total News Posts" 
                    value={stats.totalNews} // UPDATED to use state
                    color="#10B981" 
                    to="/admin/news" 
                />
                
                {/* PUBLIC FACING CONTENT - Announcements */}
                <StatCard 
                    icon={Bell} 
                    title="Total Announcements" 
                    value={stats.totalAnnouncements} // UPDATED to use state
                    color="#EF4444" 
                    to="/admin/announcements" 
                />
                
                {/* SERVICES - Document Requests */}
                <StatCard 
                    icon={FileText} 
                    title="Pending Document Requests" 
                    value={stats.pendingDocuments} // UPDATED to use state
                    color="#9333EA"
                    to="/admin/documents" 
                />
                
                {/* SERVICES - Offered */}
                <StatCard 
                    icon={Settings} 
                    title="Total Services Offered" 
                    value={stats.totalServices} // UPDATED to use state
                    color="#06B6D4"
                    to="/admin/services" 
                />
                
                {/* CONTACTS - Hotlines */}
                <StatCard 
                    icon={Phone} 
                    title="Total Hotlines Listed" 
                    value={stats.totalHotlines} // UPDATED to use state
                    color="#F97316"
                    to="/admin/hotlines" 
                />
                
                {/* CONTACTS - General Contacts */}
                <StatCard 
                    icon={Mail} 
                    title="Total Contacts Listed" 
                    value={stats.totalContacts} // UPDATED to use state
                    color="#65A30D"
                    to="/admin/contacts" 
                />
            </div>

            {/* Main Content Blocks (Activity Log and Quick Actions) */}
            {/* ... other dashboard components if they exist ... */}
            
        </div>
    );
};

// --- Styles Object (No changes) ---
const styles = {
    container: {
        padding: '20px', 
        height: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
        flexShrink: 0, 
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', 
        transition: 'all 0.3s ease', 
        cursor: 'pointer',
    },
    statCardHover: {
        transform: 'translateY(-5px)', 
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)', 
    },
    statHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    statLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748B',
        margin: 0,
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: '800',
        color: '#1E293B',
        margin: '0 0 10px 0',
    },
    statFooter: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '20px', 
    },
};

export default AdminDashboardPage;