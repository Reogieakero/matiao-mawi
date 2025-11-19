import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    FiUser, FiMail, FiEdit, FiSave, FiX, FiRefreshCcw, 
    FiCheckCircle, FiAlertTriangle, FiCamera, 
    FiPhone, FiMapPin, 
    FiMessageSquare, FiPaperclip 
} from 'react-icons/fi';
import RightPanel from '../components/RightPanel'; 

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
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min ago";
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

// --- UserThread Component ---
const UserThread = ({ thread }) => {
    
    const renderMediaGallery = (mediaUrls) => {
        if (!mediaUrls || mediaUrls.length === 0) return null;
        const count = mediaUrls.length;
        const gridItemStyle = (index) => {
            if (count === 1) return { gridColumn: 'span 2', height: '300px' };
            if (count === 2) return {};
            if (count >= 3 && index === 0) return { gridColumn: 'span 2', height: '300px' };
            return { height: '150px' };
        };

        const gridContainerStyle = {
            display: 'grid',
            gridTemplateColumns: count === 1 ? '1fr' : '1fr 1fr',
            gap: '8px',
            marginTop: '15px',
            maxHeight: count > 3 ? '450px' : 'none', 
            overflow: 'hidden',
        };

        return (
            <div style={styles.gridContainerStyle}>
                {mediaUrls.slice(0, 4).map((url, index) => (
                    <div 
                        key={index} 
                        style={{ ...styles.mediaContainer, ...gridItemStyle(index) }}
                    >
                        <img 
                            src={url} 
                            alt={`Media ${index + 1}`} 
                            style={styles.threadImage} 
                        />
                        {count > 4 && index === 3 && (
                            <div style={styles.moreMediaOverlay}>
                                +{count - 4} more
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div key={thread.id} style={styles.threadCard}>
            <div style={styles.threadMetaTop}>
                <div style={styles.threadAuthorInfo}>
                    {renderAvatar(thread.author_picture_url, thread.author, 'small')}
                    <div style={styles.authorDetails}>
                         <span style={styles.threadAuthorName}>{thread.author}</span>
                         <span style={styles.threadTime}>{getTimeSince(thread.time)}</span>
                    </div>
                </div>
                <div style={styles.threadTag}>
                    {thread.type === 'job' ? <FiPaperclip size={14} style={{marginRight: '5px'}}/> : ''}
                    {thread.tag}
                </div>
            </div>

            <h3 style={styles.threadTitle}>
                [{thread.type === 'job' ? 'JOB' : 'POST'}] {thread.title}
            </h3>
            <p style={styles.threadBody}>
                {thread.body}
            </p>

            {renderMediaGallery(thread.mediaUrls)}

            <div style={styles.threadActions}>
                <div style={styles.threadStats}>
                    <FiMessageSquare size={18} /> {thread.responseCount ?? 0} Responses 
                </div>
            </div>
        </div>
    );
};
// ----------------------------------------------------


// --- ProfilePage Component ---
export default function ProfilePage({ userId, userName, userEmail, onUpdateUser, profilePictureUrl: currentProfilePictureUrl }) {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popup, setPopup] = useState({ message: '', type: '' });
    
    // Editable fields
    const [editedName, setEditedName] = useState(userName || '');
    const [editedContact, setEditedContact] = useState('');
    const [editedAddress, setEditedAddress] = useState('');
    
    // Profile Picture State
    const [profilePictureUrl, setProfilePictureUrl] = useState(currentProfilePictureUrl || '');
    const [selectedFile, setSelectedFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(''); 
    const [isDragging, setIsDragging] = useState(false);

    // User Threads State
    const [userThreads, setUserThreads] = useState([]); 
    const [isThreadsLoading, setIsThreadsLoading] = useState(true); 

    const fileInputRef = useRef(null);
    const firstName = userName ? userName.split(' ')[0] : 'User';

    // User ID from localStorage
    const currentUserId = parseInt(localStorage.getItem('userId'), 10); 

    // --- Data Fetching ---
    const fetchUserData = useCallback(async () => {
        if (!userId) {
            setError("User not logged in or User ID is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSelectedFile(null); 
        setPreviewUrl(''); 
        
        try {
            const res = await fetch(`http://localhost:5000/api/profile/${userId}`);
            if (!res.ok) {
                if (res.status === 404) {
                    const defaultData = { name: userName, email: userEmail, contact: '', address: '', profilePictureUrl: currentProfilePictureUrl };
                    setUserData(defaultData);
                    setEditedName(userName);
                    setEditedContact('');
                    setEditedAddress('');
                    setProfilePictureUrl(currentProfilePictureUrl); 
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
            setProfilePictureUrl(data.profilePictureUrl || currentProfilePictureUrl || ''); 
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Could not load profile. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [userId, userName, userEmail, currentProfilePictureUrl]);
    
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
            
            // Ensure threads use the current known profile picture if the thread fetch missed it
            const threadsWithCurrentPic = data.map(thread => ({
                ...thread,
                author_picture_url: thread.author_picture_url || currentProfilePictureUrl || profilePictureUrl 
            }));
            setUserThreads(threadsWithCurrentPic);
        } catch (err) {
            console.error("Fetch user threads error:", err);
        } finally {
            setIsThreadsLoading(false);
        }
    }, [userId, currentProfilePictureUrl, profilePictureUrl]);


    useEffect(() => {
        if (userId) {
             fetchUserData();
             fetchUserThreads(); 
        }
    }, [userId, fetchUserData, fetchUserThreads]); 


    // Cleanup for local object URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    
    const uploadPictureToServer = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file); 

        try {
            const res = await fetch(`http://localhost:5000/api/profile/upload-picture/${userId}`, {
                method: 'POST',
                body: formData, 
            });

            const uploadData = await res.json();
            
            if (!res.ok) {
                throw new Error(uploadData.message || "File upload failed.");
            }
            
            const newUrl = uploadData.profilePictureUrl; 
            setProfilePictureUrl(newUrl); 
            onUpdateUser({ profilePictureUrl: newUrl }); 
            setPopup({ message: 'Profile picture uploaded successfully!', type: 'success' });
            return newUrl;
        } catch (err) {
            console.error("Picture upload error:", err);
            setPopup({ message: `Picture upload failed: ${err.message}.`, type: 'error' });
            return null; 
        }
    }, [userId, onUpdateUser]);

    // --- Save Handler ---
    const handleSave = async () => {
        if (!editedName.trim()) {
            setPopup({ message: 'Name cannot be empty.', type: 'error' });
            return;
        }
        
        setLoading(true);
        setError(null);
        setIsEditing(false);

        let newPictureUrl = profilePictureUrl;

        // 1. Handle profile picture upload first
        if (selectedFile) {
            const uploadedUrl = await uploadPictureToServer(selectedFile);
            if (uploadedUrl) {
                newPictureUrl = uploadedUrl;
            } else {
                setLoading(false);
                setIsEditing(true); 
                return; 
            }
        }
        
        // 2. Handle profile details update
        try {
            const updatedFields = {
                name: editedName,
                contact: editedContact,
                address: editedAddress,
            };

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
            
            // Clear temporary states
            setSelectedFile(null);
            setPreviewUrl('');
            
            // Re-fetch threads to update author name/picture
            fetchUserThreads(); 

        } catch (err) {
            console.error("Details Save error:", err);
            setPopup({ message: `Details save failed: ${err.message}.`, type: 'error' });
            setIsEditing(true);
        } finally {
            setLoading(false);
        }
    };


    // --- Cancel/Reset Handler ---
    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedFile(null); 
        setPreviewUrl(''); 
        fetchUserData(); // Refetch/reset all data
    }
    
    // --- File Selection/Drop Handler ---
    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setSelectedFile(null);
            setPreviewUrl('');
            setPopup({ message: 'Invalid file type. Only images are allowed.', type: 'error' });
            return;
        }
        setSelectedFile(file);
        
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl); 
        }
        setPreviewUrl(URL.createObjectURL(file));
    };

    // --- Drag/Drop Handlers ---
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFileSelect(files[0]);
        }
    };
    const handlePictureClick = () => { fileInputRef.current.click(); };
    const handleFileInputChange = (e) => { 
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    };

    // Helper to render an editable field
    const renderField = (label, value, stateSetter, isEditable, icon) => (
        <div style={styles.fieldRow}>
            <div style={styles.fieldLabel}>
                {icon}
                <span>{label}</span>
            </div>
            {isEditing && isEditable ? (
                <input
                    type={label === 'Contact' ? 'tel' : 'text'}
                    style={styles.inputField}
                    value={stateSetter[0]}
                    onChange={(e) => stateSetter[1](e.target.value)}
                    disabled={loading}
                />
            ) : (
                <div style={styles.fieldValue}>{value || (isEditable ? 'N/A' : 'Not Provided')}</div>
            )}
        </div>
    );

    const currentPictureSource = previewUrl || profilePictureUrl;

    return (
        <div style={styles.pageContainer}>
            <AlertPopup message={popup.message} type={popup.type} onClose={() => setPopup({ message: '', type: '' })} />
            
            {/* Page Title - Now part of the main page flow */}
            <h1 style={styles.pageTitle}>Welcome to your Profile, {firstName}!</h1>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.mainContentLayout}>
                 
                {/* Left/Center Column for Profile & Posts */}
                <div style={styles.centerContent}> 
                    
                    {/* Profile Card Content (Account Editing) */}
                    <div style={styles.profileCard}>
                        
                        {/* ⭐ BUTTONS MOVED INSIDE PROFILE CARD ⭐ */}
                        <div style={styles.cardActions}>
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
                        {/* ⭐ END BUTTONS ⭐ */}

                        <div style={styles.profileHeader}>
                            <div 
                                style={{...styles.avatarCircleLarge, cursor: isEditing ? 'pointer' : 'default'}}
                                onClick={isEditing ? handlePictureClick : null}
                                onDragEnter={isEditing ? handleDragEnter : null}
                                onDragLeave={isEditing ? handleDragLeave : null}
                                onDragOver={isEditing ? handleDragOver : null}
                                onDrop={isEditing ? handleDrop : null}
                            >
                                {currentPictureSource ? (
                                    <img 
                                        src={currentPictureSource} 
                                        alt={firstName} 
                                        style={styles.avatarImage} 
                                    />
                                ) : (
                                    firstName[0] || 'U'
                                )}
                                {isEditing && (
                                    <div style={{...styles.editOverlay, border: isDragging ? '2px dashed #fff' : 'none'}}>
                                        <FiCamera size={24} color="#fff" />
                                        <p style={{margin: 0, fontSize: '12px'}}>
                                            {selectedFile ? 'Change Photo' : 'Upload Photo'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileInputChange}
                                accept="image/*"
                            />

                            <div style={styles.headerText}>
                                <h2 style={styles.userName}>{userData?.name || userName}</h2>
                                <p style={styles.userEmail}>{userEmail}</p>
                            </div>
                        </div>

                        <div style={styles.fieldGroup}>
                            {renderField('Name', editedName, [editedName, setEditedName], true, <FiUser size={18} />)}
                            {renderField('Email', userEmail, [], false, <FiMail size={18} />)}
                            {renderField('Contact', editedContact, [editedContact, setEditedContact], true, <FiPhone size={18} />)}
                            {renderField('Address', editedAddress, [editedAddress, setEditedAddress], true, <FiMapPin size={18} />)}
                        </div>
                    </div>

                    {/* User Posts/Jobs Section */}
                    <div style={styles.postsSectionContainer}>
                        <h2 style={styles.postsSectionTitle}>Your Activity ({userThreads.length} total)</h2>
                        {isThreadsLoading ? (
                            <p style={styles.loadingResponsesText}>Loading your posts and jobs...</p>
                        ) : userThreads.length > 0 ? (
                            userThreads.map(thread => <UserThread key={thread.id} thread={thread} />)
                        ) : (
                            <p style={styles.noResponsesText}>You haven't posted any community threads or jobs yet.</p>
                        )}
                    </div>

                </div>

                {/* Right Panel */}
                <div style={styles.rightPanelContainer}>
                    <RightPanel 
                        userName={userName} 
                        userEmail={userEmail} 
                        profilePictureUrl={profilePictureUrl} 
                    />
                </div>
            </div>
        </div>
    );
}

// --- Styles ---
const styles = {
    // Layout Styles
    pageContainer: {
        minHeight: '100vh',
        paddingLeft:'10px',
        paddingRight:'50px',
    },
    pageTitle: {
        fontSize: '28px', 
        fontWeight: '700', 
        color: '#1f2937', 
        marginBottom: '20px',
        paddingLeft: '5px', // Alignment
    },
    mainContentLayout: {
        display: 'flex',
        gap: '20px', // ⭐ GAP IS ALREADY SET TO 20px for internal consistency
        maxWidth: '1200px', 
        margin: '0 auto', 
    },
    centerContent: {
        flex: '3', 
        minWidth: 0, 
    },
    rightPanelContainer: {
        flex: '1', 
        minWidth: '280px', 
        position: 'sticky',
        top: '20px', 
        maxHeight: 'calc(100vh - 40px)', 
        overflowY: 'auto',
    },
    
    // Profile Card Styles
    cardActions: { 
        position: 'absolute', 
        top: '15px',
        right: '20px',
        display: 'flex', 
        gap: '10px',
        zIndex: 10,
    },
    button: {
        padding: '6px 12px', 
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
        border: 'none',
        color: '#fff',
        backgroundColor: '#2563eb',
    },
    saveButton: { backgroundColor: '#10b981' },
    cancelButton: { backgroundColor: '#ef4444' },
    loadingIcon: { 
        animation: 'spin 1s linear infinite', 
        color: '#3b82f6', 
        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
    },
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
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        padding: '25px',
        border: '1px solid #e5e7eb',
        position: 'relative', 
        paddingTop: '60px', 
    },
    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #f3f4f6',
        marginBottom: '20px',
    },
    avatarCircleLarge: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '36px',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
    },
    avatarCircleSmall: { 
        width: '28px', // Consistent with HomePage
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '14px',
        flexShrink: 0,
        overflow: 'hidden',
    },
    avatarCircleTiny: { 
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '12px',
        flexShrink: 0,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    editOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        gap: '2px',
    },
    headerText: { display: 'flex', flexDirection: 'column' },
    userName: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1f2937' },
    userEmail: { margin: 0, fontSize: '15px', color: '#6b7280' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '15px' },
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
    fieldValue: { fontSize: '16px', color: '#374151', width: '65%' },
    inputField: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        width: '65%',
        fontSize: '16px',
        transition: 'border-color 0.2s',
    },

    // User Threads Section Styles
    postsSectionContainer: {
        backgroundColor: 'transparent', 
        borderRadius: '0', 
        padding: '0', 
        marginTop: '20px',
        boxShadow: 'none', 
    },
    postsSectionTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1f2937',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: '10px',
        marginBottom: '15px',
    },
    // Thread Card Styles (Unchanged)
    threadCard: {
        backgroundColor: '#fff', 
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '15px',
        border: '1px solid #e5e7eb',
        position: 'relative',
    },
    threadMetaTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    threadAuthorInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
    threadAuthorName: { fontWeight: '600', color: '#1f2937', fontSize: '15px' },
    threadTime: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },
    authorDetails: { display: 'flex', flexDirection: 'column' },
    threadTag: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        padding: '5px 10px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
    },
    threadTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1d4ed8',
        margin: '10px 0 8px 0',
    },
    threadBody: {
        fontSize: '15px',
        color: '#4b5563',
        lineHeight: '1.5',
        margin: '0',
    },
    threadActions: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: '15px',
        borderTop: '1px solid #f3f4f6',
        paddingTop: '10px',
    },
    threadStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#6b7280',
        fontSize: '14px',
        fontWeight: '500',
    },
    // Media Gallery Styles (Used in UserThread component)
    gridContainerStyle: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginTop: '15px',
        maxHeight: '450px', 
        overflow: 'hidden',
    },
    mediaContainer: {
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    threadImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    moreMediaOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: '#fff',
        fontSize: '24px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingResponsesText: { textAlign: 'center', padding: '10px', fontSize: '14px', color: '#9ca3af' },
    noResponsesText: { textAlign: 'center', padding: '10px', fontSize: '14px', color: '#9ca3af' },
};