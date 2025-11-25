import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { 
    Users, FileText, BarChart, Briefcase, MessageSquare, 
    Newspaper, Bell, Settings, Phone, Mail 
} from 'lucide-react';

// --- StatCard Component ---
// Removed 'change' prop as it's no longer used for display
const StatCard = ({ icon: Icon, title, value, color, to }) => { 
    // 1. State to track hover status
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate hook

    // 2. Define the hover style based on the state
    const hoverStyle = isHovered ? styles.statCardHover : {};

    // 3. Click handler to navigate
    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        // 4. Apply event handlers and combine default and hover styles, and add onClick
        <div 
            style={{ ...styles.statCard, ...hoverStyle }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick} // Navigate on click
        >
            <div style={styles.statHeader}>
                <p style={styles.statLabel}>{title}</p>
                <Icon size={24} color={color} />
            </div>
            <h2 style={styles.statNumber}>{value}</h2>
            
            {/* * StatFooter is kept but is now an empty placeholder
              * to maintain consistent card height/layout.
              * All conditional change logic has been removed.
              */}
            <div style={styles.statFooter}>
                <span style={{ fontSize: '12px', color: 'transparent' }}>.</span> 
                {/* Invisible content to reserve vertical space */}
            </div>
        </div>
    );
};

// --- AdminDashboardPage Component ---
const AdminDashboardPage = () => {
    return (
        <div style={styles.container}>
            {/* 1. Statistics Grid */}
            <div style={styles.statsGrid}>
                
                {/* ADMIN / USER MANAGEMENT */}
                <StatCard 
                    icon={Users} 
                    title="Total Registered Residents" 
                    value="1,240" 
                    // change prop REMOVED
                    color="#3B82F6" 
                    to="/admin/users" 
                />
                
                {/* CONTENT MANAGEMENT - POSTS */}
                <StatCard 
                    icon={MessageSquare} 
                    title="Total Posted Threads" 
                    value="450" 
                    // change prop REMOVED
                    color="#F59E0B" 
                    to="/admin/posts" 
                />

                {/* CONTENT MANAGEMENT - JOB LISTINGS */}
                <StatCard 
                    icon={Briefcase} 
                    title="Active Job Postings" 
                    value="2" 
                    // change prop REMOVED
                    color="#6366F1" 
                    to="/admin/jobs" 
                />
                
                {/* PUBLIC FACING CONTENT - News */}
                <StatCard 
                    icon={Newspaper} 
                    title="Total News Posts" 
                    value="12" 
                    // change prop REMOVED
                    color="#10B981" 
                    to="/admin/news" 
                />
                
                {/* PUBLIC FACING CONTENT - Announcements */}
                <StatCard 
                    icon={Bell} 
                    title="Total Announcements" 
                    value="8" 
                    // change prop REMOVED
                    color="#EF4444" 
                    to="/admin/announcements" 
                />
                
                {/* SERVICES - Document Requests */}
                <StatCard 
                    icon={FileText} 
                    title="Pending Document Requests" 
                    value="14" 
                    // change prop REMOVED
                    color="#9333EA"
                    to="/admin/documents" 
                />
                
                {/* SERVICES - Offered */}
                <StatCard 
                    icon={Settings} 
                    title="Total Services Offered" 
                    value="5" 
                    // change prop REMOVED
                    color="#06B6D4"
                    to="/admin/services" 
                />
                
                {/* CONTACTS - Hotlines */}
                <StatCard 
                    icon={Phone} 
                    title="Total Hotlines Listed" 
                    value="10" 
                    // change prop REMOVED
                    color="#F97316"
                    to="/admin/hotlines" 
                />
                
                {/* CONTACTS - General Contacts */}
                <StatCard 
                    icon={Mail} 
                    title="Total Contacts Listed" 
                    value="4" 
                    // change prop REMOVED
                    color="#65A30D"
                    to="/admin/contacts" 
                />
            </div>

            {/* Main Content Blocks (Activity Log and Quick Actions) REMOVED */}
            
        </div>
    );
};

// --- Styles Object ---
const styles = {
    container: {
        // 1. UPDATED: Set padding and use flex/height to control layout
        padding: '20px', 
        height: '100%', // Fill parent height
        overflow: 'hidden', // PREVENTS SCROLLING
        display: 'flex', 
        flexDirection: 'column',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
        flexShrink: 0, // Ensure the grid doesn't try to grow too big
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', 
        transition: 'all 0.3s ease', // Smooth transition
        cursor: 'pointer',
    },
    // Style object for the hover effect
    statCardHover: {
        transform: 'translateY(-5px)', // Slightly more noticeable lift
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)', // Deeper shadow on hover
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
        // Kept for consistent spacing/layout, but its content is effectively removed
        display: 'flex',
        alignItems: 'center',
        minHeight: '20px', 
    },
};

export default AdminDashboardPage;