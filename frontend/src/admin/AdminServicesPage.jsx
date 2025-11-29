// frontend/src/admin/AdminServicesPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, Trash2, CheckCircle, Plus, Edit, 
    HardHat, Calendar, User, Users, XCircle, Clock, Image, FileText,
    Globe, Zap, Activity, Eye, Phone, Home 
} from 'lucide-react'; // Note: Eye is the icon for Read More/View

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Constants for Dropdowns (Adapted for Services) ---
const SERVICE_CATEGORIES = [
    'Document Request', 'Health Services', 'Infrastructure', 
    'Social Welfare', 'Community Support', 'Emergency Response', 
    'Livelihood Programs', 'Other'
];

const AVAILABILITY_OPTIONS = [
    'Weekdays (8AM-5PM)', '24/7 (Emergency)', 'By Appointment', 
    'Flexible Schedule', 'Online Only', 'N/A'
];

const DEPARTMENT_OPTIONS = [
    'Office of the Captain', 'Health Center', 'Secretary\'s Office', 
    'SK Council', 'Disaster Management', 'Other'
];

// --- Utility Function: Format Date (Reused) ---
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        // Use `false` if only date is needed, but typically in admin view, time is helpful
        ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: true })
    };
    return date.toLocaleDateString(undefined, options);
};

// Function to get a color for the service category tag (Consistent style)
const getCategoryColor = (category) => {
    switch (category) {
        case 'Emergency Response': return { bg: '#FEE2E2', text: '#DC2626', icon: Zap }; // Red
        case 'Document Request': return { bg: '#FEF3C7', text: '#D97706', icon: FileText }; // Amber
        case 'Health Services': return { bg: '#D1FAE5', text: '#059669', icon: Plus }; // Green
        case 'Infrastructure': return { bg: '#DBEAFE', text: '#2563EB', icon: HardHat }; // Blue
        case 'Social Welfare': return { bg: '#EDE9FE', text: '#7C3AED', icon: Users }; // Violet
        default: return { bg: '#F3F4F6', text: '#6B7280', icon: Activity }; // Gray
    }
};

// --- Common Base Styles (Copied for consistency) ---
const baseInputStyle = {
    padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', 
    fontSize: '16px', color: '#1F2937', transition: 'border-color 0.2s',
    outline: 'none', width: '100%', boxSizing: 'border-box'
};

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

const baseModalStyles = {
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
    title: { fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0', color: '#DC2626' },
    body: { fontSize: '16px', color: '#374151', marginBottom: '20px' },
    buttonGroup: { display: 'flex', justifyContent: 'center', gap: '15px' },
    confirmButton: { 
        padding: '10px 20px', backgroundColor: '#DC2626', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s'
    },
    cancelButton: { 
        padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s'
    }
};

// --- Modals (Reused with 'Service' context) ---

const DeleteConfirmationModal = ({ show, title, onConfirm, onCancel }) => {
    if (!show) return null;
    
    return (
        <div style={baseModalStyles.backdrop}>
            <div style={baseModalStyles.modal}>
                <XCircle size={40} style={{ color: '#DC2626', marginBottom: '15px' }} />
                <h4 style={baseModalStyles.title}>Confirm Deletion</h4>
                <p style={baseModalStyles.body}>
                    Are you sure you want to delete the service: <strong>{title}</strong>? This action cannot be undone.
                </p>
                <div style={baseModalStyles.buttonGroup}>
                    <button onClick={onConfirm} style={baseModalStyles.confirmButton}>
                        Yes, Delete
                    </button>
                    <button onClick={onCancel} style={baseModalStyles.cancelButton}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;
    
    const icon = isSuccess ? <CheckCircle size={40} color="#059669" /> : <XCircle size={40} color="#DC2626" />;
    const modalTitleStyle = {
        ...baseModalStyles.title,
        color: isSuccess ? '#059669' : '#DC2626'
    };

    return (
        <div style={baseModalStyles.backdrop}>
            <div style={baseModalStyles.modal}>
                <div style={{ marginBottom: '15px' }}>{icon}</div>
                <h4 style={modalTitleStyle}>{title}</h4>
                <p style={baseModalStyles.body}>{body}</p>
                <button 
                    onClick={onClose} 
                    style={{ 
                        ...baseModalStyles.cancelButton, 
                        backgroundColor: isSuccess ? '#10B981' : '#F59E0B' 
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// --- Service View Modal ---
const ServiceViewModal = ({ show, serviceItem, onClose }) => {
    if (!show || !serviceItem) return null;

    const tagColor = getCategoryColor(serviceItem.category);
    const TagIcon = tagColor.icon;
    
    let requirements = [];
    try {
        // Requirements are stored as a JSON string of strings/bullet points
        requirements = Array.isArray(serviceItem.requirements_list) 
            ? serviceItem.requirements_list
            : (serviceItem.requirements_list ? JSON.parse(serviceItem.requirements_list) : []);
    } catch (e) {
        console.error("Failed to parse requirements JSON in view modal:", e);
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
                    <Eye size={28} /> Full Service Details: {serviceItem.title}
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
                                    <TagIcon size={16} /> {serviceItem.category}
                                </span>
                                <div style={{...baseViewModalStyles.detailValue, fontSize: '14px', color: '#9CA3AF'}}>
                                    <Calendar size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Posted: {formatDate(serviceItem.created_at, true)}
                                </div>
                            </div>
                            
                            {serviceItem.featured_image_url && (
                                <img 
                                    src={serviceItem.featured_image_url} 
                                    alt={serviceItem.title} 
                                    style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '10px', marginBottom: '20px' }} 
                                />
                            )}

                            <h4 style={{fontSize: '22px', color: '#1F2937', fontWeight: '700', marginBottom: '10px'}}>Description</h4>
                            {/* Display full content, preserving line breaks */}
                            <p style={{fontSize: '16px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>
                                {serviceItem.description}
                            </p>
                        </div>

                        {/* Requirements Section - Adjusted for clearer rendering */}
                        {requirements.length > 0 && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                                <h4 style={{fontSize: '20px', color: '#1F2937', fontWeight: '700', marginBottom: '15px'}}><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Requirements List</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {requirements.map((req, index) => (
                                        // Requirements are simple text strings/bullet points for simplicity
                                        <div key={index} 
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '8px', 
                                                padding: '10px 15px', backgroundColor: '#F0F9FF', 
                                                borderRadius: '8px', color: '#0B5394', 
                                                fontWeight: '600', transition: 'background-color 0.2s',
                                                border: '1px solid #BFDBFE'
                                            }}>
                                            <FileText size={16}/> {req}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '10px' }}>
                                    *The requirements list is typically a set of documents or conditions needed to avail the service.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Side Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Person</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_person}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Availability</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.availability}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Home size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Department</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.department}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Number</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_number || 'N/A'}</div>
                        </div>
                        <button 
                            onClick={onClose} 
                            style={{ ...baseViewModalStyles.closeButton, marginTop: '10px' }}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Service Form Modal (Create/Edit) ---
const ServiceFormModal = ({ show, initialData, onClose, onSave }) => {
    // Initial state based on the expected service data structure
    const initialFormState = {
        title: '',
        category: SERVICE_CATEGORIES[0],
        description: '',
        featured_image_url: '',
        contact_person: '',
        contact_number: '',
        availability: AVAILABILITY_OPTIONS[0],
        department: DEPARTMENT_OPTIONS[0],
        // requirements_list will hold an array of strings or a JSON string
        requirements_list: [], 
    };
    
    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dynamic requirements input state
    const [requirementInput, setRequirementInput] = useState('');

    const styles = useMemo(() => ({
        modalBackdrop: baseViewModalStyles.backdrop,
        modal: { ...baseViewModalStyles.modal, maxWidth: '700px', padding: '30px' },
        header: { ...baseViewModalStyles.header, fontSize: '24px', marginBottom: '20px' },
        form: { display: 'flex', flexDirection: 'column', gap: '20px' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '8px' },
        input: baseInputStyle,
        select: baseInputStyle,
        textarea: { ...baseInputStyle, minHeight: '150px', resize: 'vertical' },
        fileSection: { border: '2px dashed #D1D5DB', padding: '20px', borderRadius: '12px', marginTop: '10px', backgroundColor: '#F9FAFB' },
        button: { padding: '14px 20px', backgroundColor: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'opacity 0.2s, background-color 0.2s', fontSize: '16px' },
        cancelButton: { ...baseViewModalStyles.closeButton, backgroundColor: '#EF4444', marginTop: '10px', width: 'auto', alignSelf: 'flex-start' },
        filePreview: { marginBottom: '15px' },
        imagePreview: { maxWidth: '200px', margin: '10px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
        tagStyle: { 
            display: 'inline-flex', alignItems: 'center', gap: '5px', 
            backgroundColor: '#D1FAE5', color: '#065F46', 
            padding: '5px 10px', borderRadius: '9999px', fontSize: '14px', 
            marginRight: '8px', marginBottom: '8px', cursor: 'pointer', fontWeight: '500' 
        },
        addReqInputGroup: { display: 'flex', gap: '10px' }
    }), []);

    useEffect(() => {
        if (show) {
            setError(null);
            if (initialData) {
                // Parse requirements_list from string/JSON if editing
                let requirements = [];
                if (initialData.requirements_list) {
                    try {
                        requirements = Array.isArray(initialData.requirements_list) 
                            ? initialData.requirements_list 
                            : JSON.parse(initialData.requirements_list);
                    } catch (e) {
                        console.error("Failed to parse requirements_list:", e);
                        requirements = [];
                    }
                }
                
                // Set form data for editing
                setFormData({
                    ...initialData,
                    requirements_list: requirements,
                    // Ensure image is treated correctly for update
                    featured_image_url: initialData.featured_image_url || '',
                });
                setImageFile(null); // Clear any potentially lingering file from a previous session
                setRequirementInput('');
            } else {
                setFormData(initialFormState);
                setImageFile(null);
                setRequirementInput('');
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
            // Clear the existing URL when a new file is selected
            setFormData(prev => ({ ...prev, featured_image_url: '' }));
        }
    };
    
    // Handlers for dynamic requirements list
    const handleAddRequirement = () => {
        if (requirementInput.trim()) {
            setFormData(prev => ({ ...prev, requirements_list: [...prev.requirements_list, requirementInput.trim()] }));
            setRequirementInput('');
        }
    };

    const handleRemoveRequirement = (index) => {
        setFormData(prev => ({ ...prev, requirements_list: prev.requirements_list.filter((_, i) => i !== index) }));
    };

    // Placeholder for actual file upload logic
    const uploadFile = async (file) => {
        const uploadFormData = new FormData();
        // The server.js endpoint expects the file field name to be 'media'
        uploadFormData.append('media', file);
        try {
            const response = await axios.post(`${API_BASE_URL}/upload-media`, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Assumes the server returns the URL in response.data.mediaUrls[0]
            return response.data.mediaUrls?.[0];
        } catch (uploadError) {
            console.error("File upload failed:", uploadError);
            throw new Error(`Failed to upload file: ${file.name}. (Check /api/upload-media)`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let finalImageUrl = formData.featured_image_url;
            
            // 1. Upload new image file if present
            if (imageFile) {
                const url = await uploadFile(imageFile);
                finalImageUrl = url;
            }

            // 2. Prepare data for API
            const serviceData = {
                ...formData,
                featured_image_url: finalImageUrl || null,
                // Stringify the array for database storage
                requirements_list: JSON.stringify(formData.requirements_list), 
                // Ensure number is string for consistent handling
                contact_number: formData.contact_number || null,
            };

            // 3. API Call (POST for Add, PUT for Edit)
            if (initialData) {
                // Edit
                await axios.put(`${API_BASE_URL}/admin/services/${initialData.id}`, serviceData);
                onSave({ ...serviceData, id: initialData.id, created_at: initialData.created_at, description: formData.description }); 
            } else {
                // Add
                const response = await axios.post(`${API_BASE_URL}/admin/services`, serviceData);
                // Assume API returns the new object with an ID and creation timestamp
                onSave(response.data); 
            }

        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'An unknown error occurred during saving.';
            setError(`Save failed: ${msg}`);
            console.error("Save Service Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
                <h3 style={styles.header}>
                    {initialData ? <Edit size={28} /> : <Plus size={28} />}
                    {initialData ? 'Edit Service' : 'Add New Service'}
                </h3>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#6B7280' }}
                >
                    &times;
                </button>

                {error && (
                    <div style={{ color: '#DC2626', marginBottom: '15px', padding: '15px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>
                        Error: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        {/* Column 1: Core Details */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>1. Service Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>2. Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                {SERVICE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>3. Contact Person (Point of Contact)</label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>4. Contact Number (Optional)</label>
                            <input
                                type="text"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>5. Availability / Schedule</label>
                            <select
                                name="availability"
                                value={formData.availability}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                {AVAILABILITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>6. Department / Office</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                {DEPARTMENT_OPTIONS.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description (Full Width) */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>7. Detailed Description of the Service</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={styles.textarea}
                            required
                        />
                    </div>

                    {/* Requirements List (Full Width) */}
                    <div style={styles.fileSection}>
                        <label style={styles.label}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> 8. Requirements List</label>
                        <div style={styles.addReqInputGroup}>
                            <input
                                type="text"
                                value={requirementInput}
                                onChange={(e) => setRequirementInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') { 
                                        e.preventDefault();
                                        handleAddRequirement();
                                    }
                                }}
                                placeholder="E.g., Valid ID, Proof of Residence..."
                                style={{ ...styles.input, flexGrow: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddRequirement}
                                style={{ 
                                    ...styles.button, 
                                    backgroundColor: '#10B981', // Green 
                                    padding: '10px 15px',
                                }}
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            {formData.requirements_list.map((req, index) => (
                                <span key={index} style={styles.tagStyle} onClick={() => handleRemoveRequirement(index)}>
                                    {req} <XCircle size={14} color="#EF4444" style={{ marginLeft: '5px' }}/>
                                </span>
                            ))}
                            {formData.requirements_list.length === 0 && (
                                <small style={{ color: '#6B7280' }}>No requirements added yet.</small>
                            )}
                        </div>
                    </div>

                    {/* Image Upload Section (Full Width) */}
                    <div style={styles.fileSection}>
                        <label style={styles.label}><Image size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> 9. Featured Image (Optional)</label>
                        <div style={styles.filePreview}>
                            {(formData.featured_image_url && !imageFile) && (
                                <div style={{ marginBottom: '10px' }}>
                                    <img 
                                        src={formData.featured_image_url} 
                                        alt="Current Featured" 
                                        style={{ ...styles.imagePreview, objectFit: 'cover', borderRadius: '8px', border: '1px solid #D1D5DB', display: 'block' }} 
                                    />
                                    <small style={{ color: '#6B7280' }}>Current Image. Upload a new file to replace it.</small>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ ...styles.input, padding: '10px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            style={{ ...styles.cancelButton, backgroundColor: '#6B7280' }}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            style={styles.button} 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : (initialData ? 'Update Service' : 'Add Service')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Service Card Component (Customized to match Announcement/News style) ---
const ServiceCard = ({ service, onView, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const tagColor = getCategoryColor(service.category);
    const TagIcon = tagColor.icon;

    const styles = {
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: isHovered ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
            cursor: 'pointer', // Enable click on card to view details
        },
        imageContainer: {
            width: '100%',
            height: '200px',
            overflow: 'hidden',
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
        },
        placeholderIcon: {
            color: '#9CA3AF',
        },
        cardContent: {
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
        },
        cardTag: (color) => ({
            backgroundColor: color.bg,
            color: color.text,
            padding: '5px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '10px',
        }),
        cardTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        summary: {
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.4',
            marginBottom: '10px',
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },

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
        meta: {
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px dashed #E5E7EB',
            display: 'flex', 
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        metaItem: { 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
        },
        actions: {
            display: 'flex',
            flexDirection: 'column', // Stack children vertically
            gap: '10px', // Space between the action row and the date row
            padding: '15px 20px 15px',
            borderTop: '1px solid #E5E7EB',
        },
        actionRow: { // Row containing buttons
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        },
        actionButton: (color, isIcon = false) => ({
            flex: isIcon ? 0 : 'auto', 
            padding: isIcon ? '8px 12px' : '8px 15px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'background-color 0.2s',
            whiteSpace: 'nowrap',
        }),
        buttonGroup: {
            display: 'flex',
            gap: '10px',
        },
        // ⭐️ UPDATED STYLE: alignSelf: 'flex-end' pushes it to the right ⭐️
        postedDateStyle: {
            fontSize: '12px',
            color: '#6B7280', 
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            alignSelf: 'flex-end', // Pushes the date to the right of the actions container
            paddingTop: '5px', 
        },
    };

    // Format the date for display on the card
    const postedDate = formatDate(service.created_at, false); 

    return (
        <div 
            style={styles.card}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onView(service)} 
        >
            <div style={styles.imageContainer}>
                {service.featured_image_url ? (
                    <img src={service.featured_image_url} alt={service.title} style={styles.image} />
                ) : (
                    <div style={{ ...styles.image, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                        <HardHat size={50} style={styles.placeholderIcon} />
                    </div>
                )}
            </div>

            <div style={styles.cardContent}>
                <span style={styles.cardTag(tagColor)}>
                    <TagIcon size={12} /> {service.category}
                </span>
                <h3 style={styles.cardTitle}>{service.title}</h3>
                <p style={styles.summary}>{service.description}</p>
                <div style={styles.meta}>
                    <div style={styles.metaItem}>
                        <Clock size={12} style={{ verticalAlign: 'middle' }}/> 
                        Available: {service.availability}
                    </div>
                </div>
            </div>

            {/* Actions Area: Buttons Row then Posted Date Row */}
            <div style={styles.actions}>
                {/* 1. Action Row (Buttons) */}
                <div style={styles.actionRow}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(service); }}
                        style={styles.readMoreButton} 
                    >
                        <Eye size={16} /> Read More 
                    </button>
                    
                    <div style={styles.buttonGroup}> 
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                            style={styles.actionButton('#3B82F6', true)} 
                        >
                            <Edit size={16} /> 
                        </button>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(service.id, service.title); }}
                            style={styles.actionButton('#EF4444', true)} 
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* 2. Posted Date Row (Below Buttons, aligned right) */}
                <div style={styles.postedDateStyle}>
                    <Calendar size={12} style={{ verticalAlign: 'middle' }}/> 
                    Posted: {postedDate}
                </div>
            </div>
        </div>
    );
};
// --- END Service Card Component ---


// --- Main Admin Services Page Component ---
const AdminServicesPage = () => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false); // Add/Edit Modal
    const [editingService, setEditingService] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false); // View Details Modal
    const [selectedServiceForView, setSelectedServiceForView] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, serviceId: null, title: '' });
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });

    // Consistent Styles for the main page layout
    const styles = useMemo(() => ({
        container: { padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh' },
        header: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px', },
        subHeader: { fontSize: '18px', color: '#6B7280', marginBottom: '30px' },
        controls: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px', 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
        },
        addButton: { 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px 20px', 
            backgroundColor: '#6366F1', // Indigo color 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '600', 
            transition: 'background-color 0.2s', 
            fontSize: '16px' 
        },
        searchContainer: { width: '100%', maxWidth: '350px', position: 'relative' },
        searchInput: { 
            padding: '10px 10px 10px 40px', // Increased left padding for icon
            border: '1px solid #D1D5DB', 
            borderRadius: '8px', 
            width: '100%', 
            boxSizing: 'border-box', 
            fontSize: '16px' 
        },
        searchIcon: { 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#6B7280' 
        },
        cardGrid: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '30px' 
        },
        noResults: { 
            textAlign: 'center', 
            padding: '50px', 
            color: '#6B7280', 
            fontSize: '18px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            gridColumn: '1 / -1' // Span all columns
        }
    }), []);


    // --- Data Fetching ---
    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Updated API endpoint to 'admin/services'
            const response = await axios.get(`${API_BASE_URL}/admin/services`);

            // IMPLEMENT SORTING: Sort by created_at in descending order (latest first)
            const sortedServices = response.data.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                // Sort descending (b - a)
                return dateB - dateA; 
            });

            setServices(sortedServices);
        } catch (err) {
            console.error("Failed to fetch services:", err);
            setError('Failed to load service listings. Check server connection and API route (/admin/services).');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch services on component mount
    useEffect(() => {
        fetchServices();
    }, []);

    // --- Handlers for Modals ---
    const handleCloseAddEditModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleSaveComplete = (savedService) => {
        setServices(prev => {
            const index = prev.findIndex(n => n.id === savedService.id);
            const serviceWithCorrectDate = { 
                ...savedService, 
                // Ensure the date is present for display consistency if API didn't return it
                created_at: savedService.created_at || new Date().toISOString() 
            };
            
            let newServices;
            if (index > -1) {
                // Edit: Replace the old item
                newServices = prev.map((s, i) => i === index ? serviceWithCorrectDate : s);
            } else {
                // Add: Prepend the new item
                newServices = [serviceWithCorrectDate, ...prev];
            }

            // Re-sort the array to ensure the latest service is at the top
            return newServices.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return dateB - dateA;
            });
        });
        
        setMessageModal({
            show: true,
            title: 'Success!',
            body: `Service "${savedService.title}" successfully ${savedService.id ? 'updated' : 'added'}.`,
            isSuccess: true
        });
        handleCloseAddEditModal();
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedServiceForView(null);
    };

    // --- Actions ---
    const handleAddService = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleEditService = (serviceItem) => {
        setEditingService(serviceItem);
        setIsModalOpen(true);
    };

    const handleViewDetails = (serviceItem) => {
        setSelectedServiceForView(serviceItem);
        setIsViewModalOpen(true);
    };

    const handleDeleteService = (id, title) => {
        setDeleteModal({ show: true, serviceId: id, title: title });
    };

    const confirmDelete = async () => {
        const id = deleteModal.serviceId;
        const title = deleteModal.title;
        setDeleteModal({ show: false, serviceId: null, title: '' });

        try {
            // New Endpoint: DELETE /api/admin/services/:id
            await axios.delete(`${API_BASE_URL}/admin/services/${id}`);

            // Remove the item from the local state
            setServices(prev => prev.filter(item => item.id !== id));

            setMessageModal({
                show: true,
                title: 'Success!',
                body: `Service "${title}" has been successfully deleted.`,
                isSuccess: true
            });

        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'An unknown error occurred during deletion.';
            setMessageModal({
                show: true,
                title: 'Deletion Failed',
                body: `Could not delete service "${title}". Error: ${msg}`,
                isSuccess: false
            });
            console.error("Delete Service Error:", err);
        }
    };

    // --- Filtering Logic ---
    const filteredServices = useMemo(() => {
        if (!searchTerm) {
            return services;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return services.filter(service => 
            service.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            service.description.toLowerCase().includes(lowerCaseSearchTerm) ||
            service.category.toLowerCase().includes(lowerCaseSearchTerm) ||
            service.department.toLowerCase().includes(lowerCaseSearchTerm) ||
            service.contact_person.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [services, searchTerm]);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Admin Services Management</h1>

            <div style={styles.controls}>
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search services by title, category, contact, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                
                <button 
                    onClick={handleAddService} 
                    style={styles.addButton}
                >
                    <Plus size={20} style={{ marginRight: '5px' }} />
                    Add New Service
                </button>
            </div>

            {isLoading ? (
                <div style={styles.noResults}>Loading services...</div>
            ) : (
                <div style={styles.cardGrid}>
                    {error && 
                        <div style={{ color: '#DC2626', marginBottom: '20px', padding: '15px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px', gridColumn: '1 / -1' }}>
                            Error: {error}
                        </div>
                    }
                    
                    {filteredServices.length > 0 ? (
                        filteredServices.map((s) => (
                            <ServiceCard
                                key={s.id}
                                service={s}
                                onView={handleViewDetails}
                                onEdit={handleEditService}
                                onDelete={handleDeleteService}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={styles.noResults}>
                                No services found matching your search criteria.
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* ADD/EDIT MODAL (Form) */}
            <ServiceFormModal
                show={isModalOpen}
                initialData={editingService}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveComplete}
            />

            {/* VIEW MODAL (Dedicated Read-Only) */}
            <ServiceViewModal
                show={isViewModalOpen}
                serviceItem={selectedServiceForView}
                onClose={handleCloseViewModal}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                title={deleteModal.title}
                onConfirm={confirmDelete}
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

export default AdminServicesPage;