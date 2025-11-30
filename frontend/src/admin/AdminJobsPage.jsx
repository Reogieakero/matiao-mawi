// frontend/src/admin/AdminJobPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
    Search, MessageSquare, Briefcase, Phone, CheckCircle, 
    ExternalLink, User, Calendar, Tag, Plus, Trash2, XCircle 
} from 'lucide-react';

// NOTE: Ensure this matches your actual API base URL.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- CONSTANTS & PALETTE ---
const PRIMARY_BLUE_DARK = '#2563eb';
const PRIMARY_BLUE = '#1e40af';
const LIGHT_ACCENT_BG = 'rgba(30, 64, 175, 0.1)';
const NEUTRAL_PAGE_BG = '#F9FAFB';
const NEUTRAL_BG = '#f7f9fc';
const TEXT_MUTED = '#64748b';
const ADMIN_POSTING_ID = 1001; 

const JOB_TAG_OPTIONS = [
    'All', 'Full-Time', 'Part-Time', 'Internship', 'Contract',
];

// --- UTILITY FUNCTIONS (OUTSIDE MAIN COMPONENT) ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- START: NEW VALIDATION LOGIC FROM SERVICES PAGE ---

// Allows digits, spaces, plus signs (+), hyphens (-), or parentheses for 7-20 characters.
const JOB_PHONE_REGEX = /^[0-9\s\+\-()]{7,20}$/; 
const JOB_PHONE_ERROR_MSG = 'Invalid contact number format. Must be 7-20 characters long and contain only digits, spaces, plus signs (+), or hyphens (-).';

const validateContactNumberJob = (number) => {
    const cleanedNumber = (number || '').trim();
    
    // The field is REQUIRED for job posts.
    if (cleanedNumber === '') {
        return 'Contact number is required.';
    }
    
    // Check format using the more flexible regex
    if (!JOB_PHONE_REGEX.test(cleanedNumber)) {
        return JOB_PHONE_ERROR_MSG;
    }
    return null;
};

// --- END: NEW VALIDATION LOGIC ---


// Helper function for hover effects on primary action buttons (like Read More)
const handlePrimaryButtonHover = (e, isHovering) => {
    if (isHovering) {
        e.currentTarget.style.backgroundColor = PRIMARY_BLUE_DARK;
    } else {
        e.currentTarget.style.backgroundColor = PRIMARY_BLUE;
    }
};

// Helper function for hover effects on delete button footer
const handleDeleteButtonHover = (e, isHovering) => {
    if (isHovering) {
        e.currentTarget.style.backgroundColor = '#B91C1C';
    } else {
        e.currentTarget.style.backgroundColor = '#EF4444';
    }
};

// Helper function for hover effects on confirmation/message buttons
const handleModalButtonHover = (e, isSuccess) => {
    if (isSuccess) {
        e.currentTarget.style.backgroundColor = PRIMARY_BLUE_DARK;
    } else {
        e.currentTarget.style.backgroundColor = '#DC2626';
    }
};

// --- STYLES (MOVED OUTSIDE FOR PERFORMANCE) ---

const styles = {
    pageContainer: { padding: '30px', backgroundColor: NEUTRAL_PAGE_BG, minHeight: '100vh', },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #E5E7EB', paddingBottom: '20px', },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px', },
    postNewJobButton: { backgroundColor: PRIMARY_BLUE, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s', },
    controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', },
    filterContainer: { display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '60%', },
    filterButton: { border: '1px solid #D1D5DB', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s', gap: '4px', whiteSpace: 'nowrap' },
    searchContainer: { display: 'flex', alignItems: 'center', width: '100%', maxWidth: '300px', backgroundColor: 'white', borderRadius: '8px', padding: '0 10px', border: '1px solid #D1D5DB' },
    searchInput: { border: 'none', padding: '10px 0', fontSize: '16px', width: '100%', outline: 'none', },
    searchIcon: { color: TEXT_MUTED, marginRight: '8px', },
    jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', paddingBottom: '50px' },
    loadingText: { fontSize: '18px', color: TEXT_MUTED, textAlign: 'center', gridColumn: '1 / -1' },
    errorText: { fontSize: '18px', color: '#DC2626', textAlign: 'center', gridColumn: '1 / -1' },
    noResults: { fontSize: '18px', color: TEXT_MUTED, textAlign: 'center', padding: '50px', border: '1px dashed #D1D5DB', borderRadius: '8px', marginTop: '20px', gridColumn: '1 / -1' },
    actionButton: { 
        backgroundColor: PRIMARY_BLUE,
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
    },
    detailTitle: { fontSize: '28px', fontWeight: '800', color: '#1F2937', marginBottom: '5px', display: 'flex', alignItems: 'center' },
    detailSubtitle: { fontSize: '14px', color: '#6B7280', marginBottom: '25px', paddingBottom: '10px', borderBottom: '1px solid #E5E7EB' },
    iconInline: { display: 'inline-block', marginRight: '5px', verticalAlign: 'middle' },
    contactLink: { textDecoration: 'none', marginLeft: '5px', fontWeight: '500' },
    jobBodyText: { whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' },
    detailSection: { marginBottom: '30px', padding: '20px', borderRadius: '10px', },
    detailSectionHeader: { fontSize: '18px', fontWeight: '700', marginBottom: '15px', paddingBottom: '5px' },
    mediaAttachmentsContainer: { marginTop: '20px', paddingTop: '15px', },
    mediaLinkList: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' },
    mediaLink: { textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s, color 0.2s' },
    responsesHeader: { fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '15px', display: 'flex', alignItems: 'center' },
    responsesListContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
    applicationItem: { padding: '15px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB', },
    applicationHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #E5E7EB', paddingBottom: '5px', },
    applicationName: { fontSize: '15px', fontWeight: '600', color: PRIMARY_BLUE_DARK },
    applicationDate: { fontSize: '12px', color: TEXT_MUTED },
    applicationContent: { fontSize: '14px', color: '#4B5563', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '10px' },
    applicationFooter: { display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #D1D5DB' },
    noResponsesText: { fontStyle: 'italic', color: TEXT_MUTED, textAlign: 'center', padding: '20px' },
    modalHeader: { fontSize: '24px', fontWeight: '700', color: '#1F2937', borderBottom: '2px solid #E5E7EB', padding: '0 25px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s', },
    inputField: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'normal', outline: 'none', },
    textareaField: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '16px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontWeight: 'normal', outline: 'none', },
    categoryContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' },
    tagButton: { padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background-color 0.2s, border-color 0.2s', },
    tagButtonActive: { backgroundColor: PRIMARY_BLUE, color: '#ffffff', borderColor: PRIMARY_BLUE },
    fileUploadContainer: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px dashed #D1D5DB', borderRadius: '6px', marginBottom: '20px', backgroundColor: NEUTRAL_BG },
    fileUploadLabel: { flexGrow: 1, padding: '8px 15px', backgroundColor: '#E5E7EB', color: '#4B5563', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    clearFileButton: { padding: '8px 15px', backgroundColor: '#FCA5A5', color: '#B91C1C', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    submitButton: { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: '700', transition: 'background-color 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', },
    formErrorText: { color: '#DC2626', fontWeight: '600', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
    // New style for inline validation errors
    validationErrorText: { 
        fontSize: '12px', 
        color: '#DC2626', 
        marginTop: '5px', 
        marginBottom: '0', 
        fontWeight: '500', 
    }
};

const cardStyles = {
    card: {
        backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    },
    header: { marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    title: { fontSize: '18px', fontWeight: '700', color: '#1F2937', },
    tag: { display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px', color: PRIMARY_BLUE_DARK, backgroundColor: LIGHT_ACCENT_BG, },
    body: { flexGrow: 1, marginBottom: '20px', },
    infoItem: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#4B5563', marginBottom: '8px', },
    icon: { marginRight: '10px', color: '#6B7280', flexShrink: 0 },
    footer: { display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px dashed #E5E7EB', gap: '10px', },
    deleteButtonFooter: { padding: '8px 14px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s, transform 0.1s', }
};

const modalStyles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', position: 'relative' },
    closeButton: { position: 'absolute', top: '15px', right: '15px', fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED }
};

const messageModalStyles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative', textAlign: 'center' },
    closeButton: { position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: TEXT_MUTED },
    content: (isSuccess) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: isSuccess ? PRIMARY_BLUE : '#DC2626', }),
    title: { fontSize: '22px', fontWeight: '700', margin: 0, },
    body: { fontSize: '16px', color: '#374151', marginBottom: '20px', },
    successButton: { width: '100%', padding: '10px', backgroundColor: PRIMARY_BLUE, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', },
    errorButton: { width: '100%', padding: '10px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', },
    confirmationButton: { confirmButton: { padding: '10px 15px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', flexGrow: 1, }, cancelButton: { padding: '10px 15px', backgroundColor: '#9CA3AF', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', flexGrow: 1, } }
};


// --- REFACTORED MODAL COMPONENTS (OUTSIDE MAIN COMPONENT) ---

/**
 * Component: JobCard
 * ... (No changes to JobCard)
 */
const JobCard = React.memo(({ job, onClick, promptDeleteJob }) => {
    const [isHovered, setIsHovered] = useState(false);

    const currentCardStyle = {
        ...cardStyles.card,
        ...(isHovered ? { transform: 'translateY(-5px)', boxShadow: `0 8px 25px ${PRIMARY_BLUE}30` } : {})
    };

    return (
        <div 
            style={currentCardStyle} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                    <span>Response: {job.response_count}</span>
                </div>
            </div>

            <div style={cardStyles.footer}>
                {job.author_id === ADMIN_POSTING_ID && ( 
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            promptDeleteJob(job.id); 
                        }}
                        style={cardStyles.deleteButtonFooter} 
                        title="Delete Job Post"
                        onMouseEnter={(e) => handleDeleteButtonHover(e, true)}
                        onMouseLeave={(e) => handleDeleteButtonHover(e, false)}
                    >
                        <Trash2 size={16} />
                    </button>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); onClick(job); }} 
                    style={styles.actionButton}
                    onMouseEnter={(e) => handlePrimaryButtonHover(e, true)}
                    onMouseLeave={(e) => handlePrimaryButtonHover(e, false)}
                >
                    Read More
                </button>
            </div>
        </div>
    );
});


/**
 * Component: JobDetailModal
 * ... (No changes to JobDetailModal)
 */
const JobDetailModal = React.memo(({ isDetailModalOpen, selectedJob, applications, applicationsLoading, applicationsError, closeDetailModal }) => {
    if (!isDetailModalOpen || !selectedJob) return null;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <button style={modalStyles.closeButton} onClick={closeDetailModal}>&times;</button>
                
                <h2 style={styles.detailTitle}>{selectedJob.title}</h2>

                <p style={styles.detailSubtitle}>
                    <span style={{ marginRight: '15px' }}>
                        <User size={14} style={styles.iconInline} /> {selectedJob.author_name}
                    </span>
                    <span style={{ marginRight: '15px' }}>
                        <Calendar size={14} style={styles.iconInline} /> {formatDate(selectedJob.created_at)}
                    </span>
                </p>
                
                <div style={{
                    ...styles.detailSection,
                    backgroundColor: LIGHT_ACCENT_BG, 
                    border: `1px solid ${PRIMARY_BLUE_DARK}`,
                }}>
                    <h4 style={{
                        ...styles.detailSectionHeader, 
                        color: PRIMARY_BLUE_DARK,
                        borderBottom: `2px solid ${PRIMARY_BLUE_DARK}`,
                    }}>Job Overview</h4>
                    <p><strong>Category:</strong> {selectedJob.tag}</p>
                    <p style={{marginBottom: '10px'}}>
                        <strong>Contact:</strong> 
                        <Phone size={14} style={styles.iconInline} /> 
                        <a href={`tel:${selectedJob.contact_number}`} style={{...styles.contactLink, color: PRIMARY_BLUE}}>
                            {selectedJob.contact_number || 'N/A'}
                        </a>
                    </p>
                    <p style={styles.jobBodyText}>{selectedJob.content_body}</p>
                    
                    {selectedJob.media_url && selectedJob.media_url.length > 0 && (
                        <div style={{
                            ...styles.mediaAttachmentsContainer, 
                            borderTop: `1px dashed ${PRIMARY_BLUE_DARK}`
                        }}>
                            <p style={{fontWeight: '600', color: styles.detailSectionHeader.color}}>Media Attachments:</p>
                            <div style={styles.mediaLinkList}>
                                {selectedJob.media_url.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{
                                        ...styles.mediaLink, 
                                        color: PRIMARY_BLUE_DARK, 
                                        backgroundColor: LIGHT_ACCENT_BG,
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
                        <MessageSquare size={20} style={{marginRight: '8px'}} /> Response ({applications.length})
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
});


/**
 * Component: PostJobModal
 * MODIFIED to accept error state, implement live validation, and display inline error message.
 */
const PostJobModal = React.memo(({ 
    isPostModalOpen, setIsPostModalOpen, title, setTitle, jobBody, setJobBody, contactNumber, setContactNumber, 
    selectedTag, setSelectedTag, selectedFile, setSelectedFile, error, isUploadingFile, handlePostJobSubmit, 
    handleFileChange, // Existing Props
    contactNumberError, setContactNumberError // NEW Props
}) => {
    if (!isPostModalOpen) return null;

    // --- NEW HANDLER FOR LIVE VALIDATION ---
    const handleContactNumberChange = (e) => {
        const value = e.target.value;
        setContactNumber(value);
        // Perform live validation check
        setContactNumberError(validateContactNumberJob(value)); 
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <h3 style={styles.modalHeader}>
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

                    {/* CONTACT NUMBER INPUT FIELD WITH INLINE VALIDATION */}
                    <div style={{ marginBottom: contactNumberError ? '5px' : '15px' }}>
                        <input 
                            type="text" 
                            placeholder="Contact Number (e.g., 09xxxxxxxxx or +63 9xx xxx xxxx)"
                            value={contactNumber} 
                            // Use the new handler for live validation
                            onChange={handleContactNumberChange} 
                            style={{
                                ...styles.inputField,
                                // Apply dynamic border color on error
                                borderColor: contactNumberError ? '#DC2626' : styles.inputField.borderColor,
                            }}
                        />
                        {/* Display validation error message */}
                        {contactNumberError && (
                            <p style={styles.validationErrorText}>
                                {contactNumberError}
                            </p>
                        )}
                    </div>
                    
                    <p style={{ fontWeight: '600', color: '#4B5563', marginBottom: '8px' }}>Job Category:</p>
                    <div style={styles.categoryContainer}>
                        {JOB_TAG_OPTIONS.slice(1).map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => setSelectedTag(tag)} 
                                style={{
                                    ...styles.tagButton,
                                    border: selectedTag === tag ? `1px solid ${PRIMARY_BLUE_DARK}` : `1px solid ${PRIMARY_BLUE}`,
                                    backgroundColor: selectedTag === tag ? PRIMARY_BLUE : LIGHT_ACCENT_BG,
                                    color: selectedTag === tag ? '#ffffff' : PRIMARY_BLUE,
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

                    {/* General form error message is kept for other errors */}
                    {error && <p style={styles.formErrorText}>{error}</p>}
                    
                    <button 
                        onClick={handlePostJobSubmit} 
                        style={styles.submitButton}
                        onMouseEnter={(e) => handlePrimaryButtonHover(e, true)}
                        onMouseLeave={(e) => handlePrimaryButtonHover(e, false)}
                        disabled={isUploadingFile || !!contactNumberError} // Disable on upload or validation error
                    >
                        {isUploadingFile ? 'Uploading Media...' : 'Post Job'}
                    </button>
                </div>
            </div>
        </div>
    );
});

/**
 * Component: DeleteConfirmationModal
 * ... (No changes to DeleteConfirmationModal)
 */
const DeleteConfirmationModal = React.memo(({ jobIdToDelete, closeConfirmationModal, executeDeleteJob }) => {
    if (!jobIdToDelete) return null;
    
    return (
        <div style={messageModalStyles.backdrop} onClick={closeConfirmationModal}>
            <div style={messageModalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={messageModalStyles.content(false)}>
                    <Trash2 size={32} style={{ color: '#EF4444', marginBottom: '15px' }} />
                    <h4 style={{ ...messageModalStyles.title, color: '#DC2626' }}>Confirm Deletion</h4>
                </div>
                <p style={messageModalStyles.body}>
                    Are you sure you want to permanently delete job ID {jobIdToDelete}? 
                    This action is irreversible and will delete all associated applications.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                        onClick={closeConfirmationModal} 
                        style={messageModalStyles.confirmationButton.cancelButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9CA3AF'}
                    > 
                        Cancel 
                    </button>
                    <button 
                        onClick={() => executeDeleteJob(jobIdToDelete)} 
                        style={messageModalStyles.confirmationButton.confirmButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                    > 
                        Delete Permanently 
                    </button>
                </div>
            </div>
        </div>
    );
});


/**
 * Component: MessageModal
 * ... (No changes to MessageModal)
 */
const MessageModal = React.memo(({ message, isSuccess, closeMessageModal }) => {
    if (!message) return null;

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
                    onMouseEnter={(e) => handleModalButtonHover(e, isSuccess)}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSuccess ? PRIMARY_BLUE : '#EF4444'}
                > 
                    OK 
                </button>
            </div>
        </div>
    );
});


// --- Filter Option Component (MOVED OUTSIDE) ---
const FilterOption = React.memo(({ tag, activeTagFilter, setActiveTagFilter }) => {
    const isSelected = activeTagFilter === tag;
    
    return (
        <button 
            onClick={() => setActiveTagFilter(tag)} 
            style={{
                ...styles.filterButton, 
                backgroundColor: isSelected ? PRIMARY_BLUE : '#F3F4F6', 
                color: isSelected ? 'white' : TEXT_MUTED,
                fontWeight: isSelected ? '700' : '500',
                border: isSelected ? `1px solid ${PRIMARY_BLUE}` : '1px solid #D1D5DB'
            }}
        >
            {tag}
        </button>
    );
});


// --- Main Component ---
const AdminJobPage = () => {
    // --- STATE DEFINITION ---
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTagFilter, setActiveTagFilter] = useState('All'); 
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [applicationsError, setApplicationsError] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [jobBody, setJobBody] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    // START: NEW STATE FOR CONTACT NUMBER VALIDATION
    const [contactNumberError, setContactNumberError] = useState(null);
    // END: NEW STATE
    const [selectedTag, setSelectedTag] = useState(JOB_TAG_OPTIONS[1]); 
    const [selectedFile, setSelectedFile] = useState(null); 
    const [isUploadingFile, setIsUploadingFile] = useState(false); 
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [jobIdToDelete, setJobIdToDelete] = useState(null);


    // --- HANDLER DEFINITIONS ---

    const closeMessageModal = useCallback(() => {
        setMessage(null);
        setIsSuccess(false);
    }, []);
    
    const closeConfirmationModal = useCallback(() => {
        setJobIdToDelete(null);
    }, []);

    const closeDetailModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedJob(null);
        setApplications([]);
        setApplicationsError(null);
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/jobs/all`, { withCredentials: true });
            setJobs(response.data.jobs || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to load job listings. Check the /api/admin/jobs/all endpoint.');
            setLoading(false);
        }
    }, []);

    const fetchApplications = useCallback(async (jobId) => {
        setApplicationsLoading(true);
        setApplicationsError(null);
        setApplications([]);
        try {
            const endpoint = `${API_BASE_URL}/admin/content/job/responses/${jobId}`;
            const response = await axios.get(endpoint, { withCredentials: true });
            setApplications(response.data.responses || []);
            setApplicationsLoading(false);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setApplicationsError('Failed to load applications for this job.');
            setApplicationsLoading(false);
        }
    }, []);

    const openDetailModal = useCallback((job) => {
        setSelectedJob(job);
        fetchApplications(job.id);
        setIsDetailModalOpen(true);
    }, [fetchApplications]);

    const promptDeleteJob = useCallback((jobId) => {
        setJobIdToDelete(jobId);
    }, []);

    const executeDeleteJob = useCallback(async (jobId) => {
        closeConfirmationModal(); 

        try {
            const res = await axios.delete(`${API_BASE_URL}/threads/${jobId}`, {
                data: { threadType: 'job', userId: ADMIN_POSTING_ID, },
                withCredentials: true
            });

            if (res.status === 200) {
                setMessage(res.data.message || "Job deleted successfully!");
                setIsSuccess(true);
                fetchJobs(); 
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
    }, [closeConfirmationModal, fetchJobs, selectedJob, closeDetailModal]);
    
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const uploadMedia = useCallback(async () => {
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
    }, [selectedFile]);

    // START: MODIFIED handlePostJobSubmit to use new validation state
    const handlePostJobSubmit = useCallback(async () => {
        
        // 1. Trigger final contact number validation and update error state
        const validationError = validateContactNumberJob(contactNumber);
        setContactNumberError(validationError);

        // 2. Check for required fields (Title, Body, Tag)
        if (!title.trim() || !jobBody.trim() || !selectedTag) {
            setMessage('Job Title, Description, and Category are required.');
            setIsSuccess(false);
            return;
        }
        
        // 3. Check for format validation error (blocks submission if inline validation failed)
        if (validationError) {
            setMessage('Please correct the invalid contact number format before posting.');
            setIsSuccess(false);
            return;
        }

        // The old, simpler phone regex check is now removed/replaced by `validateContactNumberJob`.
        
        try {
            let mediaUrls = [];
            if (selectedFile) {
                mediaUrls = await uploadMedia();
            }

            const payload = {
                userId: ADMIN_POSTING_ID, postType: 'job', title: title,
                postContent: jobBody, postCategory: selectedTag, mediaUrls: mediaUrls,
                contactNumber: contactNumber, isAdminPost: true,
            };

            const res = await axios.post(`${API_BASE_URL}/threads`, payload, { withCredentials: true });

            if (res.status === 201 || res.status === 200) {
                setTitle(''); setJobBody(''); setContactNumber(''); setContactNumberError(null); // Clear errors and inputs
                setSelectedTag(JOB_TAG_OPTIONS[1]); setSelectedFile(null);
                setIsPostModalOpen(false);
                fetchJobs(); 
                setMessage("Job successfully posted!");
                setIsSuccess(true);
            } else {
                setMessage(`Failed to post job: ${res.data.message || 'Unknown error'}`);
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Job posting error:", error.response?.data?.message || error.message);
            setMessage(`Error posting job: ${error.response?.data?.message || error.message}`);
            setIsSuccess(false);
        }
    }, [title, jobBody, contactNumber, selectedTag, selectedFile, uploadMedia, fetchJobs, setContactNumberError]);
    // END: MODIFIED handlePostJobSubmit


    // --- EFFECTS ---
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // --- MEMOIZED DATA ---
    const filteredAndSortedJobs = useMemo(() => {
        let currentJobs = [...jobs];
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentJobs = currentJobs.filter(item =>
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.author_name || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.tag || '').toLowerCase().includes(lowerCaseQuery)
            );
        }
        if (activeTagFilter !== 'All') {
            const lowerCaseTag = activeTagFilter.toLowerCase();
            currentJobs = currentJobs.filter(item => (item.tag || '').toLowerCase() === lowerCaseTag.toLowerCase());
        }
        currentJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return currentJobs;
    }, [jobs, searchQuery, activeTagFilter]);

    // --- Main Render ---
    return (
        <div style={styles.pageContainer}>
            {/* Header */}
            <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}> Job Listings Management</h1>
                <button 
                    style={styles.postNewJobButton} 
                    onClick={() => setIsPostModalOpen(true)}
                    onMouseEnter={(e) => handlePrimaryButtonHover(e, true)}
                    onMouseLeave={(e) => handlePrimaryButtonHover(e, false)}
                >
                    <Plus size={20} /> Post New Job
                </button>
            </div>

            {/* Controls: Filters and Search */}
            <div style={styles.controls}>
                <div style={styles.filterContainer}>
                    {JOB_TAG_OPTIONS.map(tag => (
                        <FilterOption 
                            key={tag} 
                            tag={tag} 
                            activeTagFilter={activeTagFilter} 
                            setActiveTagFilter={setActiveTagFilter} 
                        />
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
                    <div style={styles.noResults}>No job listings found matching your criteria.</div>
                )}

                {!loading && filteredAndSortedJobs.length > 0 && (
                    filteredAndSortedJobs.map(job => (
                        <JobCard 
                            key={job.id} 
                            job={job} 
                            onClick={openDetailModal} 
                            promptDeleteJob={promptDeleteJob} 
                        />
                    ))
                )}
            </div>

            {/* Modals (Passed props to external components) */}
            <JobDetailModal 
                isDetailModalOpen={isDetailModalOpen} 
                selectedJob={selectedJob} 
                applications={applications}
                applicationsLoading={applicationsLoading}
                applicationsError={applicationsError}
                closeDetailModal={closeDetailModal}
            />
            <PostJobModal 
                isPostModalOpen={isPostModalOpen}
                setIsPostModalOpen={setIsPostModalOpen}
                title={title} setTitle={setTitle}
                jobBody={jobBody} setJobBody={setJobBody}
                contactNumber={contactNumber} setContactNumber={setContactNumber}
                // START: PASS NEW VALIDATION PROPS
                contactNumberError={contactNumberError} 
                setContactNumberError={setContactNumberError}
                // END: PASS NEW VALIDATION PROPS
                selectedTag={selectedTag} setSelectedTag={setSelectedTag}
                selectedFile={selectedFile} setSelectedFile={setSelectedFile}
                error={error} isUploadingFile={isUploadingFile}
                handlePostJobSubmit={handlePostJobSubmit}
                handleFileChange={handleFileChange}
            />
            <DeleteConfirmationModal 
                jobIdToDelete={jobIdToDelete}
                closeConfirmationModal={closeConfirmationModal}
                executeDeleteJob={executeDeleteJob}
            />
            <MessageModal 
                message={message}
                isSuccess={isSuccess}
                closeMessageModal={closeMessageModal}
            />
        </div>
    );
};

export default AdminJobPage;