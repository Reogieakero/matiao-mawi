// frontend/src/admin/AdminServicesPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'; 
import axios from 'axios';
import { 
    Search, Trash2, CheckCircle, Plus, Edit, ChevronDown, ChevronUp, Save,
    HardHat, User, Users, XCircle, Clock, Image, FileText,
    Globe, Zap, Activity, Eye, Phone, Home, Calendar 
} from 'lucide-react'; 

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

// --- CUSTOM SELECT COMPONENT (Reusable Dropdown) ---
const CustomSelect = ({ label, name, value, options, onChange, required = false, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(options.findIndex(opt => opt === value) > -1 ? options.findIndex(opt => opt === value) : 0);
    const containerRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const formLabelStyle = { 
        fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '8px' 
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex + 1) % options.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex - 1 + options.length) % options.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const selectedValue = options[activeIndex];
                if (selectedValue) {
                    onChange({ target: { name, value: selectedValue } });
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                if (containerRef.current) {
                    containerRef.current.querySelector('button').focus();
                }
                break;
            default:
                break;
        }
    }, [isOpen, options, activeIndex, name, onChange]);

    useEffect(() => {
        const newIndex = options.findIndex(opt => opt === value);
        setActiveIndex(newIndex > -1 ? newIndex : 0);
    }, [options, value]);

    const handleSelect = (selectedValue) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        if (containerRef.current) {
            containerRef.current.querySelector('button').focus();
        }
    };

    const selectDisplayStyles = {
        ...baseInputStyle, 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        color: value && options.includes(value) ? '#1F2937' : '#9CA3AF',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        borderColor: isFocused || isOpen ? '#6366F1' : '#D1D5DB',
        boxShadow: isFocused || isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
    };
    
    const listContainerStyles = {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        marginTop: '4px',
        borderRadius: '8px', 
        boxShadow: '0 0 15px -3px rgba(0, 0, 0, 0.1)', 
        border: '1px solid #E5E7EB',
        maxHeight: '200px',
        overflowY: 'auto',
    };
    
    const listItemStyles = (index) => ({
        padding: '10px 15px',
        fontSize: '15px',
        color: '#1F2937',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        backgroundColor: index === activeIndex ? '#F3F4F6' : (options[index] === value ? '#EFF6FF' : 'white'),
        fontWeight: options[index] === value ? '700' : '400',
    });

    const handleListHover = (e, index) => {
        setActiveIndex(index);
        e.currentTarget.style.backgroundColor = '#F3F4F6';
    }

    const handleListLeave = (e, index) => {
        if (index !== activeIndex) {
            e.currentTarget.style.backgroundColor = options[index] === value ? '#EFF6FF' : 'white';
        }
    }


    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'relative', 
                ...style 
            }}
            onKeyDown={handleKeyDown}
        >
            <p style={formLabelStyle}>{label} {required ? '*' : ''}</p>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = isFocused || isOpen ? '#6366F1' : '#D1D5DB'}
                style={selectDisplayStyles}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Current ${label}: ${value || `Select ${label}...`}`}
            >
                {value || `Select ${label}...`}
                {isOpen ? <ChevronUp size={18} color="#6B7280" /> : <ChevronDown size={18} color="#6B7280" />}
            </button>

            {isOpen && (
                <div style={listContainerStyles} role="listbox">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {options.map((option, index) => (
                            <li
                                key={option}
                                role="option"
                                aria-selected={option === value}
                                style={listItemStyles(index)}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={(e) => handleListHover(e, index)}
                                onMouseLeave={(e) => handleListLeave(e, index)}
                                ref={(el) => {
                                    if (index === activeIndex && el && isOpen) {
                                        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                                    }
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
// --- END: CUSTOM SELECT COMPONENT ---


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
                
                    <button onClick={onCancel} style={baseModalStyles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={baseModalStyles.confirmButton}>
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;
    
    const icon = isSuccess ? <CheckCircle size={40} color="#1e40af" /> : <XCircle size={40} color="#DC2626" />;
    const modalTitleStyle = {
        ...baseModalStyles.title,
        color: isSuccess ? '#1e40af' : '#DC2626'
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
                        backgroundColor: isSuccess ? '#1e40af' : '#F59E0B' 
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
    const styles = useMemo(() => ({
        mainTitle: { ...baseViewModalStyles.header, color: '#1F2937' },
        sectionTitle: { fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: '20px 0 10px 0' },
        description: { fontSize: '16px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
        requirementsContainer: { 
            marginTop: '15px', border: '1px solid #E5E7EB', borderRadius: '10px', 
            padding: '20px', backgroundColor: 'white', gridColumn: '1 / -1' // Span all columns
        },
        requirementTag: { 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '10px 15px', backgroundColor: '#F0F9FF', 
            borderRadius: '8px', color: '#0B5394', fontWeight: '600', 
            transition: 'background-color 0.2s', border: '1px solid #BFDBFE' 
        },
        contactInfo: { 
            fontSize: '16px', color: '#374151', fontWeight: '500', 
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' 
        },
        closeButton: { 
            ...baseViewModalStyles.closeButton, 
            backgroundColor: '#1e40af', // Primary Blue 
            '&:hover': { backgroundColor: '#1d4ed8' }
        },
    }), []);
    
    if (!show || !serviceItem) return null;

    const tagColor = getCategoryColor(serviceItem.category);
    const TagIcon = tagColor.icon;
    
    let requirements = [];
    try {
        if (serviceItem.requirements_list) {
            // Handle both stringified JSON and direct array if passed from form
            requirements = Array.isArray(serviceItem.requirements_list) 
                ? serviceItem.requirements_list
                : JSON.parse(serviceItem.requirements_list);
        }
    } catch (e) {
        console.error("Error parsing requirements list in view modal:", e);
    }


    return (
        <div style={baseViewModalStyles.backdrop}>
            <div style={baseViewModalStyles.modal}>
                {/* Close Button at the top right corner */}
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: 'absolute', top: '20px', right: '20px', 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        color: '#6B7280' 
                    }}
                >
                    <XCircle size={24} />
                </button>

                <h2 style={styles.mainTitle}>
                    <TagIcon size={30} color={tagColor.text} style={{ backgroundColor: tagColor.bg, padding: '5px', borderRadius: '50%' }} />
                    {serviceItem.title}
                </h2>

                <div style={baseViewModalStyles.contentGrid}>
                    {/* Main Content (Description) */}
                    <div>
                        <h3 style={styles.sectionTitle}>Service Overview</h3>
                        <p style={styles.description}>{serviceItem.description}</p>
                        
                        <h3 style={styles.sectionTitle}>Key Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                            <div style={baseViewModalStyles.detailBox}>
                                <div style={baseViewModalStyles.detailLabel}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Availability</div>
                                <div style={baseViewModalStyles.detailValue}>{serviceItem.availability}</div>
                            </div>
                            <div style={baseViewModalStyles.detailBox}>
                                <div style={baseViewModalStyles.detailLabel}><Users size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Department</div>
                                <div style={baseViewModalStyles.detailValue}>{serviceItem.department}</div>
                            </div>
                        </div>

                        {/* Requirements List (Full Width Section) */}
                        {requirements.length > 0 && (
                            <div style={{...styles.requirementsContainer, marginTop: '20px'}}>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0B5394', marginBottom: '15px', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>
                                    Required Documents/Conditions
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {requirements.map((req, index) => (
                                        <div key={index} style={styles.requirementTag}>
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
                    
                    {/* Side Details (Contact, Image) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {serviceItem.featured_image_url && (
                            <div style={{...baseViewModalStyles.detailBox, padding: '0', overflow: 'hidden'}}>
                                <img 
                                    src={serviceItem.featured_image_url} 
                                    alt="Featured" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>
                        )}
                        
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Person</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_person || 'N/A'}</div>
                            
                            <div style={{...baseViewModalStyles.detailLabel, marginTop: '15px'}}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Number</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_number || 'N/A'}</div>
                            
                            <div style={{...baseViewModalStyles.detailLabel, marginTop: '15px'}}><Globe size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Reference URL</div>
                            <div style={baseViewModalStyles.detailValue}>
                                {serviceItem.reference_url ? (
                                    <a href={serviceItem.reference_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>
                                        View Link
                                    </a>
                                ) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid #F3F4F6', paddingTop: '20px' }}>
                    <button onClick={onClose} style={styles.closeButton}>
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Service Form Modal (Add/Edit) ---

// --- NEW REGEX CONSTANTS FOR CONTACT NUMBER VALIDATION ---
// Allows empty string ($) OR a string of 7-20 chars with digits, spaces, +, -, ()
const PHONE_REGEX = /^(?:$|^[0-9\s\+\-()]{7,20}$)/; 
const PHONE_ERROR_MSG = 'Invalid phone number format. Must be 7-20 characters long and contain only digits, spaces, plus signs (+), or hyphens (-).';
// --------------------------------------------------------

const ServiceFormModal = ({ show, initialData, onClose, onSave }) => {
    const defaultData = useMemo(() => ({
        title: '',
        description: '',
        category: SERVICE_CATEGORIES[0],
        availability: AVAILABILITY_OPTIONS[0],
        department: DEPARTMENT_OPTIONS[0],
        contact_person: '',
        contact_number: '',
        reference_url: '',
        requirements_list: [], // Array of strings
        featured_image_url: null, // Existing URL if editing
    }), []);
    
    const [formData, setFormData] = useState(defaultData);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [requirementInput, setRequirementInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contactNumberError, setContactNumberError] = useState(null); // <-- STATE FOR VALIDATION
    const fileInputRef = useRef(null);

    const styles = useMemo(() => ({
        backdrop: baseViewModalStyles.backdrop,
        modal: { 
            ...baseViewModalStyles.modal, 
            maxWidth: '800px', 
            padding: '30px', 
            borderRadius: '12px' 
        },
        header: { 
            ...baseViewModalStyles.header, 
            fontSize: '24px', 
            justifyContent: 'flex-start' 
        },
        formGrid: { 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px' 
        },
        formGroup: { 
            display: 'flex', 
            flexDirection: 'column', 
            marginBottom: '15px' 
        },
        label: { 
            fontSize: '15px', 
            fontWeight: '700', 
            color: '#374151', 
            marginBottom: '8px' 
        },
        input: baseInputStyle,
        textarea: { 
            ...baseInputStyle, 
            minHeight: '100px', 
            resize: 'vertical' 
        },
        button: { 
            padding: '10px 15px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '600', 
            transition: 'background-color 0.2s', 
            border: 'none', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '5px' 
        },
        picUploadContainer: {
            gridColumn: '1 / -1', // Span full width for image/file section
            border: '1px dashed #D1D5DB',
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: '#F9FAFB',
            marginBottom: '20px'
        },
        imagePreview: { maxWidth: '200px', margin: '10px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
        fileSection: { gridColumn: '1 / -1', marginBottom: '15px' },
        addReqInputGroup: { display: 'flex', gap: '10px' },
        reqTag: { 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '5px', 
            padding: '5px 10px', 
            borderRadius: '9999px', 
            backgroundColor: '#DBEAFE', 
            color: '#1E40AF', 
            fontWeight: '600' 
        },
        errorAlert: {
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: '10px',
            borderRadius: '8px',
            fontWeight: '500'
        },
        validationError: { // <-- STYLE FOR CONTACT NUMBER VALIDATION
            fontSize: '12px',
            color: '#DC2626',
            marginTop: '5px',
            marginBottom: '0', 
            fontWeight: '500',
        }
    }), []);

    // --- Validation Function ---
    const validateContactNumber = (number) => {
        const cleanedNumber = (number || '').trim(); 
        
        // If the field is optional and empty, it's valid (returns null/no error)
        if (cleanedNumber === '') return null; 

        if (!PHONE_REGEX.test(cleanedNumber)) {
            return PHONE_ERROR_MSG;
        }
        return null;
    };
    // ---------------------------

    useEffect(() => {
        if (show) {
            if (initialData) {
                const initialRequirements = initialData.requirements_list ? 
                    (typeof initialData.requirements_list === 'string' ? JSON.parse(initialData.requirements_list) : initialData.requirements_list) 
                    : [];
                    
                setFormData({
                    title: initialData.title || '',
                    description: initialData.description || '',
                    category: initialData.category || SERVICE_CATEGORIES[0],
                    availability: initialData.availability || AVAILABILITY_OPTIONS[0],
                    department: initialData.department || DEPARTMENT_OPTIONS[0],
                    contact_person: initialData.contact_person || '',
                    contact_number: initialData.contact_number || '',
                    reference_url: initialData.reference_url || '',
                    requirements_list: initialRequirements,
                    featured_image_url: initialData.featured_image_url || null,
                });
                setPreviewUrl(initialData.featured_image_url);
                setContactNumberError(validateContactNumber(initialData.contact_number)); // Validate initial data
            } else {
                setFormData(defaultData);
                setPreviewUrl(null);
                setContactNumberError(null); // Clear error on reset
            }
            setImageFile(null);
            setRequirementInput('');
            setError(null);
        }
    }, [show, initialData, defaultData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time validation for contact_number
        if (name === 'contact_number') {
            const error = validateContactNumber(value);
            setContactNumberError(error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            if (!initialData || !initialData.featured_image_url) {
                setPreviewUrl(null);
            }
        }
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        setFormData(prev => ({ ...prev, featured_image_url: null })); // Important for existing data
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddRequirement = () => {
        if (requirementInput.trim() !== '') {
            setFormData(prev => ({
                ...prev,
                requirements_list: [...prev.requirements_list, requirementInput.trim()],
            }));
            setRequirementInput('');
        }
    };

    const handleRemoveRequirement = (index) => {
        setFormData(prev => ({
            ...prev,
            requirements_list: prev.requirements_list.filter((_, i) => i !== index),
        }));
    };

    const uploadFile = async (file) => {
        const uploadFormData = new FormData();
        // NOTE: Check your server to confirm the field name, commonly 'featuredImage' or 'media'
        uploadFormData.append('featuredImage', file); 

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/services/upload-image`, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.featuredImageUrl;
        } catch (err) {
            console.error("Image upload failed:", err);
            setError('Failed to upload image. Please check file size and format.');
            throw new Error('Upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        // Final validation check for contact number
        const finalContactError = validateContactNumber(formData.contact_number);
        setContactNumberError(finalContactError);

        if (finalContactError) {
            setError("Please fix the validation errors before submitting.");
            // Scroll to the error if possible
            const contactInput = e.target.elements.contact_number;
            if (contactInput) {
                 contactInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 contactInput.focus();
            }
            return;
        }

        setLoading(true);

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
                onSave({ 
                    ...serviceData, 
                    id: initialData.id, 
                    created_at: initialData.created_at, 
                    description: formData.description,
                    // Pass parsed requirements back for local state consistency
                    requirements_list: formData.requirements_list 
                });
            } else {
                // Add
                const response = await axios.post(`${API_BASE_URL}/admin/services`, serviceData);
                // Assume API returns the new object with an ID and creation timestamp
                onSave(response.data);
            }
            onClose();

        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'An unknown error occurred while saving the service.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div style={styles.backdrop}>
            <div style={styles.modal}>
                <h3 style={styles.header}>
                    
                    {initialData ? 'Edit Service' : 'Add New Service'}
                </h3>
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: 'absolute', top: '20px', right: '20px', 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        color: '#6B7280' 
                    }}
                >
                    <XCircle size={24} />
                </button>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ Error: {error}</p></div>}
                    
                    <div style={styles.formGrid}>
                        {/* 1. Title */}
                        <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} style={styles.input} placeholder="e.g., Business Permit Application" required />
                        </div>

                        {/* 2. Category (Dropdown) */}
                        <div style={styles.formGroup}>
                            <CustomSelect 
                                label="Category" 
                                name="category" 
                                value={formData.category} 
                                options={SERVICE_CATEGORIES} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* 3. Availability (Dropdown) */}
                        <div style={styles.formGroup}>
                            <CustomSelect 
                                label="Availability" 
                                name="availability" 
                                value={formData.availability} 
                                options={AVAILABILITY_OPTIONS} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* 4. Department (Dropdown) */}
                        <div style={styles.formGroup}>
                            <CustomSelect 
                                label="Department" 
                                name="department" 
                                value={formData.department} 
                                options={DEPARTMENT_OPTIONS} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* 5. Contact Person */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Contact Person</label>
                            <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} style={styles.input} placeholder="e.g., Jane Doe - Secretary" />
                        </div>
                        
                        {/* 6. Contact Number - VALIDATION IMPLEMENTED HERE */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Contact Number (Optional)</label>
                            <input 
                                type="text" 
                                name="contact_number" 
                                value={formData.contact_number} 
                                onChange={handleChange} 
                                // Dynamic style change for validation feedback
                                style={{
                                    ...styles.input, 
                                    borderColor: contactNumberError ? '#DC2626' : baseInputStyle.borderColor
                                }} 
                                placeholder="e.g., 09xxxxxxxxx or (02) 8xxx-xxxx" 
                                // Note: 'required' attribute is intentionally omitted here as requested
                            />
                            {/* Display validation error message */}
                            {contactNumberError && <p style={styles.validationError}>{contactNumberError}</p>}
                        </div>
                        
                        {/* 7. Reference URL */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Reference URL</label>
                            <input type="url" name="reference_url" value={formData.reference_url} onChange={handleChange} style={styles.input} placeholder="e.g., https://barangay.gov/service-form" />
                        </div>
                    </div>

                    {/* Description (Full Width) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} style={styles.textarea} required />
                    </div>

                    {/* Requirements List (Full Width) */}
                    <div style={styles.fileSection}>
                        <label style={styles.label}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Requirements List (Optional)</label>
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
                                    backgroundColor: '#1e40af', // Blue
                                    padding: '10px 15px',
                                }}
                            >
                                <Plus size={18} /> Add
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {formData.requirements_list.map((req, index) => (
                                <span key={index} style={styles.reqTag}>
                                    {req}
                                    <XCircle 
                                        size={14} 
                                        style={{ marginLeft: '5px', cursor: 'pointer' }}
                                        onClick={() => handleRemoveRequirement(index)}
                                    />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload (Full Width) */}
                    <div style={styles.picUploadContainer}>
                        <label style={{...styles.label, width: '100%', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px'}}><Image size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Featured Image (Optional)</label>
                        <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px', width: '100%'}}>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                style={{ display: 'none' }} 
                                id="service-image-upload" 
                                ref={fileInputRef}
                            />
                            <button 
                                type="button" 
                                onClick={() => document.getElementById('service-image-upload').click()} 
                                style={{...styles.button, backgroundColor: '#4B5563'}}
                                disabled={loading}
                            >
                                <Image size={18}/> Choose Image
                            </button>

                            {(previewUrl || formData.featured_image_url) && (
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                    <img src={previewUrl || formData.featured_image_url} alt="Preview" style={styles.imagePreview} />
                                    <button 
                                        type="button" 
                                        onClick={handleRemoveImage} 
                                        style={{...styles.button, backgroundColor: '#EF4444', height: 'fit-content'}}
                                        disabled={loading}
                                    >
                                        <Trash2 size={18}/> Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '10px' }}>
                            {previewUrl ? 'New image selected.' : (formData.featured_image_url ? 'Existing image present.' : 'No image uploaded.')}
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{...styles.button, backgroundColor: '#6B7280'}} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={{...styles.button, backgroundColor: '#1e40af'}} disabled={loading}>
                            {loading ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? <><Save size={18}/> Save Changes</> : <><Plus size={18}/> Add Service</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const AdminServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    
    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedServiceForView, setSelectedServiceForView] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, title: '' });
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });

    // --- Styles Memoization ---
    const styles = useMemo(() => ({
        container: { padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' },
        pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px',  },
        subtitle: { fontSize: '16px', color: '#6B7280', marginBottom: '20px' },
        toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
        searchBox: { 
            display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', 
            borderRadius: '8px', padding: '5px', width: '350px', backgroundColor: 'white' 
        },
        searchInput: { 
            border: 'none', outline: 'none', padding: '10px 15px', fontSize: '16px', 
            flexGrow: 1, backgroundColor: 'transparent' 
        },
        addButton: { 
            padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
            fontSize: '16px', transition: 'background-color 0.2s', display: 'flex', 
            alignItems: 'center' 
        },
        errorAlert: {
            backgroundColor: '#FEE2E2', color: '#DC2626', padding: '15px', 
            borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px'
        },
        loadingBox: { textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6B7280' },
        
        // --- Card Grid Layout Styles ---
        cardGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Responsive card grid
            gap: '25px',
        },
        serviceCard: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            cursor: 'default',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)' }
        },
        cardImageContainer: {
            width: '100%',
            height: '180px',
            overflow: 'hidden',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        cardContent: {
            padding: '15px 20px',
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
        detailsContainer: {
            borderTop: '1px solid #E5E7EB',
            paddingTop: '10px',
            marginTop: 'auto', // Push details to the bottom
            fontSize: '13px',
            color: '#4B5563',
        },
        detailItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '5px',
            fontWeight: '500',
        },
        actions: {
            borderTop: '1px solid #F3F4F6',
            padding: '10px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: '#FAFAFA'
        },
        actionRow: {
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
        },
        readMoreButton: {
            padding: '8px 15px',
            backgroundColor: '#E0F2FE', // Light Blue
            color: '#0B5394',
            border: '1px solid #BFDBFE',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            '&:hover': { backgroundColor: '#B9E6FE' }
        },
        buttonGroup: {
            display: 'flex',
            gap: '10px',
        },
        actionButton: (color, isIconOnly = false) => ({
            padding: isIconOnly ? '8px' : '8px 15px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'transform 0.2s, background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { transform: 'scale(1.05)', backgroundColor: color === '#EF4444' ? '#B91C1C' : '#1D4ED8' }
        }),
        postedDate: {
            fontSize: '12px',
            color: '#9CA3AF',
            textAlign: 'right',
            marginTop: '5px',
            borderTop: '1px dashed #E5E7EB',
            paddingTop: '5px',
        },
        noResults: { textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '16px', gridColumn: '1 / -1' } // Span all columns
    }), []);

    // --- Data Fetching ---
    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
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

    useEffect(() => {
        fetchServices();
    }, []);

    // --- CRUD Handlers ---
    const handleAddClick = () => {
        setEditingService(null); // Clear previous data for 'Add' mode
        setIsModalOpen(true);
    };

    const handleEditClick = (service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleViewClick = (service) => {
        setSelectedServiceForView(service);
        setIsViewModalOpen(true);
    };
    
    const handleDeleteClick = (id, title) => {
        setDeleteModal({ show: true, id, title });
    };

    const confirmDelete = async () => {
        const { id, title } = deleteModal;
        setDeleteModal({ ...deleteModal, show: false });
        
        try {
            await axios.delete(`${API_BASE_URL}/admin/services/${id}`);
            // Remove the deleted item from the local state
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
        }
    };
    
    const handleCloseAddEditModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedServiceForView(null);
    };

    const handleSaveComplete = (savedService) => {
        // Find existing index
        const index = services.findIndex(s => s.id === savedService.id);

        if (index > -1) {
            // Update existing service
            setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
            setMessageModal({
                show: true,
                title: 'Success!',
                body: `Service has been updated.`,
                isSuccess: true
            });
        } else {
            // Add new service
            setServices(prev => [savedService, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setMessageModal({
                show: true,
                title: 'Success!',
                body: `New service has been added.`,
                isSuccess: true
            });
        }
    };

    // --- Filtering and Sorting ---
    const sortedAndFilteredServices = useMemo(() => {
        let currentServices = services.filter(service => {
            const searchLower = searchTerm.toLowerCase();
            
            // Use || '' to safely access properties and call .toLowerCase()
            return (
                (service.title || '').toLowerCase().includes(searchLower) ||
                (service.description || '').toLowerCase().includes(searchLower) ||
                (service.category || '').toLowerCase().includes(searchLower) ||
                (service.department || '').toLowerCase().includes(searchLower) ||
                (service.contact_person || '').toLowerCase().includes(searchLower)
            );
        });

        // Apply sorting (already sorted by creation date descending on fetch, but handle future sort changes)
        if (sortBy) {
            currentServices.sort((a, b) => {
                const aVal = a[sortBy] ?? '';
                const bVal = b[sortBy] ?? '';

                if (sortBy === 'created_at') {
                    const dateA = new Date(aVal);
                    const dateB = new Date(bVal);
                    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                } else if (typeof aVal === 'string') {
                    const comparison = aVal.localeCompare(bVal);
                    return sortDirection === 'asc' ? comparison : -comparison;
                }
                return 0;
            });
        }

        return currentServices;
    }, [services, searchTerm, sortBy, sortDirection]);

    // --- Card Component (Replacing Table Rows) ---
    const ServiceCard = ({ service, onView, onEdit, onDelete }) => {
        const tagColor = getCategoryColor(service.category);
        const TagIcon = tagColor.icon;
        
        // Prepare summary (first 3 lines of description)
        const summaryText = service.description || 'No description provided.';

        return (
            <div style={styles.serviceCard}>
                {/* Image Section */}
                <div style={styles.cardImageContainer}>
                    {service.featured_image_url ? (
                        <img 
                            src={service.featured_image_url} 
                            alt={service.title} 
                            style={styles.cardImage}
                        />
                    ) : (
                        <Home size={48} color="#9CA3AF" />
                    )}
                </div>

                {/* Content Section */}
                <div style={styles.cardContent}>
                    <span style={styles.cardTag(tagColor)}>
                        <TagIcon size={12}/> {service.category}
                    </span>
                    <h3 style={styles.cardTitle}>{service.title}</h3>
                    <p style={styles.summary}>{summaryText}</p>
                    
                    {/* Details Footer */}
                    <div style={styles.detailsContainer}>
                        <div style={styles.detailItem}><Users size={14}/> {service.department}</div>
                        <div style={styles.detailItem}><Clock size={14}/> Available: {service.availability}</div>
                    </div>
                </div>

                {/* Actions Area */}
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
                                title="Edit Service"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(service.id, service.title); }} 
                                style={styles.actionButton('#EF4444', true)}
                                title="Delete Service"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    {/* 2. Posted Date */}
                    <p style={styles.postedDate}>
                        <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }}/>
                        Created: {formatDate(service.created_at, false)}
                    </p>
                </div>
            </div>
        );
    };

    // --- Render Component ---
    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Barangay Services Management</h1>
            

            <div style={styles.toolbar}>
                <div style={styles.searchBox}>
                    <Search size={20} color="#6B7280" style={{ marginLeft: '10px' }}/>
                    <input 
                        type="text" 
                        placeholder="Search by title, category, department..." 
                        style={styles.searchInput} 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <button 
                    onClick={handleAddClick} 
                    style={styles.addButton}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                >
                    <Plus size={20} style={{ marginRight: '5px' }} /> Add New Service
                </button>
            </div>

            {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ API Error: {error}</p></div>}
            
            {isLoading ? (
                <div style={styles.loadingBox}>Loading services...</div>
            ) : (
                <div style={styles.cardGrid}>
                    {sortedAndFilteredServices.length > 0 ? (
                        sortedAndFilteredServices.map(service => (
                            <ServiceCard 
                                key={service.id} 
                                service={service} 
                                onView={handleViewClick}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    ) : (
                        <div style={styles.noResults}>
                            No services found matching your search criteria.
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