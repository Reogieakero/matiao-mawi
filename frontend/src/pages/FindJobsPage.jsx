import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Tag, Clock, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react'; 

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

// CONSTANT for truncation length
const MAX_POST_LENGTH = 300; 

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

// Helper: Function to render the media gallery (Copied from SavedPage/HomePage)
const renderMediaGallery = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    // Common style for images in the gallery
    const imageStyle = {
        width: '100%', 
        height: '100%', 
        objectFit: 'cover',
        display: 'block',
    };

    const imageElement = (url) => (
        <div 
            key={url}
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%', 
                overflow: 'hidden',
                borderRadius: '10px'
            }}
        >
            <img 
                src={url} 
                alt="Job media" 
                style={imageStyle} 
            />
        </div>
    );

    // Only handles 1 photo now (consistent with other pages)
    if (mediaUrls.length >= 1) { 
        return (
            <div style={styles.mediaGalleryContainer}>
                {imageElement(mediaUrls[0])}
            </div>
        );
    }

    return null;
};


const FindJobsPage = ({ userName, userEmail, profilePictureUrl }) => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // NEW STATES FOR MODAL 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalJob, setModalJob] = useState(null); 
    

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
    
    // NEW HANDLERS FOR MODAL
    const openJobModal = (job) => {
        setModalJob(job);
        setIsModalOpen(true);
    };

    const closeJobModal = () => {
        setIsModalOpen(false);
        setModalJob(null);
    };


    // Helper: Function to render the post body with truncation (MODIFIED for Modal)
    const renderPostBody = (job) => {
        const bodyContent = job.body || ""; 
        const isLongPost = bodyContent.length > MAX_POST_LENGTH;

        if (isLongPost) { 
            // Truncated content
            const truncatedContent = bodyContent.substring(0, MAX_POST_LENGTH).trim() + '...';
            return (
                <>
                    <p style={styles.jobBody}>
                        {truncatedContent}
                    </p>
                    {/* Read More button calls openJobModal */}
                    <div 
                        style={styles.readMoreButton} 
                        onClick={() => openJobModal(job)} 
                    >
                        <ChevronDown size={14} /> Read More
                    </div>
                </>
            );
        }

        // Full content if not long
        return (
            <p style={styles.jobBody}>
                {bodyContent}
            </p>
        );
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
                        {/* Job title removed as requested */}
                        <p style={styles.jobAuthor}>Posted by {job.author}</p>
                    </div>
                    <div style={{...styles.tag, backgroundColor: tagColor}}>
                        <Tag size={14} style={{ marginRight: '5px' }} />
                        {job.tag}
                    </div>
                </div>
                
                {/* Use the renderPostBody helper */}
                {renderPostBody(job)} 

                {/* Display media gallery if URLs exist */}
                {renderMediaGallery(job.mediaUrls)}
                
                <div style={styles.jobMeta}>
                    <div style={styles.metaItem}><Clock size={14} /> {getTimeSince(job.time)}</div>
                    {/* Display contact number if available */}
                    {job.contactNumber && (
                        <div style={styles.metaItem}><Briefcase size={14} /> Contact: {job.contactNumber}</div>
                    )}
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

            {/* NEW: Job Details Modal */}
            {isModalOpen && modalJob && (
                // ⭐ MODIFIED: Add onClick handler to close the modal when clicking the overlay
                <div style={styles.modalOverlay} onClick={closeJobModal}>
                    {/* ⭐ MODIFIED: Add onClick handler to stop propagation so clicks inside don't close it */}
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        {/* MODIFIED: Removed modalJobTitle element. Only show close button */}
                        <div style={styles.modalHeader}>
                            <X size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={closeJobModal} />
                        </div>
                        
                        <div style={styles.modalUserSection}>
                            {renderAvatar(modalJob)} 
                            <span style={styles.modalUserName}>{modalJob.author}</span>
                            <span style={styles.modalTime}>{getTimeSince(modalJob.time)}</span>
                        </div>
                        
                        {/* Full Content */}
                        <p style={styles.modalJobBody}>
                            {modalJob.body}
                        </p>

                        {/* Media (if any) */}
                        {renderMediaGallery(modalJob.mediaUrls)}

                        <button onClick={closeJobModal} style={styles.modalCloseButton}>
                            <ArrowRight size={16} style={{ marginRight: '5px', transform: 'rotate(180deg)' }} /> Close View
                        </button>
                    </div>
                </div>
            )}
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
    jobAuthor: {
        fontSize: '14px', 
        color: '#1e40af', 
        fontWeight: '600',
        margin: '0',
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
        marginBottom: '0', 
        marginTop: '5px',
        lineHeight: '1.6',
        wordWrap: 'break-word', 
        overflowWrap: 'break-word',
    },
    mediaGalleryContainer: { 
        height: '250px', 
        marginTop: '15px', 
        marginBottom: '15px',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    readMoreButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#3b82f6',
        cursor: 'pointer',
        marginTop: '10px',
        marginBottom: '15px', 
        width: 'fit-content',
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
    
    // NEW MODAL STYLES
    modalOverlay: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
    }, 
    modalContent: { 
        backgroundColor: '#fff', 
        padding: '25px', 
        width: '90%', 
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
    }, 
    modalHeader: { 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        paddingBottom: '10px', 
        paddingTop: '5px',
        marginBottom: '10px',
    }, 
    modalUserSection: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginTop: '5px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '15px'
    },
    modalUserName: { 
        fontWeight: 600, 
        fontSize: '16px', 
        color: '#1e3a8a' 
    },
    modalTime: { 
        fontSize: '14px', 
        color: '#9ca3af', 
        marginLeft: '10px',
    }, 
    modalJobBody: {
        fontSize: '15px',
        color: '#4b5563',
        margin: '15px 0',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap', 
    },
    modalCloseButton: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        width: '100%', 
        padding: '12px', 
        borderRadius: '10px', 
        backgroundColor: '#60a5fa', 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: '16px', 
        border: 'none', 
        cursor: 'pointer', 
        transition: 'background-color 0.2s',
        marginTop: '20px',
    },
};

export default FindJobsPage;