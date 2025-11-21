import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, File, Settings, Bookmark } from 'lucide-react'; // Import Bookmark

// Define job categories (matching those in HomePage.jsx)
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];

// Define a color map for the categories
const categoryColors = {
    "Full-Time": '#a5f3fc',
    "Part-Time": '#fde68a',
    "Contract": '#fbcfe8',
    "Internship": '#d9f99d',
};

// MODIFIED: Accepts refetchTrigger prop
const Sidebar = ({ refetchTrigger }) => {
    const location = useLocation();
    const [hoveredLink, setHoveredLink] = useState(null);
    const [jobCounts, setJobCounts] = useState([]); 
    
    // NEW: Function to fetch job counts
    const fetchJobCounts = async () => {
        try {
            // FIX: Corrected URL to match the endpoint in server.js
            const res = await fetch("http://localhost:5000/api/job-categories"); 
            if (!res.ok) throw new Error("Failed to fetch job category counts");
            
            const data = await res.json();
            
            const countsMap = data.reduce((acc, item) => {
                acc[item.tag] = item.count;
                return acc;
            }, {});
            
            const jobsList = jobCategories.map(cat => ({
                title: cat,
                vacancies: countsMap[cat] || 0, 
                color: categoryColors[cat]
            }));
            
            setJobCounts(jobsList);
        } catch (error) {
            console.error("Error fetching job category counts:", error);
            setJobCounts(jobCategories.map(cat => ({
                title: cat,
                vacancies: 0,
                color: categoryColors[cat]
            })));
        }
    };

    // MODIFIED: useEffect now depends on refetchTrigger
    useEffect(() => {
        // This effect re-runs whenever refetchTrigger changes, forcing an update
        fetchJobCounts();
    }, [refetchTrigger]); 


    const navItems = [
        { name: 'Home', path: '/home', icon: <Home size={20} /> },
        { name: 'Saved', path: '/saved', icon: <Bookmark size={20} /> }, // NEW SAVED ITEM
        { name: 'News', path: '/news', icon: <FileText size={20} /> },
        { name: 'Announcements', path: '/announcements', icon: <Bell size={20} /> },
        { name: 'Documents', path: '/documents', icon: <File size={20} /> },
        { name: 'Services', path: '/services', icon: <Settings size={20} /> },
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
                    {jobCounts.map((job, index) => (
                        // MODIFIED: Use li as a wrapper, and Link for the clickable area
                        <li key={index} style={styles.jobItemWrapper}>
                            <Link 
                                to={`/find-jobs?category=${job.title}`}
                                style={styles.jobLink}
                            >
                                {/* Subtle wavy background */}
                                <div style={{ 
                                    ...styles.wavyBackground, 
                                    background: job.color, 
                                    opacity: 0.2 
                                }}></div>

                                <span style={styles.jobTitle}>{job.title}</span>
                                <span style={styles.vacancyCount}>{job.vacancies}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* This link redirects to the FindJobsPage */}
                <Link to="/find-jobs" style={styles.findJobButton}>
                    Explore All Jobs
                </Link>
            </div>

            {/* Developed by Mawi - outside the card */}
            <p style={styles.developerNote}>Developed by Mawi</p>
        </aside>
    );
};

// Styles remain unchanged
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
        zIndex: 10, // Ensure sidebar is above main content
    },
    findJobCard: {
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
    // NEW style for the li wrapper
    jobItemWrapper: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    // NEW style for the Link component
    jobLink: {
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
        textDecoration: 'none', // Remove underline
        width: '85%',
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