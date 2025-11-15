import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, File, Settings } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const [hoveredLink, setHoveredLink] = useState(null);

    const navItems = [
        { name: 'Home', path: '/home', icon: <Home size={20} /> },
        { name: 'News', path: '/news', icon: <FileText size={20} /> },
        { name: 'Announcements', path: '/announcements', icon: <Bell size={20} /> },
        { name: 'Documents', path: '/documents', icon: <File size={20} /> },
        { name: 'Services', path: '/services', icon: <Settings size={20} /> },
    ];

    const jobs = [
        { title: 'Carpenter', vacancies: 3, color: '#a5f3fc' },
        { title: 'Driver', vacancies: 5, color: '#fde68a' },
        { title: 'Electrician', vacancies: 2, color: '#fbcfe8' },
        { title: 'Plumber', vacancies: 1, color: '#d9f99d' },
    ];

    const getLinkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 15px',
        textDecoration: 'none',
        color: location.pathname === path
            ? '#2563eb'
            : hoveredLink === path
                ? '#1d4ed8'
                : '#333',
        fontWeight: location.pathname === path ? 700 : 500,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s',
        backgroundColor: location.pathname === path
            ? 'rgba(37, 99, 235, 0.1)'
            : hoveredLink === path
                ? 'rgba(37, 99, 235, 0.05)'
                : 'transparent',
    });

    return (
        <aside style={styles.sidebar}>
            {/* Navigation Links */}
            {navItems.map(item => (
                <Link
                    key={item.path}
                    to={item.path}
                    style={getLinkStyle(item.path)}
                    onMouseEnter={() => setHoveredLink(item.path)}
                    onMouseLeave={() => setHoveredLink(null)}
                >
                    {item.icon}
                    <span>{item.name}</span>
                </Link>
            ))}

            {/* Find Jobs Section */}
            <div style={styles.findJobCard}>
                <div style={styles.findJobHeader}>
                    <h4 style={styles.findJobTitle}>Find Jobs</h4>
                    <p style={styles.findJobSubTitle}>Latest opportunities in your area</p>
                </div>

                <ul style={styles.jobList}>
                    {jobs.map((job, index) => (
                        <li key={index} style={styles.jobItem}>
                            {/* Subtle wavy background */}
                            <div style={{ 
                                ...styles.wavyBackground, 
                                background: job.color, 
                                opacity: 0.2 
                            }}></div>

                            <span style={styles.jobTitle}>{job.title}</span>
                            <span style={styles.vacancyCount}>{job.vacancies}</span>
                        </li>
                    ))}
                </ul>

                <Link to="/find-jobs" style={styles.findJobButton}>
                    Explore All Jobs
                </Link>
            </div>

            {/* Developed by Mawi - outside the card */}
            <p style={styles.developerNote}>Developed by Mawi</p>
        </aside>
    );
};

const styles = {
    sidebar: {
        position: 'fixed',
        top: '60px',
        left: 0,
        width: '250px',
        height: '100vh',
        padding: '20px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        backgroundColor: '#f7f9fc',
        boxShadow: '2px 0 15px rgba(0,0,0,0.1)',
    },
    findJobCard: {
        marginTop: '20px',
        padding: '20px',
        borderRadius: '15px',
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    findJobHeader: {
        marginBottom: '10px',
    },
    findJobTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 700,
        color: '#1e40af',
    },
    findJobSubTitle: {
        margin: 0,
        fontSize: '13px',
        color: '#1e293b',
    },
    jobList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    jobItem: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '15px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#0f172a',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    wavyBackground: {
        position: 'absolute',
        top: '-20px',
        left: '-20px',
        width: '200%',
        height: '150%',
        borderRadius: '50%',
        transform: 'rotate(25deg)',
        zIndex: 0,
    },
    jobTitle: {
        position: 'relative',
        zIndex: 1,
    },
    vacancyCount: {
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#f87171',
        color: '#fff',
        fontWeight: 700,
        borderRadius: '9999px',
        padding: '3px 8px',
        fontSize: '12px',
        textAlign: 'center',
        animation: 'pulse 1.5s infinite',
    },
    findJobButton: {
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#2563eb',
        color: '#fff',
        borderRadius: '10px',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    },
    developerNote: {
        marginTop: '10px',
        fontSize: '12px',
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
    },
};

export default Sidebar;
