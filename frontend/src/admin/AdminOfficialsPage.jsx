// frontend/src/admin/AdminOfficialsPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Trash2, CheckCircle, Plus, UserPlus, Image, UserX, Edit, XCircle
} from 'lucide-react';

// --- Constants (COPIED FROM AdminJobPage.jsx for consistency) ---
const PRIMARY_BLUE_DARK = '#2563eb';
const PRIMARY_BLUE = '#1e40af';
const PRIMARY_BLUE_LIGHT_HOVER = '#1d4ed8'; // Used for hover on main blue buttons
const RED_DARK_HOVER = '#B91C1C';
const RED_LIGHT = '#DC2626';
const TEXT_MUTED = '#64748b'; 

const OFFICIAL_CATEGORIES = [
    'Barangay Official', 'SK Official', 'Staff', 'Tanod', 'Other'
];
const OFFICIAL_STATUSES = [
    'Working', 'On Site', 'On Leave', 'AWOL'
];

const BARANGAY_POSITIONS = [
    'Barangay Captain', 'Kagawad', 'Secretary', 'Treasurer'
];

const SK_POSITIONS = [
    'SK Chairperson', 'SK Kagawad'
];

const OTHER_POSITIONS = [
    'Staff', 'Tanod', 'Other'
];

const COMMITTEES = [
    'None', 
    'Appropriation', 'Peace and Order', 'Education', 'Health and Sanitation', 
    'Agriculture', 'Youth and Sports Development', 'Women and Family', 
    'Infrastructure', 'Environmental Protection'
];

// --- REGEX FOR PHILIPPINE MOBILE NUMBERS ---
// Allows 09xxxxxxxxx, +639xxxxxxxxx, or 639xxxxxxxxx. It validates 11 digits after the prefix.
const PHILIPPINE_MOBILE_REGEX = /^(09|\+639|639)\d{9}$/;

// Helper to get positions based on category
const getPositionsForCategory = (category) => {
    switch (category) {
        case 'Barangay Official':
            return BARANGAY_POSITIONS;
        case 'SK Official':
            return SK_POSITIONS;
        default:
            // Check if the category is one of the explicit position categories
            const explicitPosition = OTHER_POSITIONS.includes(category) ? category : null;
            // If it matches 'Staff', 'Tanod', or 'Other', return just that as the position list
            return explicitPosition ? [explicitPosition] : OTHER_POSITIONS;
    }
};

// --- VALIDATION HELPER FUNCTION ---
const isValidPhilippineNumber = (number) => {
    if (!number) return true; 
    const cleanedNumber = number.replace(/[\s\-\(\)]/g, ''); 
    return PHILIPPINE_MOBILE_REGEX.test(cleanedNumber);
};

// --- UTILITY FUNCTIONS ---
// Helper function for hover effects on confirmation/message buttons
const handleModalButtonHover = (e, isSuccess) => {
    if (isSuccess) {
        e.currentTarget.style.backgroundColor = PRIMARY_BLUE_DARK;
    } else {
        e.currentTarget.style.backgroundColor = RED_DARK_HOVER; // Darker red for hover
    }
};

// --- Helper Components ---

const DeleteConfirmationModal = ({ show, official, onConfirm, onCancel }) => {
    if (!show || !official) return null;
    const fullName = `${official.first_name} ${official.last_name}`;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.header}>Confirm Deletion</h3>
                <p style={modalStyles.body}>
                    Are you sure you want to permanently delete the official: 
                    <strong style={{ display: 'block', marginTop: '5px' }}>{fullName} ID: {official.id} ?</strong>
                </p>
                <p style={modalStyles.warning}>
                    This action is irreversible. The official's record will be removed.
                </p>
                <div style={modalStyles.footer}>
                    <button 
                        onClick={onCancel} 
                        style={modalStyles.cancelButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={modalStyles.deleteButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = RED_DARK_HOVER}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = RED_LIGHT}
                    >
                        Yes, Delete Official
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MessageModal Component (Now with hover handlers) ---
const MessageModal = React.memo(({ message, isSuccess, closeMessageModal }) => {
    if (!message) return null;

    const baseButtonStyle = isSuccess ? messageModalStyles.successButton : messageModalStyles.errorButton;

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
                    style={baseButtonStyle}
                    onMouseEnter={(e) => handleModalButtonHover(e, isSuccess)}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSuccess ? PRIMARY_BLUE : '#EF4444'}
                > 
                    OK 
                </button>
            </div>
        </div>
    );
});
// --- END: MessageModal Component ---


// --- CustomSelect Component (Fixed Hover/Focus styles) ---
const CustomSelect = ({ label, name, value, options, onChange, required = false, isConditional = false, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(options.findIndex(opt => opt === value));
    const containerRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    // Close on click outside
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

    // Handle Keyboard Navigation
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

    // Update activeIndex when options or value changes externally
    useEffect(() => {
        setActiveIndex(options.findIndex(opt => opt === value));
    }, [options, value]);

    const handleSelect = (selectedValue) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        if (containerRef.current) {
            containerRef.current.querySelector('button').focus();
        }
    };

    const selectDisplayStyles = {
        ...addModalStyles.input,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        color: value && options.includes(value) ? '#1F2937' : '#9CA3AF',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        marginBottom: '15px', 
        ...(isConditional ? { marginBottom: '0' } : {}), 
        // Dynamic focus styles
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
        boxShadow: '0 0 15px -3px rgba(0, 0, 0, 0.1)', // Adjusted shadow
        border: '1px solid #E5E7EB',
        maxHeight: '200px',
        overflowY: 'auto',
    };
    
    // Dynamic List Item Styles - hover handled via onMouseEnter/Leave
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
                marginBottom: isConditional ? '15px' : '0', 
                ...style
            }}
            onKeyDown={handleKeyDown}
        >
            <p style={addModalStyles.label}>{label} {required ? '*' : ''}</p>
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
                aria-label={`Current ${label}: ${value}`}
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
                                        // Scroll into view logic remains, as it's for keyboard nav
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
// --- END: CustomSelect Component ---


const AddOfficialModal = ({ show, onHide, onOfficialAdded }) => {
    const [formData, setFormData] = useState({
        firstName: '', middleInitial: '', lastName: '', contactNumber: '',
        category: OFFICIAL_CATEGORIES[0], status: OFFICIAL_STATUSES[0],
        position: getPositionsForCategory(OFFICIAL_CATEGORIES[0])[0], 
        committee: COMMITTEES[0],
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [contactNumError, setContactNumError] = useState(null); 
    const fileInputRef = useRef(null); // Ref for picture upload div

    useEffect(() => {
        if (!show) {
            setFormData({
                firstName: '', middleInitial: '', lastName: '', contactNumber: '',
                category: OFFICIAL_CATEGORIES[0], status: OFFICIAL_STATUSES[0],
                position: getPositionsForCategory(OFFICIAL_CATEGORIES[0])[0], 
                committee: COMMITTEES[0],
            });
            setFile(null); setPreviewUrl(null);
            setError(null); 
            setContactNumError(null);
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear file input
            }
        }
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'contactNumber') {
            setContactNumError(null); 
        }

        if (name === 'category') {
            const newPositions = getPositionsForCategory(value);
            setFormData({ 
                ...formData, 
                [name]: value,
                position: newPositions[0], 
                committee: COMMITTEES[0], 
            });
        } else if (name === 'position' && (formData.category === 'Staff' || formData.category === 'Tanod' || formData.category === 'Other')) {
             setFormData({ 
                ...formData, 
                [name]: value,
                category: value 
            });
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handlePictureUpload = async (fileToUpload) => {
        const uploadFormData = new FormData();
        uploadFormData.append('official_picture', fileToUpload); 

        try {
            const response = await axios.post('http://localhost:5000/api/admin/officials/upload-picture', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.profilePictureUrl;
        } catch (err) {
            console.error("Profile picture upload failed:", err);
            setError('Failed to upload profile picture.');
            throw new Error('Upload failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setContactNumError(null);
        setLoading(true);
        
        if (formData.contactNumber && !isValidPhilippineNumber(formData.contactNumber)) {
            setContactNumError('Invalid number. Use 09xxxxxxxxx, +639xxxxxxxxx, or 639xxxxxxxxx format.');
            setLoading(false);
            return;
        }

        try {
            let finalPictureUrl = null;
            if (file) {
                finalPictureUrl = await handlePictureUpload(file);
            }

            const payload = {
                ...formData,
                profilePictureUrl: finalPictureUrl,
                position: formData.position, 
                committee: formData.committee,
            };

            const response = await axios.post('http://localhost:5000/api/admin/officials', payload);
            
            onOfficialAdded(response.data.official);
            onHide();

        } catch (err) {
            console.error("Add official failed:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'An unknown error occurred while adding the official.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const currentPositions = getPositionsForCategory(formData.category);

    return (
        <div style={modalStyles.backdrop}>
            <div style={{...modalStyles.modal, width: '90%', maxWidth: '600px'}}>
                <h3 style={modalStyles.header}>
                    <UserPlus size={24} style={{ marginRight: '10px', color: '#6366F1' }} />
                    Add New Barangay Official
                </h3>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ API Error: {error}</p></div>}
                    
                    <div style={addModalStyles.grid}>
                        <div style={addModalStyles.picUploadContainer}>
                            <p style={addModalStyles.label}>Profile Picture (Optional)</p>
                            <div 
                                style={addModalStyles.picPreview} 
                                onClick={() => document.getElementById('add-official-pic-upload').click()}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={addModalStyles.picImage} />
                                ) : (
                                    <div style={addModalStyles.picPlaceholder}>
                                        <Image size={40} color="#9CA3AF" />
                                        <p style={{ margin: '10px 0 0 0', color: '#9CA3AF', fontSize: '12px' }}>Click to Upload</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    id="add-official-pic-upload"
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    style={{ display: 'none' }} 
                                    ref={fileInputRef}
                                />
                            </div>
                            <p style={addModalStyles.hint}>Max 2MB. Only image files.</p>
                        </div>
                        
                        <div style={addModalStyles.detailsContainer}>
                            <p style={addModalStyles.label}>Full Name *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr', gap: '10px', marginBottom: '15px' }}>
                                {/* Inputs with dynamic focus handling */}
                                <input 
                                    type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} 
                                    style={addModalStyles.input} required 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <input 
                                    type="text" name="middleInitial" placeholder="M.I." value={formData.middleInitial} onChange={handleInputChange} 
                                    style={addModalStyles.input} maxLength="1" 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <input 
                                    type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} 
                                    style={addModalStyles.input} required 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <p style={addModalStyles.label}>Contact Number (Optional)</p>
                            <input 
                                type="tel" 
                                name="contactNumber" 
                                placeholder="e.g., 09171234567 or +639171234567" 
                                value={formData.contactNumber} 
                                onChange={handleInputChange} 
                                style={{...addModalStyles.input, marginBottom: contactNumError ? '5px' : '15px'}} 
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                            {contactNumError && <p style={addModalStyles.validationError}>{contactNumError}</p>}

                            <CustomSelect 
                                label="Category" 
                                name="category" 
                                value={formData.category} 
                                options={OFFICIAL_CATEGORIES} 
                                onChange={handleInputChange} 
                                required
                            />

                            <CustomSelect 
                                label="Position" 
                                name="position" 
                                value={formData.position} 
                                options={currentPositions} 
                                onChange={handleInputChange} 
                                required
                            />

                            {(formData.category === 'Barangay Official' || formData.category === 'SK Official') && (
                                <CustomSelect 
                                    label="Committee (Mandatory for Kagawads)" 
                                    name="committee" 
                                    value={formData.committee} 
                                    options={COMMITTEES} 
                                    onChange={handleInputChange}
                                    isConditional={true} 
                                />
                            )}

                            <CustomSelect 
                                label="Status" 
                                name="status" 
                                value={formData.status} 
                                options={OFFICIAL_STATUSES} 
                                onChange={handleInputChange} 
                                required
                            />
                        </div>
                    </div>

                    <div style={{...modalStyles.footer, marginTop: '20px'}}>
                        <button 
                            type="button" 
                            onClick={onHide} 
                            style={modalStyles.cancelButton} 
                            disabled={loading}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            style={addModalStyles.addButton} 
                            disabled={loading}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE_LIGHT_HOVER}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE}
                        >
                            {loading ? 'Adding...' : 'Add Official'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditOfficialModal = ({ show, onHide, official, onOfficialUpdated }) => {
    const initialOfficial = official || {};

    const [formData, setFormData] = useState({
        firstName: initialOfficial.first_name || '',
        middleInitial: initialOfficial.middle_initial || '',
        lastName: initialOfficial.last_name || '',
        contactNumber: initialOfficial.contact_number || '',
        category: initialOfficial.category || OFFICIAL_CATEGORIES[0],
        status: initialOfficial.status || OFFICIAL_STATUSES[0],
        position: initialOfficial.position || getPositionsForCategory(initialOfficial.category || OFFICIAL_CATEGORIES[0])[0], 
        committee: initialOfficial.committee || COMMITTEES[0],
    });
    const [file, setFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(null); 
    const [profilePictureUrl, setProfilePictureUrl] = useState(initialOfficial.profile_picture_url || null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contactNumError, setContactNumError] = useState(null);
    const fileInputRef = useRef(null); // Ref for picture upload div

    useEffect(() => {
        if (show && official) {
            setFormData({
                firstName: official.first_name || '',
                middleInitial: official.middle_initial || '',
                lastName: official.last_name || '',
                contactNumber: official.contact_number || '',
                category: official.category || OFFICIAL_CATEGORIES[0],
                status: official.status || OFFICIAL_STATUSES[0],
                position: official.position || getPositionsForCategory(official.category || OFFICIAL_CATEGORIES[0])[0], 
                committee: official.committee || COMMITTEES[0],
            });
            setFile(null);
            setPreviewUrl(null);
            setProfilePictureUrl(official.profile_picture_url || null);
            setError(null);
            setContactNumError(null);
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear file input
            }
        }
    }, [show, official]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'contactNumber') {
            setContactNumError(null); 
        }

        if (name === 'category') {
            const newPositions = getPositionsForCategory(value);
            setFormData({ 
                ...formData, 
                [name]: value,
                position: newPositions[0], 
                committee: COMMITTEES[0], 
            });
        } else if (name === 'position' && (formData.category === 'Staff' || formData.category === 'Tanod' || formData.category === 'Other')) {
             setFormData({ 
                ...formData, 
                [name]: value,
                category: value
            });
        } 
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handlePictureUpload = async (fileToUpload) => {
        // Note: The original logic set setLoading(true) *inside* this function, then *inside* handleSubmit. 
        // I'm keeping the setLoading(true) in handleSubmit and only handling the try/catch/throw here for clarity.
        const uploadFormData = new FormData();
        uploadFormData.append('official_picture', fileToUpload); 

        try {
            const response = await axios.post('http://localhost:5000/api/admin/officials/upload-picture', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.profilePictureUrl;
        } catch (err) {
            console.error("Profile picture upload failed:", err);
            setError('Failed to upload profile picture.');
            throw new Error('Upload failed'); 
        }
    };
    
    const handleRemovePicture = () => {
        setFile(null); 
        setPreviewUrl(null); 
        setProfilePictureUrl(null); 
        if (fileInputRef.current) {
            fileInputRef.current.value = null; // Clear file input
        }
        setError(null);
        setContactNumError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setContactNumError(null); 
        setLoading(true);

        if (formData.contactNumber && !isValidPhilippineNumber(formData.contactNumber)) {
            setContactNumError('Invalid number. Use 09xxxxxxxxx, +639xxxxxxxxx, or 639xxxxxxxxx format.');
            setLoading(false);
            return;
        }

        try {
            let finalPictureUrl = profilePictureUrl; 

            if (file) {
                finalPictureUrl = await handlePictureUpload(file);
            }
            
            const payload = {
                ...formData,
                profilePictureUrl: finalPictureUrl,
            };

            const response = await axios.put(`http://localhost:5000/api/admin/officials/${official.id}`, payload);
            
            onOfficialUpdated(response.data.official);
            // onHide() is called inside onOfficialUpdated in the main component, but let's call it here too for safety/consistency with AddModal
            onHide(); 

        } catch (err) {
            console.error("Edit official failed:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'An unknown error occurred while updating the official.');
        } finally {
            setLoading(false);
        }
    };

    if (!show || !official) return null;

    const currentPositions = getPositionsForCategory(formData.category);
    const picToDisplay = previewUrl || profilePictureUrl;

    return (
        <div style={modalStyles.backdrop}>
            <div style={{...modalStyles.modal, width: '90%', maxWidth: '600px'}}>
                <h3 style={modalStyles.header}>
                    <Edit size={24} style={{ marginRight: '10px', color: '#6366F1' }} />
                    Edit Official: {official.first_name} {official.last_name}
                </h3>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ API Error: {error}</p></div>}
                    
                    <div style={addModalStyles.grid}>
                        <div style={addModalStyles.picUploadContainer}>
                            <p style={addModalStyles.label}>Profile Picture (Optional)</p>
                            <div 
                                style={addModalStyles.picPreview} 
                                onClick={() => document.getElementById('edit-official-pic-upload').click()}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                            >
                                {picToDisplay ? (
                                    <img src={picToDisplay} alt="Preview" style={addModalStyles.picImage} />
                                ) : (
                                    <div style={addModalStyles.picPlaceholder}>
                                        <Image size={40} color="#9CA3AF" />
                                        <p style={{ margin: '10px 0 0 0', color: '#9CA3AF', fontSize: '12px' }}>Click to Upload</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    id="edit-official-pic-upload"
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    style={{ display: 'none' }} 
                                    ref={fileInputRef}
                                />
                            </div>
                            <p style={addModalStyles.hint}>Max 2MB. Only image files.</p>
                            {(picToDisplay || file) && (
                                <button 
                                    type="button" 
                                    onClick={handleRemovePicture} 
                                    style={{...styles.secondaryButton, marginTop: '10px', display: 'flex', alignItems: 'center'}}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                >
                                    <UserX size={16} style={{marginRight: '5px'}}/> Remove Picture
                                </button>
                            )}
                        </div>
                        
                        <div style={addModalStyles.detailsContainer}>
                            <p style={addModalStyles.label}>Full Name *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr', gap: '10px', marginBottom: '15px' }}>
                                {/* Inputs with dynamic focus handling */}
                                <input 
                                    type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} 
                                    style={addModalStyles.input} required 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <input 
                                    type="text" name="middleInitial" placeholder="M.I." value={formData.middleInitial} onChange={handleInputChange} 
                                    style={addModalStyles.input} maxLength="1" 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <input 
                                    type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} 
                                    style={addModalStyles.input} required 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <p style={addModalStyles.label}>Contact Number (Optional)</p>
                            <input 
                                type="tel" 
                                name="contactNumber" 
                                placeholder="e.g., 09171234567 or +639171234567" 
                                value={formData.contactNumber} 
                                onChange={handleInputChange} 
                                style={{...addModalStyles.input, marginBottom: contactNumError ? '5px' : '15px'}} 
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                            {contactNumError && <p style={addModalStyles.validationError}>{contactNumError}</p>}

                            <CustomSelect 
                                label="Category" 
                                name="category" 
                                value={formData.category} 
                                options={OFFICIAL_CATEGORIES} 
                                onChange={handleInputChange} 
                                required
                            />

                            <CustomSelect 
                                label="Position" 
                                name="position" 
                                value={formData.position} 
                                options={currentPositions} 
                                onChange={handleInputChange} 
                                required
                            />

                            {(formData.category === 'Barangay Official' || formData.category === 'SK Official') && (
                                <CustomSelect 
                                    label="Committee (Mandatory for Kagawads)" 
                                    name="committee" 
                                    value={formData.committee} 
                                    options={COMMITTEES} 
                                    onChange={handleInputChange}
                                    isConditional={true} 
                                />
                            )}
                            
                            <CustomSelect 
                                label="Status" 
                                name="status" 
                                value={formData.status} 
                                options={OFFICIAL_STATUSES} 
                                onChange={handleInputChange} 
                                required
                            />

                        </div>
                    </div>

                    <div style={modalStyles.footer}>
                        <button 
                            type="button" 
                            onClick={onHide} 
                            style={modalStyles.cancelButton} 
                            disabled={loading}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            style={addModalStyles.addButton} 
                            disabled={loading}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE_LIGHT_HOVER}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE}
                        >
                            {loading ? 'Updating...' : 'Save Changes'}
                            {!loading && <CheckCircle size={18} style={{ marginLeft: '10px' }} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- ENHANCED STATUS DROPDOWN COMPONENT (Fixed Hover styles) ---
const StatusDropdown = ({ currentStatus, statuses, onStatusChange, onClose, officialId }) => {
    const dropdownRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(statuses.findIndex(s => s === currentStatus));

    useEffect(() => {
        // Focus on mount for keyboard accessibility
        if (dropdownRef.current) {
            dropdownRef.current.focus();

            // Scroll active item into view
            const activeItem = dropdownRef.current.querySelector(`[data-status="${currentStatus}"]`);
            if (activeItem && activeItem.scrollIntoView) {
                activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }, [currentStatus]);

    useEffect(() => {
        // Handle click outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex + 1) % statuses.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex - 1 + statuses.length) % statuses.length);
                break;
            case 'Enter':
            case ' ': 
                e.preventDefault();
                const selectedStatus = statuses[activeIndex];
                if (selectedStatus) {
                    onStatusChange(selectedStatus); 
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
            default:
                break;
        }
    }, [statuses, activeIndex, onStatusChange, onClose]);

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Working':
                return { backgroundColor: '#D1FAE5', color: '#047857' };
            case 'On Site':
                return { backgroundColor: '#FEF9C3', color: '#A16207' };
            case 'On Leave':
                return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
            case 'AWOL':
                return { backgroundColor: '#FBCFE8', color: '#9D174D' };
            default:
                return { backgroundColor: '#E5E7EB', color: '#4B5563' };
        }
    };

    const handleSelect = (status) => {
        onStatusChange(status);
    };

    const getListItemStyle = (status, index) => {
        let baseStyle = {
            ...styles.dropdownListItem,
            borderLeft: status === currentStatus ? '4px solid #1e40af' : 'none',
            paddingLeft: status === currentStatus ? '11px' : '15px', 
            fontWeight: status === currentStatus ? '700' : '500',
        };

        // Keyboard/mouse active index
        if (index === activeIndex) {
            baseStyle.backgroundColor = '#E5E7EB';
        } else if (status === currentStatus) {
            // Currently selected status background
            baseStyle.backgroundColor = '#EFF6FF';
        } else {
            baseStyle.backgroundColor = 'white';
        }

        return baseStyle;
    };

    const handleListItemHover = (e, index) => {
        // Update active index on hover for visual feedback
        setActiveIndex(index);
        e.currentTarget.style.backgroundColor = '#F3F4F6';
    }

    const handleListItemLeave = (e, status, index) => {
        // Reset background if it's not the keyboard active index
        if (index !== activeIndex) {
            e.currentTarget.style.backgroundColor = status === currentStatus ? '#EFF6FF' : 'white';
        } else {
             e.currentTarget.style.backgroundColor = '#E5E7EB'; // Ensure active index retains its base color
        }
    }

    return (
        <div 
            ref={dropdownRef} 
            style={styles.dropdownContainer}
            tabIndex={-1} 
            onKeyDown={handleKeyDown}
        >
            <ul style={styles.dropdownList} role="listbox" aria-activedescendant={`status-${officialId}-${statuses[activeIndex]}`}>
                {statuses.map((status, index) => (
                    <li 
                        key={status} 
                        id={`status-${officialId}-${status}`}
                        role="option"
                        aria-selected={status === currentStatus}
                        data-status={status} 
                        style={getListItemStyle(status, index)}
                        onClick={() => handleSelect(status)}
                        onMouseEnter={(e) => handleListItemHover(e, index)}
                        onMouseLeave={(e) => handleListItemLeave(e, status, index)}
                    >
                        <span style={{...styles.statusBadge, ...getStatusBadgeStyle(status), minWidth: '90px'}}>
                            {status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
// --- END ENHANCED STATUS DROPDOWN COMPONENT ---


// --- Main Component ---

const AdminOfficialsPage = () => {
    const [officials, setOfficials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id'); 
    const [sortDirection, setSortDirection] = useState('asc');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [officialToDelete, setOfficialToDelete] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // UPDATED STATE FOR MESSAGE MODAL
    const [message, setMessage] = useState(null); 
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [officialToEdit, setOfficialToEdit] = useState(null);
    
    const [editingStatusId, setEditingStatusId] = useState(null);
    const statusDisplayRef = useRef(null); 

    const closeMessageModal = useCallback(() => {
        setMessage(null);
        setIsSuccess(false);
    }, []);

    const fetchOfficials = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/officials');
            setOfficials(response.data);
        } catch (err) {
            console.error("Error fetching officials data:", err);
            setError('Failed to load officials data from the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficials();
    }, []);

    const toggleSort = (key) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('asc');
        }
    };

    const handleDeleteClick = (official) => {
        setOfficialToDelete(official);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!officialToDelete) return;
        setShowDeleteModal(false);
        setError(null);
        setMessage(null); // Clear previous message
        const officialName = `${officialToDelete.first_name} ${officialToDelete.last_name}`;
        const officialId = officialToDelete.id;
        try {
            await axios.delete(`http://localhost:5000/api/admin/officials/${officialId}`);
            setOfficials(prev => prev.filter(o => o.id !== officialId));
            
            // --- UPDATED MESSAGE LOGIC ---
            setMessage(`Official ${officialName} successfully deleted.`);
            setIsSuccess(true);
            // -----------------------------
            
        } catch (err) {
            console.error(`Error deleting official ${officialId}:`, err);
            // Set error message in the modal
            setMessage(err.response?.data?.message || 'Failed to delete official.');
            setIsSuccess(false);
        }
    };

    const handleOfficialAdded = (newOfficial) => {
        setOfficials(prev => [newOfficial, ...prev]);
        
        // --- UPDATED MESSAGE LOGIC ---
        setMessage(`Official ${newOfficial.first_name} ${newOfficial.last_name} successfully added!`);
        setIsSuccess(true);
        // -----------------------------
    };

    const handleEditClick = (official) => {
        setOfficialToEdit(official);
        setShowEditModal(true);
    };

    const handleOfficialUpdated = (updatedOfficial) => {
        setOfficials(prev => 
            prev.map(o => (o.id === updatedOfficial.id ? { 
                ...o, 
                ...updatedOfficial 
            } : o))
        );
        setShowEditModal(false);
        setOfficialToEdit(null);
        
        // --- UPDATED MESSAGE LOGIC ---
        setMessage(`Official ${updatedOfficial.first_name} ${updatedOfficial.last_name} successfully updated.`);
        setIsSuccess(true);
        // -----------------------------
    };

    const closeAndRefocus = useCallback(() => {
        const idToFocus = statusDisplayRef.current;
        setEditingStatusId(null);
        if (idToFocus) {
            const elementToFocus = document.getElementById(idToFocus);
            if (elementToFocus) {
                elementToFocus.focus();
            }
        }
        statusDisplayRef.current = null; 
    }, []);


    const handleStatusUpdate = async (officialId, statusValue) => {
        const currentStatus = officials.find(o => o.id === officialId)?.status;
        
        closeAndRefocus();

        if (statusValue === currentStatus) {
            return; 
        }

        setError(null);
        setMessage(null); 

        try {
            await axios.put(`http://localhost:5000/api/admin/officials/${officialId}/status`, {
                status: statusValue
            });

            setOfficials(prev => prev.map(o => 
                o.id === officialId ? { ...o, status: statusValue } : o
            ));
            
            // --- UPDATED MESSAGE LOGIC ---
            setMessage(`Status for Official ID ${officialId} successfully updated to '${statusValue}'.`);
            setIsSuccess(true);
            // -----------------------------

        } catch (err) {
            console.error(`Error updating status for official ${officialId}:`, err.response ? err.response.data : err);
            // Set error message in the modal
            setMessage(err.response?.data?.message || 'Failed to update official status.');
            setIsSuccess(false);
        }
    };


    const filteredAndSortedOfficials = useMemo(() => {
        let currentOfficials = officials.filter(official => {
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${official.first_name} ${official.last_name} ${official.middle_initial || ''}`.toLowerCase();
            const positionLower = (official.position || '').toLowerCase();
            const committeeLower = (official.committee || '').toLowerCase();

            return (
                fullName.includes(searchLower) ||
                (official.contact_number && official.contact_number.includes(searchLower)) ||
                official.category.toLowerCase().includes(searchLower) ||
                official.status.toLowerCase().includes(searchLower) ||
                positionLower.includes(searchLower) || 
                committeeLower.includes(searchLower)
            );
        });

        currentOfficials.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (sortBy === 'id' || sortBy === 'created_at') {
                if (sortBy === 'created_at') {
                    const aTime = new Date(aValue).getTime();
                    const bTime = new Date(bValue).getTime();
                    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
                }
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) return sortDirection === 'asc' ? -1 : 1;
                if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return currentOfficials;
    }, [officials, searchTerm, sortBy, sortDirection]);

    const renderSortIcon = (key) => {
        if (sortBy !== key) return null;
        const Icon = sortDirection === 'asc' ? ChevronUp : ChevronDown;
        return <Icon size={14} style={styles.sortIcon} />;
    };

    const SortableHeader = ({ title, sortKey }) => (
        <th onClick={() => toggleSort(sortKey)} style={{...styles.tableHeader, cursor: 'pointer', minWidth: '100px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                {title} {renderSortIcon(sortKey)}
            </div>
        </th>
    );

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Working':
                return { backgroundColor: '#D1FAE5', color: '#047857' };
            case 'On Site':
                return { backgroundColor: '#FEF9C3', color: '#A16207' };
            case 'On Leave':
                return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
            case 'AWOL':
                return { backgroundColor: '#FBCFE8', color: '#9D174D' };
            default:
                return { backgroundColor: '#E5E7EB', color: '#4B5563' };
        }
    };

    if (loading) return <div style={styles.center}><p style={{ color: PRIMARY_BLUE_DARK, fontSize: '18px' }}>🚀 Loading Officials Data...</p></div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Barangay Officials Management</h1>
            <p style={styles.subtitle}> 
                Manage all barangay and SK officials, staff, and tanods. Total: <strong style={{color: '#1F2937'}}>{officials.length.toLocaleString()}</strong> 
            </p>

            <div style={styles.toolbar}>
                <div style={styles.searchBox}>
                    <Search size={20} color="#6B7280" style={{ marginLeft: '10px' }}/>
                    <input 
                        type="text" 
                        placeholder="Search by name, contact, category..." 
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    style={styles.addButton}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE_LIGHT_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PRIMARY_BLUE}
                >
                    <Plus size={20} style={{ marginRight: '5px' }} />
                    Add New Official
                </button>
            </div>

            {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>Error: {error}</p></div>}

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <SortableHeader title="ID" sortKey="id" />
                            <th style={{...styles.tableHeader, width: '40px'}}>Pic</th>
                            <SortableHeader title="Name" sortKey="last_name" />
                            <SortableHeader title="Category" sortKey="category" />
                            <SortableHeader title="Position" sortKey="position" />
                            <SortableHeader title="Committee" sortKey="committee" />
                            <SortableHeader title="Status" sortKey="status" />
                            <SortableHeader title="Contact" sortKey="contact_number" />
                            <SortableHeader title="Added On" sortKey="created_at" />
                            <th style={{...styles.tableHeader, width: '100px', textAlign: 'center'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedOfficials.map(official => (
                            <tr 
                                key={official.id} 
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                            >
                                <td style={styles.tableData}>{official.id}</td>
                                <td style={styles.tableData}>
                                    {official.profile_picture_url ? (
                                        <img src={official.profile_picture_url} alt="Profile" style={styles.avatarTable} />
                                    ) : (
                                        <div style={styles.avatarPlaceholderTable}>
                                            <UserX size={20} color="#6B7280" />
                                        </div>
                                    )}
                                </td>
                                <td style={{...styles.tableData, fontWeight: '600'}}>
                                    {official.first_name} {official.middle_initial ? official.middle_initial + '. ' : ''}{official.last_name}
                                </td>
                                <td style={styles.tableData}>{official.category}</td>
                                
                                <td style={{...styles.tableData, fontWeight: '500'}}>{official.position}</td>

                                <td style={styles.tableData}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px', 
                                        fontWeight: '600',
                                        backgroundColor: official.committee === 'None' || !official.committee ? '#F3F4F6' : '#D1FAE5', 
                                        color: official.committee === 'None' || !official.committee ? '#4B5563' : '#047857'
                                    }}>
                                        {official.committee || 'None'}
                                    </span>
                                </td>

                                <td 
                                    key={`status-cell-${official.id}`} 
                                    style={{
                                        ...styles.tableData, 
                                        position: 'relative', 
                                        minWidth: '150px',
                                        padding: '8px 20px', 
                                    }}
                                >
                                    {editingStatusId === official.id ? (
                                        <StatusDropdown
                                            officialId={official.id}
                                            currentStatus={official.status}
                                            statuses={OFFICIAL_STATUSES}
                                            onStatusChange={(newStatus) => handleStatusUpdate(official.id, newStatus)}
                                            onClose={closeAndRefocus} 
                                        />
                                    ) : (
                                        <div 
                                            id={`status-display-${official.id}`} 
                                            style={styles.clickableStatusDisplay} 
                                            title="Click to edit status"
                                            tabIndex={0} 
                                            role="button"
                                            onClick={(e) => {
                                                setEditingStatusId(official.id);
                                                statusDisplayRef.current = e.currentTarget.id; 
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setEditingStatusId(official.id);
                                                    statusDisplayRef.current = e.currentTarget.id; 
                                                }
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.outline = '2px solid #6366F1';
                                                e.currentTarget.style.outlineOffset = '2px';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.outline = 'none';
                                                e.currentTarget.style.outlineOffset = 'none';
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <span style={{...styles.statusBadge, ...getStatusBadgeStyle(official.status)}}>
                                                {official.status}
                                            </span>
                                            <ChevronDown size={16} color="#4B5563" style={{ marginLeft: '5px' }} />
                                        </div>
                                    )}
                                </td>
                                
                                <td style={styles.tableData}>{official.contact_number || 'N/A'}</td>
                                <td style={styles.tableData}>{new Date(official.created_at).toLocaleDateString()}</td>
                                
                                <td style={{
                                    ...styles.tableData, 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    padding: '0 20px', 
                                    height: '65px' 
                                }}>
                                    <button 
                                        onClick={() => handleEditClick(official)} 
                                        style={{...styles.actionButton, marginRight: '10px'}} 
                                        title="Edit Official"
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <Edit size={18} color="#2563EB" /> 
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(official)} 
                                        style={styles.actionButton} 
                                        title="Delete Official"
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} 
                                    >
                                        <Trash2 size={18} color="#DC2626" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedOfficials.length === 0 && (
                            <tr>
                                <td colSpan="10" style={styles.noResults}>No officials found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                official={officialToDelete} 
                onConfirm={confirmDelete} 
                onCancel={() => setShowDeleteModal(false)} 
            />
            <AddOfficialModal 
                show={showAddModal} 
                onHide={() => setShowAddModal(false)} 
                onOfficialAdded={handleOfficialAdded} 
            />
            <EditOfficialModal 
                show={showEditModal}
                official={officialToEdit}
                onHide={() => setShowEditModal(false)}
                onOfficialUpdated={handleOfficialUpdated}
            />
            {/* MessageModal (The new component) */}
            <MessageModal
                message={message}
                isSuccess={isSuccess}
                closeMessageModal={closeMessageModal}
            />
        </div>
    );
};

// --- Styles (Refactored to remove non-working pseudo-classes) ---

const styles = {
    container: {
        padding: '30px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB',
    },
    center: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
    },
    pageTitle: {
        color: '#1F2937',
        marginBottom: '5px',
        fontSize: '28px',
        fontWeight: '700',
    },
    subtitle: {
        color: '#6B7280',
        fontSize: '15px',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #E5E7EB'
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        width: '350px',
        padding: '5px',
    },
    searchInput: {
        border: 'none',
        outline: 'none',
        padding: '8px 10px',
        flexGrow: 1,
        fontSize: '15px',
        backgroundColor: 'transparent',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    addButton: {
        backgroundColor: PRIMARY_BLUE, 
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    secondaryButton: {
        backgroundColor: '#F3F4F6', 
        color: '#4B5563',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        padding: '8px 15px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
    tableWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '1300px', 
    },
    tableHeader: {
        padding: '15px 20px',
        textAlign: 'left',
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        fontSize: '13px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '2px solid #E5E7EB',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    tableRow: {
        borderBottom: '1px solid #E5E7EB',
        transition: 'background-color 0.2s',
    },
    tableData: {
        padding: '15px 20px',
        color: '#1F2937',
        fontSize: '14px',
    },
    noResults: {
        textAlign: 'center',
        padding: '30px',
        color: '#9CA3AF',
        fontSize: '16px',
    },
    statusBadge: {
        padding: '5px 10px',
        borderRadius: '50px',
        fontWeight: '700',
        fontSize: '12px',
        display: 'inline-block',
        minWidth: '80px',
        textAlign: 'center',
    },
    // Focus/Hover handled via onFocus/onBlur/onMouseEnter/onMouseLeave props in JSX
    clickableStatusDisplay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '6px',
        transition: 'background-color 0.1s',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        transition: 'transform 0.1s',
    },
    errorAlert: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginTop: '15px',
    },
    avatarTable: {
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #E5E7EB',
    },
    avatarPlaceholderTable: {
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #E5E7EB',
    },
    dropdownContainer: {
        position: 'absolute',
        top: '100%', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 20, 
        minWidth: '160px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        marginTop: '5px',
        outline: 'none', 
        padding: '5px 0',
    },
    dropdownList: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        maxHeight: '200px', 
        overflowY: 'auto',
    },
    // Hover and active styles handled dynamically in StatusDropdown component
    dropdownListItem: {
        cursor: 'pointer',
        fontSize: '14px',
        color: '#374151',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 15px',
        transition: 'background-color 0.1s, border-left 0.1s',
    }
};

const modalStyles = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '450px',
        width: '100%',
    },
    header: {
        color: '#1F2937',
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '22px',
        fontWeight: '700',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
    },
    body: {
        color: '#4B5563',
        fontSize: '16px',
        lineHeight: '1.5',
        marginBottom: '15px',
    },
    warning: {
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '14px',
        border: '1px solid #FCA5A5',
        marginBottom: '20px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '1px solid #E5E7EB',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    cancelButton: {
        backgroundColor: '#E5E7EB',
        color: '#4B5563',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    deleteButton: {
        backgroundColor: RED_LIGHT,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
    },
};

const messageModalStyles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        width: '90%', 
        maxWidth: '400px', 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', // Adjusted shadow from original messageModalStyles 
        position: 'relative', 
        textAlign: 'center' 
    },
    closeButton: { position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: TEXT_MUTED },
    content: (isSuccess) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: isSuccess ? PRIMARY_BLUE : RED_LIGHT, }),
    title: { fontSize: '22px', fontWeight: '700', margin: 0, },
    body: { fontSize: '16px', color: '#374151', marginBottom: '20px', },
    successButton: { 
        width: '100%', 
        padding: '10px', 
        backgroundColor: PRIMARY_BLUE, 
        color: 'white', 
        border: 'none', 
        borderRadius: '6px', 
        fontWeight: '600', 
        cursor: 'pointer', 
        transition: 'background-color 0.2s', 
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
    },
};

const addModalStyles = {
    ...modalStyles,
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    addButton: {
        backgroundColor: PRIMARY_BLUE, 
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: '20px',
    },
    detailsContainer: {
        padding: '10px',
    },
    label: {
        color: '#374151',
        marginBottom: '5px',
        marginTop: '10px',
        fontWeight: '600',
        fontSize: '14px',
    },
    // Focus/Hover handled via onFocus/onBlur/onMouseEnter/onMouseLeave props in JSX
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        fontSize: '15px',
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF', 
        transition: 'border-color 0.2s, box-shadow 0.2s', // Added transition for smooth effect
    },
    validationError: {
        fontSize: '12px',
        color: '#DC2626',
        marginTop: '5px',
        marginBottom: '10px',
        fontWeight: '500',
    },
    picUploadContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
    },
    // Hover handled via onMouseEnter/onMouseLeave props in JSX
    picPreview: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: '#E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        border: '3px dashed #D1D5DB',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
    },
    picImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    picPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: {
        fontSize: '11px',
        color: '#6B7280',
        marginTop: '10px',
    }
};


export default AdminOfficialsPage;