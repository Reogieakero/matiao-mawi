import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Tag, Clock, ArrowRight } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';

// Utility function to format the time (Copied from HomePage for consistency)
const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min ago";
    return Math.floor(seconds) + "s ago";
};

// Define job categories
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];
const allCategories = ['All', ...jobCategories];

// Color map for tags
const categoryColors = {
    "Full-Time": '#a5f3fc', // Light Cyan
    "Part-Time": '#fde68a', // Light Yellow
    "Contract": '#fbcfe8', // Light Pink
    "Internship": '#d9f99d', // Light Green
};

const FindJobsPage = ({ userName, userEmail, profilePictureUrl }) => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const fetchJobs = async (category) => {
        setIsLoading(true);
        try {
            // Fetch jobs from the server.js endpoint, using the category filter
            const categoryQuery = category && category !== 'All' ? `?category=${category}` : '';
            // Assuming the server URL is correct
            const res = await fetch(`http://localhost:5000/api/jobs${categoryQuery}`); 
            
            if (!res.ok) throw new Error("Failed to fetch jobs");
            
            const data = await res.json();
            setJobs(data.filter(job => job.type === 'job')); 
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobs([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to fetch jobs whenever the selected category changes
    useEffect(() => {
        fetchJobs(selectedCategory);
    }, [selectedCategory]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    // Helper to render job author avatar/initials
    const renderAvatar = (job) => {
        const initials = job.author
            ? job.author.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U';

        return (
            <div style={styles.avatarCircleSmall}>
                {job.author_picture_url ? (
                    <img src={job.author_picture_url} alt={job.author} style={styles.avatarImage} />
                ) : (
                    initials[0]
                )}
            </div>
        );
    };

    // Render a single job card
    const renderJobCard = (job) => {
        const tagColor = categoryColors[job.tag] || '#e5e7eb'; 

        return (
            <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                    {renderAvatar(job)}
                    <div style={styles.jobTitleArea}>
                        <h3 style={styles.jobTitle}>{job.title}</h3>
                        <p style={styles.jobAuthor}>Posted by {job.author}</p>
                    </div>
                    <div style={{...styles.tag, backgroundColor: tagColor}}>
                        <Tag size={14} style={{ marginRight: '5px' }} />
                        {job.tag}
                    </div>
                </div>
                <p style={styles.jobBody}>{job.body}</p>
                <div style={styles.jobMeta}>
                    <div style={styles.metaItem}><Clock size={14} /> {getTimeSince(job.time)}</div>
                </div>
                {/* Use Link if you have a detail page, otherwise a button */}
                <button style={styles.applyButton}> 
                    View Details & Apply <ArrowRight size={16} style={{ marginLeft: '5px' }} />
                </button>
            </div>
        );
    };

    return (
        <div style={styles.pageContainer}>
            {/* Sidebar (Left Panel) - Must be positioned correctly in its component (fixed/absolute) */}
            <Sidebar /> 
            
            {/* Main Content Area - Uses margins to create space for side panels */}
            <div style={styles.mainContent}>
                <h1 style={styles.heading}>Explore Job Opportunities</h1>
                
                {/* Category Filter Buttons */}
                <div style={styles.filterContainer}>
                    {allCategories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => handleCategoryChange(cat)}
                            style={cat === selectedCategory ? styles.filterButtonActive : styles.filterButton}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                
                {/* Job List */}
                <div style={styles.jobListContainer}>
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading jobs...</p>
                    ) : jobs.length > 0 ? (
                        jobs.map(renderJobCard)
                    ) : (
                        <p style={styles.noJobsText}>No jobs found in the **{selectedCategory}** category.</p>
                    )}
                </div>
            </div>
            
            {/* Right Panel - Must be positioned correctly in its component (fixed/absolute) */}
            <RightPanel 
                userName={userName} 
                userEmail={userEmail} 
                profilePictureUrl={profilePictureUrl} 
            />
        </div>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'flex-start',
    },
    mainContent: {
        // Use 290px to match the global offset defined in App.jsx's contentArea and ensure good spacing
        // Margin-right to reserve space for the RightPanel + gap
        marginRight: '290px', 
        paddingRight: '60px', 
        paddingLeft: '15px',
        flexGrow: 1,
    },
    heading: {
        color: '#1e40af', 
        marginBottom: '20px', 
        borderBottom: '2px solid #bfdbfe', 
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
    },
    filterContainer: {
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
    },
    filterButton: {
        padding: '10px 20px',
        borderRadius: '25px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#4b5563',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    filterButtonActive: {
        padding: '10px 20px',
        borderRadius: '25px',
        border: '1px solid #2563eb',
        backgroundColor: '#eff6ff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        color: '#1e40af',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
    },
    jobListContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '25px',
    },
    jobCard: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
    },
    jobHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
        gap: '15px',
    },
    jobTitleArea: {
        flexGrow: 1,
    },
    jobTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e40af',
        margin: '0',
    },
    jobAuthor: {
        fontSize: '12px',
        color: '#6b7280',
        margin: '0',
        marginTop: '3px',
    },
    tag: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },
    jobBody: {
        fontSize: '14px',
        color: '#374151',
        marginBottom: '15px',
        lineHeight: '1.6',
        maxHeight: '4.8em', 
        overflow: 'hidden',
    },
    jobMeta: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: '#6b7280',
    },
    applyButton: {
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        marginTop: 'auto', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: '16px',
        color: '#6b7280',
        gridColumn: '1 / -1', 
        textAlign: 'center',
        padding: '50px 0',
    },
    noJobsText: {
        fontSize: '16px',
        color: '#ef4444',
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '50px 0',
        fontWeight: '500',
    },
    avatarCircleSmall: { 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        backgroundColor: '#bfdbfe', 
        color: '#1e40af', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '16px', 
        fontWeight: '600',
        overflow: 'hidden',
        flexShrink: 0,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
};

export default FindJobsPage;