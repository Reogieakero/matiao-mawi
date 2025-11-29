// frontend/src/admin/AdminJobPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Eye, MessageSquare, Briefcase, Phone, CheckCircle, 
    ExternalLink, User, Calendar, Tag, HardHat, DollarSign, Plus, 
    Trash2, // Import Trash2 icon for deletion
    XCircle // Import XCircle for error messages
} from 'lucide-react';

// NOTE: Ensure this matches your actual API base URL.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- COLOR PALETTE DEFINITION (Based on AdminSidebar.jsx and user preference #1e40af) ---
const PRIMARY_BLUE_DARK = '#2563eb'; // User's preferred color, Active/Text/Header/Borders
const PRIMARY_BLUE = '#1e40af'; // Blue-600/Indigo Accent for logos, main buttons (used for CTA)
const LIGHT_ACCENT_BG = 'rgba(30, 64, 175, 0.1)'; // 10% opacity of PRIMARY_BLUE_DARK
const NEUTRAL_BG = '#f7f9fc'; // Light background
const NEUTRAL_PAGE_BG = '#F9FAFB'; // Light page background (retained as close to F7F9FC)
const TEXT_DARK = '#333';
const TEXT_MUTED = '#64748b'; // Slate-500/Gray-500

// --- Utility Function: Format Date ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- Job Tag Filter Options ---
const JOB_TAG_OPTIONS = [
    'All',
    'Full-Time',
    'Part-Time',
    'Internship',
    'Contract',
    // Add other relevant tags as needed
];

// --- Main Component ---
const AdminJobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTagFilter, setActiveTagFilter] = useState('All'); 
    
    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsError, setApplicationsError] = useState(null);

    // --- STATES FOR JOB POSTING MODAL ---
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [jobBody, setJobBody] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [selectedTag, setSelectedTag] = useState(JOB_TAG_OPTIONS[1]); 
    const [selectedFile, setSelectedFile] = useState(null); 
    const [isUploadingFile, setIsUploadingFile] = useState(false); 
    
    // --- Confirmation/Message Modal State ---
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // --- NEW: Deletion Confirmation State ---
    const [jobIdToDelete, setJobIdToDelete] = useState(null);
    
    const closeMessageModal = () => {
        setMessage(null);
        setIsSuccess(false);
    };
    
    // --- NEW: Close Confirmation Modal ---
    const closeConfirmationModal = () => {
        setJobIdToDelete(null);
    };

    // --- ADMIN ID CHECK ---
    // Enforce the admin user ID for posting and deletion.
    const ADMIN_POSTING_ID = 1001; 

    /**
     * Fetches all job listings from the server.
     */
    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Dedicated admin endpoint for jobs
            const response = await axios.get(`${API_BASE_URL}/admin/jobs/all`, {
                withCredentials: true 
            });
            setJobs(response.data.jobs || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to load job listings. Check the /api/admin/jobs/all endpoint.');
            setLoading(false);
        }
    };

    /**
     * Fetches all applications (responses) for a specific job.
     */
    const fetchApplications = async (jobId) => {
        setApplicationsLoading(true);
        setApplicationsError(null);
        setApplications([]);
        try {
            // Reuses the content response endpoint logic
            const endpoint = `${API_BASE_URL}/admin/content/job/responses/${jobId}`;
            const response = await axios.get(endpoint, {
                withCredentials: true
            });
            setApplications(response.data.responses || []);
            setApplicationsLoading(false);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setApplicationsError('Failed to load applications for this job.');
            setApplicationsLoading(false);
        }
    };
    
    // --- Job Posting Logic ---

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    /**
     * Handles the media upload to the server.
     */
    const uploadMedia = async () => {
        if (!selectedFile) return []; 

        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append('media', selectedFile); 

        try {
            const res = await axios.post(`${API_BASE_URL}/upload-media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (res.data && res.data.mediaUrls) {
                return res.data.mediaUrls;
            }
            throw new Error('Upload successful but no media URLs returned.');

        } catch (err) {
            console.error("Upload Media Error:", err);
            throw new Error(err.response?.data?.message || 'Failed to upload media.'); 
        } finally {
            setIsUploadingFile(false);
        }
    };
    
    /**
     * Handles the creation and submission of a new job post.
     */
    const handlePostJobSubmit = async () => {
        // --- VALIDATION AND ADMIN ID CHECK ---
        if (!title.trim() || !jobBody.trim() || !contactNumber.trim() || !selectedTag) {
            // Replaced alert()
            setMessage('Title, job description, category, and contact number are required.');
            setIsSuccess(false);
            return;
        }
        
        // Simple validation for PH mobile number format
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(contactNumber)) {
            // Replaced alert()
            setMessage('Invalid contact number format. Use 09xxxxxxxxx or +639xxxxxxxxx.');
            setIsSuccess(false);
            return;
        }

        try {
            let mediaUrls = [];
            if (selectedFile) {
                mediaUrls = await uploadMedia();
            }

            const payload = {
                userId: ADMIN_POSTING_ID, 
                postType: 'job', 
                title: title,
                postContent: jobBody,
                postCategory: selectedTag,
                mediaUrls: mediaUrls,
                contactNumber: contactNumber,
                isAdminPost: true,
            };

            const res = await axios.post(`${API_BASE_URL}/threads`, payload, {
                withCredentials: true
            });

            // On success, reset form and refresh job list
            if (res.status === 201 || res.status === 200) {
                setTitle('');
                setJobBody('');
                setContactNumber('');
                setSelectedTag(JOB_TAG_OPTIONS[1]);
                setSelectedFile(null);
                setIsPostModalOpen(false);

                fetchJobs(); 
                // Replaced alert()
                setMessage("Job successfully posted!");
                setIsSuccess(true);
            } else {
                // Replaced alert()
                setMessage(`Failed to post job: ${res.data.message || 'Unknown error'}`);
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Job posting error:", error.response?.data?.message || error.message);
            // Replaced alert()
            setMessage(`Error posting job: ${error.response?.data?.message || error.message}`);
            setIsSuccess(false);
        }
    };

    // --- JOB DELETION LOGIC (UPDATED) ---
    /**
     * STEP 1: Sets the job ID to be confirmed for deletion.
     * This will trigger the custom DeleteConfirmationModal to appear.
     */
    const promptDeleteJob = (jobId) => {
        setJobIdToDelete(jobId);
    };

    /**
     * STEP 2: The actual function that performs the API call to delete the job.
     * This is called only after the user confirms in the modal.
     */
    const executeDeleteJob = async (jobId) => {
        closeConfirmationModal(); // Close the confirmation modal immediately

        try {
            // Uses the generic thread deletion endpoint /api/threads/:threadId
            const res = await axios.delete(`${API_BASE_URL}/threads/${jobId}`, {
                data: { 
                    threadType: 'job', 
                    userId: ADMIN_POSTING_ID, 
                },
                withCredentials: true
            });

            if (res.status === 200) {
                setMessage(res.data.message || "Job deleted successfully!");
                setIsSuccess(true);
                fetchJobs(); // Refresh the job list
                // If the detail modal is open for this job, close it
                if (selectedJob && selectedJob.id === jobId) {
                    closeDetailModal();
                }
            } else {
                setMessage(`Failed to delete job: ${res.data.message || 'Unknown error'}`);
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Job deletion error:", error.response?.data?.message || error.message);
            setMessage(`Error deleting job: ${error.response?.data?.message || error.message || 'Server error'}`);
            setIsSuccess(false);
        }
    };
    // --- END JOB DELETION LOGIC ---


    useEffect(() => {
        fetchJobs();
    }, []);

    // --- Filtering Memoized Data ---
    const filteredAndSortedJobs = useMemo(() => {
        let currentJobs = [...jobs];

        // 1. Filtering by search query
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentJobs = currentJobs.filter(item =>
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.author_name || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.tag || '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 2. Filtering by job tag/type
        if (activeTagFilter !== 'All') {
            const lowerCaseTag = activeTagFilter.toLowerCase();
            currentJobs = currentJobs.filter(item => 
                (item.tag || '').toLowerCase() === lowerCaseTag.toLowerCase()
            );
        }

        // 3. Default Sorting (Always sort by created_at descending)
        currentJobs.sort((a, b) => {
            const aDate = new Date(a.created_at).getTime();
            const bDate = new Date(b.created_at).getTime();
            return bDate - aDate; // Descending order (newest first)
        });

        return currentJobs;
    }, [jobs, searchQuery, activeTagFilter]);

    // --- Detail Modal Handlers ---
    const openDetailModal = (job) => {
        setSelectedJob(job);
        fetchApplications(job.id);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedJob(null);
        setApplications([]);
        setApplicationsError(null);
    };

    // --- Filter Option Component ---
    const FilterOption = ({ tag }) => {
        const isSelected = activeTagFilter === tag;
        
        return (
            <button 
                onClick={() => setActiveTagFilter(tag)} 
                style={{
                    ...styles.filterButton, 
                    // Set selected color to PRIMARY_BLUE
                    backgroundColor: isSelected ? PRIMARY_BLUE : '#F3F4F6', 
                    color: isSelected ? 'white' : TEXT_MUTED,
                    fontWeight: isSelected ? '700' : '500',
                    border: isSelected ? `1px solid ${PRIMARY_BLUE}` : '1px solid #D1D5DB'
                }}
            >
                {tag}
            </button>
        );
    };
    
    // --- Job Card Component (UPDATED) ---
    const JobCard = ({ job, onClick, adminId }) => ( 
        <div style={cardStyles.card}>
            <div style={cardStyles.header}>
                <h3 style={cardStyles.title}>{job.title}</h3>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <span style={{
                        ...cardStyles.tag, 
                        // Text color set to the user's preferred dark blue
                        color: PRIMARY_BLUE_DARK,
                        // Background color set to the light accent using the dark blue
                        backgroundColor: LIGHT_ACCENT_BG,
                    }}><Tag size={12} style={{marginRight: '5px'}}/>{job.tag}</span>
                </div>
            </div>
            
            <div style={cardStyles.body} onClick={() => onClick(job)}>
                <div style={cardStyles.infoItem}>
                    <User size={16} style={cardStyles.icon} />
                    <span>Posted by: {job.author_name}</span>
                </div>
                <div style={cardStyles.infoItem}>
                    <Calendar size={16} style={cardStyles.icon} />
                    <span>Date Posted: {formatDate(job.created_at)}</span>
                </div>
                <div style={cardStyles.infoItem}>
                    <MessageSquare size={16} style={cardStyles.icon} />
                    <span>Applications: {job.response_count}</span>
                </div>
            </div>

            <div style={cardStyles.footer}>
                {/* Conditional check: Only show delete button if job.author_id matches ADMIN_POSTING_ID */}
                {job.author_id === adminId && ( 
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); // Prevents the main card onClick from opening the modal
                            // Calls the function to prompt the custom modal
                            promptDeleteJob(job.id); 
                        }}
                        style={cardStyles.deleteButtonFooter} 
                        title="Delete Job Post"
                    >
                        <Trash2 size={16} />
                    </button>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); onClick(job); }} 
                    style={{
                        ...styles.actionButton,
                        // Action button color set to PRIMARY_BLUE
                        backgroundColor: PRIMARY_BLUE, 
                        // Action button hover color set to PRIMARY_BLUE_DARK
                        ':hover': { backgroundColor: PRIMARY_BLUE_DARK },
                    }}
                    title="View Details & Applications"
                >
                     Read More
                </button>
            </div>
        </div>
    );


    // --- Detail Modal Content ---
    const JobDetailModal = () => {
        if (!selectedJob) return null;

        return (
            <div style={modalStyles.backdrop}>
                <div style={modalStyles.modal}>
                    <button style={modalStyles.closeButton} onClick={closeDetailModal}>&times;</button>
                    
                    <h2 style={styles.detailTitle}>{selectedJob.title}</h2>

                    <p style={styles.detailSubtitle}>
                        <span style={{ marginRight: '15px' }}>
                            <User size={14} style={styles.iconInline} /> 
                            {selectedJob.author_name}
                        </span>
                        <span style={{ marginRight: '15px' }}>
                            <Calendar size={14} style={styles.iconInline} /> 
                            {formatDate(selectedJob.created_at)}
                        </span>
                    </p>
                    
                    <div style={{
                        ...styles.detailSection,
                        // Background set to light accent BG
                        backgroundColor: LIGHT_ACCENT_BG, 
                        // Border set to dark primary blue
                        border: `1px solid ${PRIMARY_BLUE_DARK}`,
                    }}>
                        <h4 style={{
                            ...styles.detailSectionHeader, 
                            // Header text set to dark primary blue
                            color: PRIMARY_BLUE_DARK,
                            // Header border set to dark primary blue
                            borderBottom: `2px solid ${PRIMARY_BLUE_DARK}`,
                        }}>Job Overview</h4>
                        <p><strong>Category:</strong> {selectedJob.tag}</p>
                        <p style={{marginBottom: '10px'}}>
                            <strong>Contact:</strong> 
                            <Phone size={14} style={styles.iconInline} /> 
                            {/* Link color set to PRIMARY_BLUE */}
                            <a href={`tel:${selectedJob.contact_number}`} style={{...styles.contactLink, color: PRIMARY_BLUE}}>
                                {selectedJob.contact_number || 'N/A'}
                            </a>
                        </p>
                        <p style={styles.jobBodyText}>{selectedJob.content_body}</p>
                        
                        {selectedJob.media_url && selectedJob.media_url.length > 0 && (
                            <div style={{
                                ...styles.mediaAttachmentsContainer, 
                                // Border color set to dark primary blue
                                borderTop: `1px dashed ${PRIMARY_BLUE_DARK}`
                            }}>
                                <p style={{fontWeight: '600', color: styles.detailSectionHeader.color}}>Media Attachments:</p>
                                <div style={styles.mediaLinkList}>
                                    {selectedJob.media_url.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{
                                            ...styles.mediaLink, 
                                            // Link text color set to dark primary blue
                                            color: PRIMARY_BLUE_DARK, 
                                            // Link background set to light accent BG
                                            backgroundColor: LIGHT_ACCENT_BG,
                                            ':hover': { backgroundColor: PRIMARY_BLUE }
                                        }}>
                                            <ExternalLink size={14} style={styles.iconInline} /> Attachment {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.detailSection}>
                        <h4 style={styles.responsesHeader}>
                            <MessageSquare size={20} style={{marginRight: '8px'}} /> Applications ({applications.length})
                        </h4>
                        <div style={styles.responsesListContainer}>
                            {applicationsLoading && <p style={styles.loadingText}>Loading applications...</p>}
                            {applicationsError && <p style={styles.errorText}>{applicationsError}</p>}
                            
                            {!applicationsLoading && !applicationsError && applications.length === 0 && (
                                <p style={styles.noResponsesText}>No applications received for this job yet.</p>
                            )}

                            {!applicationsLoading && applications.length > 0 && (
                                applications.map(app => (
                                    <div key={app.id} style={styles.applicationItem}>
                                        <p style={styles.applicationHeader}>
                                            <span style={styles.applicationName}><User size={16} style={styles.iconInline} />{app.author_name}</span>
                                            <span style={styles.applicationDate}><Calendar size={14} style={styles.iconInline} />{formatDate(app.created_at)}</span>
                                        </p>
                                        <p style={styles.applicationContent}>{app.content_body}</p>
                                        <div style={styles.applicationFooter}>
                                            <a href={`tel:${app.contact_number}`} style={{...styles.contactLink, color: PRIMARY_BLUE, fontWeight: '600'}}>
                                                <Phone size={14} style={styles.iconInline} /> {app.contact_number || 'N/A'}
                                            </a>
                                            {app.media_url && app.media_url.length > 0 && (
                                                app.media_url.map((url, index) => (
                                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{...styles.mediaLink, color: PRIMARY_BLUE_DARK}}>
                                                        <ExternalLink size={14} style={styles.iconInline} /> View Attachment {index + 1}
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Job Posting Form Modal ---
    const PostJobModal = () => {
        // ... (Modal implementation remains the same)
        if (!isPostModalOpen) return null;

        return (
            <div style={modalStyles.backdrop}>
                <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                    <h3 style={styles.modalHeader}>
                        <Briefcase size={24} style={{ marginRight: '10px' }} />
                        Post a New Job Opening
                    </h3>
                    <button 
                        onClick={() => setIsPostModalOpen(false)} 
                        style={styles.modalCloseButton} 
                    >
                        <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                    <div style={{ padding: '0 25px 25px' }}>
                        <input 
                            type="text" 
                            placeholder="Job Title (e.g., Barangay Secretary Assistant)"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            style={{...styles.inputField, marginBottom: '15px'}} 
                        />
                        <textarea 
                            placeholder="Describe the job requirements, responsibilities, and benefits..."
                            value={jobBody} 
                            onChange={(e) => setJobBody(e.target.value)} 
                            rows="6" 
                            style={{...styles.textareaField, marginBottom: '15px'}} 
                        />
                        <input 
                            type="tel" 
                            placeholder="Contact Number (e.g., 09xxxxxxxxx or +639xxxxxxxxx)"
                            value={contactNumber} 
                            onChange={(e) => setContactNumber(e.target.value)} 
                            style={{...styles.inputField, marginBottom: '15px'}} 
                        />
                        
                        <p style={{ fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>Job Category:</p>
                        <div style={styles.categoryContainer}>
                            {JOB_TAG_OPTIONS.slice(1).map(tag => ( // Skip 'All'
                                <button 
                                    key={tag} 
                                    onClick={() => setSelectedTag(tag)} 
                                    style={{
                                        ...styles.tagButton,
                                        // Tag button border set to dark primary blue or primary blue
                                        border: selectedTag === tag ? `1px solid ${PRIMARY_BLUE_DARK}` : `1px solid ${PRIMARY_BLUE}`,
                                        // Tag button background/color set to primary blue or light accent BG
                                        backgroundColor: selectedTag === tag ? PRIMARY_BLUE : LIGHT_ACCENT_BG,
                                        color: selectedTag === tag ? '#ffffff' : PRIMARY_BLUE,
                                        // Spread active style for hover in absence of true CSS-in-JS
                                        ...(selectedTag === tag ? styles.tagButtonActive : {})
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        
                        <div style={styles.fileUploadContainer}>
                            <input type="file" id="job-media-upload" accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <label htmlFor="job-media-upload" style={styles.fileUploadLabel}>
                                {selectedFile ? selectedFile.name : 'Upload Featured Image/Video (Optional)'}
                            </label>
                            {selectedFile && (
                                <button 
                                    onClick={() => setSelectedFile(null)} 
                                    style={styles.clearFileButton}
                                >
                                    Clear File
                                </button>
                            )}
                        </div>

                        {error && <p style={styles.formErrorText}>{error}</p>}
                        
                        <button 
                            onClick={handlePostJobSubmit} 
                            style={{
                                ...styles.submitButton, 
                                backgroundColor: PRIMARY_BLUE,
                                ':hover': { backgroundColor: PRIMARY_BLUE_DARK },
                            }}
                            disabled={isUploadingFile}
                        >
                            {isUploadingFile ? 'Uploading Media...' : 'Post Job'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    // --- Delete Confirmation Modal Component (UPDATED TO MATCH NEWS PAGE) ---
    const DeleteConfirmationModal = () => {
        if (!jobIdToDelete) return null;

        // NEW STYLES for the confirmation buttons based on AdminNewsPage.jsx
        const confirmationButtonStyles = {
            confirmButton: { 
                padding: '10px 15px', backgroundColor: '#EF4444', color: 'white', 
                border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
                transition: 'background-color 0.2s', flexGrow: 1,
                ':hover': { backgroundColor: '#DC2626' }
            },
            cancelButton: { 
                padding: '10px 15px', backgroundColor: '#9CA3AF', color: 'white', 
                border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
                transition: 'background-color 0.2s', flexGrow: 1,
                ':hover': { backgroundColor: '#6B7280' }
            }
        };

        return (
            <div style={messageModalStyles.backdrop} onClick={closeConfirmationModal}>
                <div style={messageModalStyles.modal} onClick={e => e.stopPropagation()}>
                    <div style={messageModalStyles.content(false)}>
                        {/* UPDATED ICON COLOR AND MARGIN */}
                        <Trash2 size={32} style={{ color: '#EF4444', marginBottom: '15px' }} />
                        <h4 style={{ ...messageModalStyles.title, color: '#DC2626' }}>Confirm Deletion</h4>
                    </div>
                    <p style={messageModalStyles.body}>
                        Are you sure you want to permanently delete job ID {jobIdToDelete}? 
                        This action is irreversible and will delete all associated applications.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        {/* UPDATED BUTTON STYLE */}
                        <button 
                            onClick={closeConfirmationModal} 
                            style={confirmationButtonStyles.cancelButton}
                        > 
                            Cancel 
                        </button>
                        {/* UPDATED BUTTON STYLE */}
                        <button 
                            onClick={() => executeDeleteJob(jobIdToDelete)} 
                            style={confirmationButtonStyles.confirmButton}
                        > 
                            Delete Permanently 
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Message/Confirmation Modal Component ---
    const MessageModal = () => {
        if (!message) return null;
        // ... (Modal implementation remains the same)
        return (
            <div style={messageModalStyles.backdrop} onClick={closeMessageModal}>
                <div style={messageModalStyles.modal} onClick={e => e.stopPropagation()}>
                    <button style={messageModalStyles.closeButton} onClick={closeMessageModal}>&times;</button>
                    <div style={messageModalStyles.content(isSuccess)}>
                        {isSuccess ? <CheckCircle size={24} style={{ marginRight: '10px' }} /> : <XCircle size={24} style={{ marginRight: '10px' }} />}
                        <h4 style={messageModalStyles.title}>{isSuccess ? 'Success!' : 'Error'}</h4>
                    </div>
                    <p style={messageModalStyles.body}>{message}</p>
                    <button 
                        onClick={closeMessageModal} 
                        style={isSuccess ? messageModalStyles.successButton : messageModalStyles.errorButton}
                    > 
                        OK 
                    </button>
                </div>
            </div>
        );
    };

    // --- Styles for Modals (Shared) ---
    const modalStyles = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        },
        modal: {
            backgroundColor: 'white', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', position: 'relative'
        },
        closeButton: {
            position: 'absolute', top: '15px', right: '15px', fontSize: '24px', 
            background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED
        }
    };

    // --- Styles for Job Card (UPDATED `deleteButtonFooter`) ---
    const cardStyles = {
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            ':hover': { transform: 'translateY(-3px)', boxShadow: `0 6px 20px ${PRIMARY_BLUE}15` },
        },
        header: {
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        title: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#1F2937',
        },
        tag: {
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '600',
            // Colors updated inline in JobCard component
            padding: '4px 8px',
            borderRadius: '4px',
        },
        body: {
            flexGrow: 1,
            marginBottom: '20px',
        },
        infoItem: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#4B5563',
            marginBottom: '8px',
        },
        icon: {
            marginRight: '10px',
            color: '#6B7280',
            flexShrink: 0
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '10px',
            borderTop: '1px dashed #E5E7EB',
            gap: '10px',
        },
        // UPDATED DELETE BUTTON STYLE TO MATCH NEWS PAGE RED BUTTON
        deleteButtonFooter: { 
            padding: '8px 14px', 
            backgroundColor: '#EF4444', // Solid Red BG (from News Page confirm button)
            color: 'white', // White Text
            border: 'none', // Remove border
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: '600', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            transition: 'background-color 0.2s, transform 0.1s',
            ':hover': { backgroundColor: '#B91C1C' }, // Darker Red on hover
            ':active': { transform: 'scale(0.98)' }
        }
    };

    // --- Styles (Main Page - Consistent) ---
    const styles = {
        pageContainer: {
            padding: '30px',
            backgroundColor: NEUTRAL_PAGE_BG, // Retained F9FAFB for a page content area
            minHeight: '100vh',
        },
        pageHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '2px solid #E5E7EB',
            paddingBottom: '20px',
        },
        pageTitle: {
            fontSize: '32px',
            fontWeight: '800',
            color: TEXT_DARK,
            margin: 0,
        },
        postNewJobButton: {
            // Post button color set to PRIMARY_BLUE
            backgroundColor: PRIMARY_BLUE, 
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            // Post button hover color set to dark primary blue
            ':hover': { backgroundColor: PRIMARY_BLUE_DARK }
        },
        controls: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
        },
        filterContainer: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            maxWidth: '60%',
        },
        filterButton: {
            // Colors updated inline in FilterOption component
            border: '1px solid #D1D5DB',
            padding: '8px 15px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s',
            gap: '4px',
            whiteSpace: 'nowrap'
        },
        searchContainer: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '300px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0 10px',
            border: '1px solid #D1D5DB'
        },
        searchInput: {
            border: 'none',
            padding: '10px 0',
            fontSize: '16px',
            width: '100%',
            outline: 'none',
        },
        searchIcon: {
            color: TEXT_MUTED,
            marginRight: '8px',
        },
        jobGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '30px',
            paddingBottom: '50px'
        },
        loadingText: {
            fontSize: '18px',
            color: TEXT_MUTED,
            textAlign: 'center',
            gridColumn: '1 / -1'
        },
        errorText: {
            fontSize: '18px',
            color: '#DC2626',
            textAlign: 'center',
            gridColumn: '1 / -1'
        },
        noResults: {
            fontSize: '18px',
            color: TEXT_MUTED,
            textAlign: 'center',
            padding: '50px',
            border: '1px dashed #D1D5DB',
            borderRadius: '8px',
            marginTop: '20px',
            gridColumn: '1 / -1'
        },
        actionButton: {
            // Colors updated inline in JobCard component
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s, transform 0.1s',
            // Hover color updated inline
            ':active': { transform: 'scale(0.98)' }
        },
        // Detail Modal Styles
        detailTitle: {
            fontSize: '28px',
            fontWeight: '800',
            color: '#1F2937',
            marginBottom: '5px',
            display: 'flex',
            alignItems: 'center'
        },
        detailSubtitle: {
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '25px',
            paddingBottom: '10px',
            borderBottom: '1px solid #E5E7EB'
        },
        iconInline: {
            display: 'inline-block',
            marginRight: '5px',
            verticalAlign: 'middle'
        },
        contactLink: {
            // Color updated inline in JobDetailModal
            textDecoration: 'none',
            marginLeft: '5px',
            fontWeight: '500'
        },
        jobBodyText: {
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            color: '#374151'
        },
        detailSection: {
            // Colors updated inline in JobDetailModal
            marginBottom: '30px',
            padding: '20px',
            borderRadius: '10px',
        },
        detailSectionHeader: {
            // Colors updated inline in JobDetailModal
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '15px',
            paddingBottom: '5px'
        },
        mediaAttachmentsContainer: {
            marginTop: '20px',
            paddingTop: '15px',
            // Border color updated inline in JobDetailModal
        },
        mediaLinkList: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '10px'
        },
        mediaLink: {
            // Colors updated inline in JobDetailModal
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'background-color 0.2s, color 0.2s'
        },
        responsesHeader: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center'
        },
        responsesListContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        },
        applicationItem: {
            padding: '15px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: '#F9FAFB',
        },
        applicationHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
            borderBottom: '1px solid #E5E7EB',
            paddingBottom: '5px',
        },
        applicationName: {
            fontSize: '15px',
            fontWeight: '600',
            color: PRIMARY_BLUE_DARK
        },
        applicationDate: {
            fontSize: '12px',
            color: TEXT_MUTED
        },
        applicationContent: {
            fontSize: '14px',
            color: '#4B5563',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            marginBottom: '10px'
        },
        applicationFooter: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed #D1D5DB'
        },
        noResponsesText: {
            fontStyle: 'italic',
            color: TEXT_MUTED,
            textAlign: 'center',
            padding: '20px'
        },
        // Post Job Modal Styles
        modalHeader: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#1F2937',
            borderBottom: '2px solid #E5E7EB',
            padding: '0 25px 20px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center'
        },
        modalCloseButton: {
            position: 'absolute', top: '15px', right: '15px', 
            background: 'none', border: 'none', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', transition: 'background-color 0.2s',
        },
        inputField: {
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            fontSize: '16px',
            boxSizing: 'border-box',
        },
        textareaField: {
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            fontSize: '16px',
            boxSizing: 'border-box',
            resize: 'vertical',
        },
        categoryContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '15px'
        },
        tagButton: {
            // Colors updated inline in main Render
            padding: '8px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s, border-color 0.2s',
        },
        tagButtonActive: {
            // Colors updated inline in main Render
            backgroundColor: PRIMARY_BLUE,
            color: '#ffffff',
            borderColor: PRIMARY_BLUE
        },
        fileUploadContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            border: '1px dashed #D1D5DB',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: NEUTRAL_BG
        },
        fileUploadLabel: {
            flexGrow: 1,
            padding: '8px 15px',
            backgroundColor: '#E5E7EB',
            color: '#4B5563',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        },
        clearFileButton: {
            padding: '8px 15px',
            backgroundColor: '#FCA5A5',
            color: '#B91C1C',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        },
        submitButton: {
            width: '100%',
            padding: '15px',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '700',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        formErrorText: {
            color: '#DC2626',
            fontWeight: '600',
            textAlign: 'center',
            backgroundColor: '#FEE2E2',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px'
        }
    };

    // --- Message Modal Styles (For consistency) ---
    const messageModalStyles = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        },
        modal: {
            backgroundColor: 'white', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            textAlign: 'center'
        },
        closeButton: { 
            position: 'absolute', top: '10px', right: '10px', 
            fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: TEXT_MUTED
        },
        content: (isSuccess) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            // Success color set to PRIMARY_BLUE
            color: isSuccess ? PRIMARY_BLUE : '#DC2626', 
        }),
        title: {
            fontSize: '22px',
            fontWeight: '700',
            margin: 0,
        },
        body: {
            fontSize: '16px',
            color: '#374151',
            marginBottom: '20px',
        },
        successButton: {
            width: '100%',
            padding: '10px',
            // Success button color set to PRIMARY_BLUE
            backgroundColor: PRIMARY_BLUE,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            // Success button hover set to dark primary blue
            ':hover': { backgroundColor: PRIMARY_BLUE_DARK }
        },
        errorButton: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            ':hover': { backgroundColor: '#DC2626' }
        }
    };


    // --- Main Render ---
    return (
        <div style={styles.pageContainer}>
            {/* Combined Header with Button */}
            <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}> Job Listings Management</h1>
                <button 
                    style={{
                        ...styles.postNewJobButton,
                        // Post button color set to PRIMARY_BLUE
                        backgroundColor: PRIMARY_BLUE,
                        // Post button hover color set to dark primary blue
                        ':hover': { backgroundColor: PRIMARY_BLUE_DARK }
                    }} 
                    onClick={() => setIsPostModalOpen(true)}
                >
                    <Plus size={20} /> Post New Job
                </button>
            </div>

            {/* Controls: Filters and Search */}
            <div style={styles.controls}>
                <div style={styles.filterContainer}>
                    {JOB_TAG_OPTIONS.map(tag => (
                        <FilterOption key={tag} tag={tag} />
                    ))}
                </div>
                
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search jobs, tags, or authors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            {/* Job Grid */}
            <div style={styles.jobGrid}>
                {loading && <p style={styles.loadingText}>Loading job listings...</p>}
                {error && <p style={styles.errorText}>{error}</p>}
                
                {!loading && !error && filteredAndSortedJobs.length === 0 && (
                    <div style={styles.noResults}>
                        No job listings found matching your criteria.
                    </div>
                )}

                {!loading && filteredAndSortedJobs.length > 0 && (
                    filteredAndSortedJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            onClick={openDetailModal} 
                            adminId={ADMIN_POSTING_ID} // Pass Admin ID for conditional rendering
                        />
                    ))
                )}
            </div>

            {/* Modals */}
            <JobDetailModal />
            <PostJobModal />
            <DeleteConfirmationModal />
            <MessageModal />
        </div>
    );
};

export default AdminJobPage;