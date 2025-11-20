import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageSquare, FiBookmark, FiX, FiChevronDown, FiChevronUp, FiPaperclip, FiFlag } from 'react-icons/fi';
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

const postCategories = ["General", "Invention", "Achievement", "Competition", "Events", "Maintenance"];
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];

// ⭐ NEW: Categories for reporting issues
const reportCategories = [
    "Spam or Misleading", 
    "Hate Speech or Harassment", 
    "Inappropriate Content", 
    "Self-harm or Suicide", 
    "Intellectual Property",
    "Other"
];

export default function HomePage({ userName, userEmail, profilePictureUrl, setRefetchTrigger }) {
    const [threads, setThreads] = useState([]);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState(postCategories[0]); 
    const [postType, setPostType] = useState("post");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedFile, setSelectedFile] = useState(null); 
    const [isUploadingFile, setIsUploadingFile] = useState(false); 

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
    
    // ⭐ MODIFIED STATES FOR REPORTING MODAL
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [threadToReportId, setThreadToReportId] = useState(null);
    const [threadToReportType, setThreadToReportType] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportCategory, setReportCategory] = useState(reportCategories[0]); // ⭐ NEW STATE for selected category
    // ---------------------------------
    
    const currentCategories = postType === 'job' ? jobCategories : postCategories;

    const firstName = userName ? userName.split(' ')[0] : 'User';
    // Use the user ID from localStorage
    const userId = parseInt(localStorage.getItem('userId'), 10); 

    const renderAvatar = (url, initial, size = 'small') => {
        let style;
        switch (size) {
            case 'large':
                style = styles.avatarCircle;
                break;
            case 'tiny':
                style = styles.avatarCircleTiny;
                break;
            case 'small':
            default:
                style = styles.avatarCircleSmall;
                break;
        }

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
            mediaUrls: thread.mediaUrls || (thread.mediaUrl ? [thread.mediaUrl] : []), 
            author_picture_url: 
                (thread.author_id === userId && !thread.author_picture_url && profilePictureUrl)
                    ? profilePictureUrl
                    : thread.author_picture_url
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

    useEffect(() => {
        fetchThreads();
    }, [userId, profilePictureUrl]); 

    const handleBookmark = async (threadId, threadType, isBookmarked) => {
        if (!userId) return alert('You must be logged in to save a thread.');
        
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
    
    const toggleResponses = (threadId, threadType) => {
        if (expandedThreadId === threadId) {
            setExpandedThreadId(null);
        } else {
            setExpandedThreadId(threadId); 
            fetchResponses(threadId, threadType); 
        }
    };

    const handlePostTypeChange = (type) => {
        setPostType(type);
        setPostCategory(type === 'job' ? jobCategories[0] : postCategories[0]);
        setSelectedFile(null); 
    };


    const handlePostSubmit = async () => {
        if (!userId) {
             alert('User ID not found. Please log in again to post.');
             setIsModalOpen(false);
             return;
        }

        if (!postContent.trim() && !selectedFile) {
            return alert('Post cannot be empty if no media is attached!');
        }
        if (!postCategory) return alert('Please select a category.');

        // --- File Upload Logic ---
        let mediaUrls = []; 
        if (selectedFile) {
            setIsUploadingFile(true);
            const formData = new FormData();
            
            formData.append('media', selectedFile); 

            try {
                const uploadRes = await fetch("http://localhost:5000/api/upload-media", {
                    method: "POST",
                    body: formData, 
                });

                const uploadData = await uploadRes.json();
                
                if (!uploadRes.ok) {
                    throw new Error(uploadData.message || "File upload failed.");
                }
                
                mediaUrls = uploadData.mediaUrls; 
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
            author_id: userId,
            author_picture_url: profilePictureUrl,
            time: new Date(),
            tag: postCategory,
            body: postContent,
            reactions: 0,
            responseCount: 0, 
            isSubmitting: true, 
            isBookmarked: false,
            mediaUrls: mediaUrls,
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
                    mediaUrls: mediaUrls,
                }),
            });

            const data = await res.json();
            
            setThreads(prevThreads => {
                const updatedThreads = prevThreads.filter(t => t.id !== tempId);
                
                if (res.ok && data.thread) {
                    if (postType === 'job' && setRefetchTrigger) {
                        setRefetchTrigger(prev => prev + 1);
                    }
                    
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
        setSelectedFile(null); 
    };
    
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
    
    const handlePostKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handlePostSubmit();
        }
    };

    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };

    // ⭐ MODIFIED: Opens the report modal and sets the initial category
    const handleReportThread = (threadId, threadType) => {
        if (!userId) {
            return alert('You must be logged in to report a thread.');
        }
        setThreadToReportId(threadId);
        setThreadToReportType(threadType);
        setReportCategory(reportCategories[0]); // Set default category
        setReportReason(''); // Clear free-text reason
        setIsReportModalOpen(true);
    };

    // ⭐ MODIFIED: Function to handle the actual submission of the report
    const submitReport = async () => {
        if (!reportCategory || (reportCategory === 'Other' && !reportReason.trim())) {
            // Require a category selection, or a reason if 'Other' is selected.
            return alert('Please select a report category. If selecting "Other", please provide a description.');
        }

        const threadId = threadToReportId;
        const threadType = threadToReportType;

        // Construct the full report reason string
        const finalReason = reportReason.trim() 
            ? `${reportCategory}: ${reportReason.trim()}`
            : reportCategory;

        // Optimistically close the modal
        setIsReportModalOpen(false); 
        
        // ⭐ NEW: Show an immediate confirmation message
        alert(`Report for thread ID ${threadId} has been successfully submitted! Issue: ${reportCategory}`);


        try {
            const res = await fetch('http://localhost:5000/api/report-thread', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: userId, 
                    threadId: threadId, 
                    threadType: threadType,
                    // Send the combined/selected reason
                    reason: finalReason 
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                // If the report fails (e.g., already reported), notify the user.
                alert(`Server failure: ${data.message || 'Failed to submit report. It may have been submitted previously.'}`); 
            }
            // Note: The success case relies on the optimistic alert above for confirmation.

        } catch (err) {
            console.error("Report network error:", err);
            alert("A network error occurred while submitting the report. Check server status.");
        } finally {
            // Cleanup state
            setThreadToReportId(null);
            setThreadToReportType(null);
            setReportReason('');
            setReportCategory(reportCategories[0]);
        }
    };

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
                    {renderAvatar(response.author_picture_url, response.author, 'tiny')}
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

                {renderResponses(threadResponses, threadId, threadType, response.id)}
            </div>
        ));
    };

    const renderMediaGallery = (mediaUrls) => {
        if (!mediaUrls || mediaUrls.length === 0) return null;

        const imageStyle = {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
        };

        const imageElement = (url) => (
            <div 
                key={url}
                style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '100%', 
                    overflow: 'hidden',
                    borderRadius: '10px'
                }}
            >
                <img src={url} alt="Post media" style={imageStyle} />
            </div>
        );

        if (mediaUrls.length >= 1) {
            return (
                <div style={{ height: '350px', marginTop: '15px', marginBottom: '15px' }}>
                    {imageElement(mediaUrls[0])}
                </div>
            );
        }

        return null;
    };
    
    // Find the thread details for the report modal
    const reportedThreadDetails = threads.find(t => t.id === threadToReportId && t.type === threadToReportType);


    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Community Feed</h2>
                    
                    <div style={styles.createPostBar} onClick={() => setIsModalOpen(true)}>
                        {renderAvatar(profilePictureUrl, firstName, 'large')}
                        <input 
                            type="text" 
                            placeholder={`What's on your mind, ${firstName}?`}
                            style={styles.postInput}
                            readOnly
                        />
                        <FiPaperclip size={20} color="#3b82f6" style={{ cursor: 'pointer' }} />
                    </div>

                    {/* Thread List */}
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading community threads...</p>
                    ) : (threads.length === 0) ? (
                        <p style={styles.loadingText}>No threads found. Be the first to post!</p>
                    ) : (
                        threads.map(thread => (
                            <div key={thread.id} style={styles.threadPost}>
                                <div style={styles.threadMetaTop}>
                                    <div style={styles.threadAuthorInfo}>
                                        {renderAvatar(thread.author_picture_url, thread.author, 'small')}
                                        <span style={styles.threadAuthorName}>{thread.author}</span>
                                        <span style={styles.threadTime}>
                                            {getTimeSince(thread.time)}
                                        </span>
                                    </div>
                                    <div style={styles.threadRightActions}>
                                        <span style={styles.threadTagModified}>{thread.tag}</span>
                                        {thread.author_id !== userId && (
                                            <div 
                                                style={styles.reportIcon}
                                                // ⭐ Call the new handler
                                                onClick={() => handleReportThread(thread.id, thread.type)}
                                                title="Report Thread"
                                            >
                                                <FiFlag size={18} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 style={styles.threadTitle}>{thread.title}</h3>
                                <p style={styles.threadBodyModified}>
                                    {thread.body}
                                </p>
                                
                                {renderMediaGallery(thread.mediaUrls)}

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
                    profilePictureUrl={profilePictureUrl} 
                />
            </div>

            {/* Post Modal (Unchanged) */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>Create New {postType === 'job' ? 'Job Post' : 'Community Post'}</h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setIsModalOpen(false)} />
                        </div>
                        
                        <div style={styles.toggleContainer}>
                            <button 
                                style={{ ...styles.toggleButton, ...(postType === 'post' ? styles.toggleButtonActive : {}) }}
                                onClick={() => handlePostTypeChange('post')}
                            >
                                Community Post
                            </button>
                            <button 
                                style={{ ...styles.toggleButton, ...(postType === 'job' ? styles.toggleButtonActive : {}) }}
                                onClick={() => handlePostTypeChange('job')}
                            >
                                Job Post
                            </button>
                        </div>

                        <div style={styles.modalUserSection}>
                            {renderAvatar(profilePictureUrl, firstName, 'large')}
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
                            placeholder={`Write your ${postType === 'job' ? 'job post title and details' : 'community post content'} here...`} 
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                            onKeyDown={handlePostKeyDown}
                            style={styles.modalTextarea}
                        />

                        <div style={styles.fileInputSection}>
                            <label htmlFor="media-upload" style={styles.fileInputLabel}>
                                <FiPaperclip size={20} /> Attach Media ({postType === 'job' ? 'PDF/Image (optional)' : 'Image (optional)'})
                            </label>
                            <input 
                                type="file" 
                                id="media-upload" 
                                style={{ display: 'none' }}
                                accept={postType === 'job' ? ".pdf,image/*" : "image/*"}
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                        </div>

                        {selectedFile && (
                            <div style={styles.selectedFileBox}>
                                <span>File Selected: {selectedFile.name}</span>
                                <FiX size={20} style={{ cursor: 'pointer', color: '#dc2626' }} onClick={() => setSelectedFile(null)} />
                            </div>
                        )}
                        
                        <button 
                            onClick={handlePostSubmit} 
                            style={styles.modalPostButton}
                            disabled={isUploadingFile}
                        >
                            {isUploadingFile ? 'Uploading File...' : <><FiPlus color="#fff" /> Submit Post</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Response Modal (Unchanged) */}
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
                            {renderAvatar(profilePictureUrl, firstName, 'large')}
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

            {/* ⭐ MODIFIED: Report Modal */}
            {isReportModalOpen && reportedThreadDetails && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#dc2626' }}>Report Content</h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => setIsReportModalOpen(false)} />
                        </div>

                        <div style={styles.replyContextBox}>
                            <p style={styles.replyingToText}>
                                Reporting {reportedThreadDetails.type} by {reportedThreadDetails.author}:
                            </p>
                            <p style={styles.threadSnippet}>
                                {reportedThreadDetails.body.substring(0, 150)} {reportedThreadDetails.body.length > 150 ? '...' : ''}
                            </p>
                        </div>
                        
                        {/* ⭐ NEW: Report Categories Selection */}
                        <label style={styles.reportLabel}>
                            Select the primary issue: <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={styles.categoryContainer}>
                            {reportCategories.map(cat => (
                                <button 
                                    key={cat}
                                    style={{ 
                                        ...styles.reportCategoryButton, 
                                        ...(reportCategory === cat ? styles.reportCategoryButtonActive : {}) 
                                    }}
                                    onClick={() => setReportCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        
                        <label htmlFor="report-reason" style={styles.reportLabel}>
                            Provide specific details (Optional):
                        </label>
                        <textarea 
                            id="report-reason"
                            placeholder={reportCategory === 'Other' ? "Please explain why you are reporting this content." : "Add more details to help us investigate (optional)."} 
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                            style={styles.modalTextarea}
                            rows={4}
                        />
                        
                        <button 
                            onClick={submitReport} 
                            style={styles.reportSubmitButton}
                            // ⭐ MODIFIED: Disable if no category is selected OR if "Other" is selected but no reason is provided
                            disabled={!reportCategory || (reportCategory === 'Other' && reportReason.trim().length === 0)}
                        >
                            <FiFlag color="#fff" /> Submit Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Styles (for HomePage and shared components) ---
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
    loadingText: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#9ca3af',
    },
    createPostBar: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '12px 20px',
        borderRadius: '30px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        marginBottom: '25px',
        border: '1px solid #e5e7eb',
    },
    postInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        padding: '10px 15px',
        margin: '0 10px',
        borderRadius: '20px',
        backgroundColor: '#f3f4f6',
        fontSize: '15px',
        color: '#4b5563',
        cursor: 'pointer',
    },
    threadPost: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '20px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
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
        gap: '8px',
    },
    threadRightActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    reportIcon: {
        color: '#9ca3af',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '50%',
        transition: 'color 0.2s, background-color 0.2s',
        '&:hover': {
            backgroundColor: '#fee2e2',
            color: '#dc2626'
        }
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
    responsesContainer: {
        marginTop: '15px',
        padding: '10px 0',
        borderTop: '1px solid #e5e7eb',
    },
    responseItem: {
        padding: '10px 0',
        borderBottom: '1px dashed #e5e7eb',
    },
    responseMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
    },
    responseAuthorName: {
        fontWeight: '600',
        fontSize: '13px',
        color: '#374151',
    },
    responseContent: {
        fontSize: '14px',
        color: '#4b5563',
        margin: '0 0 5px 30px',
        lineHeight: '1.4',
    },
    responseActionLine: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginLeft: '30px',
        marginBottom: '5px',
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
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
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
        overflow: 'hidden', 
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #c7d2fe',
        paddingBottom: '12px'
    },
    toggleContainer: {
        display: 'flex',
        gap: '10px',
        margin: '15px 0',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        padding: '8px 10px',
        border: 'none',
        backgroundColor: '#f9fafb',
        color: '#4b5563',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '14px'
    },
    toggleButtonActive: {
        backgroundColor: '#1e40af',
        color: '#fff',
    },
    modalUserSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '15px'
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
        borderColor: '#3b82f6',
    },
    reportCategoryButton: { // ⭐ NEW STYLE for report categories
        padding: '6px 10px',
        borderRadius: '16px',
        border: '1px solid #fca5a5',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
    },
    reportCategoryButtonActive: { // ⭐ NEW STYLE for active report category
        backgroundColor: '#dc2626',
        color: '#fff',
        borderColor: '#dc2626',
    },
    modalTextarea: {
        width: '100%',
        minHeight: '100px', // Reduced height for more compact modal
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        resize: 'vertical',
        fontSize: '15px',
        boxSizing: 'border-box'
    },
    modalPostButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: '#1e40af',
        color: '#fff',
        fontWeight: '700',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    fileInputSection: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '15px',
    },
    fileInputLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 15px',
        borderRadius: '20px',
        border: '1px solid #93c5fd',
        backgroundColor: '#f0f9ff',
        color: '#1e40af',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    selectedFileBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        border: '1px solid #a7f3d0',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '15px',
        fontSize: '14px',
        color: '#059669',
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
    reportLabel: { 
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px',
    },
    reportSubmitButton: { 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: '#dc2626',
        color: '#fff',
        fontWeight: '700',
        fontSize: '16px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    }
};