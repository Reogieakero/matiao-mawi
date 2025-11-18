import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiUser, FiMail, FiEdit, FiSave, FiX, FiRefreshCcw, FiCheckCircle, FiAlertTriangle, FiCamera } from 'react-icons/fi';

// --- Custom Alert Popup (Unchanged) ---
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
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease-out',
    },
    icon: { marginRight: '15px' },
    content: { flexGrow: 1 },
    title: {
        margin: '0 0 5px 0',
        fontSize: '16px',
        fontWeight: '700',
    },
    message: {
        margin: 0,
        fontSize: '14px',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        marginLeft: '15px',
    },
};

// --- ProfilePage Component ---
export default function ProfilePage({ userId, userName, userEmail, onUpdateUser }) {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for custom popup
    const [popup, setPopup] = useState({ message: '', type: '' });
    
    // Editable fields
    const [editedName, setEditedName] = useState(userName || '');
    const [editedContact, setEditedContact] = useState('');
    const [editedAddress, setEditedAddress] = useState('');
    
    // Profile Picture State
    const [profilePictureUrl, setProfilePictureUrl] = useState(''); // URL from DB
    const [selectedFile, setSelectedFile] = useState(null); // File object for deferred upload ⭐ NEW
    const [previewUrl, setPreviewUrl] = useState(''); // Local URL for preview ⭐ NEW

    // State for drag-and-drop visual effect
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);
    const firstName = userName ? userName.split(' ')[0] : 'User';

    // --- Data Fetching (MODIFIED to include cleanup for previewUrl) ---
    const fetchUserData = async () => {
        if (!userId) {
            setError("User not logged in or User ID is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSelectedFile(null); // Clear pending file
        setPreviewUrl(''); // Clear local preview
        
        try {
            const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    const defaultData = { name: userName, email: userEmail, contact: '', address: '', profilePictureUrl: '' };
                    setUserData(defaultData);
                    setEditedName(userName);
                    setEditedContact('');
                    setEditedAddress('');
                    setProfilePictureUrl('');
                    setLoading(false);
                    return;
                }
                throw new Error("Failed to fetch user data.");
            }
            const data = await res.json();
            setUserData(data);
            setEditedName(data.name || userName);
            setEditedContact(data.contact || '');
            setEditedAddress(data.address || '');
            setProfilePictureUrl(data.profilePictureUrl || ''); 
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Could not load profile. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
             fetchUserData();
        }
    }, [userId]);
    
    // Cleanup for local object URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);


    // ⭐ NEW: Isolated function for uploading the picture
    const uploadPictureToServer = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file); 

        const res = await fetch(`http://localhost:5000/api/profile/upload-picture/${userId}`, {
            method: 'POST', 
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Failed to upload picture.');
        }
        return data;
    }, [userId]);


    // --- Data Saving (MODIFIED to include picture upload) ---
    const handleSave = async () => {
        if (!editedName.trim()) {
            setPopup({ message: 'Full Name cannot be empty.', type: 'error' });
            return;
        }
        
        if (loading) return; 

        setIsEditing(false);
        setLoading(true);
        setError(null);
        setPopup({ message: '', type: '' }); 
        let newPictureUrl = profilePictureUrl;

        // 1. Handle Profile Picture Upload if a file is selected (deferred)
        if (selectedFile) {
            setPopup({ message: 'Uploading profile picture...', type: 'success' }); // Show progress
            try {
                const uploadedData = await uploadPictureToServer(selectedFile);
                newPictureUrl = uploadedData.profilePictureUrl;
                setProfilePictureUrl(newPictureUrl);
                onUpdateUser({ profilePictureUrl: newPictureUrl }); // Update global state
                
                // Clear file and preview after successful upload
                setSelectedFile(null);
                setPreviewUrl('');
                
            } catch (err) {
                console.error("Picture Upload Error:", err);
                setPopup({ message: `Picture upload failed: ${err.message}. Changes were not saved.`, type: 'error' });
                setLoading(false);
                return; // Stop the save process if picture upload fails
            }
        }
        
        // 2. Handle Profile Details Save (Always happens if Step 1 succeeds or is skipped)
        setPopup({ message: 'Saving profile details...', type: 'success' });
        const updatedFields = {
            name: editedName.trim(),
            contact: editedContact.trim(),
            address: editedAddress.trim(),
        };

        try {
            const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update profile details.');
            }
            
            setPopup({ message: 'Profile updated successfully!', type: 'success' });
            
            // Update local state and global state for name
            setUserData(prev => ({ ...prev, ...updatedFields, profilePictureUrl: newPictureUrl }));
            if (onUpdateUser && updatedFields.name !== userName) {
                onUpdateUser({ name: updatedFields.name });
            }

        } catch (err) {
            console.error("Details Save error:", err);
            setPopup({ message: `Details save failed: ${err.message}.`, type: 'error' });
            setIsEditing(true); // Re-enable editing
        } finally {
            setLoading(false);
        }
    };
    
    // --- Cancel/Reset Handler ---
    const handleCancelEdit = () => {
        setIsEditing(false); 
        setSelectedFile(null); // Clear file
        setPreviewUrl(''); // Clear preview
        fetchUserData(); // Refetch/reset all data
    }


    // --- File Selection/Drop Handler (Stores file locally) ⭐ NEW
    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setSelectedFile(null);
            setPreviewUrl('');
            setPopup({ message: 'Invalid file type. Only images are allowed.', type: 'error' });
            return;
        }

        setSelectedFile(file);
        
        // Create a local URL for instant preview
        const url = URL.createObjectURL(file);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl); // Clean up previous preview URL
        }
        setPreviewUrl(url);
    };

    // Triggered by button click
    const handlePictureButtonClick = (event) => {
        if (event.target.files && event.target.files[0]) {
            handleFileSelect(event.target.files[0]);
            // Clear file input so the same file can be uploaded again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // --- Drag-and-Drop Handlers (Unchanged logic, calls handleFileSelect) ---
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget)) {
             setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    
    // --- Enter Key Handler (Unchanged) ---
    const handleKeyPress = (event) => {
        if (isEditing && event.key === 'Enter') {
            event.preventDefault(); 
            handleSave();
        }
    };

    // --- Helper Render Functions (Unchanged) ---
    const renderField = (label, icon, value, setter, placeholder, isEditable = true) => (
        <div style={styles.fieldRow}>
            <div style={styles.fieldLabel}>
                {icon}
                <span>{label}</span>
            </div>
            {isEditing && isEditable ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    onKeyPress={handleKeyPress} 
                    placeholder={placeholder}
                    style={styles.input}
                    disabled={loading}
                />
            ) : (
                <div style={styles.fieldValue}>{value || (isEditable ? 'N/A' : 'Not Editable')}</div>
            )}
        </div>
    );
    
    // Determine which URL to display (preview takes precedence)
    const currentPictureSource = previewUrl || profilePictureUrl;


    return (
        <div style={styles.pageContainer}>
            <AlertPopup 
                message={popup.message} 
                type={popup.type} 
                onClose={() => setPopup({ message: '', type: '' })} 
            />
            
            <div style={styles.header}>
                <h1 style={styles.title}>Welcome to your Profile, {firstName}!</h1>
                <div style={styles.actions}>
                    {loading ? (
                        <FiRefreshCcw size={20} style={styles.loadingIcon} />
                    ) : isEditing ? (
                        <>
                            <button style={{...styles.button, ...styles.cancelButton}} onClick={handleCancelEdit} disabled={loading}>
                                <FiX size={18} /> Cancel
                            </button>
                            <button style={{...styles.button, ...styles.saveButton}} onClick={handleSave} disabled={loading}>
                                <FiSave size={18} /> Save Details
                            </button>
                        </>
                    ) : (
                        <button style={styles.button} onClick={() => setIsEditing(true)} disabled={loading}>
                            <FiEdit size={18} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.profileCard}>
                <div style={styles.profileHeader}>
                    {/* Drag-and-Drop Wrapper: Only active during editing */}
                    <div 
                        style={isEditing && isDragging ? {...styles.avatarContainerWrapper, ...styles.dragActive} : styles.avatarContainerWrapper}
                        onDragEnter={isEditing ? handleDragEnter : undefined}
                        onDragLeave={isEditing ? handleDragLeave : undefined}
                        onDragOver={isEditing ? handleDragOver : undefined}
                        onDrop={isEditing ? handleDrop : undefined}
                    >
                        <div style={styles.avatarContainer}>
                            {currentPictureSource ? (
                                <img src={currentPictureSource} alt="Profile" style={styles.profilePicture} />
                            ) : (
                                <div style={styles.avatarCircle}>{userName ? userName[0].toUpperCase() : 'U'}</div>
                            )}
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePictureButtonClick}
                                accept="image/*"
                                style={{ display: 'none' }}
                                disabled={!isEditing || loading}
                            />
                            {/* Camera button to trigger file input */}
                            {isEditing && (
                                <button 
                                    style={styles.cameraButton} 
                                    onClick={() => fileInputRef.current.click()}
                                    title="Change Profile Picture"
                                    disabled={loading}
                                >
                                    <FiCamera size={18} />
                                </button>
                            )}
                        </div>
                        {isEditing && isDragging && (
                            <div style={styles.dragOverlay}>Drop image here</div>
                        )}
                    </div>
                    
                    <div style={styles.headerText}>
                        <h2 style={styles.userName}>{userData?.name || userName}</h2>
                        <p style={styles.userEmail}>{userData?.email || userEmail}</p>
                    </div>
                </div>
                
                <div style={styles.fieldGroup}>
                    {/* Editable Fields */}
                    {renderField('Full Name', <FiUser size={18} />, editedName, setEditedName, 'Enter your full name')}
                    {renderField('Contact Number', <FiMail size={18} />, editedContact, setEditedContact, 'e.g., +639XXXXXXXXX')}
                    {renderField('Address', <FiMail size={18} />, editedAddress, setEditedAddress, 'e.g., Purok 1, Brgy. Central')}
                    
                    <div style={styles.divider}></div>
                    
                    {/* Non-Editable Fields */}
                    {renderField('Email Address', <FiMail size={18} />, userEmail, null, '', false)}
                </div>
            </div>
        </div>
    );
}

// --- ProfilePage Styles (MODIFIED to include drag overlay) ---
const styles = {
    pageContainer: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '30px 20px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1e40af',
    },
    actions: {
        display: 'flex',
        gap: '10px',
    },
    button: {
        padding: '10px 15px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
    },
    saveButton: { backgroundColor: '#10b981' },
    cancelButton: { backgroundColor: '#ef4444' },
    loadingIcon: { animation: 'spin 1s linear infinite', color: '#3b82f6' },
    errorBox: {
        padding: '15px',
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    profileCard: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
    },
    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: '1px solid #f3f4f6',
        marginBottom: '20px',
    },
    avatarContainerWrapper: {
        position: 'relative',
        marginRight: '15px',
        flexShrink: 0,
        borderRadius: '50%',
        transition: 'all 0.2s',
        border: '3px solid transparent', 
        padding: '2px', 
    },
    dragActive: {
        borderColor: '#3b82f6',
        borderStyle: 'dashed',
        backgroundColor: '#e0f2fe',
    },
    dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        color: 'white',
        borderRadius: '50%',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 10,
    },
    avatarContainer: {
        position: 'relative',
        width: '60px',
        height: '60px',
    },
    profilePicture: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #3b82f6',
    },
    avatarCircle: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '24px',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10b981',
        color: '#fff',
        borderRadius: '50%',
        border: '2px solid #fff',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
    },
    headerText: {
        display: 'flex',
        flexDirection: 'column',
    },
    userName: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1f2937' },
    userEmail: { margin: 0, fontSize: '15px', color: '#6b7280' },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    fieldRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px dashed #e5e7eb',
    },
    fieldLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#4b5563',
        width: '30%',
    },
    fieldValue: {
        fontSize: '16px',
        color: '#1f2937',
        width: '65%',
        textAlign: 'right',
        minHeight: '24px', 
    },
    input: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        width: '65%',
        boxSizing: 'border-box',
        textAlign: 'right',
    },
    divider: { height: '1px', backgroundColor: '#e5e7eb', margin: '10px 0' }
};