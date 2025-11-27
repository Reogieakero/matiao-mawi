import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    FiUser, FiMail, FiEdit, FiSave, FiX, FiRefreshCcw, 
    FiCheckCircle, FiAlertTriangle, FiCamera, 
    FiPhone, FiMapPin, 
    FiMessageSquare, 
    FiSend, 
    FiTrash2,
    FiAlertOctagon, 
} from 'react-icons/fi';

// CONSTANT for truncation length (Max characters to show before "Read More")
const MAX_POST_LENGTH = 300; 

// NEW CONSTANT for filter options
const THREAD_FILTERS = [
    { label: 'All Posts', value: 'All' },
    { label: 'Threads', value: 'post' },
    { label: 'Jobs', value: 'job' },
];

// --- Utility Functions (Essential for rendering) ---
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
    
    // ADDED: Check for minutes (m)
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago"; 
    
    return Math.floor(seconds) + "s ago";
};

// Render Avatar (styles defined later)
const renderAvatar = (url, initial, size = 'small') => {
    let style = styles.avatarCircleSmall;
    if (size === 'large') style = styles.avatarCircleLarge;
    if (size === 'tiny') style = styles.avatarCircleTiny;

    if (url) {
        return (
            <div style={style}>
                <img 
                    src={url} 
                    alt={`${initial}`} 
                    style={styles.avatarImage} 
                />
            </div>
        );
    }
    return (
        <div style={style}>{initial ? initial[0] : 'U'}</div> 
    );
};
// ----------------------------------------------------

// --- Custom Alert Popup Component ---
const AlertPopup = ({ message, type, onClose }) => {
    if (!message) return null;

    const isSuccess = type === 'success';
    const icon = isSuccess ? <FiCheckCircle size={24} /> : <FiAlertTriangle size={24} />;
    const bgColor = isSuccess ? '#10b981' : '#f59e0b';

    return (
        <div style={popupStyles.overlay}>
            <div style={{ ...popupStyles.box, backgroundColor: bgColor }}>
                <div style={popupStyles.icon}>{icon}</div>
                <div style={popupStyles.content}>
                    <h3 style={popupStyles.title}>{isSuccess ? 'Success!' : 'Error'}</h3>
                    <p style={popupStyles.message}>{message}</p>
                </div>
                <button style={popupStyles.closeButton} onClick={onClose}>
                    <FiX size={20} />
                </button>
            </div>
        </div>
    );
};
const popupStyles = {
    overlay: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        pointerEvents: 'none',
    },
    box: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        borderRadius: '10px',
        color: '#fff',
        maxWidth: '400px',
        pointerEvents: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.3s ease-out',
    },
    icon: { marginRight: '15px' },
    content: { flexGrow: 1 },
    title: { margin: '0 0 5px 0', fontSize: '16px', fontWeight: '700' },
    message: { margin: 0, fontSize: '14px' },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        marginLeft: '15px',
    },
};

// --- Custom Confirmation Modal Component ---
const ConfirmationModal = ({ isVisible, title, message, threadTitle, threadBody, mediaUrls, onConfirm, onCancel, confirmButtonText = 'Delete', confirmIcon = <FiTrash2 size={18} /> }) => {
    if (!isVisible) return null;

    // Only show a preview for single thread deletion (when threadTitle is present)
    const isSingleThreadDelete = !!threadTitle; 
    const imageUrl = isSingleThreadDelete && mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null; 

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.box}>
                <h3 style={modalStyles.title}>{title}</h3>
                <p style={modalStyles.message}>{message}</p>
                
                {/* Image Preview (Only for single thread delete) */}
                {imageUrl && (
                    <div style={modalStyles.imagePreviewContainer}>
                        <img src={imageUrl} alt="Thread Preview" style={modalStyles.imagePreview} />
                    </div>
                )}

                {/* Thread Content Display (Only for single thread delete) */}
                {isSingleThreadDelete && (
                    <div style={{...modalStyles.threadContentBox, marginTop: imageUrl ? '15px' : '0'}}> 
                        <p style={modalStyles.threadBody}>{threadBody}</p>
                    </div>
                )}

                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.button, ...modalStyles.cancel }} onClick={onCancel}>
                        <FiX size={18} /> Cancel
                    </button>
                    <button style={{ ...modalStyles.button, ...modalStyles.confirm }} onClick={onConfirm}>
                        {confirmIcon} {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
    },
    title: { 
        fontSize: '20px', 
        fontWeight: '700', 
        color: '#dc2626', // Red for danger
        margin: '0 0 10px 0' 
    },
    message: { 
        fontSize: '16px', 
        color: '#4b5563', 
        margin: '0 0 15px 0' 
    },
    imagePreviewContainer: {
        width: '100%',
        height: '180px', 
        overflow: 'hidden',
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)', 
        marginBottom: '20px', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        objectFit: 'cover', 
        display: 'block',
        transition: 'transform 0.3s ease', 
    },
    threadContentBox: {
        backgroundColor: '#fef2f2', 
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        padding: '15px',
        margin: '15px 0 25px 0', 
        textAlign: 'left',
        maxHeight: '150px',
        overflowY: 'auto',
    },
    threadTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#b91c1c', 
        margin: '0 0 5px 0',
    },
    threadBody: {
        fontSize: '14px',
        color: '#ef4444', 
        margin: 0,
        lineHeight: 1.4,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3, 
        WebkitBoxOrient: 'vertical',
        textOverflow: 'ellipsis',
    },
    actions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    button: {
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
        border: 'none',
    },
    confirm: { 
        backgroundColor: '#dc2626', 
        color: '#fff',
    },
    cancel: { 
        backgroundColor: '#f3f4f6', 
        color: '#4b5563',
        border: '1px solid #d1d5db',
    }
};

// --- NEW COMPONENT: EditProfileModal (REPLACES INLINE EDITING LOGIC) ---
const EditProfileModal = ({ 
    isVisible, 
    onClose, 
    userData, 
    onSave, // The master save handler from ProfilePage
    loading,
    currentProfilePictureUrl,
    setPopup,
    userName // Original prop for fallback
}) => {
    
    // --- State Management for Editing Fields (Moved from ProfilePage) ---
    const [editedName, setEditedName] = useState(userData?.name || userName || '');
    const [editedContact, setEditedContact] = useState(userData?.contact || '');
    const [editedAddress, setEditedAddress] = useState(userData?.address || '');
    // profilePictureUrl is local here, representing the current/preview picture state
    const [profilePictureUrl, setProfilePictureUrl] = useState(userData?.profilePictureUrl || currentProfilePictureUrl || ''); 
    const [selectedFile, setSelectedFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(''); 
    const [isDragging, setIsDragging] = useState(false);
    
    // NEW STATE: For inline validation errors
    const [nameError, setNameError] = useState(''); 
    const [contactError, setContactError] = useState(''); // NEW STATE for contact number

    const fileInputRef = useRef(null);
    // const currentUserId = parseInt(localStorage.getItem('userId'), 10); // Commented out to prevent no-undef

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isVisible) {
            // Initialize with current data from props
            setEditedName(userData?.name || userName || '');
            setEditedContact(userData?.contact || '');
            setEditedAddress(userData?.address || '');
            setProfilePictureUrl(userData?.profilePictureUrl || currentProfilePictureUrl || '');
            setSelectedFile(null); // Reset file selection
            setPreviewUrl(''); // Reset preview
            setNameError(''); // Reset name error
            setContactError(''); // Reset contact error
        }
    }, [isVisible, userData, userName, currentProfilePictureUrl]);
    
    // Cleanup for local object URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!isVisible) return null;

    // --- Photo/File Handlers (Moved from ProfilePage) ---
    const handleFileSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            setPopup({ message: 'Please select an image file.', type: 'error' });
            setSelectedFile(null);
            setPreviewUrl('');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setPopup({ message: 'File size must be under 2MB.', type: 'error' });
            setSelectedFile(null);
            setPreviewUrl('');
            return;
        }

        setSelectedFile(file);
        
        // Revoke old URL before creating a new one
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);
        setProfilePictureUrl(newPreviewUrl); // Update the main picture state with the preview URL
    };
    
    // Manual click trigger for hidden file input
    const handlePictureClick = () => fileInputRef.current.click(); 

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
        setIsDragging(false);
    };

    const currentPictureSource = previewUrl || profilePictureUrl;

    // Helper to render an editable field (Modified for Modal)
    // ADDED: error parameter
    const renderModalField = (label, value, stateSetter, icon, error) => ( 
        <div style={modalEditStyles.fieldRow}>
            <div style={modalEditStyles.fieldLabel}>
                {icon} 
                <span>{label}</span>
            </div>
            <input 
                type="text" 
                value={value} 
                onChange={(e) => stateSetter(e.target.value)} 
                style={{
                    ...modalEditStyles.fieldInput,
                    // Apply error style if an error message exists
                    ...(error ? modalEditStyles.fieldInputError : {}) 
                }}
                disabled={loading}
                placeholder={`Enter new ${label.toLowerCase()}`}
            />
            {/* NEW: Display Error Message */}
            {error && (
                <p style={modalEditStyles.errorMessage}><FiAlertTriangle size={14} /> {error}</p>
            )}
        </div>
    );
    
    // --- Save/Cancel Handlers for Modal (NEW) ---
    const handleModalCancel = () => {
        // Reset state before closing
        setEditedName(userData?.name || userName || '');
        setEditedContact(userData?.contact || '');
        setEditedAddress(userData?.address || '');
        setSelectedFile(null); 
        setPreviewUrl(''); 
        setNameError(''); 
        setContactError(''); // Clear contact error on cancel
        onClose(); // Calls setIsEditModalVisible(false)
    };

    const handleModalSave = () => {
        // 1. Validate
        setNameError(''); // Clear previous name error
        setContactError(''); // Clear previous contact error
        
        if (!editedName.trim()) {
            setNameError('Name cannot be empty.'); 
            return;
        }

        // --- CONTACT NUMBER VALIDATION ---
        const contactNumber = editedContact.trim();
        // Regex: Must start with '09' followed by exactly 9 digits (total 11)
        const contactRegex = /^09\d{9}$/; 

        // Only validate if a contact number is provided (it's optional, but if provided, it must be valid)
        if (contactNumber && !contactRegex.test(contactNumber)) {
            setContactError('Contact No. must start with "09" and have exactly 11 digits (e.g., 09xxxxxxxxx).'); 
            return; // Stop if validation fails
        }
        // ---------------------------------

        // 2. Prepare payload for the parent's onSave handler
        const savePayload = {
            editedName: editedName.trim(),
            editedContact: contactNumber, // Use the validated/trimmed value
            editedAddress: editedAddress.trim(),
            selectedFile: selectedFile, 
            existingProfilePictureUrl: profilePictureUrl, // The current URL (DB or preview URL)
        };
        
        // 3. Call parent's onSave (which is handleSaveProfileDetails in ProfilePage)
        onSave(savePayload);
    };


    return (
        <div style={modalStyles.overlay}>
            <div style={modalEditStyles.box}>
                <h3 style={modalEditStyles.title}>Edit Your Profile</h3>
                <p style={modalEditStyles.message}>Update your personal details and profile picture.</p>
                
                {/* Picture Upload Area */}
                <div style={modalEditStyles.pictureArea}>
                    <div 
                        style={{...modalEditStyles.pictureCircle, ...(isDragging ? modalEditStyles.pictureCircleDragging : {})}}
                        onClick={handlePictureClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        title="Click or Drag to Upload"
                    >
                        {currentPictureSource ? (
                            <img src={currentPictureSource} alt="Profile" style={styles.avatarImage} />
                        ) : (
                            <FiCamera size={40} color="#6b7280" />
                        )}
                        <div style={modalEditStyles.pictureOverlay}>
                            <FiCamera size={20} />
                        </div>
                    </div>
                    {selectedFile && (
                        <p style={modalEditStyles.fileName}>{selectedFile.name}</p>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={loading}
                    />
                </div>

                {/* Editable Fields */}
                <div style={modalEditStyles.fieldsContainer}>
                    {/* Name Field with inline error */}
                    {renderModalField('Name', editedName, setEditedName, <FiUser size={18} />, nameError)} 
                    
                    <div style={modalEditStyles.fieldRow}>
                        <div style={modalEditStyles.fieldLabel}>
                            <FiMail size={18} /> 
                            <span>Email (Non-Editable)</span>
                        </div>
                        <input 
                            type="email" 
                            value={userData?.email || 'N/A'} 
                            style={{...modalEditStyles.fieldInput, backgroundColor: '#f3f4f6'}}
                            disabled={true}
                        />
                    </div>
                    
                    {/* Contact No. Field with inline error */}
                    {renderModalField('Contact No.', editedContact, setEditedContact, <FiPhone size={18} />, contactError)}
                    
                    {renderModalField('Address', editedAddress, setEditedAddress, <FiMapPin size={18} />)}
                </div>

                {/* Actions */}
                <div style={modalEditStyles.actions}>
                    <button 
                        style={modalEditStyles.buttonStyles.cancelButton} 
                        onClick={handleModalCancel} 
                        disabled={loading} 
                    >
                        <FiX size={18} /> Cancel
                    </button>
                    <button 
                        style={modalEditStyles.buttonStyles.saveButton} 
                        // Disable if loading or if there's a name or contact error
                        onClick={handleModalSave} 
                        disabled={loading || !editedName.trim() || !!nameError || !!contactError} 
                    >
                        {loading ? <FiRefreshCcw size={18} style={styles.spinner} /> : <FiSave size={18} />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- END EditProfileModal ---

// --- NEW COMPONENT: ReadPostModal (Pro-Level Polish) ---
const ReadPostModal = ({ isVisible, thread, onClose, renderAvatar }) => {
    if (!isVisible || !thread) return null;

    // Determine the post type label
    const postTypeLabel = thread.type === 'job' ? 'Job Posting' : 'Community Thread'; 
    
    // Filter and prepare images
    const imageUrls = (thread.mediaUrls || []).filter(url => 
        url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    );

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalReadStyles.box} onClick={(e) => e.stopPropagation()}>
                
                {/* Close Button & Header */}
                <div style={modalReadStyles.header}>
                    <div style={modalReadStyles.postTypeTag}>{postTypeLabel}</div>
                    <button style={modalReadStyles.closeButton} onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                {/* User Info */}
                <div style={modalReadStyles.userInfo}>
                    {renderAvatar(thread.author_picture_url, thread.author, 'small')}
                    <div style={modalReadStyles.authorDetails}>
                        <span style={modalReadStyles.authorName}>{thread.author}</span>
                        <span style={modalReadStyles.postTime}>{getTimeSince(thread.time)}</span>
                    </div>
                </div>
                
                {/* Scrollable Body Content */}
                <div style={modalReadStyles.bodyScrollContainer}>
                    {/* Title */}
                    
                    {/* Media Gallery (Before Body for better visual hierarchy) */}
                    {imageUrls.length > 0 && (
                        <div style={modalReadStyles.mediaGallery}>
                            {imageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Media ${index}`} style={modalReadStyles.mediaImage} />
                            ))}
                        </div>
                    )}

                    {/* Full Text Body */}
                    <p style={modalReadStyles.textBody}>{thread.body}</p>

                    {/* Job Contact Info (If applicable) */}
                    {thread.type === 'job' && thread.contactNumber && (
                        <div style={modalReadStyles.jobContactBox}>
                            <FiPhone size={18} /> 
                            <span style={modalReadStyles.jobContactText}>
                                **Contact:** {thread.contactNumber}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer (Placeholder for actions/comments if needed) */}
                <div style={modalReadStyles.footer}>
                    <span style={modalReadStyles.readFooterText}>
                        Viewing full content of the post.
                    </span>
                </div>
            </div>
        </div>
    );
};
// --- END ReadPostModal ---

// --- NEW MODAL STYLES (Use existing modalStyles and augment) ---
const modalEditStyles = {
    // Inherits overlay from modalStyles
    box: { 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        padding: '30px', 
        maxWidth: '600px', // Wider box for fields
        width: '90%', 
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)', 
        textAlign: 'left', // Align text left
        maxHeight: '90vh', 
        overflowY: 'auto', 
    },
    title: { 
        fontSize: '24px', 
        fontWeight: '700', 
        color: '#1f2937', 
        margin: '0 0 5px 0' 
    },
    message: { 
        fontSize: '14px', 
        color: '#6b7280', 
        margin: '0 0 25px 0' 
    },
    pictureArea: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '25px',
    },
    pictureCircle: {
        width: '120px', 
        height: '120px', 
        borderRadius: '50%', 
        backgroundColor: '#e5e7eb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        position: 'relative', 
        cursor: 'pointer',
        border: '3px solid #d1d5db',
        transition: 'all 0.2s',
    },
    pictureCircleDragging: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
    },
    pictureOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
        color: '#fff',
    },
    fileName: {
        fontSize: '12px',
        color: '#4b5563',
        marginTop: '8px',
        maxWidth: '200px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    fieldsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '25px',
    },
    fieldRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    fieldLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
    },
    fieldInput: {
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '5px',
    },
    fieldInputError: { // STYLE for red border on error
        border: '1px solid #ef4444', 
        boxShadow: '0 0 0 1px #fca5a5',
    },
    errorMessage: { // STYLE for the validation message
        color: '#ef4444', 
        fontSize: '12px',
        marginTop: '5px',
        padding: '0 5px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: '500',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    // NEW BUTTON STYLES FOR THE MODAL
    buttonStyles: {
        base: {
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s, box-shadow 0.2s, opacity 0.2s',
            border: 'none',
            outline: 'none',
        },
        saveButton: {
            backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
        marginTop: '10px',
            ':hover': {
                backgroundColor: '#059669',
            },
            ':disabled': {
                backgroundColor: '#9ca3af',
                color: '#d1d5db',
                cursor: 'not-allowed',
                boxShadow: 'none',
            },
        },
        cancelButton: {
            
            border: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s',
            marginTop: '10px',
            backgroundColor: '#f3f4f6', // Light Gray
            color: '#4b5563',
            border: '1px solid #d1d5db',
            ':hover': {
                backgroundColor: '#e5e7eb',
                color: '#1f2937',
            },
            ':disabled': {
                opacity: 0.7,
                cursor: 'not-allowed',
            },
        }
    }
};

// --- NEW MODAL READ STYLES (Pro-Level Polish) ---
const modalReadStyles = {
    box: {
        backgroundColor: '#fff',
        borderRadius: '16px', // Slightly larger border-radius
        width: '95%',
        maxWidth: '800px', // Wider modal for content focus
        maxHeight: '90vh',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '20px 25px 15px 25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f3f4f6',
    },
    postTypeTag: {
        backgroundColor: '#e0f2f1',
        color: '#047857',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#9ca3af',
        cursor: 'pointer',
        padding: '5px',
        transition: 'color 0.2s',
        // ':hover': { // Assuming styling-in-js handles this via separate style logic or a framework
        //     color: '#ef4444',
        // },
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px 25px',
        borderBottom: '1px solid #e5e7eb',
    },
    authorDetails: {
        display: 'flex',
        flexDirection: 'column',
    },
    authorName: {
        fontWeight: '600',
        fontSize: '15px',
        color: '#1e40af',
    },
    postTime: {
        fontSize: '13px',
        color: '#6b7280',
    },
    bodyScrollContainer: {
        padding: '25px',
        overflowY: 'auto', // Scrollable content area
        flexGrow: 1,
    },
    title: {
        fontSize: '28px', // Larger, bolder title
        fontWeight: '800',
        color: '#111827',
        margin: '0 0 20px 0',
        lineHeight: 1.3,
    },
    textBody: {
        fontSize: '17px',
        color: '#374151',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap', // Preserve formatting
        marginBottom: '20px',
    },
    mediaGallery: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '25px',
    },
    mediaImage: {
        width: '100%',
        height: '250px',
        objectFit: 'cover',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        // transition: 'transform 0.3s', // Assuming styling-in-js handles this
        // ':hover': {
        //     transform: 'scale(1.01)',
        // },
    },
    jobContactBox: {
        fontSize: '17px',
        color: '#059669',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '15px 0 0 0',
        padding: '15px 20px',
        backgroundColor: '#ecfdf5',
        borderRadius: '10px',
        border: '1px solid #a7f3d0',
    },
    jobContactText: {
        fontWeight: '700',
    },
    footer: {
        padding: '15px 25px',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center',
    },
    readFooterText: {
        fontSize: '13px',
        color: '#9ca3af',
    }
};

// --- END Modal Styles ---

// --- Core Thread/Post Components (Simplified for context) ---
// FIX 1: Converted renderPostBody function into a React Component (PostBody)
const PostBody = ({ thread }) => {
    // ... (existing renderPostBody logic)
    const postContent = thread.body || '';
    const needsTruncation = postContent.length > MAX_POST_LENGTH;
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Fallback to post type if no tag
    const postTypeLabel = thread.type === 'job' ? 'Job Posting' : 'Community Thread'; 

    const displayContent = isExpanded || !needsTruncation 
        ? postContent
        : postContent.substring(0, MAX_POST_LENGTH) + '...';

    const handleReadMore = (e) => {
        e.stopPropagation(); // Prevent opening the read modal
        if (needsTruncation) {
            setIsExpanded(prev => !prev);
        }
    };

    return (
        <div style={styles.threadBodyContainer}>
            <p style={styles.threadPostType}>{postTypeLabel}</p>
            {thread.type === 'job' && thread.contactNumber && (
                 <p style={styles.jobContact}><FiPhone size={14} /> Contact: {thread.contactNumber}</p>
            )}
            <p style={styles.threadBody}>
                {displayContent}
                {needsTruncation && (
                    <span 
                        style={styles.readMore} 
                        onClick={handleReadMore}
                    >
                        {isExpanded ? ' Read Less' : ' Read More'}
                    </span>
                )}
            </p>
        </div>
    );
};

const renderMediaGallery = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const imageUrls = mediaUrls.filter(url => 
        url.match(/\.(jpeg|jpg|gif|png|webp)$/i)
    );
    if (imageUrls.length === 0) return null; 

    return (
        <div style={styles.mediaGallery}>
            <img 
                src={imageUrls[0]} 
                alt="Post Media" 
                style={styles.mediaImage}
            />
            {imageUrls.length > 1 && (
                <div style={styles.mediaCounter}>
                    +{imageUrls.length - 1}
                </div>
            )}
        </div>
    );
};

// --- Profile Page Component ---
const ProfilePage = ({ 
    userName, 
    userEmail, 
    userId, // <-- This is the key prop needed for API calls
    currentProfilePictureUrl, 
    onUpdateUser // <-- NEW PROP
}) => {
    const [userData, setUserData] = useState(null); // User data from server (name, email, contact, address, pic_url)
    const [userThreads, setUserThreads] = useState([]);
    const [isThreadsLoading, setIsThreadsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [popup, setPopup] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [deleteModal, setDeleteModal] = useState(null); // { id, type, title, body, mediaUrls } for single thread delete
    const [deleteAllModal, setDeleteAllModal] = useState(false); // for bulk delete
    const [isReadModalOpen, setIsReadModalOpen] = useState(false);
    const [readModalThread, setReadModalThread] = useState(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false); // <-- NEW STATE for Edit Modal

    // State for response section
    const [showResponses, setShowResponses] = useState(null); // thread id
    const [responses, setResponses] = useState([]);
    const [newResponse, setNewResponse] = useState('');

    const filteredThreads = userThreads.filter(thread => 
        selectedFilter === 'All' || thread.type === selectedFilter
    );

    // Close popup handler
    const closePopup = () => setPopup(null);
    
    // --- NEW: Helper to upload the picture to the server (Called by handleSaveProfileDetails) ---
    const uploadPictureToServer = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file); // 'profile_picture' must match the multer field name

        try {
            // userId is passed in the URL params for the server's multer config
            const res = await fetch(`http://localhost:5000/api/profile/upload-picture/${userId}`, {
                method: 'POST',
                // Important: Do NOT set 'Content-Type' header for FormData. The browser handles it.
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Picture upload failed.');
            }

            setPopup({ message: 'Picture uploaded to server temporarily.', type: 'success' });
            return data.pictureUrl; // The temporary URL of the uploaded file
        } catch (err) {
            console.error("Picture upload error:", err);
            setPopup({ message: `Picture upload failed: ${err.message}`, type: 'error' });
            return null;
        }
    }, [userId]);


    // --- NEW: Master Save Handler (Passed to EditProfileModal as onSave) ---
    const handleSaveProfileDetails = useCallback(async ({ editedName, editedContact, editedAddress, selectedFile, existingProfilePictureUrl }) => {
        setLoading(true);
        setError(null);

        let newPictureUrl = existingProfilePictureUrl; 

        // 1. Handle profile picture upload first if a new file was selected
        if (selectedFile) {
            const uploadedUrl = await uploadPictureToServer(selectedFile);
            if (uploadedUrl) {
                newPictureUrl = uploadedUrl;
            } else {
                setLoading(false);
                return; // Stop if picture upload fails
            }
        }
        
        // 2. Handle profile details update (including the (new or existing) picture URL)
        try {
            const updatedFields = {
                editedName,
                editedContact,
                editedAddress,
                newProfilePictureUrl: newPictureUrl, // Pass the new or existing URL
            };

            const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
                method: 'PUT', // Use PUT for update
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFields),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update profile details.');
            }

            setPopup({ message: 'Profile updated successfully!', type: 'success' });
            setIsEditModalVisible(false); // Close modal on success

            // Update local state in ProfilePage
            setUserData(prev => ({
                ...prev,
                name: updatedFields.editedName,
                contact: updatedFields.editedContact,
                address: updatedFields.editedAddress,
                profilePictureUrl: data.updatedPictureUrl, // Use the final URL returned by the server
            }));
            
            // Update global state in App.jsx
            onUpdateUser({ 
                name: data.updatedName, // Use 'name' instead of 'updatedName' to match App.jsx's handleUpdateUser function signature
                profilePictureUrl: data.updatedPictureUrl 
            });

        } catch (err) {
            console.error("Profile details update error:", err);
            setPopup({ message: `Profile details update failed: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [userId, onUpdateUser, uploadPictureToServer]); 

    // --- Fetch User Threads ---
    const fetchUserThreads = useCallback(async () => {
        if (!userId) {
            setIsThreadsLoading(false);
            return;
        }
        setIsThreadsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/user-threads/${userId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch user threads.");
            }
            const data = await res.json();
            setUserThreads(data);
        } catch (err) {
            console.error("Fetch user threads error:", err);
            setError(err.message);
        } finally {
            setIsThreadsLoading(false);
        }
    }, [userId]);

    // --- Fetch User Data (Profile Details) ---
    const fetchUserData = useCallback(async () => {
        if (!userId) {
            setError("User not logged in or User ID is missing.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // NEW FETCH: Use the dedicated GET endpoint
            const res = await fetch(`http://localhost:5000/api/profile/${userId}`); 
            if (!res.ok) {
                if (res.status === 404) {
                    // Handle 404: User exists but has no custom profile details yet
                    const defaultData = { 
                        name: userName, 
                        email: userEmail, 
                        contact: '', 
                        address: '', 
                        profilePictureUrl: currentProfilePictureUrl // Fallback to current global state picture
                    }; 
                    setUserData(defaultData); 
                    setLoading(false);
                    return;
                }
                throw new Error("Failed to fetch user data.");
            }
            const data = await res.json(); // Data now includes name, email, contact, address, profilePictureUrl
            setUserData(data); 
        } catch (err) {
            console.error("Fetch user data error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, userName, userEmail, currentProfilePictureUrl]);

    useEffect(() => {
        fetchUserThreads();
        fetchUserData();
    }, [fetchUserThreads, fetchUserData]);
    
    // ... (rest of existing thread and response logic)

    // --- Delete Thread Handlers ---
    const handleDeleteThread = (thread) => {
        setDeleteModal({
            id: thread.id,
            type: thread.type,
            title: thread.title,
            body: thread.body,
            mediaUrls: thread.mediaUrls,
        });
    };

    const confirmDeleteThread = async () => {
        if (!deleteModal) return;

        setDeleteModal(null);
        setLoading(true);

        const { id, type } = deleteModal;
        
        try {
            const res = await fetch(`http://localhost:5000/api/threads/${type}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                // FIX 2: Replaced undefined 'currentUserId' with 'userId' prop
                body: JSON.stringify({ userId: userId }), 
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `Failed to delete ${type}.`);
            }

            // CRITICAL UPDATE FOR AUTO-REFRESH: Remove the deleted thread from state
            setUserThreads(prev => prev.filter(thread => !(thread.id === id && thread.type === type)));

            setPopup({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, type: 'success' });
        } catch (err) {
            console.error("Delete thread error:", err);
            setPopup({ message: `Deletion failed: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    // --- Delete All Posts Handler (NEW) ---
    const handleDeleteAllPosts = () => {
        setDeleteAllModal(true);
    };

    // UPDATED: Clear userThreads state upon successful bulk deletion
    const confirmDeleteAllThreads = async () => {
        setDeleteAllModal(false);
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/user-threads/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete all threads.');
            }
            // CRITICAL UPDATE FOR AUTO-REFRESH: Clear the state immediately
            setUserThreads([]);
            
            // Set success popup
            setPopup({ message: 'All your community threads and jobs have been successfully deleted!', type: 'success' });
            
            // New: Set a timeout to clear the popup after 2000ms (2 seconds)
            setTimeout(() => {
                setPopup(null);
            }, 2000);

        } catch (err) {
            console.error("Delete All Threads error:", err);
            setPopup({ message: `Bulk deletion failed: ${err.message}.`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // --- Read Modal Handlers ---
    const openReadModal = (thread) => {
        setReadModalThread(thread);
        setIsReadModalOpen(true);
        setShowResponses(null); // Close responses when opening read modal
    };

    const closeReadModal = () => {
        setIsReadModalOpen(false);
        setReadModalThread(null);
        setShowResponses(null); // Ensure responses are closed
    };

    const fetchResponses = useCallback(async (threadId, threadType) => {
        try {
            const res = await fetch(`http://localhost:5000/api/responses/${threadType}/${threadId}`);
            if (!res.ok) throw new Error('Failed to fetch responses.');
            const data = await res.json();
            setResponses(data);
        } catch (err) {
            console.error("Error fetching responses:", err);
            setResponses([]);
        }
    }, []);

    // Toggle responses
    const handleToggleResponses = (threadId, threadType) => {
        if (showResponses === threadId) {
            setShowResponses(null);
            setResponses([]);
        } else {
            setShowResponses(threadId);
            fetchResponses(threadId, threadType);
        }
    };
    
    // Response submission
    const handleSubmitResponse = async (e) => {
        e.preventDefault();
        if (!newResponse.trim() || !showResponses) return; 
        
        const currentThread = userThreads.find(t => t.id === showResponses);
        if (!currentThread) return;

        const payload = {
            userId: userId,
            threadId: currentThread.id,
            threadType: currentThread.type,
            content: newResponse.trim(),
            parentResponseId: null,
        };

        try {
            const res = await fetch('http://localhost:5000/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to submit response.');
            }

            setNewResponse('');
            setPopup({ message: 'Response submitted successfully!', type: 'success' });
            fetchResponses(currentThread.id, currentThread.type); // Refresh responses

            // Optional: Increment responseCount in userThreads state locally
            setUserThreads(prev => prev.map(t => t.id === currentThread.id ? { ...t, responseCount: (t.responseCount || 0) + 1 } : t));

        } catch (err) {
            console.error("Response submission error:", err);
            setPopup({ message: `Response submission failed: ${err.message}`, type: 'error' });
        }
    };

    const renderResponse = (response) => (
        <div key={response.id} style={styles.responseItem}>
            <div style={styles.responseMeta}>
                {renderAvatar(response.author_picture_url, response.author, 'tiny')}
                <div style={styles.responseAuthorText}>
                    <span style={styles.responseAuthorName}>{response.author}</span>
                    <span style={styles.responseTime}>{getTimeSince(response.time)}</span>
                </div>
            </div>
            <p style={styles.responseContent}>{response.content}</p>
        </div>
    );


    // Render individual thread card
    const renderThread = (thread) => (
        <div key={`${thread.type}-${thread.id}`} style={styles.threadCard} onClick={() => openReadModal(thread)}>
            <div style={styles.threadHeader}>
                <div style={styles.threadAuthor}>
                    {renderAvatar(thread.author_picture_url, thread.author, 'small')}
                    <div style={styles.authorDetails}>
                        <span style={styles.threadAuthorName}>{thread.author}</span>
                        <span style={styles.threadTime}>{getTimeSince(thread.time)}</span>
                    </div>
                </div>
                <div style={styles.threadTag}>
                    {thread.tag}
                </div>
            </div>
            {/* Post title has been removed as per previous user request */}
            {/* Use PostBody component for truncation/Read More */}
            <PostBody thread={thread} /> {/* FIX 1: Updated call site */}
            {renderMediaGallery(thread.mediaUrls)}

            {/* ACTION BAR: Now includes the Delete Button */}
            <div style={styles.threadActions}>
                <div style={{...styles.threadStats, cursor: 'pointer', color: showResponses === thread.id ? '#1d4ed8' : '#6b7280'}} 
                    onClick={(e) => { e.stopPropagation(); handleToggleResponses(thread.id, thread.type); }}
                >
                    <FiMessageSquare size={18} /> {thread.responseCount ?? 0} Responses
                </div>
                {/* Delete Button - Passes full thread object */}
                <button 
                    style={styles.deleteThreadButton} 
                    onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread); }} 
                    title="Delete this Thread/Job"
                >
                    <FiTrash2 size={16} /> 
                </button>
            </div>
            
            {/* Responses Section */}
            {showResponses === thread.id && (
                <div style={styles.responsesContainer} onClick={(e) => e.stopPropagation()}>
                    {/* Response Form */}
                    <form onSubmit={handleSubmitResponse} style={styles.responseForm}>
                        <input
                            type="text"
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            placeholder="Write a response..."
                            style={styles.responseInput}
                            required
                        />
                        <button type="submit" style={styles.responseSendButton} title="Send Response">
                            <FiSend size={18} />
                        </button>
                    </form>

                    {/* Responses List */}
                    {responses.length > 0 ? (
                        responses.map(renderResponse)
                    ) : (
                        <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', margin: '15px 0' }}>No responses yet.</p>
                    )}
                </div>
            )}
        </div>
    );


    if (error) return <div style={{...styles.container, color: '#dc2626'}}>{error}</div>;

    return (
        <main style={styles.container}>
            {/* Alert Popup (for general errors like picture upload or server issues) */}
            <AlertPopup 
                message={popup?.message} 
                type={popup?.type} 
                onClose={closePopup} 
            />

            {/* Profile Card */}
            <div style={styles.profileCard}>
                <div style={styles.profileHeader}>
                    {/* Use userData?.profilePictureUrl if fetched, otherwise fallback */}
                    {renderAvatar(userData?.profilePictureUrl || currentProfilePictureUrl, userData?.name || userName, 'large')}
                    <h1 style={styles.profileName}>{userData?.name || userName}</h1>
                    <p style={styles.profileEmail}>{userData?.email || userEmail}</p>
                    
                    {/* EDIT BUTTON: Updated onClick to show modal */}
                    <button style={styles.editButton} onClick={() => setIsEditModalVisible(true)} disabled={loading}>
                        <FiEdit size={18} /> Edit Profile
                    </button>
                </div>
                <div style={styles.profileDetails}>
                    <h2 style={styles.detailsTitle}>Contact Information</h2>
                    <div style={styles.profileMeta}>
                        <div style={styles.fieldRow}>
                            <div style={styles.fieldLabel}>
                                <FiPhone size={16} /> <span>Contact No.</span>
                            </div>
                            {/* Use fetched userData (or N/A) */}
                            <div style={styles.fieldValue}>{userData?.contact || 'N/A'}</div>
                        </div>
                        <div style={styles.fieldRow}>
                            <div style={styles.fieldLabel}>
                                <FiMapPin size={16} /> <span>Address</span>
                            </div>
                            {/* Use fetched userData (or N/A) */}
                            <div style={styles.fieldValue}>{userData?.address || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Posts Section */}
            <div style={styles.postsSectionContainer}>
                <div style={styles.postsSectionHeader}>
                    {/* Updated title to show filtered count */}
                    <h2 style={styles.postsSectionTitle}>Your Community Posts ({filteredThreads.length})</h2>
                    {userThreads.length > 0 && (
                        <button style={styles.deleteAllButton} onClick={handleDeleteAllPosts} disabled={isThreadsLoading || loading} >
                            <FiTrash2 size={16} /> Delete All Posts & Jobs
                        </button>
                    )}
                </div>
                {/* NEW: Filter Buttons */}
                <div style={styles.filterBar}>
                    {THREAD_FILTERS.map(filter => (
                        <button 
                            key={filter.value} 
                            style={filter.value === selectedFilter ? styles.filterButtonActive : styles.filterButton} 
                            onClick={() => setSelectedFilter(filter.value)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {isThreadsLoading ? (
                    <div style={styles.loadingContainer}>
                        <FiRefreshCcw size={24} style={styles.spinner} />
                        <p>Loading your posts...</p>
                    </div>
                ) : filteredThreads.length > 0 ? (
                    <div style={styles.threadsList}>
                        {filteredThreads.map(renderThread)}
                    </div>
                ) : (
                    <p style={styles.noPostsMessage}>You haven't created any {selectedFilter === 'All' ? 'posts or jobs' : selectedFilter} yet.</p>
                )}
            </div>

            {/* NEW: Edit Profile Modal */}
            <EditProfileModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                userData={userData}
                onSave={handleSaveProfileDetails} // Pass the master save handler
                loading={loading}
                currentProfilePictureUrl={currentProfilePictureUrl} 
                setPopup={setPopup}
                userName={userName}
            />

            {/* Single Delete Confirmation Modal */}
            {deleteModal && (
                <ConfirmationModal
                    isVisible={!!deleteModal}
                    title={`Delete ${deleteModal.type === 'job' ? 'Job Posting' : 'Community Thread'}?`}
                    message={`Are you sure you want to delete your ${deleteModal.type === 'job' ? 'job posting' : 'thread'}? This action is permanent.`}
                    threadTitle={deleteModal.title}
                    threadBody={deleteModal.body}
                    mediaUrls={deleteModal.mediaUrls}
                    onConfirm={confirmDeleteThread}
                    onCancel={() => setDeleteModal(null)}
                />
            )}

            {/* Delete ALL Confirmation Modal */}
            <ConfirmationModal
                isVisible={deleteAllModal}
                title="Delete ALL Your Posts & Jobs"
                message={`You are about to delete all ${userThreads.length} posts and jobs you have ever created. This action is irreversible and cannot be recovered.`}
                threadTitle={null} // Important: Hide thread preview
                threadBody={null}
                mediaUrls={[]}
                onConfirm={confirmDeleteAllThreads}
                onCancel={() => setDeleteAllModal(false)}
                confirmButtonText={`Delete ALL (${userThreads.length})`}
                confirmIcon={<FiAlertOctagon size={18} />}
            />

            {/* NEW: Pro-Level Read Details Modal (Replaces the old inline modal) */}
            <ReadPostModal
                isVisible={isReadModalOpen}
                thread={readModalThread}
                onClose={closeReadModal}
                renderAvatar={renderAvatar}
            />
            
        </main>
    );
};

// --- STYLES (Existing) ---
const styles = {
    // ... (rest of existing styles)
    container: {
        padding: '20px 20px 20px 15px', // Adjusted for sidebar
        minHeight: '100vh',
    },
    spinner: {
        animation: 'spin 1s linear infinite',
    },
    '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    },
    // ... (rest of existing styles)
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '25px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    profileHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '25px',
        width: '100%',
    },
    profileName: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '15px 0 5px 0',
    },
    profileEmail: {
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 20px 0',
    },
    editButton: {
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
        marginTop: '10px',
    },
    profileDetails: {
        width: '100%',
        paddingTop: '25px',
    },
    detailsTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1f2937',
        borderBottom: '2px solid #3b82f6',
        paddingBottom: '10px',
        marginBottom: '15px',
    },
    profileMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    fieldRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px dotted #e5e7eb',
    },
    fieldLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#4b5563',
        flexShrink: 0,
    },
    fieldValue: {
        fontSize: '16px',
        color: '#1f2937',
        textAlign: 'right',
        wordBreak: 'break-word',
    },
    postsSectionContainer: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        padding: '30px',
    },
    postsSectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '15px',
        marginBottom: '20px',
    },
    postsSectionTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1f2937',
        margin: 0,
    },
    deleteAllButton: {
        backgroundColor: '#fecaca',
        color: '#dc2626',
        border: '1px solid #f87171',
        padding: '8px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.2s',
    },
    filterBar: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #e5e7eb',
        paddingTop: '5px',
    },
    filterButton: {
        padding: '8px 15px',
        borderRadius: '20px',
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    filterButtonActive: {
        padding: '8px 15px',
        borderRadius: '20px',
        backgroundColor: '#3b82f6', // Blue background for active
        color: '#fff',
        border: '1px solid #3b82f6',
        cursor: 'default',
        fontWeight: '600',
        fontSize: '14px',
    },
    threadsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    noPostsMessage: {
        textAlign: 'center',
        color: '#6b7280',
        padding: '40px 0',
        fontSize: '16px',
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '40px 0',
        color: '#4f46e5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
    },
    // Thread Card Styles
    threadCard: {
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        ':hover': {
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            borderColor: '#bfdbfe',
        },
    },
    threadHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
    },
    threadAuthor: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    authorDetails: {
        display: 'flex',
        flexDirection: 'column',
    },
    threadAuthorName: {
        fontWeight: '600',
        fontSize: '15px',
        color: '#1e40af',
    },
    threadTime: {
        fontSize: '12px',
        color: '#9ca3af',
    },
    threadTag: {
        backgroundColor: '#e0f2f1',
        color: '#047857',
        padding: '4px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        flexShrink: 0,
    },
    threadBodyContainer: {
        marginBottom: '10px',
    },
    threadPostType: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#9ca3af',
        margin: '0 0 5px 0',
    },
    threadTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 5px 0',
    },
    threadBody: {
        fontSize: '14px',
        color: '#374151',
        margin: '5px 0',
        lineHeight: 1.5,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        // Max lines before truncation (set high if relying on MAX_POST_LENGTH)
        // WebkitLineClamp: 3, 
    },
    jobContact: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#10b981',
        margin: '0 0 10px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    readMore: {
        color: '#2563eb',
        fontWeight: '600',
        cursor: 'pointer',
        marginLeft: '5px',
    },
    mediaGallery: {
        position: 'relative',
        height: '150px',
        overflow: 'hidden',
        borderRadius: '8px',
        marginBottom: '10px',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    mediaCounter: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '12px',
    },
    threadActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '10px',
        borderTop: '1px solid #e5e7eb',
    },
    threadStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: '500',
    },
    deleteThreadButton: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#fca5a5',
        },
    },
    // Response Styles
    responsesContainer: {
        marginTop: '15px',
        padding: '10px 0',
        borderTop: '1px dashed #d1d5db',
    },
    responseItem: {
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '10px 15px',
        marginBottom: '10px',
    },
    responseMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px', 
        marginBottom: '4px',
    },
    responseAuthorText: {
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
    },
    responseAuthorName: {
        fontWeight: '700', 
        color: '#1f2937', 
        fontSize: '13px',
    },
    responseTime: {
        fontSize: '11px', 
        color: '#9ca3af',
    },
    responseContent: {
        margin: '0',
        fontSize: '14px',
        color: '#374151',
        paddingLeft: '36px', 
    },
    responseForm: {
        display: 'flex', 
        gap: '8px', 
        marginBottom: '15px',
    },
    responseInput: {
        flexGrow: 1,
        padding: '10px 15px',
        borderRadius: '20px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
    },
    responseSendButton: {
        backgroundColor: '#1d4ed8',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
    },
    // Avatar Styles
    avatarCircleLarge: { 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%', 
        backgroundColor: '#e5e7eb', 
        color: '#6b7280', 
        fontSize: '40px', 
        fontWeight: '700', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        position: 'relative', 
        flexShrink: 0, 
    },
    avatarCircleSmall: { 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        backgroundColor: '#e5e7eb', 
        color: '#6b7280', 
        fontSize: '14px', 
        fontWeight: '600', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        flexShrink: 0, 
    },
    avatarCircleTiny: { 
        width: '24px', 
        height: '24px', 
        borderRadius: '50%', 
        backgroundColor: '#e5e7eb', 
        color: '#6b7280', 
        fontSize: '12px', 
        fontWeight: '600', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden', 
        flexShrink: 0, 
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    // The old Read Modal styles are now unused but kept here for reference:
    // modalOverlay: {
    //     position: 'fixed',
    //     top: 0, right: 0, bottom: 0, left: 0,
    //     backgroundColor: 'rgba(0, 0, 0, 0.6)',
    //     zIndex: 1500,
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     padding: '20px',
    // },
    // modalContent: {
    //     backgroundColor: '#fff',
    //     borderRadius: '12px',
    //     width: '90%',
    //     maxWidth: '700px',
    //     maxHeight: '90vh',
    //     overflowY: 'auto',
    //     boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    //     display: 'flex',
    //     flexDirection: 'column',
    // },
    // modalHeaderNoBorder: {
    //     padding: '15px 20px 0',
    //     textAlign: 'right',
    // },
    // modalUserSection: {
    //     display: 'flex',
    //     alignItems: 'center',
    //     gap: '15px',
    //     padding: '0 20px 20px',
    //     borderBottom: '1px solid #e5e7eb',
    // },
    // modalUserName: {
    //     fontSize: '18px',
    //     fontWeight: '700',
    //     color: '#1f2937',
    // },
    // modalTime: {
    //     fontSize: '14px',
    //     color: '#9ca3af',
    //     marginLeft: 'auto',
    // },
    // modalBody: {
    //     padding: '20px',
    // },
    // modalTitle: {
    //     fontSize: '24px',
    //     fontWeight: '800',
    //     color: '#111827',
    //     margin: '0 0 10px 0',
    // },
    // modalText: {
    //     fontSize: '16px',
    //     color: '#374151',
    //     lineHeight: 1.6,
    //     whiteSpace: 'pre-wrap',
    //     marginBottom: '20px',
    // },
    // modalJobContact: {
    //     fontSize: '16px',
    //     color: '#059669',
    //     display: 'flex',
    //     alignItems: 'center',
    //     gap: '8px',
    //     margin: '10px 0 20px 0',
    //     padding: '10px',
    //     backgroundColor: '#ecfdf5',
    //     borderRadius: '8px',
    // },
    // modalMediaGallery: {
    //     display: 'grid',
    //     gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    //     gap: '10px',
    //     marginTop: '10px',
    //     marginBottom: '20px',
    // },
    // modalMediaImage: {
    //     width: '100%',
    //     height: '200px',
    //     objectFit: 'cover',
    // }
};

export default ProfilePage;