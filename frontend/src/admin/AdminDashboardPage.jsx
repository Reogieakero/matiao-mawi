// frontend/src/admin/AdminDashboardPage.jsx

import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { 
    Users, FileText, BarChart, Briefcase, MessageSquare, 
    Newspaper, Bell, Settings, Phone, Mail 
} from 'lucide-react';

// --- StatCard Component ---
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
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalContacts: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard stats from the backend
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Assuming your Express server runs on port 5000
                const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
                setStats(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError('Failed to load dashboard statistics from the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div style={{...styles.container, justifyContent: 'center', alignItems: 'center'}}><p style={{color: '#2563eb'}}>Loading Dashboard Stats...</p></div>;
    }

    if (error) {
        return <div style={{...styles.container, justifyContent: 'center', alignItems: 'center'}}><p style={{color: '#DC2626'}}>Error: {error}</p></div>;
    }


    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Admin Dashboard</h1>
            <p style={styles.subtitle}>Welcome to the administration panel. Here's a quick overview of your application data.</p>
            
            <div style={styles.statsGrid}>
                {/* USER MANAGEMENT */}
                <StatCard 
                    icon={Users} 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    color="#059669" 
                    to="/admin/users" 
                />
                
                {/* COMMUNITY CONTENT - Posts */}
                <StatCard 
                    icon={FileText} 
                    title="Total Community Posts" 
                    value={stats.totalPosts} 
                    color="#2563EB" 
                    to="/admin/posts" 
                />
                
                {/* CONTENT MANAGEMENT - JOB LISTINGS */}
                <StatCard 
                    icon={Briefcase} 
                    title="Active Job Postings" 
                    value={stats.totalJobs} 
                    color="#6366F1" 
                    to="/admin/jobs" 
                />
                
                {/* DOCUMENT & SERVICES - Applications */}
                <StatCard 
                    icon={FileText} 
                    title="Document Applications" 
                    value={stats.totalApplications} 
                    color="#F59E0B" 
                    to="/admin/documents" 
                />

                {/* SUPPORT & CONTACTS - Messages */}
                <StatCard 
                    icon={Mail} 
                    title="Contact Messages" 
                    value={stats.totalContacts} 
                    color="#DC2626" 
                    to="/admin/contacts" 
                />
                
                {/* You can add more database-backed cards here */}
            </div>

            {/* QUICK ACTIONS & RECENT ACTIVITY (Placeholder for other dashboard components) */}
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
    pageTitle: {
        color: '#1F2937', 
        marginBottom: '5px',
    },
    subtitle: {
        color: '#6B7280', 
        fontSize: '14px', 
        marginBottom: '30px', 
        paddingBottom: '10px',
        borderBottom: '1px solid #E5E7EB'
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
        margin: 0,
        fontSize: '14px',
        fontWeight: '500',
        color: '#6B7280',
    },
    statNumber: {
        margin: '0',
        fontSize: '32px',
        fontWeight: '700',
        color: '#1F2937',
    },
    statFooter: {
        marginTop: '15px',
    },
};

export default AdminDashboardPage;