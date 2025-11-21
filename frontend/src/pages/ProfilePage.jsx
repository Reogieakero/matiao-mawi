import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    FiUser, FiMail, FiEdit, FiSave, FiX, FiRefreshCcw, 
    FiCheckCircle, FiAlertTriangle, FiCamera, 
    FiPhone, FiMapPin, 
    FiMessageSquare, 
    FiSend, 
    FiTrash2,
    FiAlertOctagon, 
    FiChevronDown, 
    FiChevronUp, 
} from 'react-icons/fi';
import RightPanel from '../components/RightPanel'; 

// CONSTANT for truncation length (Max characters to show before "Read More")
const MAX_POST_LENGTH = 300; 

// ⭐ NEW CONSTANT for filter options
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

// --- Custom Confirmation Modal Component (UPDATED to display media) ---
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
                        <h4 style={modalStyles.threadTitle}>{threadTitle}</h4>
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
// ----------------------------------------------------


// --- Component: ThreadResponses (Restored for functionality) ---
const ThreadResponses = ({ threadId, threadType, currentUserId, setPopup }) => {
    const [responses, setResponses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newResponse, setNewResponse] = useState('');

    const fetchResponses = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/responses/${threadType}/${threadId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch responses.");
            }
            const data = await res.json();
            setResponses(data);
        } catch (err) {
            console.error("Fetch responses error:", err);
            setPopup({ message: `Failed to load responses: ${err.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [threadId, threadType, setPopup]);

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);
    
    // Handler for submitting a new response
    const handleSubmitResponse = async (e) => {
        e.preventDefault();
        if (!newResponse.trim()) return;
        
        const payload = {
            userId: currentUserId,
            threadId: threadId,
            threadType: threadType,
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
            fetchResponses(); 
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

    return (
        <div style={styles.responsesContainer}>
            {/* Response Input Form */}
            <form onSubmit={handleSubmitResponse} style={styles.responseForm}>
                <input
                    type="text"
                    placeholder="Write a response..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    style={styles.responseInput}
                    required
                />
                <button type="submit" style={styles.responseSendButton} disabled={!newResponse.trim() || isLoading}>
                    <FiSend size={18} />
                </button>
            </form>
            
            {isLoading && <p style={styles.loadingResponsesText}>Loading responses...</p>}
            
            {!isLoading && responses.length > 0 ? (
                responses.map(renderResponse)
            ) : !isLoading && (
                <p style={styles.noResponsesText}>No responses yet. Be the first to start the discussion!</p>
            )}
        </div>
    );
};
// ----------------------------------------------------

// --- UserThread Component ---
const UserThread = ({ thread, currentUserId, setPopup, handleDeleteThread, renderPostBody }) => { 
    const [showResponses, setShowResponses] = useState(false);

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
                    {thread.tag}
                </div>
            </div>

            {/* Post title has been removed as per previous user request */}
            
            {/* Use renderPostBody function for truncation/Read More */}
            {renderPostBody(thread)}

            {renderMediaGallery(thread.mediaUrls)}

            {/* ACTION BAR: Now includes the Delete Button */}
            <div style={styles.threadActions}>
                <div 
                    style={{...styles.threadStats, cursor: 'pointer', color: showResponses ? '#1d4ed8' : '#6b7280'}}
                    onClick={() => setShowResponses(!showResponses)}
                >
                    <FiMessageSquare size={18} /> {thread.responseCount ?? 0} Responses 
                </div>
                
                {/* Delete Button - Passes full thread object */}
                <button 
                    style={styles.deleteThreadButton} 
                    onClick={() => handleDeleteThread(thread)} 
                    title="Delete this post"
                >
                    <FiTrash2 size={16} /> Delete
                </button>
                
            </div>

            {/* Conditional rendering of ThreadResponses */}
            {showResponses && (
                <ThreadResponses 
                    threadId={thread.id} 
                    threadType={thread.type}
                    currentUserId={currentUserId}
                    setPopup={setPopup}
                />
            )}
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
    const [editedContact, setEditedContact, ] = useState('');
    const [editedAddress, setEditedAddress] = useState('');
    
    // Profile Picture State
    const [profilePictureUrl, setProfilePictureUrl] = useState(currentProfilePictureUrl || '');
    const [selectedFile, setSelectedFile] = useState(null); 
    const [previewUrl, setPreviewUrl] = useState(''); 
    const [isDragging, setIsDragging] = useState(false);

    // User Threads State
    const [userThreads, setUserThreads] = useState([]); 
    const [isThreadsLoading, setIsThreadsLoading] = useState(true); 

    // ⭐ NEW STATE for filtering
    const [selectedFilter, setSelectedFilter] = useState('All'); 

    // Confirmation Modal State for a single thread
    const [confirmationModal, setConfirmationModal] = useState({ 
        isVisible: false, 
        threadId: null, 
        threadType: null,
        threadTitle: '', 
        threadBody: '',
        mediaUrls: []   
    });

    // Confirmation Modal State for deleting all threads (NEW)
    const [deleteAllModal, setDeleteAllModal] = useState(false);
    
    // State for Read More Modal
    const [isReadModalOpen, setIsReadModal] = useState(false);
    const [readModalThread, setReadModalThread] = useState(null); 


    const fileInputRef = useRef(null);
    const firstName = userName ? userName.split(' ')[0] : 'User';

    // User ID from localStorage
    const currentUserId = parseInt(localStorage.getItem('userId'), 10); 

    // --- Read Modal Handlers (Copied from SavedPage/HomePage) ---
    const openReadModal = (thread) => {
        setReadModalThread(thread);
        setIsReadModal(true);
    };

    const closeReadModal = () => {
        setIsReadModal(false);
        setReadModalThread(null);
    };
    // ----------------------------------------------------
    
    // ⭐ NEW: Computed value for filtered threads
    const filteredThreads = userThreads.filter(thread => {
        if (selectedFilter === 'All') {
            return true;
        }
        // Assumes thread.type is 'thread' or 'job'
        return thread.type === selectedFilter; 
    });

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
            setUserData(prev => ({ ...prev, ...updatedFields, profilePictureUrl: newPictureUrl }));
            
            if (onUpdateUser && updatedFields.name !== userName) {
                onUpdateUser({ name: updatedFields.name });
            }
            
            setSelectedFile(null);
            setPreviewUrl('');
            fetchUserThreads(); 

        } catch (err) {
            console.error("Details Save error:", err);
            setPopup({ message: `Details save failed: ${err.message}.`, type: 'error' });
            setIsEditing(true); 
        } finally {
            setLoading(false);
        }
    };

    // --- Delete Single Thread Handler (Receives full thread object and passes mediaUrls) ---
    const handleDeleteThread = (thread) => {
        // Close Read Modal if open for this thread
        if (readModalThread && readModalThread.id === thread.id) {
             closeReadModal();
        }
        
        // Open custom confirmation modal instead of using window.confirm
        setConfirmationModal({
            isVisible: true,
            threadId: thread.id,
            threadType: thread.type,
            threadTitle: thread.title, 
            threadBody: thread.body,
            mediaUrls: thread.mediaUrls || [] 
        });
    };

    // --- Confirmation Handler (Performs actual single thread deletion) ---
    const confirmDeleteThread = async (threadId, threadType) => {
        // Reset modal state, including content fields and mediaUrls
        setConfirmationModal({ isVisible: false, threadId: null, threadType: null, threadTitle: '', threadBody: '', mediaUrls: [] });
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/threads/${threadId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadType, userId: currentUserId }), // Pass required data
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete thread.');
            }

            // Update state: remove the deleted thread
            setUserThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
            setPopup({ message: `${threadType.charAt(0).toUpperCase() + threadType.slice(1)} deleted successfully!`, type: 'success' });
        } catch (err) {
            console.error("Delete Thread error:", err);
            setPopup({ message: `Deletion failed: ${err.message}.`, type: 'error' });
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
                body: JSON.stringify({ userId: currentUserId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete all threads.');
            }
            
            // CRITICAL UPDATE FOR AUTO-REFRESH: Clear the state immediately
            setUserThreads([]);
            setPopup({ message: 'All your community threads and jobs have been successfully deleted!', type: 'success' });
        } catch (err) {
            console.error("Delete All Threads error:", err);
            setPopup({ message: `Bulk deletion failed: ${err.message}.`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelEdit = () => {
        // Reset editing state to initial profile values
        setIsEditing(false);
        setEditedName(userData?.name || userName);
        setEditedContact(userData?.contact || '');
        setEditedAddress(userData?.address || '');
        
        // Reset photo selection
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl); 
            setPreviewUrl('');
        }
        setProfilePictureUrl(userData?.profilePictureUrl || currentProfilePictureUrl || ''); 
        setPopup({ message: 'Editing cancelled. Changes discarded.', type: 'error' });
    };


    // --- File/Photo Handlers (for profile picture) ---
    const handleFileSelect = (file) => {
        if (!file.type.startsWith('image/')) {
            setPopup({ message: 'Please select an image file.', type: 'error' });
            setSelectedFile(null);
            setPreviewUrl('');
            setIsDragging(false);
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setSelectedFile(null);
            setPreviewUrl('');
            setPopup({ message: 'Image size exceeds 2MB limit.', type: 'error' });
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setIsDragging(false);
    };

    const handlePictureClick = () => {
        if (isEditing) {
            fileInputRef.current.click();
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };
    
    const handleDragEnter = (e) => {
        e.preventDefault();
        if (isEditing) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        if (isEditing) setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (isEditing) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (isEditing && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Helper to render an editable field
    const renderField = (label, value, stateSetter, isEditable, icon) => (
        <div style={styles.fieldRow}>
            <div style={styles.fieldLabel}>
                {icon} <span>{label}</span>
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

    // --- Function to render the post body with truncation (Opens Modal) ---
    const renderPostBody = (thread) => {
        // Ensure body exists before accessing length
        const bodyContent = thread.body || "";
        const isLongPost = bodyContent.length > MAX_POST_LENGTH;

        if (isLongPost) {
            // Truncated content
            const truncatedContent = bodyContent.substring(0, MAX_POST_LENGTH).trim() + '...';
            return (
                <>
                    <p style={styles.threadBody}>
                        {truncatedContent}
                    </p>
                    <div 
                        style={styles.readMoreButton} 
                        onClick={() => openReadModal(thread)} // <--- CALLS MODAL
                    >
                        <FiChevronDown size={14} /> Read More
                    </div>
                </>
            );
        }

        // Full content if not long
        return (
            <p style={styles.threadBody}>
                {bodyContent}
            </p>
        );
    };
    // ----------------------------------------------------


    return (
        <div style={styles.pageContainer}>
            <AlertPopup message={popup.message} type={popup.type} onClose={() => setPopup({ message: '', type: '' })} />
            
            {/* Single Thread Delete Confirmation Modal */}
            <ConfirmationModal
                isVisible={confirmationModal.isVisible}
                title="Confirm Thread Deletion"
                message="Are you sure you want to permanently delete this post? This action is irreversible."
                threadTitle={confirmationModal.threadTitle}
                threadBody={confirmationModal.threadBody}
                mediaUrls={confirmationModal.mediaUrls}
                onConfirm={() => confirmDeleteThread(confirmationModal.threadId, confirmationModal.threadType)}
                onCancel={() => setConfirmationModal({ isVisible: false, threadId: null, threadType: null, threadTitle: '', threadBody: '', mediaUrls: [] })}
            />
            
            {/* Delete All Threads Confirmation Modal */}
            <ConfirmationModal
                isVisible={deleteAllModal}
                title="WARNING: Delete All Posts"
                message={`You are about to permanently delete ALL ${userThreads.length} posts you have ever created. This action is irreversible and cannot be recovered.`}
                threadTitle={null} // Important: Hide thread preview
                threadBody={null}
                mediaUrls={[]}
                onConfirm={confirmDeleteAllThreads}
                onCancel={() => setDeleteAllModal(false)}
                confirmButtonText={`Delete ALL (${userThreads.length})`}
                confirmIcon={<FiAlertOctagon size={18} />}
            />

            {/* Read Details Modal */}
            {isReadModalOpen && readModalThread && (
                // Click outside to close
                <div style={styles.modalOverlay} onClick={closeReadModal}>
                    {/* Stop propagation for clicks inside content */}
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        {/* Header without title/border */}
                        <div style={styles.modalHeaderNoBorder}>
                             <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={closeReadModal} />
                        </div>
                        <div style={styles.modalUserSection}>
                            {renderAvatar(readModalThread.author_picture_url, readModalThread.author, 'large')}
                            <span style={styles.modalUserName}>{readModalThread.author}</span>
                            <span style={styles.modalTime}>{getTimeSince(readModalThread.time)}</span>
                            <span style={styles.threadTag}>{readModalThread.tag}</span>
                        </div>

                        {/* Full Content */}
                        <p style={styles.modalThreadBody}>
                            {readModalThread.body}
                        </p>
                        
                        {/* Media */}
                        {readModalThread.mediaUrls && readModalThread.mediaUrls.length > 0 && (
                            <div style={{height: '300px', margin: '15px 0', borderRadius: '10px', overflow: 'hidden'}}>
                                <img src={readModalThread.mediaUrls[0]} alt="Post media" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            </div>
                        )}

                        <button onClick={closeReadModal} style={styles.modalCloseButton}>
                            <FiChevronUp size={16} style={{ marginRight: '5px' }} /> Close View
                        </button>
                    </div>
                </div>
            )}
            {/* End Read Modal */}

            {/* Page Title - Now part of the main page flow */}
            <h1 style={styles.pageTitle}>Welcome to your Profile, {firstName}!</h1>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.mainContentLayout}>
                {/* Left/Center Column for Profile & Posts */}
                <div style={styles.centerContent}>
                    {/* Profile Card Content (Account Editing) */}
                    <div style={styles.profileCard}>
                         {/* BUTTONS MOVED INSIDE PROFILE CARD */}
                        <div style={styles.cardActions}>
                             {loading ? (
                                <FiRefreshCcw size={20} style={styles.loadingIcon} />
                            ) : isEditing ? (
                                <>
                                    <button 
                                        style={{...styles.button, ...styles.cancelButton}}
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                    >
                                        <FiX size={18} /> Cancel
                                    </button>
                                    <button 
                                        style={{...styles.button, ...styles.saveButton}}
                                        onClick={handleSave}
                                        disabled={loading || !editedName.trim()}
                                    >
                                        <FiSave size={18} /> Save
                                    </button>
                                </>
                            ) : (
                                <button 
                                    style={{...styles.button, ...styles.editButton}} 
                                    onClick={() => setIsEditing(true)}
                                >
                                    <FiEdit size={18} /> Edit Profile
                                </button>
                            )}
                        </div>
                        
                        <div style={styles.profileHeader}>
                            <div 
                                style={{ ...styles.avatarCircleLarge, cursor: isEditing ? 'pointer' : 'default' }}
                                onClick={handlePictureClick}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <img 
                                    src={currentPictureSource} 
                                    alt={`${userName}`} 
                                    style={styles.avatarImage} 
                                    onError={(e) => { e.target.onerror = null; e.target.src = '' }} 
                                />
                                {isEditing && (
                                    <div style={{ ...styles.editOverlay, opacity: isDragging ? 1 : 0.8 }}>
                                        <FiCamera size={24} />
                                        <span style={{fontSize: '14px', fontWeight: 600}}>{isDragging ? 'Drop Image' : 'Change Photo'}</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div style={styles.headerText}>
                                {renderField('Name', userData?.name, [editedName, setEditedName], true, <FiUser size={18} />)}
                                <p style={styles.userEmail}><FiMail size={16} style={{marginRight: '8px'}} />{userData?.email || userEmail}</p>
                            </div>
                        </div>

                        <div style={styles.fieldGroup}>
                            <h2 style={styles.sectionTitle}>Contact Information</h2>
                            {renderField('Contact', userData?.contact, [editedContact, setEditedContact], true, <FiPhone size={16} />)}
                            {renderField('Address', userData?.address, [editedAddress, setEditedAddress], true, <FiMapPin size={16} />)}
                        </div>

                    </div>

                    {/* User Posts Section */}
                    <div style={styles.postsSectionContainer}>
                        <div style={styles.postsSectionHeader}>
                            {/* Updated title to show filtered count */}
                            <h2 style={styles.postsSectionTitle}>Your Community Posts ({filteredThreads.length})</h2>
                            {userThreads.length > 0 && (
                                <button 
                                    style={styles.deleteAllButton} 
                                    onClick={handleDeleteAllPosts} 
                                    disabled={isThreadsLoading || loading} 
                                >
                                    <FiTrash2 size={16} /> Delete All Posts
                                </button>
                            )}
                        </div>

                        {/* ⭐ NEW: Filter Buttons */}
                        <div style={styles.filterBar}>
                            {THREAD_FILTERS.map(filter => (
                                <button
                                    key={filter.value}
                                    style={filter.value === selectedFilter ? styles.filterButtonActive : styles.filterButton}
                                    onClick={() => setSelectedFilter(filter.value)}
                                    disabled={isThreadsLoading}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        {/* ⭐ END: Filter Buttons */}


                        {isThreadsLoading ? (
                            <p style={styles.loadingResponsesText}>Loading your posts and jobs...</p>
                        ) : filteredThreads.length > 0 ? ( // Use filteredThreads
                            filteredThreads.map(thread => (
                                <UserThread 
                                    key={thread.id}
                                    thread={thread}
                                    currentUserId={currentUserId}
                                    setPopup={setPopup}
                                    handleDeleteThread={handleDeleteThread}
                                    renderPostBody={renderPostBody} 
                                />
                            ))
                        ) : (
                            <p style={styles.noResponsesText}>
                                {selectedFilter === 'All' 
                                    ? "You haven't posted any community threads or jobs yet."
                                    : `You have no ${selectedFilter === 'thread' ? 'threads' : 'jobs'} to display.`
                                }
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div style={styles.rightPanelContainer}>
                    <RightPanel userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />
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
        gap: '20px',
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
        alignSelf: 'flex-start',
    },
    errorBox: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #f87171',
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: '600',
    },
    loadingIcon: {
        animation: 'spin 1s linear infinite',
        color: '#3b82f6',
    },
    // Card Styles
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        padding: '30px',
        marginBottom: '25px',
        position: 'relative',
    },
    cardActions: {
        position: 'absolute',
        top: '25px',
        right: '25px',
        display: 'flex',
        gap: '10px',
    },
    button: {
        padding: '10px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s',
        border: '1px solid #d1d5db',
    },
    editButton: {
        backgroundColor: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
    },
    saveButton: {
        backgroundColor: '#10b981',
        color: '#fff',
        border: 'none',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
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
        fontSize: '10px',
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
    editOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
    // Profile Info Styles
    profileHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #f3f4f6',
    },
    headerText: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
    },
    userName: {
        margin: 0,
        fontSize: '22px',
        fontWeight: '700',
        color: '#1f2937'
    },
    userEmail: {
        margin: 0,
        fontSize: '15px',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '10px',
        paddingBottom: '5px',
        borderBottom: '2px solid #e5e7eb',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    fieldRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 5px',
    },
    fieldLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '15px',
        fontWeight: '600',
        color: '#4b5563',
        minWidth: '100px',
    },
    fieldValue: {
        fontSize: '15px',
        color: '#1f2937',
        fontWeight: '500',
        textAlign: 'right',
        flexGrow: 1,
    },
    inputField: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '15px',
        flexGrow: 1,
        maxWidth: '60%', 
        textAlign: 'right',
        transition: 'border-color 0.2s',
    },
    // Posts Section Styles
    postsSectionContainer: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        padding: '30px',
    },
    postsSectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '15px',
    },
    postsSectionTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '700',
        color: '#1f2937',
    },
    deleteAllButton: {
        backgroundColor: '#fecaca',
        color: '#dc2626',
        border: '1px solid #fca5a5',
        padding: '8px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
    },
    // ⭐ NEW: Filter Bar Styles
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
    // Thread Card Styles
    threadCard: {
        backgroundColor: '#fff',
        padding: '20px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    },
    threadMetaTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    threadAuthorInfo: {
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
        color: '#1f2937',
    },
    threadTime: {
        fontSize: '12px',
        color: '#9ca3af',
    },
    threadTag: {
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '12px',
        fontWeight: '600',
    },
    threadTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '5px 0 10px 0',
    },
    threadBody: {
        fontSize: '15px',
        color: '#374151',
        margin: 0,
        lineHeight: '1.6',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
    },
    // Read More Button Style
    readMoreButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#3b82f6',
        cursor: 'pointer',
        marginTop: '10px',
        marginBottom: '15px',
        width: 'fit-content',
    },
    threadActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
    },
    threadStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: '500',
    },
    deleteThreadButton: {
        backgroundColor: '#fef2f2',
        color: '#ef4444',
        border: '1px solid #fca5a5',
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
    },
    // Media Gallery Styles
    gridContainerStyle: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginTop: '15px',
        maxHeight: '450px', 
        overflow: 'hidden',
        borderRadius: '10px',
    },
    mediaContainer: {
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    threadImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    moreMediaOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: '20px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles (for Read More)
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh', 
        overflowY: 'auto', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
    },
    modalHeaderNoBorder: { 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        paddingBottom: '10px', 
        paddingTop: '5px',
        marginBottom: '5px',
    },
    modalUserSection: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginTop: '0px', 
        borderBottom: '1px solid #e5e7eb', 
        paddingBottom: '15px' 
    }, 
    modalUserName: { 
        fontWeight: 600, 
        fontSize: '16px', 
        color: '#1e3a8a' 
    }, 
    modalTime: { 
        fontSize: '13px',
        color: '#9ca3af',
        marginLeft: '10px',
    },
    modalThreadBody: {
        fontSize: '15px',
        color: '#4b5563',
        margin: '15px 0',
        lineHeight: '1.6',
    },
    modalCloseButton: {
        width: '100%',
        padding: '10px',
        marginTop: '15px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        backgroundColor: '#f9fafb',
        color: '#4b5563',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    // Response Section Styles
    responsesContainer: {
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #f3f4f6',
    },
    responseItem: {
        padding: '10px 0',
        borderBottom: '1px solid #f9fafb',
    },
    responseMeta: {
        display: 'flex',
        alignItems: 'flex-start', 
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
        transition: 'opacity 0.2s',
        opacity: 0.9,
    },
    loadingResponsesText: {
        fontSize: '14px',
        color: '#6b7280',
        textAlign: 'center',
        padding: '10px 0',
    },
    noResponsesText: {
        fontSize: '14px',
        color: '#9ca3af',
        textAlign: 'center',
        padding: '10px 0',
        margin: 0,
    },
};