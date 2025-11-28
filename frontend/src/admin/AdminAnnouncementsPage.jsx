// frontend/src/admin/AdminAnnouncementPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, Trash2, CheckCircle, Plus, Edit, 
    Bell, Calendar, User, Users, XCircle, Clock, Image, FileText,
    Globe, Zap, Activity, Eye, Volume2 // Volume2 is a good icon for Announcement
} from 'lucide-react';

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Constants for Dropdowns (Tailored for Announcements) ---
// ANNOUNCEMENT_CATEGORIES are simpler than NEWS_CATEGORIES
const ANNOUNCEMENT_CATEGORIES = [
    'General Information', 'Closure Notice', 'Service Interruption', 
    'Urgent Call to Action', 'Office Hours Update', 'Upcoming Event', 
    'Official Statement'
];

const POSTED_BY_OPTIONS = [
    'Barangay Captain', 'Barangay Secretary', 'SK Chairperson', 
    'Office Staff', 'Other'
];

const TARGET_AUDIENCE_OPTIONS = [
    'Whole Barangay', 'Purok / Zone', 'Senior Citizens', 
    'Youth', 'Business Owners', 'General Public', 'N/A'
];

// --- Utility Function: Format Date (Copied from News Page) ---
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Function to get a color for the announcement category tag (Used in Cards and Modals)
// Adjusted colors/icons for Announcement categories
const getCategoryColor = (category) => {
    switch (category) {
        case 'Urgent Call to Action': return { bg: '#FEE2E2', text: '#DC2626', icon: Zap }; // Red
        case 'Service Interruption': return { bg: '#FEF3C7', text: '#D97706', icon: XCircle }; // Amber
        case 'General Information': return { bg: '#D1FAE5', text: '#059669', icon: Globe }; // Green
        case 'Official Statement': return { bg: '#DBEAFE', text: '#2563EB', icon: FileText }; // Blue
        case 'Upcoming Event': return { bg: '#EDE9FE', text: '#7C3AED', icon: Calendar }; // Violet
        default: return { bg: '#F3F4F6', text: '#6B7280', icon: Volume2 }; // Gray
    }
};

// Common Styles for View Modal (Copied from News Page)
const baseViewModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    modal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative'
    },
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700'
    },
    contentGrid: { 
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '20px' 
    },
    detailBox: { 
        padding: '15px', border: '1px solid #E5E7EB', borderRadius: '10px', 
        backgroundColor: '#F9FAFB' 
    },
    detailLabel: { 
        fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '5px' 
    },
    detailValue: { 
        fontSize: '16px', color: '#1F2937', fontWeight: '500' 
    },
    closeButton: { 
        padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        fontSize: '16px', transition: 'background-color 0.2s', width: '100%' 
    }
};

// --- View Announcement Modal (Modified from NewsViewModal) ---
const AnnouncementViewModal = ({ show, announcementItem, onClose }) => {
    if (!show || !announcementItem) return null;

    const tagColor = getCategoryColor(announcementItem.category);
    const TagIcon = tagColor.icon;
    
    let attachments = [];
    try {
        attachments = Array.isArray(announcementItem.attachments) 
            ? announcementItem.attachments 
            : (announcementItem.attachments_json ? JSON.parse(announcementItem.attachments_json) : []);
    } catch (e) {
        console.error("Failed to parse attachments JSON in view modal:", e);
    }

    const cardTagStyle = (color) => ({
        backgroundColor: color.bg, color: color.text, 
        padding: '6px 10px', borderRadius: '9999px', 
        fontSize: '14px', fontWeight: '700', 
        display: 'inline-flex', alignItems: 'center', gap: '8px'
    });
    
    return (
        <div style={baseViewModalStyles.backdrop}>
            <div style={baseViewModalStyles.modal}>
                <h3 style={baseViewModalStyles.header}>
                    <Eye size={28} /> Full Announcement Details: {announcementItem.title}
                </h3>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#6B7280' }}
                >
                    &times;
                </button>

                <div style={baseViewModalStyles.contentGrid}>
                    {/* Main Content Area */}
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <span style={cardTagStyle(tagColor)}>
                                    <TagIcon size={16} /> {announcementItem.category}
                                </span>
                                <div style={{...baseViewModalStyles.detailValue, fontSize: '14px', color: '#9CA3AF'}}>
                                    <Calendar size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Published: {formatDate(announcementItem.date_published, true)}
                                </div>
                            </div>
                            
                            {announcementItem.featured_image_url && (
                                <img 
                                    src={announcementItem.featured_image_url} 
                                    alt={announcementItem.title} 
                                    style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '10px', marginBottom: '20px' }} 
                                />
                            )}

                            <h4 style={{fontSize: '22px', color: '#1F2937', fontWeight: '700', marginBottom: '10px'}}>Description</h4>
                            <p style={{fontSize: '16px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                                {announcementItem.content}
                            </p>
                        </div>

                        {/* Attachments Section */}
                        {attachments.length > 0 && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                                <h4 style={{fontSize: '20px', color: '#1F2937', fontWeight: '700', marginBottom: '15px'}}><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Available Attachments</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {attachments.map((att, index) => (
                                        <a key={index} href={att} target="_blank" rel="noopener noreferrer" 
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '8px', 
                                                padding: '10px 15px', backgroundColor: '#DBEAFE', 
                                                borderRadius: '8px', color: '#1E40AF', textDecoration: 'none', 
                                                fontWeight: '600', transition: 'background-color 0.2s'
                                            }}>
                                            <FileText size={16}/> View Attachment {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Side Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Posted By</div>
                            <div style={baseViewModalStyles.detailValue}>{announcementItem.posted_by}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Users size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Target Audience</div>
                            <div style={baseViewModalStyles.detailValue}>{announcementItem.target_audience}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Valid Until (Expiry)</div>
                            <div style={{...baseViewModalStyles.detailValue, color: announcementItem.valid_until ? '#B91C1C' : '#059669'}}>
                                {announcementItem.valid_until ? formatDate(announcementItem.valid_until, false) : 'No Expiry Set'}
                            </div>
                        </div>
                        
                        {/* Closing Button */}
                        <div style={{marginTop: '15px'}}>
                            <button onClick={onClose} style={baseViewModalStyles.closeButton}>
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Modal Component (Success/Error) (Copied from News Page) ---
const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;

    const modalStyles = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        },
        modal: {
            backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)', 
            position: 'relative', textAlign: 'center'
        },
        closeButton: { position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none' },
        content: {
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginBottom: '15px', color: isSuccess ? '#059669' : '#DC2626'
        },
        title: { fontSize: '22px', fontWeight: '700', margin: 0 },
        body: { fontSize: '16px', color: '#374151', marginBottom: '20px' },
        successButton: { 
            width: '100%', padding: '10px', backgroundColor: isSuccess ? '#10B981' : '#DC2626', 
            color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
            transition: 'background-color 0.2s' 
        }
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <button onClick={onClose} style={modalStyles.closeButton}>&times;</button>
                <div style={modalStyles.content}>
                    {isSuccess ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>
                <h3 style={modalStyles.title}>{title}</h3>
                <p style={modalStyles.body}>{body}</p>
                <button onClick={onClose} style={modalStyles.successButton}>Close</button>
            </div>
        </div>
    );
};

// --- MODIFIED: Custom Delete Confirmation Modal (Hard Delete Messaging) ---
const DeleteConfirmationModal = ({ show, title, onConfirm, onCancel }) => {
    if (!show) return null;

    const modalStyles = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        },
        modal: {
            backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)', 
            position: 'relative', textAlign: 'center'
        },
        // MODIFIED TITLE COLOR FOR CONSISTENCY
        title: { fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0', color: '#DC2626' }, 
        body: { fontSize: '16px', color: '#374151', marginBottom: '20px' },
        buttonGroup: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
        cancelButton: { 
            padding: '10px 15px', backgroundColor: '#9CA3AF', color: 'white', 
            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
            transition: 'background-color 0.2s', flexGrow: 1
        },
        confirmButton: { 
            padding: '10px 15px', backgroundColor: '#EF4444', color: 'white', 
            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
            transition: 'background-color 0.2s', flexGrow: 1
        }
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <Trash2 size={32} style={{ color: '#EF4444', marginBottom: '15px' }} />
                <h3 style={modalStyles.title}>Confirm PERMANENT Deletion</h3>
                <p style={modalStyles.body}>
                    Are you sure you want to **permanently delete** this announcement: "{title}"? 
                    This action **cannot be undone** and will remove it from the system entirely.
                </p>
                <div style={modalStyles.buttonGroup}>
                    <button onClick={onCancel} style={modalStyles.cancelButton}>Cancel</button>
                    <button onClick={onConfirm} style={modalStyles.confirmButton}>Yes, Permanently Delete</button>
                </div>
            </div>
        </div>
    );
};
// --- END MODIFIED COMPONENT ---


// --- Announcement Form Modal Component (Modified from NewsFormModal) ---
const AnnouncementFormModal = ({ show, initialData, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: ANNOUNCEMENT_CATEGORIES[0],
        content: '',
        featured_image_url: '',
        valid_until: '', // YYYY-MM-DD
        posted_by: POSTED_BY_OPTIONS[0],
        target_audience: TARGET_AUDIENCE_OPTIONS[0],
        attachments: [], 
    });
    const [imageFile, setImageFile] = useState(null);
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            setError('');
            setLoading(false);
            if (initialData) {
                let attachmentsArray = [];
                try {
                    attachmentsArray = Array.isArray(initialData.attachments) 
                        ? initialData.attachments 
                        : (initialData.attachments_json ? JSON.parse(initialData.attachments_json) : []);
                } catch (e) {
                    console.error("Failed to parse attachments JSON:", e);
                }

                setFormData({
                    ...initialData,
                    // Use initialData.valid_until or '' if null/undefined
                    valid_until: initialData.valid_until ? new Date(initialData.valid_until).toISOString().split('T')[0] : '',
                    target_audience: initialData.target_audience || TARGET_AUDIENCE_OPTIONS[0],
                    attachments: attachmentsArray 
                });
                setImageFile(null);
                setAttachmentFiles([]);
            } else {
                setFormData({
                    title: '', category: ANNOUNCEMENT_CATEGORIES[0], content: '', featured_image_url: '',
                    valid_until: '', posted_by: POSTED_BY_OPTIONS[0],
                    target_audience: TARGET_AUDIENCE_OPTIONS[0], attachments: [], 
                });
            }
        }
    }, [show, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setFormData(prev => ({ ...prev, featured_image_url: '' }));
        }
    };

    const handleAttachmentChange = (e) => {
        setAttachmentFiles([...e.target.files]);
    };
    
    // Placeholder for actual file upload logic (Same as News Page)
    const uploadFile = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('media', file);
        try {
            const response = await axios.post(`${API_BASE_URL}/upload-media`, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Assumes the server returns the URL in response.data.fileUrl or response.data.mediaUrls[0]
            return response.data.fileUrl || response.data.mediaUrls?.[0]; 
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            throw new Error(`Failed to upload file: ${file.name}. (Check /api/upload-media)`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let finalImageUrl = formData.featured_image_url;
            const existingAttachments = Array.isArray(formData.attachments) ? formData.attachments : [];
            let finalAttachmentUrls = [...existingAttachments];

            if (imageFile) {
                finalImageUrl = await uploadFile(imageFile);
            }

            const newAttachmentUrls = await Promise.all(attachmentFiles.map(uploadFile));
            finalAttachmentUrls = finalAttachmentUrls.concat(newAttachmentUrls);
            
            const announcementData = {
                ...formData,
                featured_image_url: finalImageUrl || null,
                // Server should parse this JSON string for array storage
                attachments_json: finalAttachmentUrls.length > 0 ? JSON.stringify(finalAttachmentUrls) : null,
                attachments: undefined, // Exclude the state array from API payload
            };

            // Use 'admin/announcements' endpoint
            const url = initialData ? `${API_BASE_URL}/admin/announcements/${initialData.id}` : `${API_BASE_URL}/admin/announcements`;
            const method = initialData ? 'put' : 'post';

            await axios[method](url, announcementData);
            
            onSave(initialData ? 'updated' : 'added');

        } catch (err) {
            console.error("API error:", err);
            setError(err.message || 'An error occurred while saving the announcement.');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = !!initialData;

    if (!show) return null;

    // Use the same styles as NewsFormModal
    const baseInputStyle = { 
        padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', 
        fontSize: '15px', boxSizing: 'border-box', width: '100%',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        // In a real project, use styled-components or CSS for pseudo-classes
        // ':focus': { 
        //     borderColor: '#6366F1',
        //     boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        //     outline: 'none',
        // }
    };
    
    const styles = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        },
        modal: {
            backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
            width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative'
        },
        header: { 
            margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
            borderBottom: '2px solid #F3F4F6', paddingBottom: '15px' 
        },
        form: { display: 'flex', flexDirection: 'column', gap: '20px' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '8px' },
        input: baseInputStyle,
        select: baseInputStyle,
        textarea: { ...baseInputStyle, minHeight: '150px', resize: 'vertical' },
        fileSection: { 
            border: '2px dashed #D1D5DB', padding: '20px', borderRadius: '12px', 
            marginTop: '10px', backgroundColor: '#F9FAFB' 
        },
        button: {
            padding: '14px 20px', backgroundColor: '#6366F1', color: 'white', 
            border: 'none', borderRadius: '10px', cursor: 'pointer', 
            fontWeight: '700', fontSize: '16px', transition: 'opacity 0.2s, background-color 0.2s'
        },
        error: { color: '#DC2626', fontWeight: '600', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' },
        filePreview: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' },
        fileItem: { 
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '8px 12px', backgroundColor: '#E5E7EB', borderRadius: '6px', 
            fontSize: '13px', color: '#4B5563'
        },
    };

    return (
        <div style={styles.backdrop}>
            <div style={styles.modal}>
                <h3 style={styles.header}>
                    {isEdit ? 'Edit Barangay Announcement' : 'Add New Announcement'}
                </h3>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#6B7280' }}>&times;</button>
                
                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>1. Announcement Title *</label>
                        <input
                            type="text" name="title" value={formData.title}
                            onChange={handleChange} style={styles.input} required
                            placeholder="e.g., Office Closure for Holiday"
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>3. Content / Detailed Announcement *</label>
                        <textarea
                            name="content" value={formData.content}
                            onChange={handleChange} style={styles.textarea} required
                            placeholder="Provide the full announcement details here."
                        />
                    </div>

                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>2. Category / Type of Announcement *</label>
                            <select
                                name="category" value={formData.category}
                                onChange={handleChange} style={styles.select} required
                            >
                                {ANNOUNCEMENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>7. Posted By *</label>
                            <select
                                name="posted_by" value={formData.posted_by}
                                onChange={handleChange} style={styles.select} required
                            >
                                {POSTED_BY_OPTIONS.map(by => <option key={by} value={by}>{by}</option>)}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>6. Valid Until / Expiry Date (Optional)</label>
                            <input
                                type="date" name="valid_until" value={formData.valid_until}
                                onChange={handleChange} style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>8. Target Audience (Optional)</label>
                            <select
                                name="target_audience" value={formData.target_audience}
                                onChange={handleChange} style={styles.select}
                            >
                                {TARGET_AUDIENCE_OPTIONS.map(aud => <option key={aud} value={aud}>{aud}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div style={styles.fileSection}>
                        <label style={styles.label}><Image size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> 4. Featured Image</label>
                        {formData.featured_image_url && (
                            <div style={{ marginBottom: '15px' }}>
                                <img src={formData.featured_image_url} alt="Current Featured" style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #D1D5DB', display: 'block' }} />
                                <small style={{ color: '#6B7280' }}>Current Image. Upload a new file to replace it.</small>
                            </div>
                        )}
                        <input
                            type="file" accept="image/*"
                            onChange={handleImageChange} style={{ ...styles.input, padding: '10px' }}
                        />
                    </div>

                    <div style={styles.fileSection}>
                        <label style={styles.label}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> 9. Attachments (Optional: PDF files, Schedules)</label>
                        {(formData.attachments && formData.attachments.length > 0) || (attachmentFiles.length > 0) ? (
                            <div style={styles.filePreview}>
                                <small style={{ color: '#6B7280', width: '100%', marginBottom: '5px', fontWeight: '500' }}>Existing Files:</small>
                                {/* Display existing attachments */}
                                {formData.attachments.map((att, index) => (
                                    <span key={`exist-${index}`} style={styles.fileItem}>
                                        <FileText size={14}/>
                                        <a href={att} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>File {index + 1}</a>
                                    </span>
                                ))}
                                {/* Display newly selected files */}
                                {attachmentFiles.map((file, index) => (
                                    <span key={`new-${index}`} style={{...styles.fileItem, backgroundColor: '#DBEAFE'}}>
                                        <FileText size={14}/>
                                        {file.name} (New)
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No attachments currently.</p>
                        )}
                        
                        <input
                            type="file" multiple
                            onChange={handleAttachmentChange} style={{ ...styles.input, padding: '10px', marginTop: '10px' }}
                        />
                    </div>

                    <button type="submit" style={{ ...styles.button, opacity: loading ? 0.8 : 1 }} disabled={loading}>
                        {loading ? '🚀 Publishing...' : (isEdit ? '💾 Update Announcement' : 'Publish Announcement')}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Main AdminAnnouncementPage Component ---
const AdminAnnouncementPage = () => {
    // State variables use 'announcements' instead of 'news'
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for Add/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null); 
    
    // State for dedicated View Modal 
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAnnouncementForView, setSelectedAnnouncementForView] = useState(null);
    
    // NEW STATE: State for Delete Confirmation Modal
    const [deleteModal, setDeleteModal] = useState({ show: false, announcementId: null, title: '' });

    // NEW STATE: State for Card Hover Effect (Crucial for inline hover implementation)
    const [hoveredCardId, setHoveredCardId] = useState(null);


    const [error, setError] = useState('');

    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: true });
    
    // --- Data Fetching ---
    const fetchAnnouncements = async () => {
        setLoading(true);
        setError('');
        try {
            // Updated API endpoint to 'admin/announcements'
            const response = await axios.get(`${API_BASE_URL}/admin/announcements`);
            setAnnouncements(response.data);
        } catch (err) {
            console.error("Failed to fetch announcements:", err);
            setError('Failed to load announcement listings. Check server connection and API route (admin/announcements).');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Function to close/reset modal states
    const handleCloseAddEditModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
    };
    
    // Function to close/reset view modal state
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedAnnouncementForView(null);
    };


    // --- Actions ---
    const handleAddAnnouncement = () => {
        setEditingAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleEditAnnouncement = (announcementItem) => {
        setEditingAnnouncement(announcementItem);
        setIsModalOpen(true);
    };

    // --- ACTION: Open dedicated view modal ---
    const handleViewDetails = (announcementItem) => {
        setSelectedAnnouncementForView(announcementItem);
        setIsViewModalOpen(true);
    };

    // MODIFIED: Open custom confirmation modal
    const handleDeleteAnnouncement = (id, title) => {
        setDeleteModal({ show: true, announcementId: id, title: title });
    };

    // MODIFIED FUNCTION: Executes PERMANENT deletion and updates state instantly
    const confirmDelete = async () => {
        const id = deleteModal.announcementId;
        // Close the confirmation modal
        setDeleteModal({ show: false, announcementId: null, title: '' }); 

        try {
            // Call the DELETE API endpoint (assumed to be a HARD DELETE on server side)
            await axios.delete(`${API_BASE_URL}/admin/announcements/${id}`);
            
            // 🔑 CRUCIAL CHANGE: AUTOMATIC REMOVAL from the page (no archiving/refetch)
            setAnnouncements(prev => prev.filter(item => item.id !== id));
            
            setMessageModal({
                show: true,
                title: 'Success!',
                body: `Announcement ID ${id} was permanently deleted and removed from the list.`,
                isSuccess: true
            });
            // Removed: fetchAnnouncements(); 
        } catch (err) {
            setMessageModal({
                show: true,
                title: 'Error',
                body: `Failed to permanently delete announcement ID: ${id}.`,
                isSuccess: false
            });
            console.error(err);
        }
    };

    const handleSaveComplete = (action) => {
        handleCloseAddEditModal();
        setMessageModal({
            show: true,
            title: 'Success!',
            body: `Announcement item has been successfully ${action}.`,
            isSuccess: true
        });
        fetchAnnouncements();
    };

    // --- Filtering Logic (Same logic as News Page) ---
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(n => 
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.posted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [announcements, searchTerm]);


    // --- Inline Styles (Copied from News Page) ---
    const styles = {
        pageContainer: { padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        title: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px', },
        addButton: { 
            display: 'flex', alignItems: 'center', padding: '10px 20px', 
            backgroundColor: '#6366F1', color: 'white', border: 'none', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
            transition: 'background-color 0.2s'
        },
        controls: { 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            marginBottom: '30px', backgroundColor: 'white', padding: '15px', 
            borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
        },
        searchInput: { 
            padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', 
            width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center', 
            boxSizing: 'border-box'
        },
        searchIcon: { marginRight: '10px', color: '#6B7280' },
        cardGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '30px',
        },
        // MODIFIED: Added cursor and transitions for hover simulation
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s', // Smooth transition
            cursor: 'pointer', // Indicates clickability
        },
        cardImage: {
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            backgroundColor: '#E5E7EB',
        },
        cardContent: {
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
        },
        cardTag: (color) => ({
            backgroundColor: color.bg, color: color.text, 
            padding: '6px 10px', borderRadius: '9999px', 
            fontSize: '12px', fontWeight: '700', 
            display: 'inline-flex', alignItems: 'center', gap: '5px'
        }),
        cardTitle: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#1F2937',
            margin: '10px 0 5px 0',
            lineHeight: '1.4'
        },
        cardSummary: {
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '15px',
            flexGrow: 1
        },
        cardFooter: {
            borderTop: '1px solid #E5E7EB',
            paddingTop: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '13px',
            color: '#4B5563',
            marginTop: '15px'
        },
        actionButton: (color) => ({ 
            background: color, color: 'white', border: 'none', padding: '8px 10px', 
            borderRadius: '6px', cursor: 'pointer', marginLeft: '8px', 
            display: 'inline-flex', alignItems: 'center', transition: 'opacity 0.2s' 
        }),
        readMoreButton: {
            background: '#4B5563', 
            color: 'white', 
            border: 'none', 
            padding: '8px 15px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: '600',
            display: 'inline-flex', 
            alignItems: 'center', 
            transition: 'background-color 0.2s',
            fontSize: '14px'
        },
        noResults: { 
            textAlign: 'center', padding: '50px', backgroundColor: 'white', 
            borderRadius: '12px', color: '#6B7280' 
        }
    };
    

    if (loading) {
        return <div style={styles.pageContainer}>Loading announcements...</div>;
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                {/* Updated Icon and Title */}
                <h1 style={styles.title}> Manage Barangay Announcements</h1>
                <button style={styles.addButton} onClick={handleAddAnnouncement}>
                    <Plus size={20} style={{ marginRight: '5px' }} /> Add New Announcement
                </button>
            </div>

            <div style={styles.controls}>
                <div style={styles.searchInput}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search announcements (title, category, content...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', outline: 'none', flexGrow: 1 }}
                    />
                </div>
            </div>

            {error && <div style={{ color: '#DC2626', marginBottom: '20px', padding: '15px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>Error: {error}</div>}

            <div style={styles.cardGrid}>
                {filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map((n) => {
                        const tagColor = getCategoryColor(n.category);
                        const TagIcon = tagColor.icon;

                        // NEW: Dynamic styles for hover effect
                        const isHovered = n.id === hoveredCardId;
                        const cardStyle = {
                            ...styles.card,
                            transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                            boxShadow: isHovered 
                                ? '0 8px 20px rgba(0, 0, 0, 0.15)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.08)',
                        };
                        
                        return (
                            <div 
                                key={n.id} 
                                // NEW: Apply dynamic style and event handlers
                                style={cardStyle}
                                onMouseEnter={() => setHoveredCardId(n.id)}
                                onMouseLeave={() => setHoveredCardId(null)}
                                // NEW: Make the entire card clickable to open the view modal
                                onClick={() => handleViewDetails(n)} 
                            >
                                <img 
                                    src={n.featured_image_url || 'https://via.placeholder.com/400x200?text=No+Image+Provided'} 
                                    alt={n.title} 
                                    style={styles.cardImage} 
                                />
                                <div style={styles.cardContent}>
                                    <span style={styles.cardTag(tagColor)}>
                                        <TagIcon size={14} /> {n.category}
                                    </span>
                                    <h2 style={styles.cardTitle}>{n.title}</h2>
                                    
                                    <p style={styles.cardSummary}>
                                        {n.content.substring(0, 120)}{n.content.length > 120 ? '...' : ''}
                                    </p>
                                    
                                    {/* Action Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                        {/* Read More Button (opens dedicated view modal) */}
                                        <button 
                                            style={styles.readMoreButton} 
                                            // 🔑 IMPORTANT: Stop propagation to prevent double-click handler (card + button)
                                            onClick={(e) => { e.stopPropagation(); handleViewDetails(n); }}
                                            title="View Full Details"
                                        >
                                            <Eye size={16} style={{ marginRight: '6px' }} /> Read More
                                        </button>

                                        <div>
                                            {/* Edit Button (opens form modal) */}
                                            <button 
                                                style={styles.actionButton('#3B82F6')} 
                                                // 🔑 IMPORTANT: Stop propagation 
                                                onClick={(e) => { e.stopPropagation(); handleEditAnnouncement(n); }}
                                                title="Edit Announcement"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {/* Delete Button (Opens custom confirmation modal) */}
                                            <button 
                                                style={styles.actionButton('#EF4444')} 
                                                // 🔑 IMPORTANT: Stop propagation
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(n.id, n.title); }}
                                                title="Permanently Delete Announcement"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Details (Dates, Posted By) */}
                                    <div style={styles.cardFooter}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <User size={14} style={{ marginRight: '5px' }} /> Posted by: <strong>{n.posted_by}</strong>
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <Calendar size={14} style={{ marginRight: '5px' }} /> Published: {formatDate(n.date_published, false)}
                                            </span>
                                            {n.valid_until && (
                                                <span style={{ display: 'flex', alignItems: 'center', color: '#F59E0B', fontWeight: '500' }}>
                                                    <Clock size={14} style={{ marginRight: '5px' }} /> Expires: {formatDate(n.valid_until, false)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={styles.noResults}>
                            No announcement items found matching your search criteria.
                        </div>
                    </div>
                )}
            </div>
            
            {/* ADD/EDIT MODAL (Form) */}
            <AnnouncementFormModal
                show={isModalOpen}
                initialData={editingAnnouncement}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveComplete}
            />

            {/* VIEW MODAL (Dedicated Read-Only) */}
            <AnnouncementViewModal
                show={isViewModalOpen}
                announcementItem={selectedAnnouncementForView}
                onClose={handleCloseViewModal}
            />
            
            {/* DELETE CONFIRMATION MODAL */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                title={deleteModal.title}
                onConfirm={confirmDelete} // Calls the function that filters state instantly
                onCancel={() => setDeleteModal({ ...deleteModal, show: false })}
            />

            <AdminMessageModal
                show={messageModal.show}
                title={messageModal.title}
                body={messageModal.body}
                isSuccess={messageModal.isSuccess}
                onClose={() => setMessageModal({ ...messageModal, show: false })}
            />
        </div>
    );
};

export default AdminAnnouncementPage;