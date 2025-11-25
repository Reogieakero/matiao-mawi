import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, MessageSquare, Settings, FileText, 
    Briefcase, Bell, Newspaper, Phone, Mail 
} from 'lucide-react'; // Removed LogOut

// Removed onLogout prop from component definition
const AdminSidebar = () => {
    const location = useLocation();

    // UPDATED: Added new navigation items matching user-facing pages
    const adminNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Manage Users', path: '/admin/users', icon: Users },
        { name: 'Content Posts', path: '/admin/posts', icon: MessageSquare },
        { name: 'Job Listings', path: '/admin/jobs', icon: Briefcase },
    ];
    
    // NEW SECTION: Management for Public-Facing Content
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
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : styles.navLinkHover),
                        })}
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
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : styles.navLinkHover),
                        })}
                    >
                        <item.icon size={20} style={styles.navIcon} />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* Removed the entire footer block which contained the logout button */}
        </div>
    );
};

const styles = {
    sidebar: {
        width: '290px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#1E293B', // Dark Slate Background
        color: 'white',
        padding: '20px 0',
        boxShadow: '4px 0 16px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
    },
    logoContainer: {
        padding: '10px 30px 20px 30px',
        marginBottom: '10px',
        borderBottom: '1px solid #334155', // Separator below logo
    },
    logoText: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#6366F1', // Indigo Accent
    },
    nav: {
        flex: 1,
        padding: '0 15px',
        overflowY: 'auto', // Scrollable navigation
    },
    navSectionTitle: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#94A3B8', // Gray text
        padding: '15px 15px 5px 15px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase', // Title case for section headers
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 15px',
        margin: '5px 0',
        color: '#E2E8F0', 
        textDecoration: 'none',
        fontSize: '15px',
        fontWeight: '500',
        borderRadius: '8px',
        transition: 'background-color 0.2s, color 0.2s',
    },
    navLinkHover: {
        // ... (styles remain as-is)
    },
    navLinkActive: {
        backgroundColor: '#4338CA', // Stronger Indigo for active
        color: 'white',
        fontWeight: '600',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', // Subtle shadow for active item
    },
    navIcon: {
        marginRight: '12px',
    },
    // Removed footer, logoutBtn, and logoutIcon styles
};

export default AdminSidebar;