import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, File, Settings, Bookmark, Rss } from 'lucide-react'; 

// Define job categories (matching those in HomePage.jsx)
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];

// Define a color map for the categories
const categoryColors = {
    "Full-Time": '#a5f3fc',
    "Part-Time": '#fde68a',
    "Contract": '#fbcfe8',
    "Internship": '#d9f99d',
};

// Map of link names to the backend category key used in the database
const BADGED_LINKS_MAP = {
    'Announcements': 'announcement',
    'News': 'news',
    'Services': 'service',
};

// Helper style for the badge used in the main navigation links (to fit inline)
// FINAL UPDATE: Styled as a small red circle for notifications.
const navBadgeStyle = {
    backgroundColor: '#ef4444', // Bright red color
    color: '#fff',
    fontWeight: 700,
    borderRadius: '50%', // Perfect circle
    width: '20px',       // Fixed width
    height: '20px',      // Fixed height
    display: 'flex',     // Use flexbox for centering
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '10px',    // Small font size for a tight fit
    marginLeft: 'auto',  // Push badge to the right
    minWidth: '20px',    // Ensures width is not overridden
    textAlign: 'center',
    lineHeight: '1',     // Ensure vertical centering
};


const Sidebar = ({ refetchTrigger, userId }) => { 
    const location = useLocation();
    const [hoveredLink, setHoveredLink] = useState(null);
    const [jobCounts, setJobCounts] = useState([]); 
    
    // NEW STATE: To hold unread counts for Announcement, News, and Service
    const [unreadCounts, setUnreadCounts] = useState({ announcement: 0, news: 0, service: 0 });
    
    // 2. We use the prop 'userId' directly instead of a hardcoded constant.
    const currentUserId = userId; 


    // NEW: Function to fetch unread counts
    const fetchUnreadCounts = async () => {
        if (!currentUserId) return; // Guard clause updated to use currentUserId (which is the prop)

        try {
            // Fetch counts, passing userId as a query parameter
            const res = await fetch(`http://localhost:5000/api/unread-counts?userId=${currentUserId}`); 
            if (!res.ok) throw new Error("Failed to fetch unread counts");
            
            const data = await res.json();
            // Data structure expected: { announcement: 5, news: 2, service: 0 }
            setUnreadCounts(data);
        } catch (error) {
            console.error("Error fetching unread counts:", error);
            setUnreadCounts({ announcement: 0, news: 0, service: 0 });
        }
    };
    
    // NEW: Function to mark a category as read
    const markAsRead = async (category) => {
        if (!currentUserId || !BADGED_LINKS_MAP[category]) return; // Guard clause updated

        try {
            // Post to the backend to update the user's 'last_read_at' timestamp
            const res = await fetch('http://localhost:5000/api/mark-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, category: BADGED_LINKS_MAP[category] }), // Uses currentUserId
            });
            if (!res.ok) throw new Error(`Failed to mark ${category} as read`);

            // Optimistic UI update: Immediately reset the count for the clicked tab
            setUnreadCounts(prev => ({ ...prev, [BADGED_LINKS_MAP[category]]: 0 }));
            
        } catch (error) {
            console.error(`Error marking ${category} as read:`, error);
        }
    };
    
    // EXISTING: Function to fetch job counts
    const fetchJobCounts = async () => {
        try {
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

    // MODIFIED: useEffect now calls both fetch functions
    useEffect(() => {
        fetchJobCounts();
        fetchUnreadCounts(); 
    }, [refetchTrigger, currentUserId]); 


    const navItems = [
        { name: 'Home', path: '/home', icon: <Home size={20} /> },
        { name: 'Saved', path: '/saved', icon: <Bookmark size={20} /> }, 
        { name: 'News', path: '/news', icon: <Rss size={20} /> },
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
        // Check location.pathname for active style
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
            {navItems.map(item => {
                const categoryKey = BADGED_LINKS_MAP[item.name];
                const count = categoryKey ? unreadCounts[categoryKey] : 0;
                const showBadge = count > 0;
                
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={getLinkStyle(item.path)}
                        onMouseEnter={() => setHoveredLink(item.path)}
                        onMouseLeave={() => setHoveredLink(null)}
                        // NEW: Attach markAsRead handler if the item has a badge
                        onClick={categoryKey ? () => markAsRead(item.name) : undefined} 
                    >
                        {item.icon}
                        <span>{item.name}</span>

                        {/* FINAL: Badge rendering uses the circular red style */}
                        {showBadge && (
                            <span style={navBadgeStyle}>
                                {count}
                            </span>
                        )}
                    </Link>
                );
            })}

            {/* Find Jobs Section */}
            <div style={styles.findJobCard}>
                <div style={styles.findJobHeader}>
                    <h4 style={styles.findJobTitle}>Find Jobs</h4>
                    <p style={styles.findJobSubTitle}>Latest opportunities in your area</p>
                </div>

                <ul style={styles.jobList}>
                    {jobCounts.map((job, index) => (
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
                                {/* EXISTING: The job badge uses the vacancyCount style */}
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

// Styles remain unchanged from your provided code
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
        zIndex: 10, 
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
    jobItemWrapper: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
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
        textDecoration: 'none', 
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
    // This style is used for the Find Jobs badge (still rectangular rounded corner)
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