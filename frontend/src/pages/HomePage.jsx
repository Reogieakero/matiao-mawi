import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageSquare, FiBookmark, FiX, FiChevronDown, FiChevronUp, FiPaperclip } from 'react-icons/fi';
import RightPanel from '../components/RightPanel';

// Utility function to format the time
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

// REMOVED: getMimeTypeFromUrl is no longer needed as we only support images.

const postCategories = ["General", "Invention", "Achievement", "Competition", "Events", "Maintenance"];
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];

export default function HomePage({ userName, userEmail }) {
    const [threads, setThreads] = useState([]);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState(postCategories[0]); 
    const [postType, setPostType] = useState("post");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // MODIFIED STATE: selectedFile changed to selectedFiles (array)
    const [selectedFiles, setSelectedFiles] = useState([]); 
    const [isUploadingFile, setIsUploadingFile] = useState(false); 

    // State to force refresh job counts in sidebar
    const [jobPostTrigger, setJobPostTrigger] = useState(0); 

    // --- STATE FOR RESPONSES ---
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [threadIdToReply, setThreadIdToReply] = useState(null);
    const [threadTypeToReply, setThreadTypeToReply] = useState(null);
    const [threadToReplyDetails, setThreadToReplyDetails] = useState(null); 
    const [parentResponseId, setParentResponseId] = useState(null); 
    const [parentResponseAuthor, setParentResponseAuthor] = useState(null);
    const [parentResponseContent, setParentResponseContent] = useState(null); 
    const [responseContent, setResponseContent] = useState('');
    const [expandedThreadId, setExpandedThreadId] = useState(null);
    const [responses, setResponses] = useState({}); 
    const [isFetchingResponses, setIsFetchingResponses] = useState(false);
    // ---------------------------------
    
    const currentCategories = postType === 'job' ? jobCategories : postCategories;

    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 

    // Function to fetch threads, including bookmark status check
    const fetchThreads = async () => {
        let allThreads = [];
        try {
            const res = await fetch("http://localhost:5000/api/threads");
            if (!res.ok) throw new Error("Failed to fetch threads");
            allThreads = await res.json();
        } catch (error) {
            console.error("Error fetching threads:", error);
            setIsLoading(false);
            return;
        }

        const mapThreadMedia = (thread) => ({
            ...thread,
            isBookmarked: thread.isBookmarked || false,
            // NEW: Use mediaUrls from server and ensure it is an array
            mediaUrls: thread.mediaUrls || (thread.mediaUrl ? [thread.mediaUrl] : []), 
        });

        if (userId) {
            try {
                const bookmarkRes = await fetch(`http://localhost:5000/api/bookmarks/${userId}`);
                if (!bookmarkRes.ok) throw new Error("Failed to fetch bookmarks");
                const bookmarks = await bookmarkRes.json();
                
                const bookmarkMap = bookmarks.reduce((acc, thread) => {
                    acc[`${thread.type}-${thread.id}`] = true;
                    return acc;
                }, {});

                const threadsWithStatus = allThreads.map(thread => ({
                    ...mapThreadMedia(thread),
                    isBookmarked: bookmarkMap[`${thread.type}-${thread.id}`] || false,
                }));
                setThreads(threadsWithStatus);

            } catch (error) {
                console.warn("Error fetching bookmark status:", error);
                setThreads(allThreads.map(mapThreadMedia));
            }
        } else {
             setThreads(allThreads.map(mapThreadMedia));
        }
        
        setIsLoading(false);
    };

    // Fetch threads on component mount
    useEffect(() => {
        fetchThreads();
    }, [userId]); 

    // Function to handle saving/unsaving a thread
    const handleBookmark = async (threadId, threadType, isBookmarked) => {
        if (!userId) return alert('You must be logged in to save a thread.');
        
        // Optimistic UI Update
        setThreads(prevThreads => prevThreads.map(t => 
            t.id === threadId && t.type === threadType ? { ...t, isBookmarked: !isBookmarked } : t
        ));

        try {
            const res = await fetch("http://localhost:5000/api/bookmarks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    threadId: threadId,
                    threadType: threadType,
                }),
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                 alert(data.message || `Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
                 setThreads(prevThreads => prevThreads.map(t => 
                    t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
                 ));
            }
        } catch (error) {
            console.error("Bookmark network error:", error);
            alert(`A network error occurred. Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
            setThreads(prevThreads => prevThreads.map(t => 
                t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
            ));
        }
    };
    
    // Function to fetch responses for a specific thread
    const fetchResponses = async (threadId, threadType) => {
        setResponses(prevResponses => {
            const newResponses = { ...prevResponses };
            delete newResponses[threadId];
            return newResponses;
        });

        setIsFetchingResponses(true);
        try {
            const res = await fetch(`http://localhost:5000/api/responses/${threadType}/${threadId}`);
            if (!res.ok) throw new Error("Failed to fetch responses");
            const data = await res.json();
            
            setResponses(prevResponses => ({
                ...prevResponses,
                [threadId]: data.reverse()
            }));
        } catch (error) {
            console.error("Error fetching responses:", error);
        } finally {
            setIsFetchingResponses(false);
        }
    };
    
    // Function to toggle response view
    const toggleResponses = (threadId, threadType) => {
        if (expandedThreadId === threadId) {
            setExpandedThreadId(null);
        } else {
            setExpandedThreadId(threadId); 
            fetchResponses(threadId, threadType); 
        }
    };

    // Handle category change when postType changes
    const handlePostTypeChange = (type) => {
        setPostType(type);
        setPostCategory(type === 'job' ? jobCategories[0] : postCategories[0]);
        // MODIFIED: Clear selectedFiles
        setSelectedFiles([]); 
    };


    // MODIFIED: handlePostSubmit to include multi-file upload logic
    const handlePostSubmit = async () => {
        if (!userId) {
             alert('User ID not found. Please log in again to post.');
             setIsModalOpen(false);
             return;
        }

        // MODIFIED: Check selectedFiles length
        if (!postContent.trim() && selectedFiles.length === 0) {
            return alert('Post cannot be empty if no media is attached!');
        }
        if (!postCategory) return alert('Please select a category.');

        // --- File Upload Logic ---
        let mediaUrls = []; // MODIFIED: array of URLs
        if (selectedFiles.length > 0) {
            setIsUploadingFile(true);
            const formData = new FormData();
            
            // MODIFIED: Append all selected files
            selectedFiles.forEach(file => {
                 formData.append('media', file); 
            });

            try {
                const uploadRes = await fetch("http://localhost:5000/api/upload-media", {
                    method: "POST",
                    body: formData, 
                });

                const uploadData = await uploadRes.json();
                
                if (!uploadRes.ok) {
                    throw new Error(uploadData.message || "File upload failed.");
                }
                
                mediaUrls = uploadData.mediaUrls; // MODIFIED: Expect array of URLs
            } catch (err) {
                console.error("Media upload error:", err);
                alert(`Failed to upload media. Post was cancelled. Error: ${err.message}`);
                setIsUploadingFile(false);
                return;
            } finally {
                setIsUploadingFile(false);
            }
        }
        // -----------------------------

        const tempId = Date.now();
        const optimisticThread = {
            id: tempId,
            type: postType,
            title: postContent.substring(0, 50) + (postContent.length > 50 ? '...' : ''),
            author: userName || 'User',
            time: new Date(),
            tag: postCategory,
            body: postContent,
            reactions: 0,
            responseCount: 0, 
            isSubmitting: true, 
            isBookmarked: false,
            mediaUrls: mediaUrls, // MODIFIED: Use array
        };
        setThreads([optimisticThread, ...threads]);
        setIsModalOpen(false);
        
        try {
            const res = await fetch("http://localhost:5000/api/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    postType,
                    postContent,
                    postCategory,
                    mediaUrls: mediaUrls, // MODIFIED: Send array of URLs
                }),
            });

            const data = await res.json();
            
            setThreads(prevThreads => {
                const updatedThreads = prevThreads.filter(t => t.id !== tempId);
                
                if (res.ok && data.thread) {
                    if (postType === 'job') {
                        setJobPostTrigger(prev => prev + 1);
                    }
                    // NEW: Ensure the returned thread object has mediaUrls
                    const newThreadWithUrls = {
                        ...data.thread, 
                        mediaUrls: data.thread.mediaUrls || (data.thread.mediaUrl ? [data.thread.mediaUrl] : []),
                    };
                    return [newThreadWithUrls, ...updatedThreads];
                } else {
                    alert(data.message || "Something went wrong while posting. Please try again.");
                    return updatedThreads;
                }
            });

        } catch (err) {
            console.error("Post network error:", err);
            alert("A network error occurred. Check server status.");
            setThreads(prevThreads => prevThreads.filter(t => t.id !== tempId));
        }
        
        // Cleanup
        setPostContent('');
        setPostCategory(currentCategories[0]); 
        setPostType("post");
        setSelectedFiles([]); // MODIFIED: Clear selectedFiles
    };
    
    // handleReplyClick
    const handleReplyClick = (threadId, threadType, replyToResponseId = null, replyToAuthor = null, replyToContent = null) => {
        if (!userId) return alert('You must be logged in to reply.');
        
        const thread = threads.find(t => t.id === threadId);
        if (!thread) return alert('Thread not found.');

        setThreadToReplyDetails({
            title: thread.title,
            body: thread.body
        });

        setThreadIdToReply(threadId);
        setThreadTypeToReply(threadType);
        setParentResponseId(replyToResponseId); 
        setParentResponseAuthor(replyToAuthor); 
        setParentResponseContent(replyToContent); 
        setResponseContent('');
        setIsResponseModalOpen(true);
    };

    // handleResponseSubmit
    const handleResponseSubmit = async () => {
        if (!responseContent.trim()) return alert('Response cannot be empty!');
        
        const responseData = {
            userId: userId,
            threadId: threadIdToReply,
            threadType: threadTypeToReply,
            content: responseContent,
            parentResponseId: parentResponseId 
        };
        
        try {
            const res = await fetch("http://localhost:5000/api/responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(responseData),
            });

            const data = await res.json();

            if (res.ok) {
                if (!parentResponseId) {
                    setThreads(prevThreads => prevThreads.map(t => 
                        t.id === threadIdToReply ? { ...t, responseCount: (t.responseCount || 0) + 1 } : t
                    ));
                }
                if(expandedThreadId === threadIdToReply) {
                    fetchResponses(threadIdToReply, threadTypeToReply);
                }

            } else {
                alert(data.message || "Failed to add response.");
            }

        } catch (err) {
            console.error("Response network error:", err);
            alert("A network error occurred while submitting response.");
        }

        setIsResponseModalOpen(false);
        setResponseContent('');
        setThreadIdToReply(null);
        setThreadTypeToReply(null);
        setThreadToReplyDetails(null); 
        setParentResponseId(null); 
        setParentResponseAuthor(null);
        setParentResponseContent(null); 
    };

    // handlePostKeyDown
    const handlePostKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handlePostSubmit();
        }
    };

    // handleResponseKeyDown
    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };

    // renderResponses
    const renderResponses = (threadResponses, threadId, threadType, parentId = null) => {
        const children = threadResponses.filter(r => 
            (parentId === null && r.parent_id === null) || 
            (parentId !== null && r.parent_id === parentId)
        );

        return children.map(response => (
            <div key={response.id} style={{
                ...styles.responseItem,
                marginLeft: response.parent_id ? '30px' : '0', 
            }}>
                <div style={styles.responseMeta}>
                    <div style={styles.avatarCircleTiny}>{response.author[0]}</div>
                    <span style={styles.responseAuthorName}>{response.author}</span>
                </div>
                
                <p style={styles.responseContent}>
                    {response.parent_author && (
                        <span style={styles.replyToText}>@{response.parent_author} </span>
                    )}
                    {response.content}
                </p>
                
                <div style={styles.responseActionLine}>
                    <div 
                        style={styles.responseReplyButton}
                        onClick={() => handleReplyClick(threadId, threadType, response.id, response.author, response.content)}
                    >
                        Reply
                    </div>
                    <span style={styles.responseTimeSmall}>
                        {getTimeSince(response.time)}
                    </span>
                </div>

                {/* Recursively render child responses */}
                {renderResponses(threadResponses, threadId, threadType, response.id)}
            </div>
        ));
    };

    // NEW HELPER: Function to render the media gallery with specific 1-on-2 layout
    const renderMediaGallery = (mediaUrls) => {
        if (!mediaUrls || mediaUrls.length === 0) return null;

        // Common style for images in the gallery
        const imageStyle = {
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
        };

        const imageElement = (url) => (
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                <img 
                    src={url} 
                    alt="Post media" 
                    style={imageStyle} 
                />
            </div>
        );

        if (mediaUrls.length === 1) {
            return (
                <div style={{ height: '350px' }}>
                    {imageElement(mediaUrls[0])}
                </div>
            );
        }

        if (mediaUrls.length === 2) {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', height: '350px' }}>
                    {imageElement(mediaUrls[0])}
                    {imageElement(mediaUrls[1])}
                </div>
            );
        }

        if (mediaUrls.length >= 3) {
            // Facebook-like 3-photo layout: 1 full-height on left, 2 half-height on right
            return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', height: '400px' }}>
                    {/* Left Side (First photo) */}
                    <div style={{ gridRow: 'span 2', maxHeight: '100%', overflow: 'hidden' }}>
                        {imageElement(mediaUrls[0])}
                    </div>
                    {/* Right Side Top (Second photo) */}
                    <div style={{ maxHeight: 'calc(50% - 2.5px)', overflow: 'hidden' }}>
                        {imageElement(mediaUrls[1])}
                    </div>
                    {/* Right Side Bottom (Third photo) */}
                    <div style={{ maxHeight: 'calc(50% - 2.5px)', overflow: 'hidden' }}>
                        {imageElement(mediaUrls[2])}
                    </div>
                </div>
            );
        }

        return null;
    };


    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Community Feed</h2>
                    
                    <button style={styles.createPostButton} onClick={() => setIsModalOpen(true)}>
                        <FiPlus size={20} /> Create New Post
                    </button>
                    
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading threads...</p>
                    ) : (threads.length === 0) ? (
                        <p style={styles.loadingText}>No threads found.</p>
                    ) : (
                        threads.map(thread => (
                            <div 
                                key={thread.id} 
                                style={{ 
                                    ...styles.threadPost, 
                                    opacity: thread.isSubmitting ? 0.7 : 1, 
                                }}
                            >
                                <div style={styles.threadMetaTop}>
                                    <div style={styles.threadAuthorInfo}>
                                        <div style={styles.avatarCircleSmall}>{thread.author[0]}</div>
                                        <span style={styles.threadAuthorName}>{thread.author}</span>
                                        <span style={styles.threadTime}>
                                            {thread.isSubmitting ? "Posting..." : getTimeSince(thread.time)}
                                        </span>
                                    </div>
                                    <span style={styles.threadTagModified}>{thread.tag}</span>
                                </div>
                                <h3 style={styles.threadTitle}>{thread.title}</h3>
                                
                                <p style={styles.threadBodyModified}>
                                    {thread.body}
                                </p>
                                
                                {/* MODIFIED: Media Display for photo gallery */}
                                {thread.mediaUrls && thread.mediaUrls.length > 0 && (
                                    <div style={styles.threadMediaContainer}>
                                        {renderMediaGallery(thread.mediaUrls)}
                                    </div>
                                )}
                                {/* END MODIFIED: Media Display */}
                                
                                <div style={styles.threadFooter}>
                                    <div style={styles.threadActions}>
                                        <div 
                                            style={{
                                                ...styles.threadActionButton,
                                                color: thread.isBookmarked ? '#3b82f6' : '#555',
                                                fontWeight: thread.isBookmarked ? '600' : '500',
                                            }}
                                            onClick={() => handleBookmark(thread.id, thread.type, thread.isBookmarked)}
                                        >
                                            <FiBookmark size={18} /> {thread.isBookmarked ? 'Saved' : 'Bookmark'}
                                        </div>

                                        <div 
                                            style={styles.threadActionButton}
                                            onClick={() => handleReplyClick(thread.id, thread.type)}
                                        >
                                            <FiMessageSquare size={18} /> Add Response
                                        </div>
                                    </div>
                                    
                                    <div 
                                        style={styles.responseToggleButton}
                                        onClick={() => toggleResponses(thread.id, thread.type)}
                                    >
                                        {thread.responseCount ?? 0} {thread.responseCount === 1 ? 'Response' : 'Responses'}
                                        {expandedThreadId === thread.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                    </div>
                                </div>

                                {expandedThreadId === thread.id && (
                                    <div style={styles.responsesContainer}>
                                        {isFetchingResponses && expandedThreadId === thread.id ? (
                                            <p style={styles.loadingResponsesText}>Loading responses...</p>
                                        ) : (
                                            (responses[thread.id] && responses[thread.id].length > 0) ? (
                                                renderResponses(responses[thread.id], thread.id, thread.type, null)
                                            ) : (
                                                <p style={styles.noResponsesText}>No responses yet. Be the first!</p>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Right Panel */}
                <RightPanel 
                    userName={userName} 
                    userEmail={userEmail} 
                    jobPostTrigger={jobPostTrigger}
                />
            </div>

            {/* Post Modal */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>Create New {postType === 'job' ? 'Job Post' : 'Community Post'}</h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setIsModalOpen(false)} />
                        </div>

                        <div style={styles.toggleContainer}>
                            <button 
                                style={{
                                    ...styles.toggleButton, 
                                    ...(postType === 'post' ? styles.toggleButtonActive : {})
                                }}
                                onClick={() => handlePostTypeChange('post')}
                            >
                                Community Post
                            </button>
                            <button 
                                style={{
                                    ...styles.toggleButton, 
                                    ...(postType === 'job' ? styles.toggleButtonActive : {})
                                }}
                                onClick={() => handlePostTypeChange('job')}
                            >
                                Job Post
                            </button>
                        </div>
                        
                        <div style={styles.modalUserSection}>
                            <div style={styles.avatarCircle}>{firstName[0]}</div>
                            <span style={styles.modalUserName}>{userName}</span>
                        </div>
                        
                        <div style={styles.categoryContainer}>
                            {currentCategories.map(cat => (
                                <button
                                    key={cat}
                                    style={{
                                        ...styles.categoryButton,
                                        ...(postCategory === cat ? styles.categoryButtonActive : {})
                                    }}
                                    onClick={() => setPostCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder={`What's on your mind, ${firstName}? (Title will be the first 50 characters of the post content)`}
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                            onKeyDown={handlePostKeyDown}
                            style={styles.modalTextarea}
                        />

                        {/* File Input Section - MODIFIED for multiple photos */}
                        <label htmlFor="media-upload" style={styles.fileUploadLabel}>
                            <FiPaperclip size={18} /> Attach up to 3 Images (Max 5MB total)
                            <input
                                id="media-upload"
                                type="file"
                                accept="image/*" // MODIFIED: Only images
                                multiple // NEW: Allow multiple files
                                onChange={e => {
                                    const files = Array.from(e.target.files);
                                    setSelectedFiles(files.slice(0, 3)); // Limit to 3 files
                                }}
                                style={styles.fileInputHidden}
                            />
                        </label>

                        {selectedFiles.length > 0 && (
                            <div style={styles.filePreviewContainer}>
                                {selectedFiles.map((file, index) => (
                                    <div key={index} style={styles.filePreview}>
                                        <span style={styles.fileName}>{file.name}</span>
                                        <FiX 
                                            size={20} 
                                            style={{ cursor: 'pointer', color: '#dc2626' }} 
                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* END MODIFIED: File Input Section */}


                        <button 
                            onClick={handlePostSubmit} 
                            style={styles.modalPostButton}
                            disabled={isUploadingFile}
                        >
                            {isUploadingFile ? 'Uploading Files...' : <><FiPlus color="#fff" /> Submit Post</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {isResponseModalOpen && threadToReplyDetails && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>
                                Reply to {threadTypeToReply === 'job' ? 'Job Post' : 'Community Post'}
                            </h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setIsResponseModalOpen(false)} />
                        </div>
                        
                        <div style={styles.replyContextBox}>
                            {parentResponseId ? (
                                <>
                                    <p style={styles.replyingToText}>
                                        Replying to @{parentResponseAuthor}'s comment:
                                    </p>
                                    <p style={styles.replyContentSnippet}>
                                        {parentResponseContent.substring(0, 150)} {parentResponseContent.length > 150 ? '...' : ''}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={styles.replyingToText}>
                                        Replying to the main {threadTypeToReply} topic:
                                    </p>
                                    <p style={styles.threadSnippet}>
                                        {threadToReplyDetails.body.substring(0, 150)} {threadToReplyDetails.body.length > 150 ? '...' : ''}
                                    </p>
                                </>
                            )}
                        </div>

                        <div style={styles.modalUserSection}>
                            <div style={styles.avatarCircle}>{firstName[0]}</div>
                            <span style={styles.modalUserName}>{userName}</span>
                        </div>

                        <textarea
                            placeholder={parentResponseId ? `Replying to @${parentResponseAuthor}...` : `Reply to the ${threadTypeToReply} here...`}
                            value={responseContent}
                            onChange={e => setResponseContent(e.target.value)}
                            onKeyDown={handleResponseKeyDown}
                            style={styles.modalTextarea}
                        />

                        <button onClick={handleResponseSubmit} style={styles.modalPostButton}>
                            <FiMessageSquare color="#fff" /> Submit Response
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const styles = {
    page: { 
        minHeight: '100vh', 
        padding: '10px' 
    },
    container: { 
        display: 'flex', 
        gap: '30px', 
        alignItems: 'flex-start', 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingRight: '340px', 
        boxSizing: 'border-box'
    },
    mainContent: { 
        flex: 1, 
        minWidth: '600px' 
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px',
    },
    createPostButton: {
        width: '100%',
        padding: '12px 20px',
        marginBottom: '20px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.2s',
    },
    loadingText: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#9ca3af',
    },
    threadPost: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '20px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
    },
    // Media container styles
    threadMediaContainer: {
        marginTop: '15px',
        marginBottom: '15px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    threadImage: {
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        display: 'block',
        maxWidth: '100%',
    },
    // threadVideo style REMOVED
    // End: Media container styles
    threadMetaTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },
    threadAuthorInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    avatarCircleSmall: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '14px',
    },
    threadAuthorName: {
        fontWeight: '600',
        fontSize: '15px',
        color: '#1e40af',
    },
    threadTime: {
        fontSize: '13px',
        color: '#9ca3af',
        marginLeft: '10px',
    },
    threadTagModified: {
        padding: '4px 10px',
        backgroundColor: '#e0f2fe',
        color: '#1e40af',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
    },
    threadTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0 0 8px 0',
    },
    threadBodyModified: {
        fontSize: '16px',
        color: '#4b5563',
        margin: '0 0 15px 0',
        lineHeight: '1.5',
    },
    threadFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '15px',
        borderTop: '1px solid #f3f4f6',
    },
    threadActions: {
        display: 'flex',
        gap: '15px',
    },
    threadActionButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        color: '#555',
        cursor: 'pointer',
        padding: '5px 8px',
        borderRadius: '6px',
        transition: 'background-color 0.2s',
    },
    responseToggleButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '14px',
        color: '#1e40af',
        fontWeight: '600',
        cursor: 'pointer',
        padding: '5px 8px',
        borderRadius: '6px',
        backgroundColor: '#eff6ff',
    },
    toggleContainer: {
        display: 'flex',
        width: '100%',
        backgroundColor: '#f0f9ff',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        padding: '10px',
        border: '1px solid #93c5fd',
        backgroundColor: '#e0f2fe',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'all 0.2s'
    },
    toggleButtonActive: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: '1px solid #2563eb'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '16px',
        width: '520px',
        maxWidth: '95%',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #c7d2fe',
        paddingBottom: '12px'
    },
    modalUserSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    avatarCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '18px',
    },
    modalUserName: {
        fontWeight: 600,
        fontSize: '16px',
        color: '#1e3a8a'
    },
    categoryContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '15px'
    },
    categoryButton: {
        padding: '8px 14px',
        borderRadius: '20px',
        border: '1px solid #93c5fd',
        backgroundColor: '#e0f2fe',
        color: '#1e40af',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
    },
    categoryButtonActive: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        borderColor: '#2563eb'
    },
    modalTextarea: {
        width: '94%',
        minHeight: '160px',
        padding: '15px',
        borderRadius: '14px',
        border: '1px solid #93c5fd',
        resize: 'vertical',
        outline: 'none',
        fontSize: '16px',
        backgroundColor: '#f0f9ff'
    },
    modalPostButton: {
        padding: '12px 18px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: '600',
        fontSize: '16px',
        transition: 'all 0.2s'
    },
    // File upload related styles
    fileInputHidden: {
        display: 'none',
    },
    fileUploadLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 15px',
        backgroundColor: '#eff6ff',
        color: '#1e40af',
        borderRadius: '8px',
        cursor: 'pointer',
        border: '1px dashed #93c5fd',
        fontWeight: '500',
        fontSize: '15px',
    },
    // NEW style for multiple file previews
    filePreviewContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    filePreview: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 15px',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #6ee7b7',
    },
    fileName: {
        fontSize: '14px',
        color: '#065f46',
        fontWeight: '600',
    },
    // End: File upload related styles
    responsesContainer: {
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: '350px',
        overflowY: 'auto',
    },
    responseItem: {
        padding: '5px 0',
        position: 'relative',
    },
    responseMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    avatarCircleTiny: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#60a5fa',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '10px',
    },
    responseAuthorName: {
        fontWeight: '700',
        fontSize: '14px',
        color: '#1e40af',
    },
    responseContent: {
        fontSize: '15px',
        color: '#4b5563',
        margin: '5px 0 5px 28px',
        lineHeight: '1.4',
    },
    responseActionLine: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginLeft: '28px',
    },
    responseReplyButton: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#60a5fa',
        cursor: 'pointer',
        padding: '2px 0',
        width: 'fit-content'
    },
    responseTimeSmall: {
        fontSize: '12px',
        color: '#9ca3af',
        lineHeight: 1,
    },
    replyToText: {
        fontWeight: '700',
        color: '#1d4ed8',
        marginRight: '4px',
    },
    loadingResponsesText: { 
        textAlign: 'center', 
        padding: '10px', 
        fontSize: '14px', 
        color: '#9ca3af' 
    },
    noResponsesText: { 
        textAlign: 'center', 
        padding: '10px', 
        fontSize: '14px', 
        color: '#9ca3af' 
    },
    replyContextBox: {
        border: '1px solid #c7d2fe',
        backgroundColor: '#f0f9ff',
        padding: '12px',
        borderRadius: '10px',
        marginBottom: '10px',
    },
    replyingToText: {
        fontSize: '14px',
        color: '#475569',
        fontWeight: '500',
        margin: '0',
    },
    threadSnippet: {
        fontSize: '15px',
        color: '#1e40af',
        fontWeight: '600',
        margin: '5px 0 0 0',
        maxHeight: '40px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    replyContentSnippet: {
        fontSize: '15px',
        color: '#4b5563',
        margin: '5px 0 0 0',
        maxHeight: '40px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }
};