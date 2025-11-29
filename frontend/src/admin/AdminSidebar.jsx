import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, MessageSquare, Settings, FileText, 
    Briefcase, Bell, Newspaper, Phone, Mail, UserCheck 
} from 'lucide-react'; 

// Define a style for the NavLink based on active state and hover state
const getLinkStyle = (path, location, hoveredLink) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 15px',
    textDecoration: 'none',
    color: location.pathname.startsWith(path)
        ? '#1e40af' // Blue-800 for active text
        : hoveredLink === path
            ? '#1d4ed8' // Blue-700 for hover text
            : '#333', // Dark text for default
    fontWeight: location.pathname.startsWith(path) ? 700 : 500,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    backgroundColor: location.pathname.startsWith(path)
        ? 'rgba(37, 99, 235, 0.1)' // Blue-600 with 10% opacity for active background
        : hoveredLink === path
            ? 'rgba(37, 99, 235, 0.05)' // Blue-600 with 5% opacity for hover background
            : 'transparent',
});


const AdminSidebar = () => {
    const location = useLocation();
    const [hoveredLink, setHoveredLink] = useState(null); // State for hover effect

    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Manage Users', path: '/admin/users', icon: Users },
        { name: 'Manage Officials', path: '/admin/officials', icon: UserCheck },
        { name: 'Content Management', path: '/admin/content-management', icon: MessageSquare },
        { name: 'Job Listings', path: '/admin/jobs', icon: Briefcase },
    ];
    
    // Updated Content Management paths to allow for nested content links
    const contentNavItems = [
        { name: 'News', path: '/admin/news', icon: Newspaper },
        { name: 'Announcements', path: '/admin/announcements', icon: Bell },
        { name: 'Documents', path: '/admin/documents', icon: FileText },
        { name: 'Services', path: '/admin/services', icon: Settings },
        { name: 'Hotlines', path: '/admin/hotlines', icon: Phone },
        { name: 'Contacts', path: '/admin/contacts', icon: Mail },
    ];

    return (
        <div style={styles.sidebar}>
            <div style={styles.logoContainer}>
                <span style={styles.logoText}>Barangay Admin</span>
            </div>
            
            <nav style={styles.nav}>
                {/* Main Menu */}
                <div style={styles.navSectionTitle}>ADMINISTRATION</div>
                {adminNavItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={() => getLinkStyle(item.path, location, hoveredLink)}
                        onMouseEnter={() => setHoveredLink(item.path)}
                        onMouseLeave={() => setHoveredLink(null)}
                    >
                        <item.icon size={20} style={styles.navIcon} />
                        {item.name}
                    </NavLink>
                ))}
                
                {/* Content Management Menu */}
                <div style={styles.navSectionTitle}>CONTENT MANAGEMENT</div>
                {contentNavItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={() => getLinkStyle(item.path, location, hoveredLink)}
                        onMouseEnter={() => setHoveredLink(item.path)}
                        onMouseLeave={() => setHoveredLink(null)}
                    >
                        <item.icon size={20} style={styles.navIcon} />
                        {item.name}
                    </NavLink>
                ))}
            </nav>
            {/* Added developer note for consistency */}
            <p style={styles.developerNote}>Developed by Mawi</p>
        </div>
    );
};

const styles = {
    // UPDATED: Adopted colors and shadow from Sidebar.jsx
    sidebar: {
        width: '270px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#f7f9fc', // Light background from Sidebar.jsx
        color: '#333', // Dark text color
        padding: '20px 15px', // Adjusted padding
        boxShadow: '2px 0 15px rgba(0,0,0,0.1)', // Subtle shadow from Sidebar.jsx
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
    },
    logoContainer: {
        padding: '10px 15px 20px 15px', // Adjusted padding
        marginBottom: '10px',
        borderBottom: '1px solid #e2e8f0', // Light separator (Slate-200)
    },
    logoText: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#2563eb', // Indigo Accent from Sidebar.jsx
    },
    nav: {
        flex: 1,
        padding: '0', // Removed inner padding
        overflowY: 'auto', 
        display: 'flex',
        flexDirection: 'column',
        gap: '5px', // Added gap between links
    },
    navSectionTitle: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b', // Slate-500/Gray-500 text
        padding: '15px 0px 5px 15px', // Adjusted padding
        letterSpacing: '0.05em',
        textTransform: 'uppercase', 
    },
    navIcon: {
        marginRight: '0px', // Icon spacing is handled by gap: '10px' in getLinkStyle
    },
    developerNote: {
        marginTop: '10px',
        fontSize: '12px',
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
    },
};

export default AdminSidebar;