import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, MessageSquare, Settings, LogOut, FileText, 
    Briefcase, Bell, Newspaper, Phone, Mail 
} from 'lucide-react'; // Added Newspaper, Bell, Phone, Mail

const AdminSidebar = ({ onLogout }) => {
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

            <div style={styles.footer}>
                 <div style={styles.logoutBtn} onClick={onLogout}>
                    <LogOut size={20} style={styles.logoutIcon} />
                    Logout
                </div>
            </div>
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
        // NavLink requires a function for active styles, but we can't use pseudo-classes like :hover
        // in inline styles easily without external libraries. We'll rely on the default hover style 
        // which the original component was doing with a functional style property (which I'll skip 
        // for simplicity, or just apply a minimal hover style to the parent container).
        // For now, let's keep the active style clean.
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
    footer: {
        padding: '20px 30px 10px 30px',
        borderTop: '1px solid #334155',
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        color: '#F87171', // Red accent for logout
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '500',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#334155',
        }
    },
    logoutIcon: {
        marginRight: '12px',
    }
};

export default AdminSidebar;