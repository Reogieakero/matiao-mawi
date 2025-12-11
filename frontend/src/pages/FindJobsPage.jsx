import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, MapPin, Tag, Clock, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react'; 

import Sidebar from '../components/Sidebar';

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

const MAX_POST_LENGTH = 300; 

const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];
const allCategories = ['All', ...jobCategories];

const categoryColors = {
    "Full-Time": '#a5f3fc', 
    "Part-Time": '#fde68a', 
    "Contract": '#fbcfe8', 
    "Internship": '#d9f99d', 
};

const renderMediaGallery = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

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
    const location = useLocation(); 
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const getInitialCategory = () => {
        const params = new URLSearchParams(location.search);
        const category = params.get('category');
        return allCategories.includes(category) ? category : 'All';
    };
    
    const [selectedCategory, setSelectedCategory] = useState(getInitialCategory); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalJob, setModalJob] = useState(null); 
    

    const fetchJobs = async (category) => {
        setIsLoading(true);
        try {
            const categoryQuery = category && category !== 'All' ? `?category=${category}` : '';
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

    useEffect(() => {
        document.title = "Find Jobs";
        fetchJobs(selectedCategory);
    }, [selectedCategory]);
    
    useEffect(() => {
        const newCategory = getInitialCategory();
        if (newCategory !== selectedCategory) {
            setSelectedCategory(newCategory);
        }
    }, [location.search]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };
    
    const openJobModal = (job) => {
        setModalJob(job);
        setIsModalOpen(true);
    };

    const closeJobModal = () => {
        setIsModalOpen(false);
        setModalJob(null);
    };


    const renderPostBody = (job) => {
        const bodyContent = job.body || ""; 
        const isLongPost = bodyContent.length > MAX_POST_LENGTH;

        if (isLongPost) { 
            const truncatedContent = bodyContent.substring(0, MAX_POST_LENGTH).trim() + '...';
            return (
                <>
                    <p style={styles.jobBody}>
                        {truncatedContent}
                    </p>
                    <div 
                        style={styles.readMoreButton} 
                        onClick={() => openJobModal(job)} 
                    >
                        <ChevronDown size={14} /> Read More
                    </div>
                </>
            );
        }

        return (
            <p style={styles.jobBody}>
                {bodyContent}
            </p>
        );
    };

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

    const renderJobCard = (job) => {
        const tagColor = categoryColors[job.tag] || '#e5e7eb'; 

        return (
            <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                    {renderAvatar(job)}
                    <div style={styles.jobTitleArea}>
                        <p style={styles.jobAuthor}>Posted by {job.author}</p>
                    </div>
                    <div style={{...styles.tag, backgroundColor: tagColor}}>
                        <Tag size={14} style={{ marginRight: '5px' }} />
                        {job.tag}
                    </div>
                </div>
                
                <div style={styles.jobContentWrapper}>
                    {renderPostBody(job)} 

                    {renderMediaGallery(job.mediaUrls)}
                </div>
                
                <div style={styles.jobMeta}>
                    <div style={styles.metaItem}><Clock size={14} /> {getTimeSince(job.time)}</div>
                    {job.contactNumber && (
                        <div style={styles.metaItem}><Briefcase size={14} /> Contact: {job.contactNumber}</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.pageContainer}>
            <Sidebar /> 
            
            <div style={styles.mainContent}>
                <h1 style={styles.heading}>Explore Job Opportunities</h1>
                
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
                
                <div style={styles.jobListContainer}>
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading jobs...</p>
                    ) : jobs.length > 0 ? (
                        jobs.map(renderJobCard)
                    ) : (
                        <p style={styles.noJobsText}>No jobs found in the {selectedCategory} category.</p>
                    )}
                </div>
            </div>
            

            {isModalOpen && modalJob && (
                <div style={styles.modalOverlay} onClick={closeJobModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <X size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={closeJobModal} />
                        </div>
                        
                        <div style={styles.modalUserSection}>
                            {renderAvatar(modalJob)} 
                            <span style={styles.modalUserName}>{modalJob.author}</span>
                            <span style={styles.modalTime}>{getTimeSince(modalJob.time)}</span>
                        </div>
                        
                        <p style={styles.modalJobBody}>
                            {modalJob.body}
                        </p>

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
        paddingLeft: '15px',
        paddingRight: '60px', 
        paddingTop: '20px', 
        paddingBottom: '20px', 
        flexGrow: 1,
    },
    heading: {
        fontSize: '24px', 
        fontWeight: '700', 
        color: '#1e40af', 
        marginBottom: '15px', 
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
        gridTemplateColumns: 'repeat(3, 1fr)', 
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
        height: '480px', 
    },
    jobContentWrapper: {
        flex: 1, 
        overflowY: 'auto',
        paddingBottom: '15px', 
        marginBottom: '10px',
    },
    jobHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
        gap: '15px',
        flexShrink: 0,
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
        flexShrink: 0, 
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
        flexShrink: 0,
    },
    jobMeta: {
        display: 'flex',
        gap: '20px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        flexShrink: 0, 
        marginTop: 'auto', 
        marginBottom: '0', 
        paddingBottom: '10px', 
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: '#6b7280',
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