// AdminOfficialsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
// Import all necessary icons from lucide-react, including the new ones for toasts and loading
import { 
    PlusCircle, Edit, Trash2, X, AlertTriangle, Users, Image, CheckCircle, 
    Info, Loader // Added CheckCircle, Info, Loader
} from 'lucide-react'; 

// -----------------------------------------------------------------
// --- Configuration: Predefined Positions and Committees (UPDATED) ---
// -----------------------------------------------------------------

// Positions specific to Sangguniang Kabataan and Barangay Support Staff
const POSITIONS = [
    'SK Chairperson',
    'SK Kagawad',
    'SK Secretary',
    'SK Treasurer',
    'Barangay Staff', // General staff role
    'Appointive Official (e.g., BHW, Tanod)',
    'Other'
];

// Standard Committees in a typical Sangguniang Kabataan (SK) or Barangay structure
const COMMITTEES = [
    'None (Executive Role/Staff)', 
    'Committee on Youth and Sports Development',
    'Committee on Education',
    'Committee on Health and Sanitation',
    'Committee on Social Inclusion & Equity',
    'Committee on Economic Empowerment & Livelihood',
    'Committee on Environment & Disaster Risk Reduction (DRR)',
    'Committee on Peace-Building and Security',
    'Committee on Public Works and Infrastructure',
    'Committee on Budget and Finance',
    'Committee on Governance & Accountability'
];


// --- TOAST COMPONENT ---
// A simple, modern notification component
const Toast = ({ message, type, onClose }) => {
    
    // FIX: useEffect is now called UNCONDITIONALLY at the top of the component
    useEffect(() => {
        if (!message) return; // Prevent setting a timeout if no message is present
        const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
        return () => clearTimeout(timer);
    }, [onClose, message]); 

    // Conditional return happens AFTER the hook is called
    if (!message) return null; 

    const baseStyle = {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 2000,
        transition: 'opacity 0.3s ease-in-out',
    };

    let colorStyle = {};
    let Icon = Info;

    switch (type) {
        case 'success':
            colorStyle = { backgroundColor: '#059669' }; // Darker Green
            Icon = CheckCircle;
            break;
        case 'error':
            colorStyle = { backgroundColor: '#DC2626' }; // Darker Red
            Icon = AlertTriangle;
            break;
        default:
            colorStyle = { backgroundColor: '#2563EB' }; // Darker Blue (Info)
            Icon = Info;
    }

    return (
        <div style={{ ...baseStyle, ...colorStyle }}>
            <Icon size={20} style={{ marginRight: '10px' }} />
            <span>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '15px', cursor: 'pointer' }}>
                <X size={16} />
            </button>
        </div>
    );
};
// --- END TOAST COMPONENT ---


const AdminOfficialsPage = () => {
    // --- State Management ---
    const [officials, setOfficials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for the Add/Edit form modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentOfficial, setCurrentOfficial] = useState(null); 
    
    // Form state
    const [name, setName] = useState('');
    const [position, setPosition] = useState(POSITIONS[0]);
    const [committee, setCommittee] = useState(COMMITTEES[0]);
    const [contact, setContact] = useState('');
    
    // State for Profile Picture
    const [profilePictureFile, setProfilePictureFile] = useState(null); 
    const [picturePath, setPicturePath] = useState(''); 

    // State for Delete Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [officialToDelete, setOfficialToDelete] = useState(null);

    // NEW STATE FOR EDIT CONFIRMATION MODAL
    const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
    const [officialToEdit, setOfficialToEdit] = useState(null);
    
    // State for Toast Notification
    const [toast, setToast] = useState({ message: '', type: '' });
    
    // State for form submission loading
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for input focus (to simulate better styling)
    const [focusedInput, setFocusedInput] = useState(null);


    // --- API Configuration ---
    const API_URL = 'http://localhost:5000/api/officials'; 
    const UPLOAD_API_URL = 'http://localhost:5000/api/officials/upload-picture';

    // --- Data Fetching ---
    // Using useCallback to stabilize the function for useEffect dependency
    const fetchOfficials = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setOfficials(data);
        } catch (err) {
            console.error("Failed to fetch officials:", err);
            setError("Failed to load officials. Please check the server connection.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOfficials();
    }, [fetchOfficials]);

    // --- Modal and Form Handlers ---

    // Primary function to open the main Add/Edit Modal
    const handleOpenModal = (official = null) => {
        setIsModalOpen(true);
        setError(null); // Clear form error
        setFocusedInput(null); // Clear focus state
        
        if (official) {
            // Edit Mode
            setIsEditMode(true);
            setCurrentOfficial(official);
            setName(official.name);
            setPosition(official.position && POSITIONS.includes(official.position) ? official.position : POSITIONS[0]); 
            setCommittee(official.committee && COMMITTEES.includes(official.committee) ? official.committee : COMMITTEES[0]);
            setContact(official.contact || '');
            setPicturePath(official.picture_path || ''); 
            setProfilePictureFile(null);
        } else {
            // Add Mode
            setIsEditMode(false);
            setCurrentOfficial(null);
            setName('');
            setPosition(POSITIONS[0]);
            setCommittee(COMMITTEES[0]);
            setContact('');
            setPicturePath('');
            setProfilePictureFile(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset all modal state
        setName('');
        setPosition(POSITIONS[0]);
        setCommittee(COMMITTEES[0]);
        setContact('');
        setProfilePictureFile(null);
        setPicturePath('');
        setError(null);
        setIsSubmitting(false); // Reset submitting state
        setFocusedInput(null);
    };
    
    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            // Revoke previous blob URL if it exists
            if (picturePath.startsWith('blob:')) {
                URL.revokeObjectURL(picturePath);
            }
            setPicturePath(URL.createObjectURL(file)); 
        } else {
            setProfilePictureFile(null);
            // Revert to original path if in edit mode and canceling file selection
            setPicturePath(isEditMode && currentOfficial?.picture_path ? currentOfficial.picture_path : '');
        }
    };
    
    const handleRemovePicture = () => {
        if (picturePath.startsWith('blob:')) {
            URL.revokeObjectURL(picturePath); 
        }
        setProfilePictureFile(null); 
        setPicturePath(''); 
    }


    // Toast Handler
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast({ message: '', type: '' });
    };

    // Delete Confirmation Modal Handlers
    const openConfirmModal = (official) => {
        setOfficialToDelete(official);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setOfficialToDelete(null);
        setIsConfirmModalOpen(false);
    };

    // NEW: Edit Confirmation Modal Handlers
    const openEditConfirmModal = (official) => {
        setOfficialToEdit(official);
        setIsEditConfirmModalOpen(true);
    };

    const closeEditConfirmModal = () => {
        setOfficialToEdit(null);
        setIsEditConfirmModalOpen(false);
    };

    const handleEditConfirmed = () => {
        // 1. Close the confirmation modal
        closeEditConfirmModal();
        // 2. Open the main Edit modal with the selected official
        if (officialToEdit) {
            handleOpenModal(officialToEdit);
        }
    };


    // --- CRUD Operations ---

    const handleAddOrUpdateOfficial = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        let finalPicturePath = isEditMode && currentOfficial ? currentOfficial.picture_path : null; 
        setError(null);
        
        // 1. Handle File Upload
        if (profilePictureFile && profilePictureFile instanceof File) {
            try {
                const formData = new FormData();
                // NOTE: The server.js code is expecting the field name 'official_picture', not 'profilePicture'
                // Ensure your server is configured to accept the field name used here, or update the client/server.
                // Assuming you will update server.js to look for 'profilePicture' or will correct this field name:
                formData.append('official_picture', profilePictureFile); 

                const uploadResponse = await fetch(UPLOAD_API_URL, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const errorBody = await uploadResponse.json();
                    throw new Error(errorBody.message || 'Picture upload failed.');
                }
                
                const uploadData = await uploadResponse.json();
                finalPicturePath = uploadData.picturePath;

            } catch (err) {
                console.error("Upload error:", err);
                setError(`Failed to upload picture: ${err.message}`);
                setIsSubmitting(false);
                return;
            }
        } else if (picturePath === '') {
            // User explicitly removed the picture or never had one
            finalPicturePath = null;
        } else if (picturePath && !picturePath.startsWith('blob:')) {
            // Picture path exists and is the existing remote URL (not a local blob URL)
            finalPicturePath = picturePath;
        }
        
        // 2. Prepare official data for CRUD operation
        const officialData = {
            name,
            position,
            committee: committee === COMMITTEES[0] ? null : committee, // Store null if 'None' is selected
            contact: contact || null,
            picturePath: finalPicturePath,
        };

        try {
            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${API_URL}/${currentOfficial.id}` : API_URL;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(officialData),
            });
            
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
            }

            // Success
            const successMessage = isEditMode ? 'Official updated successfully!' : 'New official added successfully!';
            showToast(successMessage, 'success');

            handleCloseModal();
            fetchOfficials(); 

        } catch (err) {
            console.error("CRUD error:", err);
            setError(`Operation failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOfficialConfirmed = async () => {
        if (!officialToDelete) return;

        const { id: officialId, name: officialName } = officialToDelete;
        closeConfirmModal(); // Close the confirmation modal first

        try {
            setError(null);
            const response = await fetch(`${API_URL}/${officialId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
            }

            showToast(`${officialName} has been deleted successfully.`, 'success');
            fetchOfficials();

        } catch (err) {
            console.error("Delete error:", err);
            showToast(`Failed to delete official: ${err.message}`, 'error');
        }
    };
    
    // --- Renderers ---

    const renderOfficialTable = () => {
        if (isLoading) return <div style={styles.loadingText}><Loader size={20} style={styles.spinner} /> Loading officials...</div>;
        if (error && !isModalOpen && !isConfirmModalOpen && !isEditConfirmModalOpen) return <div style={styles.alertError}>Error: {error}</div>;
        if (officials.length === 0) return <div style={styles.noDataText}>No officials found. Click 'Add New Official' to start.</div>;

        return (
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Picture</th> 
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Position</th>
                        <th style={styles.th}>Committee</th>
                        <th style={styles.th}>Contact</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {officials.map((official) => (
                        <tr key={official.id} style={styles.tr}>
                            <td style={styles.td}>
                                {official.picture_path ? (
                                    <img 
                                        // Path to static files served by server.js at /media
                                        src={official.picture_path.startsWith('http') ? official.picture_path : `http://localhost:5000${official.picture_path}`} 
                                        alt={official.name}
                                        style={styles.tablePicture} 
                                    />
                                ) : (
                                    <Users size={24} color="#64748B" /> 
                                )}
                            </td>
                            <td style={styles.td}>{official.name}</td>
                            <td style={styles.td}>{official.position}</td>
                            <td style={styles.td}>{official.committee || 'N/A'}</td>
                            <td style={styles.td}>{official.contact || 'N/A'}</td>
                            <td style={styles.td}>
                                <button 
                                    // UPDATED: Now calls the confirmation modal
                                    onClick={() => openEditConfirmModal(official)} 
                                    style={{ ...styles.actionButton, marginRight: '8px', backgroundColor: '#2563EB' }} // Darker Blue for Edit
                                    title="Edit Official"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => openConfirmModal(official)} // Open custom confirmation modal for delete
                                    style={{ ...styles.actionButton, backgroundColor: '#DC2626' }} // Darker Red
                                    title="Delete Official"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderAddEditModal = () => {
        if (!isModalOpen) return null;

        const modalTitle = isEditMode ? 'Edit Official' : 'Add New Official';
        const buttonText = isEditMode ? 'Save Changes' : 'Add Official';

        // Helper function for dynamic input styles based on focus
        const getInputStyle = (inputName) => ({
            ...styles.input,
            // Apply a stronger blue border/shadow on focus
            ...(focusedInput === inputName && { 
                borderColor: '#2563EB', 
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.3)', 
            }),
        });

        return (
            <div style={styles.modalBackdrop}>
                <div style={styles.modalContent}>
                    <div style={styles.modalHeader}>
                        <h3 style={styles.modalTitle}>{modalTitle}</h3>
                        <button onClick={handleCloseModal} style={styles.closeButton}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    {error && (
                        <div style={styles.alertError}>
                            <AlertTriangle size={18} style={{ marginRight: '8px' }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAddOrUpdateOfficial}>
                        
                        {/* --- PROFESSIONAL PICTURE UPLOAD SECTION --- */}
                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="profilePicture">Profile Picture (Optional)</label>
                            
                            {/* Picture Preview and Action Buttons */}
                            <div style={styles.pictureUploadContainer}>
                                
                                <div style={styles.picturePreviewWrapper}>
                                    {picturePath ? (
                                        <img 
                                            // Handling both local blob URL (for immediate preview) and remote URL
                                            src={picturePath.startsWith('blob:') 
                                                ? picturePath 
                                                : `http://localhost:5000${picturePath}`} 
                                            alt="Profile Preview"
                                            style={styles.picturePreview}
                                        />
                                    ) : (
                                        <div style={styles.picturePlaceholder}>
                                            <Users size={40} color="#94A3B8" />
                                            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>No Image</p>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.pictureControls}>
                                    <input
                                        type="file"
                                        id="profilePicture"
                                        accept="image/*"
                                        onChange={handlePictureChange}
                                        style={styles.hiddenFileInput}
                                    />
                                    <label htmlFor="profilePicture" style={styles.uploadLabelButton}>
                                        <Image size={16} style={{ marginRight: '8px' }} />
                                        {profilePictureFile || (picturePath && !picturePath.startsWith('blob:')) ? 'Change Picture' : 'Upload Picture'}
                                    </label>
                                    
                                    {(picturePath || profilePictureFile) && (
                                        <button 
                                            type="button" 
                                            onClick={handleRemovePicture}
                                            style={styles.removePictureButton}
                                        >
                                            <Trash2 size={16} style={{ marginRight: '5px' }} />
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ------------------------------------------- */}

                        <div style={styles.formGrid}>
                            
                            {/* Full Name */}
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="name">Full Name*</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                    style={getInputStyle('name')} 
                                    required
                                />
                            </div>

                            {/* Contact */}
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="contact">Contact (Optional)</label>
                                <input
                                    id="contact"
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    onFocus={() => setFocusedInput('contact')}
                                    onBlur={() => setFocusedInput(null)}
                                    style={getInputStyle('contact')}
                                />
                            </div>

                        </div> {/* End formGrid */}
                        
                        <div style={styles.formGrid}>

                            {/* Position (Dropdown/Select) - SK Roles */}
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="position">Official Position*</label>
                                <select
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    onFocus={() => setFocusedInput('position')}
                                    onBlur={() => setFocusedInput(null)}
                                    style={getInputStyle('position')} 
                                    required
                                >
                                    <option value="" disabled>Select Position</option>
                                    {POSITIONS.map((pos) => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Committee (Dropdown/Select) - Barangay Committees */}
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="committee">Committee Assignment*</label>
                                <select
                                    id="committee"
                                    value={committee}
                                    onChange={(e) => setCommittee(e.target.value)}
                                    onFocus={() => setFocusedInput('committee')}
                                    onBlur={() => setFocusedInput(null)}
                                    style={getInputStyle('committee')} 
                                    required
                                >
                                    {COMMITTEES.map((comm) => (
                                        <option key={comm} value={comm}>{comm}</option>
                                    ))}
                                </select>
                            </div>
                            
                        </div> {/* End formGrid */}

                        
                        <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader size={18} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Processing...</>
                            ) : (
                                buttonText
                            )}
                        </button>
                    </form>
                </div>
                {/* Add CSS for spin animation */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    };

    // Delete Confirmation Modal Renderer
    const renderConfirmModal = () => {
        if (!isConfirmModalOpen || !officialToDelete) return null;

        return (
            <div style={styles.modalBackdrop}>
                <div style={styles.confirmModalContent}>
                    <div style={styles.modalHeader}>
                        <h3 style={{ margin: 0, color: '#DC2626' }}>Confirm Deletion</h3>
                        <button onClick={closeConfirmModal} style={styles.closeButton}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
                        <AlertTriangle size={24} color="#DC2626" style={{ marginRight: '15px' }} />
                        <p style={{ margin: 0, color: '#334155' }}>
                            Are you sure you want to delete **{officialToDelete.name}**? 
                            This action cannot be undone.
                        </p>
                    </div>

                    <div style={styles.confirmModalActions}>
                        <button 
                            onClick={closeConfirmModal} 
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteOfficialConfirmed} 
                            style={styles.deleteConfirmButton}
                        >
                            <Trash2 size={16} style={{ marginRight: '5px' }} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // NEW: Edit Confirmation Modal Renderer
    const renderEditConfirmModal = () => {
        if (!isEditConfirmModalOpen || !officialToEdit) return null;

        return (
            <div style={styles.modalBackdrop}>
                <div style={styles.confirmModalContent}>
                    <div style={styles.modalHeader}>
                        <h3 style={{ margin: 0, color: '#2563EB' }}>Confirm Edit</h3> {/* Blue title */}
                        <button onClick={closeEditConfirmModal} style={styles.closeButton}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
                        <Info size={24} color="#2563EB" style={{ marginRight: '15px' }} /> {/* Info icon */}
                        <p style={{ margin: 0, color: '#334155' }}>
                            Are you sure you want to edit the details for **{officialToEdit.name}**? 
                            This will open the official editing form.
                        </p>
                    </div>

                    <div style={styles.confirmModalActions}>
                        <button 
                            onClick={closeEditConfirmModal} 
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleEditConfirmed} 
                            style={styles.editConfirmButton}
                        >
                            <Edit size={16} style={{ marginRight: '5px' }} />
                            Edit Details
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // --- Inline Styles (Adjusted for Pro-Look and New Components) ---
    const styles = {
        container: {
            padding: '30px', // Increased padding
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'Inter, Arial, sans-serif', // Changed font
            backgroundColor: '#F8FAFC', // Light background for the page
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '15px',
            borderBottom: '2px solid #E2E8F0',
        },
        title: {
            fontSize: '32px', // Slightly larger title
            color: '#1E293B',
            margin: 0,
            fontWeight: '800', // Bolder title
        },
        addButton: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px', // Slightly more padding
            backgroundColor: '#2563EB', // Darker blue
            color: 'white',
            border: 'none',
            borderRadius: '10px', // More rounded
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', // Subtle shadow
            transition: 'background-color 0.2s, box-shadow 0.2s',
        },
        // Table Styles (kept largely the same as they were already polished)
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '10px', // More rounded
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)', // Better shadow
            border: '1px solid #E2E8F0',
        },
        th: {
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontWeight: '700',
            padding: '16px', // Slightly more vertical padding
            textAlign: 'left',
            textTransform: 'uppercase',
            fontSize: '12px', // Smaller font for header
        },
        td: {
            padding: '15px 16px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: 'white',
            fontSize: '15px',
            color: '#334155',
        },
        tr: {
            transition: 'background-color 0.1s',
            // No direct ':hover' in inline styles
        },
        actionButton: {
            padding: '10px', // Slightly larger button
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'white',
            transition: 'opacity 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        // Modal Styles
        modalBackdrop: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)', // Darker, more professional backdrop
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        modalContent: {
            backgroundColor: 'white',
            padding: '40px', // More padding
            borderRadius: '16px', // Pro-level rounding
            width: '90%',
            maxWidth: '700px', // Wider modal for the two-column layout
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', // Stronger shadow
            maxHeight: '90vh', 
            overflowY: 'auto',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out', // Added slide-in animation
        },
        confirmModalContent: {
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            animation: 'slideIn 0.3s ease-out',
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '10px',
            borderBottom: '1px solid #E2E8F0',
        },
        modalTitle: {
            margin: 0, 
            color: '#1E293B', 
            fontSize: '24px', 
            fontWeight: '700'
        },
        closeButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            transition: 'color 0.2s',
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '20px',
            // Simple media query simulation for responsiveness
            '@media (maxWidth: 600px)': {
                gridTemplateColumns: '1fr',
            },
        },
        formGroup: {
            marginBottom: '10px', 
        },
        label: {
            display: 'block',
            marginBottom: '6px',
            fontWeight: '600',
            color: '#475569',
            fontSize: '14px',
        },
        // Polished Input/Select Style (base style, adjusted for focus via getInputStyle)
        input: {
            width: '100%',
            padding: '12px',
            border: '1px solid #E2E8F0', // Lighter border
            borderRadius: '8px',
            fontSize: '15px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out', 
        },
        submitButton: {
            width: '100%',
            padding: '14px', // More padding
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '17px',
            marginTop: '30px',
            transition: 'background-color 0.2s, opacity 0.2s',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)',
        },
        alertError: {
            backgroundColor: '#FEF2F2', // Very light red
            color: '#DC2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #FCA5A5', 
        },
        // --- NEW/UPDATED PICTURE UPLOAD STYLES ---
        pictureUploadContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '15px',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            backgroundColor: '#F9FAFB',
            marginBottom: '20px', // Added spacing
        },
        picturePreviewWrapper: {
            flexShrink: 0,
            width: '100px', 
            height: '100px', 
            borderRadius: '50%',
            border: '3px solid #6366F1', // Accent border
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        picturePreview: {
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
        },
        picturePlaceholder: {
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#E5E7EB',
        },
        pictureControls: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        hiddenFileInput: {
            display: 'none',
        },
        uploadLabelButton: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 15px',
            backgroundColor: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 5px rgba(99, 102, 241, 0.3)',
        },
        removePictureButton: {
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
        },
        // ----------------------------------------------------
        loadingText: { 
            textAlign: 'center', 
            fontSize: '18px', 
            color: '#64748B', 
            padding: '50px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        spinner: {
            animation: 'spin 1s linear infinite',
            marginRight: '10px',
        },
        noDataText: { 
            textAlign: 'center', 
            fontSize: '18px', 
            color: '#64748B', 
            padding: '50px 0', 
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
        },
        tablePicture: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #E2E8F0'
        },
        // Confirmation Modal Specific Styles
        confirmModalActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '25px',
            gap: '10px',
        },
        cancelButton: {
            padding: '10px 15px',
            backgroundColor: '#E5E7EB',
            color: '#4B5563',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s',
        },
        deleteConfirmButton: {
            padding: '10px 15px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
        },
        // NEW Style for Edit Confirmation Button
        editConfirmButton: { 
            padding: '10px 15px',
            backgroundColor: '#2563EB', // Blue
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
        },
    };
    
    // Add custom CSS for animation and media query support (as a fallback/simulation in inline styles)
    const animationStyle = `
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Simulated Media Query for formGrid responsiveness */
        @media (max-width: 600px) {
            .formGrid {
                grid-template-columns: 1fr !important;
            }
            .pictureUploadContainer {
                 flex-direction: column;
                 align-items: flex-start;
            }
            .pictureControls {
                 flex-direction: column;
                 align-items: stretch;
                 width: 100%;
            }
        }
    `;

    return (
        <div style={styles.container}>
            <style>{animationStyle}</style>
            
            <div style={styles.header}>
                <h1 style={styles.title}>Official Directory Management</h1>
                <button onClick={() => handleOpenModal()} style={styles.addButton}>
                    <PlusCircle size={20} style={{ marginRight: '8px' }} />
                    Add New Official
                </button>
            </div>

            {renderOfficialTable()}
            {renderAddEditModal()}
            {renderEditConfirmModal()} {/* NEW: Edit Confirmation Modal */}
            {renderConfirmModal()}    {/* Delete Confirmation Modal */}
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={closeToast} 
            />
        </div>
    );
};

export default AdminOfficialsPage;