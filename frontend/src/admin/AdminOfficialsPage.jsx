// frontend/src/admin/AdminOfficialsPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Trash2, CheckCircle, Plus, UserPlus, Image, UserX, Edit
} from 'lucide-react';

// --- Constants ---
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
            // Ensure Staff/Tanod/Other categories map to a single position of the same name
            const explicitPosition = OTHER_POSITIONS.includes(category) ? category : null;
            return explicitPosition ? [explicitPosition] : OTHER_POSITIONS;
    }
};

// --- VALIDATION HELPER FUNCTION ---
const isValidPhilippineNumber = (number) => {
    // If the field is empty (optional), it is valid.
    if (!number) return true; 
    
    // Clean the number by removing spaces, hyphens, and parentheses
    const cleanedNumber = number.replace(/[\s\-\(\)]/g, ''); 
    
    return PHILIPPINE_MOBILE_REGEX.test(cleanedNumber);
};

// --- Helper Components ---

const SuccessAlert = ({ message, style }) => {
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

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
                    <button onClick={onCancel} style={modalStyles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={modalStyles.deleteButton}>
                        Yes, Delete Official
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- START: NEW CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ label, name, value, options, onChange, required = false, isConditional = false, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Find index of current value for keyboard navigation
    const [activeIndex, setActiveIndex] = useState(options.findIndex(opt => opt === value));
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
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

    // Update activeIndex when options or value changes externally (e.g., category change)
    useEffect(() => {
        setActiveIndex(options.findIndex(opt => opt === value));
    }, [options, value]);

    const handleSelect = (selectedValue) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        // Restore focus to the custom select button
        if (containerRef.current) {
            containerRef.current.querySelector('button').focus();
        }
    };

    // Custom select styles based on addModalStyles.input
    const selectDisplayStyles = {
        ...addModalStyles.input,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        // Change text color if value is empty (like a placeholder)
        color: value && options.includes(value) ? '#1F2937' : '#9CA3AF',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        marginBottom: '15px', 
        ...(isConditional ? { marginBottom: '0' } : {}), // for conditional rendering
    };
    
    // Pro-level dropdown list styles (to address user's request for radius and design)
    const listContainerStyles = {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        marginTop: '4px',
        borderRadius: '8px', // Added radius
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Added shadow
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
        // Active item gets a different color
        backgroundColor: index === activeIndex ? '#F3F4F6' : (options[index] === value ? '#EFF6FF' : 'white'),
        fontWeight: options[index] === value ? '700' : '400',
        ':hover': {
            backgroundColor: '#F3F4F6',
        }
    });

    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'relative', 
                marginBottom: isConditional ? '15px' : '0', // Control margin for the div
                ...style
            }}
            onKeyDown={handleKeyDown}
        >
            <p style={addModalStyles.label}>{label} {required ? '*' : ''}</p>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
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
                                // Use ref logic to ensure the active/focused item scrolls into view
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
// --- END: NEW CUSTOM SELECT COMPONENT ---


const AddOfficialModal = ({ show, onHide, onOfficialAdded }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        middleInitial: '',
        lastName: '',
        contactNumber: '',
        category: OFFICIAL_CATEGORIES[0],
        status: OFFICIAL_STATUSES[0],
        position: getPositionsForCategory(OFFICIAL_CATEGORIES[0])[0], 
        committee: COMMITTEES[0],
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [contactNumError, setContactNumError] = useState(null); 

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
            // Logic to sync category and position if they are the same value (for non-official roles)
             setFormData({ 
                ...formData, 
                [name]: value,
                category: value // Set category to position value
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
                    <UserPlus size={24} style={{ marginRight: '10px', color: '#1e40af' }} />
                    Add New Barangay Official
                </h3>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ API Error: {error}</p></div>}
                    
                    <div style={addModalStyles.grid}>
                        <div style={addModalStyles.picUploadContainer}>
                            <p style={addModalStyles.label}>Profile Picture (Optional)</p>
                            <div style={addModalStyles.picPreview} onClick={() => document.getElementById('add-official-pic-upload').click()}>
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
                                />
                            </div>
                            <p style={addModalStyles.hint}>Max 2MB. Only image files.</p>
                        </div>
                        
                        <div style={addModalStyles.detailsContainer}>
                            <p style={addModalStyles.label}>Full Name *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr', gap: '10px', marginBottom: '15px' }}>
                                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} style={addModalStyles.input} required />
                                <input type="text" name="middleInitial" placeholder="M.I." value={formData.middleInitial} onChange={handleInputChange} style={addModalStyles.input} maxLength="1" />
                                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} style={addModalStyles.input} required />
                            </div>

                            <p style={addModalStyles.label}>Contact Number (Optional)</p>
                            <input 
                                type="tel" 
                                name="contactNumber" 
                                placeholder="e.g., 09171234567 or +639171234567" 
                                value={formData.contactNumber} 
                                onChange={handleInputChange} 
                                style={{...addModalStyles.input, marginBottom: contactNumError ? '5px' : '15px'}} 
                            />
                            {contactNumError && <p style={addModalStyles.validationError}>{contactNumError}</p>}

                            {/* REPLACED <select> WITH CUSTOMSELECT */}
                            <CustomSelect 
                                label="Category" 
                                name="category" 
                                value={formData.category} 
                                options={OFFICIAL_CATEGORIES} 
                                onChange={handleInputChange} 
                                required
                            />

                            {/* REPLACED <select> WITH CUSTOMSELECT */}
                            <CustomSelect 
                                label="Position" 
                                name="position" 
                                value={formData.position} 
                                options={currentPositions} 
                                onChange={handleInputChange} 
                                required
                            />

                            {(formData.category === 'Barangay Official' || formData.category === 'SK Official') && (
                                // REPLACED <select> WITH CUSTOMSELECT
                                <CustomSelect 
                                    label="Committee (Mandatory for Kagawads)" 
                                    name="committee" 
                                    value={formData.committee} 
                                    options={COMMITTEES} 
                                    onChange={handleInputChange}
                                    isConditional={true} // For spacing
                                />
                            )}

                            {/* REPLACED <select> WITH CUSTOMSELECT */}
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
                        <button type="button" onClick={onHide} style={modalStyles.cancelButton} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={addModalStyles.addButton} disabled={loading}>
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
            // Logic to sync category and position if they are the same value (for non-official roles)
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
        setLoading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('official_picture', fileToUpload); 

        try {
            const response = await axios.post('http://localhost:5000/api/admin/officials/upload-picture', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLoading(false);
            return response.data.profilePictureUrl;
        } catch (err) {
            console.error("Profile picture upload failed:", err);
            setError('Failed to upload profile picture.');
            setLoading(false);
            throw new Error('Upload failed'); 
        }
    };
    
    const handleRemovePicture = () => {
        setFile(null); 
        setPreviewUrl(null); 
        setProfilePictureUrl(null); 
        document.getElementById('edit-official-pic-upload').value = null; 
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
    
    // FIX: Define picToDisplay here. It prioritizes the new file preview, then falls back to the existing URL.
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
                            <div style={addModalStyles.picPreview} onClick={() => document.getElementById('edit-official-pic-upload').click()}>
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
                                />
                            </div>
                            <p style={addModalStyles.hint}>Max 2MB. Only image files.</p>
                            {(picToDisplay || file) && (
                                <button type="button" onClick={handleRemovePicture} style={{...styles.secondaryButton, marginTop: '10px', display: 'flex', alignItems: 'center'}}>
                                    <UserX size={16} style={{marginRight: '5px'}}/> Remove Picture
                                </button>
                            )}
                        </div>
                        
                        <div style={addModalStyles.detailsContainer}>
                            <p style={addModalStyles.label}>Full Name *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr', gap: '10px', marginBottom: '15px' }}>
                                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} style={addModalStyles.input} required />
                                <input type="text" name="middleInitial" placeholder="M.I." value={formData.middleInitial} onChange={handleInputChange} style={addModalStyles.input} maxLength="1" />
                                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} style={addModalStyles.input} required />
                            </div>

                            <p style={addModalStyles.label}>Contact Number (Optional)</p>
                            <input 
                                type="tel" 
                                name="contactNumber" 
                                placeholder="e.g., 09171234567 or +639171234567" 
                                value={formData.contactNumber} 
                                onChange={handleInputChange} 
                                style={{...addModalStyles.input, marginBottom: contactNumError ? '5px' : '15px'}} 
                            />
                            {contactNumError && <p style={addModalStyles.validationError}>{contactNumError}</p>}

                            {/* REPLACED <select> WITH CUSTOMSELECT */}
                            <CustomSelect 
                                label="Category" 
                                name="category" 
                                value={formData.category} 
                                options={OFFICIAL_CATEGORIES} 
                                onChange={handleInputChange} 
                                required
                            />

                            {/* REPLACED <select> WITH CUSTOMSELECT */}
                            <CustomSelect 
                                label="Position" 
                                name="position" 
                                value={formData.position} 
                                options={currentPositions} 
                                onChange={handleInputChange} 
                                required
                            />

                            {(formData.category === 'Barangay Official' || formData.category === 'SK Official') && (
                                // REPLACED <select> WITH CUSTOMSELECT
                                <CustomSelect 
                                    label="Committee (Mandatory for Kagawads)" 
                                    name="committee" 
                                    value={formData.committee} 
                                    options={COMMITTEES} 
                                    onChange={handleInputChange}
                                    isConditional={true} // For spacing
                                />
                            )}
                            
                            {/* REPLACED <select> WITH CUSTOMSELECT */}
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
                        <button type="button" onClick={onHide} style={modalStyles.cancelButton} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={addModalStyles.addButton} disabled={loading}>
                            {loading ? 'Updating...' : 'Save Changes'}
                            {!loading && <CheckCircle size={18} style={{ marginLeft: '10px' }} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- ENHANCED STATUS DROPDOWN COMPONENT (Used in the main table) ---
const StatusDropdown = ({ currentStatus, statuses, onStatusChange, onClose, officialId }) => {
    const dropdownRef = useRef(null);
    // State to track the keyboard-focused item index
    const [activeIndex, setActiveIndex] = useState(statuses.findIndex(s => s === currentStatus));

    // 1. Auto-focus and scroll the active item into view on mount
    useEffect(() => {
        if (dropdownRef.current) {
            dropdownRef.current.focus();

            // Optional: Scroll active item into view
            const activeItem = dropdownRef.current.querySelector(`[data-status="${currentStatus}"]`);
            if (activeItem && activeItem.scrollIntoView) {
                activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }, [currentStatus]);

    // 2. Handle click outside (close dropdown)
    useEffect(() => {
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

    // 3. Handle keyboard navigation and selection
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
            case ' ': // Spacebar also selects
                e.preventDefault();
                const selectedStatus = statuses[activeIndex];
                if (selectedStatus) {
                    onStatusChange(selectedStatus); // This also calls onClose internally
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
        // onClose() is called inside onStatusChange logic in the parent component
    };

    return (
        <div 
            ref={dropdownRef} 
            style={styles.dropdownContainer}
            // TabIndex for programmatic focus
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
                        data-status={status} // Used for scrolling
                        style={{
                            ...styles.dropdownListItem,
                            // Highlight based on keyboard activeIndex
                            backgroundColor: index === activeIndex ? '#E5E7EB' : (status === currentStatus ? '#EFF6FF' : 'white'), 
                            // Add border to distinguish the current status visually from the list
                            borderLeft: status === currentStatus ? '4px solid #1e40af' : 'none',
                            paddingLeft: status === currentStatus ? '11px' : '15px', // Adjust padding for border
                            fontWeight: status === currentStatus ? '700' : '500',
                        }}
                        onClick={() => handleSelect(status)}
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
    const [successMessage, setSuccessMessage] = useState(null); 
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [officialToEdit, setOfficialToEdit] = useState(null);
    
    // State to track the ID of the official whose status dropdown is open
    const [editingStatusId, setEditingStatusId] = useState(null);
    // Ref to store the DOM element that opened the dropdown, allowing focus to be restored
    const statusDisplayRef = useRef(null); 


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
        setSuccessMessage(null);
        const officialName = `${officialToDelete.first_name} ${officialToDelete.last_name}`;
        const officialId = officialToDelete.id;
        try {
            await axios.delete(`http://localhost:5000/api/admin/officials/${officialId}`);
            setOfficials(prev => prev.filter(o => o.id !== officialId));
            setSuccessMessage(`Official ${officialName} deleted successfully.`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error(`Error deleting official ${officialId}:`, err);
            setError(err.response?.data?.message || 'Failed to delete official.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleOfficialAdded = (newOfficial) => {
        setOfficials(prev => [newOfficial, ...prev]);
        setSuccessMessage(`Official ${newOfficial.first_name} ${newOfficial.last_name} added successfully!`);
        setTimeout(() => setSuccessMessage(null), 5000);
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
        setSuccessMessage(`Official ${updatedOfficial.first_name} ${updatedOfficial.last_name} updated successfully.`);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // New handler to close the dropdown and restore focus to the trigger element
    const closeAndRefocus = useCallback(() => {
        const idToFocus = statusDisplayRef.current;
        setEditingStatusId(null);
        // Restore focus to the element that opened the dropdown
        if (idToFocus) {
             // Find the element by the stored ref (which is the element's ID)
            const elementToFocus = document.getElementById(idToFocus);
            if (elementToFocus) {
                elementToFocus.focus();
            }
        }
        statusDisplayRef.current = null; // Clear the ref
    }, []);


    const handleStatusUpdate = async (officialId, statusValue) => {
        const currentStatus = officials.find(o => o.id === officialId)?.status;
        
        // 1. Close dropdown immediately, regardless of whether status changed or not
        // This makes the UI feel fast and responsive.
        closeAndRefocus();

        if (statusValue === currentStatus) {
            return; // No change, just close and return
        }

        setError(null);
        setSuccessMessage(null);

        try {
            await axios.put(`http://localhost:5000/api/admin/officials/${officialId}/status`, {
                status: statusValue
            });

            setOfficials(prev => prev.map(o => 
                o.id === officialId ? { ...o, status: statusValue } : o
            ));
            
            setSuccessMessage(`Status for Official ID ${officialId} updated successfully to '${statusValue}'.`);
            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (err) {
            console.error(`Error updating status for official ${officialId}:`, err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'Failed to update official status.');
            setTimeout(() => setError(null), 5000);
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

    if (loading) return <div style={styles.center}><p style={{ color: '#2563eb', fontSize: '18px' }}>🚀 Loading Officials Data...</p></div>;

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
                <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
                    <Plus size={20} style={{ marginRight: '5px' }} />
                    Add New Official
                </button>
            </div>

            {successMessage && <SuccessAlert message={successMessage} />}
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
                            <tr key={official.id} style={styles.tableRow}>
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

                                {/* MODIFIED TD FOR CUSTOM DROPDOWN */}
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
                                            onClose={closeAndRefocus} // Pass the close and refocus function
                                        />
                                    ) : (
                                        <div 
                                            id={`status-display-${official.id}`} // Unique ID for focus return
                                            style={styles.clickableStatusDisplay} 
                                            title="Click to edit status"
                                            // Make it focusable when closed for keyboard users to activate
                                            tabIndex={0} 
                                            role="button"
                                            onClick={(e) => {
                                                setEditingStatusId(official.id);
                                                // Store the ID of the element clicked to restore focus later
                                                statusDisplayRef.current = e.currentTarget.id; 
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setEditingStatusId(official.id);
                                                    statusDisplayRef.current = e.currentTarget.id; 
                                                }
                                            }}
                                        >
                                            <span style={{...styles.statusBadge, ...getStatusBadgeStyle(official.status)}}>
                                                {official.status}
                                            </span>
                                            <ChevronDown size={16} color="#4B5563" style={{ marginLeft: '5px' }} />
                                        </div>
                                    )}
                                </td>
                                {/* END MODIFIED TD */}
                                
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
                                    >
                                        <Edit size={18} color="#2563EB" /> 
                                    </button>
                                    <button onClick={() => handleDeleteClick(official)} style={styles.actionButton} title="Delete Official" >
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
        </div>
    );
};

// --- Styles (no changes needed here, CustomSelect handles its own list styles) ---

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
    addButton: {
        backgroundColor: '#1e40af', 
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
        ':hover': {
            backgroundColor: '#1d4ed8',
        }
    },
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
        ':hover': {
            backgroundColor: '#E5E7EB',
        }
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
    tableRow: {
        borderBottom: '1px solid #E5E7EB',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#F9FAFB',
        }
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
    clickableStatusDisplay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '6px',
        transition: 'background-color 0.1s',
        // Style when focused (via keyboard/tab)
        ':focus': {
            outline: '2px solid #6366F1',
            outlineOffset: '2px',
        },
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        transition: 'transform 0.1s',
        ':hover': {
            transform: 'scale(1.1)',
        }
    },
    successAlert: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#D1FAE5',
        color: '#047857',
        border: '1px solid #6EE7B7',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginBottom: '15px',
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
    // --- Styles for the Table Status Dropdown (already custom) ---
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
    dropdownListItem: {
        cursor: 'pointer',
        fontSize: '14px',
        color: '#374151',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 15px',
        transition: 'background-color 0.1s, border-left 0.1s',
        ':hover': {
            backgroundColor: '#F3F4F6',
        }
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
        ':hover': {
            backgroundColor: '#D1D5DB',
        }
    },
    deleteButton: {
        backgroundColor: '#DC2626',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#B91C1C',
        }
    },
};

const addModalStyles = {
    ...modalStyles,
    addButton: {
        backgroundColor: '#1e40af', 
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
        ':hover': {
            backgroundColor: '#1d4ed8',
        }
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
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        fontSize: '15px',
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF', // Explicitly white background for contrast
        ':focus': {
            borderColor: '#6366F1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            outline: 'none',
        }
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
        ':hover': {
            borderColor: '#6366F1',
        }
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