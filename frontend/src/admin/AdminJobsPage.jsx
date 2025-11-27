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
                    backgroundColor: isSelected ? '#059669' : '#F3F4F6', 
                    color: isSelected ? 'white' : '#4B5563',
                    fontWeight: isSelected ? '700' : '500',
                    border: isSelected ? '1px solid #059669' : '1px solid #D1D5DB'
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
                    <span style={cardStyles.tag}><Tag size={12} style={{marginRight: '5px'}}/>{job.tag}</span>
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
                    style={styles.actionButton}
                    title="View Details & Applications"
                >
                    <Eye size={16} /> View Details
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
                    
                    <div style={styles.detailSection}>
                        <h4 style={styles.detailSectionHeader}>Job Overview</h4>
                        <p><strong>Category:</strong> {selectedJob.tag}</p>
                        <p style={{marginBottom: '10px'}}>
                            <strong>Contact:</strong> 
                            <Phone size={14} style={styles.iconInline} /> 
                            <a href={`tel:${selectedJob.contact_number}`} style={styles.contactLink}>
                                {selectedJob.contact_number || 'N/A'}
                            </a>
                        </p>
                        <p style={styles.jobBodyText}>{selectedJob.content_body}</p>
                        
                        {selectedJob.media_url && selectedJob.media_url.length > 0 && (
                            <div style={styles.mediaAttachmentsContainer}>
                                <p style={{fontWeight: '600', color: styles.detailSectionHeader.color}}>Media Attachments:</p>
                                <div style={styles.mediaLinkList}>
                                    {selectedJob.media_url.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={styles.mediaLink}>
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
                            {!applicationsLoading && applications.length === 0 && !applicationsError && (
                                <p style={styles.noResponsesText}>No applications yet for this job listing.</p>
                            )}
                            {!applicationsLoading && applications.map(response => (
                                <div key={response.id} style={styles.responseItem}>
                                    <div style={styles.responseHeader}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <User size={16} color="#6366F1"/>
                                            <strong style={styles.responseAuthor}>{response.author_name}</strong>
                                        </div>
                                        <span style={styles.responseDate}>{formatDate(response.created_at)}</span>
                                    </div>
                                    <p style={styles.responseBody}>
                                        Application Message: {response.response_content}
                                    </p>
                                    {/* Assuming media_url might contain a CV or resume link */}
                                    {response.media_url && (
                                        <p style={styles.responseApplicationLink}>
                                            <ExternalLink size={14} style={styles.iconInline} />
                                            <a href={response.media_url} target="_blank" rel="noopener noreferrer" style={styles.applicationLink}>
                                                View Attached CV/Resume
                                            </a>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- NEW: Confirmation Modal Component for Deletion ---
    const DeleteConfirmationModal = () => {
        if (!jobIdToDelete) return null;

        return (
            <div style={messageModalStyles.backdrop} onClick={closeConfirmationModal}>
                <div style={messageModalStyles.modal} onClick={e => e.stopPropagation()}>
                    <button style={messageModalStyles.closeButton} onClick={closeConfirmationModal}>&times;</button>
                    
                    <div style={messageModalStyles.content(false)}>
                        <Trash2 size={24} style={{ marginRight: '10px' }} color="#DC2626" /> 
                        <h4 style={{ ...messageModalStyles.title, color: '#DC2626' }}>Confirm Deletion</h4>
                    </div>
                    
                    <p style={messageModalStyles.body}>
                        Are you sure you want to **permanently delete** job ID **{jobIdToDelete}**? 
                        This action is irreversible and will delete all associated applications.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button 
                            onClick={closeConfirmationModal} 
                            style={{ ...messageModalStyles.successButton, flex: 1, backgroundColor: '#6B7280', ':hover': { backgroundColor: '#4B5563' } }} 
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => executeDeleteJob(jobIdToDelete)} 
                            style={{ ...messageModalStyles.errorButton, flex: 1 }} 
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

        return (
            <div style={messageModalStyles.backdrop} onClick={closeMessageModal}>
                <div style={messageModalStyles.modal} onClick={e => e.stopPropagation()}>
                    <button style={messageModalStyles.closeButton} onClick={closeMessageModal}>&times;</button>
                    
                    <div style={messageModalStyles.content(isSuccess)}>
                        {isSuccess 
                            ? <CheckCircle size={24} style={{ marginRight: '10px' }} /> 
                            : <XCircle size={24} style={{ marginRight: '10px' }} />}
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

    // --- Main Render ---
    return (
        <div style={styles.pageContainer}>
            
            {/* Combined Header with Button */}
            <div style={styles.pageHeader}> 
                <h1 style={styles.pageTitle}><Briefcase size={28} style={{marginRight: '10px'}} /> Job Listings Management</h1>
                <button style={styles.postNewJobButton} onClick={() => setIsPostModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Post New Job
                </button>
            </div>
            
            <p style={styles.pageSubtitle}>Review and manage all job posts and their corresponding applications.</p>
            
            {error && <p style={styles.errorText}>{error}</p>}
            
            <div style={styles.controlBar}>
                {/* Search Input */}
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input 
                        type="text"
                        placeholder="Search by title, author, or tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            {/* FILTER BAR */}
            <div style={styles.filterBar}>
                <span style={styles.sortLabel}>Filter by Type:</span>
                {JOB_TAG_OPTIONS.map(tag => (
                    <FilterOption key={tag} tag={tag} />
                ))}
            </div>

            {loading ? (
                <p style={styles.loadingText}>Loading job listings...</p>
            ) : filteredAndSortedJobs.length === 0 ? (
                <p style={styles.noContentText}>No job listings found matching your criteria.</p>
            ) : (
                <div style={cardStyles.gridContainer}>
                    {filteredAndSortedJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            onClick={openDetailModal} 
                            adminId={ADMIN_POSTING_ID}
                        />
                    ))}
                </div>
            )}

            {isDetailModalOpen && <JobDetailModal />}

            {/* NEW JOB POST MODAL */}
            {isPostModalOpen && (
                <div style={modalStyles.backdrop}>
                    <div style={{...modalStyles.modal, maxWidth: '600px', padding: '0'}}>
                        <div style={modalStyles.header}>
                            <h3 style={{ color: '#1e40af' }}>Create New Job Post (Admin)</h3>
                            <button 
                                onClick={() => setIsPostModalOpen(false)} 
                                style={styles.modalCloseButton}
                            >
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

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
                                            ...(selectedTag === tag ? styles.tagButtonActive : {}) 
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            <div style={styles.fileUploadContainer}>
                                <input 
                                    type="file" 
                                    id="job-media-upload"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                                <label htmlFor="job-media-upload" style={styles.fileUploadLabel}>
                                    {selectedFile ? selectedFile.name : 'Attach Image (Optional, for company logo/banner)'}
                                </label>
                                {selectedFile && (
                                    <button 
                                        onClick={() => setSelectedFile(null)} 
                                        style={styles.removeFileButton}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>


                            <button 
                                onClick={handlePostJobSubmit} 
                                disabled={isUploadingFile}
                                style={{ 
                                    ...styles.primaryButton, 
                                    width: '100%', 
                                    marginTop: '20px', 
                                    opacity: isUploadingFile ? 0.6 : 1 
                                }}
                            >
                                {isUploadingFile ? 'Uploading Media...' : 'Post Job'}
                            </button>

                        </div>
                    </div>
                </div>
            )}
            
            {/* Render the custom message modal for success/error */}
            <MessageModal />

            {/* Render the custom confirmation modal for deletion */}
            <DeleteConfirmationModal />
        </div>
    );
};

// --- Card Styles (Unchanged) ---
const cardStyles = {
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '25px',
        padding: '20px 0',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        padding: '20px',
        border: '1px solid #E5E7EB',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ':hover': {
            borderColor: '#6366F1',
            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15)',
            transform: 'translateY(-2px)'
        }
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
        color: '#3730A3',
        backgroundColor: '#EEF2FF',
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
    deleteButtonFooter: {
        padding: '8px 14px', 
        backgroundColor: '#FEE2E2', 
        color: '#EF4444',           
        border: '1px solid #FCA5A5', 
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        // Styling for hover in JS object literals is complex, often requiring a library like styled-components.
        // Assuming this is used with a CSS-in-JS solution that handles pseudoclasses.
    }
};

// --- Styles (Main Page - Unchanged) ---
const styles = {
    pageContainer: { padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh', },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }, 
    pageTitle: { fontSize: '28px', fontWeight: '800', color: '#1F2937', display: 'flex', alignItems: 'center' },
    pageSubtitle: { fontSize: '15px', color: '#6B7280', marginBottom: '25px', borderBottom: '1px solid #E5E7EB', paddingBottom: '15px' },
    errorText: { color: '#DC2626', fontWeight: '600', padding: '15px', backgroundColor: '#FEE2E2', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #DC2626' },
    loadingText: { textAlign: 'center', padding: '50px', color: '#6B7280' },
    noContentText: { textAlign: 'center', padding: '50px', color: '#6B7280', fontSize: '18px' },
    controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '20px' },
    searchContainer: { position: 'relative', flexGrow: 1, maxWidth: '450px', },
    searchIcon: { position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9CA3AF', },
    searchInput: { width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', ':focus': { borderColor: '#6366F1' } },
    filterBar: { 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '30px', 
        padding: '10px 0',
        borderBottom: '1px solid #E5E7EB',
        flexWrap: 'wrap',
        gap: '10px',
    },
    sortLabel: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#4B5563',
        marginRight: '10px',
    },
    filterButton: { 
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 15px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
        gap: '4px',
    },
    actionButton: { 
        backgroundColor: '#6366F1', 
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
        ':hover': { backgroundColor: '#4F46E5' },
        ':active': { transform: 'scale(0.98)' }
    },
    detailTitle: { fontSize: '28px', fontWeight: '800', color: '#1F2937', marginBottom: '5px', display: 'flex', alignItems: 'center' },
    detailSubtitle: { fontSize: '14px', color: '#6B7280', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' },
    iconInline: { display: 'inline-block', marginRight: '5px', verticalAlign: 'middle' },
    contactLink: { color: '#6366F1', textDecoration: 'none', marginLeft: '5px', fontWeight: '500' },
    jobBodyText: { whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' },
    detailSection: { marginBottom: '30px', padding: '20px', backgroundColor: '#EEF2FF', borderRadius: '10px', border: '1px solid #C7D2FE' },
    detailSectionHeader: { fontSize: '18px', fontWeight: '700', color: '#3730A3', marginBottom: '15px', borderBottom: '2px solid #A5B4FC', paddingBottom: '5px' },
    mediaAttachmentsContainer: { marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #A5B4FC' },
    mediaLinkList: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' },
    mediaLink: { 
        color: '#3730A3', 
        textDecoration: 'none', 
        fontSize: '14px', 
        backgroundColor: '#C7D2FE', 
        padding: '6px 12px', 
        borderRadius: '6px', 
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#A5B4FC' }
    },
    responsesHeader: { fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '15px', display: 'flex', alignItems: 'center', },
    responsesListContainer: { maxHeight: '350px', overflowY: 'auto', padding: '15px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#FFFFFF' },
    responseItem: { border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB', marginBottom: '15px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '15px' },
    responseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px dashed #E5E7EB' },
    responseAuthor: { fontSize: '16px', color: '#1F2937', fontWeight: '700', },
    responseDate: { fontSize: '13px', color: '#9CA3AF', },
    responseBody: { fontSize: '14px', color: '#4B5563', margin: '0 0 10px 0', whiteSpace: 'pre-wrap' },
    noResponsesText: { textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '15px', },
    responseApplicationLink: { marginTop: '10px', fontSize: '14px' },
    applicationLink: { color: '#059669', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s', ':hover': { color: '#047857' } },
    postNewJobButton: {
        padding: '10px 18px',
        backgroundColor: '#10B981', // Emerald green
        color: '#fff',
        borderRadius: '8px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#059669' },
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
        padding: '8px 14px',
        borderRadius: '20px',
        border: '1px solid #93c5fd',
        backgroundColor: '#e0f2fe',
        color: '#3b82f6',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s, border-color 0.2s',
    },
    tagButtonActive: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderColor: '#3b82f6',
    },
    fileUploadContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '15px'
    },
    fileUploadLabel: {
        padding: '10px 15px',
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#E5E7EB' },
    },
    removeFileButton: {
        padding: '8px 12px',
        backgroundColor: '#EF4444',
        color: '#fff',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
    },
    primaryButton: {
        padding: '12px 20px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: '700',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#2563EB' },
    },
    modalCloseButton: { 
        background: 'none', 
        border: 'none', 
        cursor: 'pointer', 
        color: '#6b7280',
        padding: '5px',
        transition: 'color 0.2s',
        ':hover': { color: '#1F2937' }
    }
};

// --- Modal Styles (Detail/Post Modals) ---
const modalStyles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, },
    modal: { backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', width: '90%', maxWidth: '800px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', maxHeight: '90vh', overflowY: 'auto', position: 'relative', },
    closeButton: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#9CA3AF', transition: 'color 0.2s', ':hover': { color: '#6B7280' } },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '25px 25px 0 25px' }
};

// --- Message Modal Styles ---
const messageModalStyles = {
    backdrop: { ...modalStyles.backdrop, zIndex: 1001 },
    modal: {
        backgroundColor: '#FFFFFF',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        textAlign: 'center'
    },
    closeButton: { ...modalStyles.closeButton, top: '10px', right: '10px', fontSize: '24px' },
    content: (isSuccess) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '15px',
        color: isSuccess ? '#059669' : '#DC2626',
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
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#059669' }
    },
    errorButton: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#F87171',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': { backgroundColor: '#EF4444' }
    }
};

export default AdminJobPage;