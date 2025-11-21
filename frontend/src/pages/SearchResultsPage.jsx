import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMessageSquare, FiBookmark, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
// ⭐ IMPORT THE RIGHT PANEL
import RightPanel from '../components/RightPanel'; 

// Utility function to format the time (Copied from HomePage.jsx)
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

// ⭐ NEW HELPER: Function to render avatar based on URL presence (Copied from HomePage.jsx)
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


// ⭐ MODIFIED: Added profilePictureUrl prop for the Response Modal avatar
export default function SearchResultsPage({ userName, profilePictureUrl }) {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    
    // --- STATE FOR RESPONSES (Copied from HomePage.jsx) ---
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
    
    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 
    
    // Extract search query from URL
    const query = new URLSearchParams(location.search).get('q');
    
    // ⭐ MODIFIED: Function to fetch search results
    const fetchSearchResults = async (searchTerm) => {
        if (!searchTerm) {
            setThreads([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        // Step 1: Fetch Search Results
        let searchResults = [];
        try {
            const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`);
            if (!res.ok) throw new Error("Failed to fetch search results");
            searchResults = await res.json();
        } catch (error) {
            console.error("Error fetching search results:", error);
            setThreads([]);
            setIsLoading(false);
            return;
        }
        
        const mapThreadMedia = (thread) => ({
            ...thread,
            // Ensure mediaUrls is an array
            mediaUrls: thread.mediaUrls || (thread.mediaUrl ? [thread.mediaUrl] : []), 
        });

        // Step 2: Fetch User Bookmarks to check status (Copied logic from HomePage.jsx)
        if (userId) {
            try {
                const bookmarkRes = await fetch(`http://localhost:5000/api/bookmarks/${userId}`);
                if (!bookmarkRes.ok) throw new Error("Failed to fetch bookmarks");
                const bookmarks = await bookmarkRes.json();
                
                const bookmarkMap = bookmarks.reduce((acc, thread) => {
                    acc[`${thread.type}-${thread.id}`] = true;
                    return acc;
                }, {});

                // Step 3: Merge bookmark status into threads
                const threadsWithStatus = searchResults.map(thread => ({
                    ...mapThreadMedia(thread),
                    isBookmarked: bookmarkMap[`${thread.type}-${thread.id}`] || false,
                }));
                setThreads(threadsWithStatus);

            } catch (error) {
                console.warn("Error fetching bookmark status:", error);
                setThreads(searchResults.map(t => ({...mapThreadMedia(t), isBookmarked: false})));
            }
        } else {
             setThreads(searchResults.map(t => ({...mapThreadMedia(t), isBookmarked: false})));
        }
        
        setIsLoading(false);
    };

    // Fetch search results when the component mounts or the query changes
    useEffect(() => {
        fetchSearchResults(query);
    }, [query, userId]); 

    // Function to handle saving/unsaving a thread (Copied from HomePage.jsx)
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
            
            if (!res.ok) throw new Error("API call failed");

            const data = await res.json();
            
            if (!res.ok) {
                 // Revert optimistic update on failure
                 alert(data.message || `Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
                 setThreads(prevThreads => prevThreads.map(t => 
                    t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
                 ));
            }
            
        } catch (error) {
            console.error("Bookmark network error:", error);
            alert(`A network error occurred. Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
            // Revert optimistic update on network error
            setThreads(prevThreads => prevThreads.map(t => 
                t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
            ));
        }
    };
    
    // Function to fetch responses for a specific thread (Copied from HomePage.jsx)
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
    
    // Function to toggle response view (Copied from HomePage.jsx)
    const toggleResponses = (threadId, threadType) => {
        if (expandedThreadId === threadId) {
            setExpandedThreadId(null);
        } else {
            setExpandedThreadId(threadId); 
            fetchResponses(threadId, threadType); 
        }
    };

    // handleReplyClick (Copied from HomePage.jsx)
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

    // handleResponseSubmit (Copied from HomePage.jsx)
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
                    // Update response count only for top-level responses
                    setThreads(prevThreads => prevThreads.map(t => 
                        t.id === threadIdToReply ? { ...t, responseCount: (t.responseCount || 0) + 1 } : t
                    ));
                }
                // Refresh responses if the thread is currently expanded
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

    // handleResponseKeyDown (Copied from HomePage.jsx)
    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };

    // NEW HELPER: Function to render the media gallery (Copied from HomePage.jsx)
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

        // Only handles 1 photo now
        if (mediaUrls.length >= 1) {
            return (
                <div style={{ height: '350px', marginTop: '15px', marginBottom: '15px' }}>
                    {imageElement(mediaUrls[0])}
                </div>
            );
        }

        return null;
    };


    // MODIFIED: renderResponses to use renderAvatar
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
                    {/* ⭐ MODIFIED: Use renderAvatar for response author */}
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


    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>
                        Search Results for: "{query || ''}"
                    </h2>
                    
                    {isLoading ? (
                        <p style={styles.loadingText}>Searching threads...</p>
                    ) : (
                        threads.length > 0 ? (
                            threads.map(thread => (
                                <div key={thread.id + thread.type} style={styles.threadPost}>
                                    <div style={styles.threadMetaTop}>
                                        <div style={styles.threadAuthorInfo}>
                                            {/* ⭐ MODIFIED: Use renderAvatar for author */}
                                            {renderAvatar(thread.author_picture_url, thread.author, 'small')}
                                            <span style={styles.threadAuthorName}>{thread.author}</span>
                                            <span style={styles.threadTime}>
                                                {getTimeSince(thread.time)}
                                            </span>
                                        </div>
                                        <span style={styles.threadTagModified}>{thread.tag}</span>
                                    </div>
                                    <h3 style={styles.threadTitle}>{thread.title}</h3>
                                    <p style={styles.threadBodyModified}> 
                                        {thread.body} 
                                    </p>
                                    {/* NEW: Render Media Gallery */}
                                    {renderMediaGallery(thread.mediaUrls)}
                                    <div style={styles.threadFooter}>
                                        <div style={styles.threadActions}>
                                            {/* Bookmark Button (Same function as HomePage.jsx) */}
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
                                            {/* Add Response Button (Same function as HomePage.jsx) */}
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
                        ) : (
                            <p style={styles.loadingText}>No results found for "{query}".</p>
                        )
                    )}
                </div> 

                {/* Right Panel */}
                <div style={styles.rightPanel}>
                    <RightPanel 
                        // Assuming you need to pass these props for it to function correctly
                        userName={userName} 
                        userEmail={localStorage.getItem('userEmail')} 
                        profilePictureUrl={profilePictureUrl}
                    /> 
                </div>

                {/* Response Modal (Copied and modified from HomePage.jsx) */}
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
                            {/* ⭐ MODIFIED: Use renderAvatar for current user */}
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
            </div>
        </div>
    );
}

// --- Styles (Modified to accommodate RightPanel and new avatar needs) --- 
const styles = { 
    page: { minHeight: '100vh', padding: '10px' }, 
    container: { 
        display: 'flex', 
        gap: '30px', 
        alignItems: 'flex-start', 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingRight: '10px', 
        boxSizing: 'border-box' 
    }, 
    mainContent: { 
        flex: 1, 
        minWidth: '600px' // Ensure main content has a minimum width 
    }, 
    rightPanel: { 
        width: '300px', 
        flexShrink: 0, 
        position: 'sticky', 
        top: '80px', // Below the header 
    }, 
    sectionTitle: { 
        fontSize: '24px', 
        fontWeight: '700', 
        color: '#1e40af', 
        marginBottom: '20px', 
        borderBottom: '2px solid #1e40af', 
        paddingBottom: '5px' 
    }, 
    loadingText: { 
        textAlign: 'center', 
        padding: '20px', 
        fontSize: '16px', 
        color: '#6b7280' 
    },
    // --- Avatar Styles ---
    avatarCircle: { 
        width: '45px', 
        height: '45px', 
        borderRadius: '50%', 
        backgroundColor: '#2563eb', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: '700', 
        fontSize: '18px', 
        flexShrink: 0,
        overflow: 'hidden' 
    }, 
    avatarCircleSmall: { 
        width: '30px', 
        height: '30px', 
        borderRadius: '50%', 
        backgroundColor: '#93c5fd', 
        color: '#1e40af', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: '600', 
        fontSize: '14px', 
        flexShrink: 0,
        overflow: 'hidden'
    }, 
    avatarCircleTiny: { 
        width: '25px', 
        height: '25px', 
        borderRadius: '50%', 
        backgroundColor: '#bfdbfe', 
        color: '#1e40af', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: '600', 
        fontSize: '12px', 
        flexShrink: 0,
        overflow: 'hidden' 
    },
    // ⭐ NEW STYLE: For image inside the avatar circles (Copied from HomePage.jsx)
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    // --- End Avatar Styles ---
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
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
        maxHeight: '80vh',
        overflowY: 'auto' 
    }, 
    modalHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        borderBottom: '1px solid #e5e7eb', 
        paddingBottom: '10px' 
    }, 
    modalUserSection: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '15px' 
    }, 
    modalUserName: { 
        fontWeight: '600', 
        fontSize: '16px', 
        color: '#1f2937' 
    }, 
    modalTextarea: { 
        width: '100%', 
        minHeight: '100px', 
        padding: '10px', 
        borderRadius: '8px', 
        border: '1px solid #d1d5db', 
        fontSize: '15px', 
        resize: 'vertical', 
        marginBottom: '15px', 
        boxSizing: 'border-box' 
    }, 
    modalPostButton: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        width: '100%', 
        backgroundColor: '#3b82f6', 
        color: '#fff', 
        padding: '12px 20px', 
        borderRadius: '8px', 
        border: 'none', 
        cursor: 'pointer', 
        fontWeight: '600', 
        fontSize: '16px', 
        transition: 'background-color 0.2s' 
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
        fontWeight: '600', 
        color: '#1f2937', 
        margin: '5px 0 0 0',
        whiteSpace: 'pre-wrap', 
    },
    replyContentSnippet: { 
        fontSize: '14px', 
        color: '#374151', 
        margin: '5px 0 0 0',
        whiteSpace: 'pre-wrap',
    },
    // --- Thread Post Styles --- 
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
        color: '#111827', 
        marginBottom: '5px' 
    }, 
    threadBodyModified: { 
        fontSize: '15px', 
        fontWeight: '500', 
        color: '#111827', 
        lineHeight: '1.4', 
        marginBottom: '15px', 
        marginTop: '10px', 
        whiteSpace: 'pre-wrap', 
    }, 
    threadFooter: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '10px', 
        borderTop: '1px solid #c7d2fe' 
    }, 
    threadActions: { 
        display: 'flex', 
        gap: '20px' 
    }, 
    threadActionButton: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        color: '#555', 
        cursor: 'pointer', 
        fontSize: '14px', 
        fontWeight: '500' 
    }, 
    responseToggleButton: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px', 
        color: '#1e40af', 
        fontWeight: '600', 
        fontSize: '14px', 
        cursor: 'pointer' 
    }, 
    // --- Response Styles --- 
    responsesContainer: { 
        marginTop: '15px', 
        paddingLeft: '10px', 
        borderLeft: '2px solid #e0f2fe' 
    }, 
    responseItem: { 
        padding: '10px 0', 
        borderBottom: '1px dashed #e5e7eb', 
        paddingRight: '10px' 
    }, 
    responseMeta: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '5px' 
    }, 
    responseAuthorName: { 
        fontWeight: '600', 
        fontSize: '13px', 
        color: '#1e40af' 
    }, 
    responseContent: { 
        fontSize: '14px', 
        color: '#1f2937', 
        marginLeft: '30px', 
        lineHeight: '1.4', 
        whiteSpace: 'pre-wrap',
        margin: '0 0 5px 30px'
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
    }
};