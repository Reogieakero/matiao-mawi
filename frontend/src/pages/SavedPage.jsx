import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiBookmark,FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
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

export default function SavedPage({ userName, userEmail }) {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
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
    
    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 

    // Function to fetch bookmarked threads
    const fetchSavedThreads = async () => {
        if (!userId) {
            setThreads([]);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/bookmarks/${userId}`);
            if (!res.ok) throw new Error("Failed to fetch saved threads");
            
            const data = await res.json();
            // All fetched threads from the backend are marked as bookmarked
            setThreads(data.map(t => ({...t, isBookmarked: true}))); 
        } catch (error) {
            console.error("Error fetching saved threads:", error);
            setThreads([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch threads on component mount
    useEffect(() => {
        fetchSavedThreads();
    }, [userId]); 

    // Function to handle unsaving a thread (Only unsaving is possible on this page)
    const handleUnsave = async (threadId, threadType) => {
        if (!userId) return alert('You must be logged in to unsave a thread.');
        
        // Optimistic UI Update: Remove from list
        setThreads(prevThreads => prevThreads.filter(t => 
            !(t.id === threadId && t.type === threadType)
        ));

        try {
            const res = await fetch("http://localhost:5000/api/bookmarks", {
                method: "POST", // POST handles both save and unsave
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    threadId: threadId,
                    threadType: threadType,
                }),
            });
            
            const data = await res.json();
            
            if (!res.ok || data.bookmarked) {
                 // Revert optimistic update on failure or if it somehow saved instead of unsaved
                 alert(data.message || `Failed to unsave thread. Please refresh.`);
                 fetchSavedThreads(); // Re-fetch to restore on failure
            }

        } catch (error) {
            console.error("Unsave network error:", error);
            alert(`A network error occurred. Failed to unsave thread.`);
            fetchSavedThreads(); // Re-fetch to restore on failure
        }
    };
    
    // Function to fetch responses for a specific thread (Copied from HomePage)
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
    
    // Function to toggle response view (Copied from HomePage)
    const toggleResponses = (threadId, threadType) => {
        if (expandedThreadId === threadId) {
            setExpandedThreadId(null);
        } else {
            setExpandedThreadId(threadId); 
            fetchResponses(threadId, threadType); 
        }
    };

    // handleReplyClick (Copied from HomePage - simplified)
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

    // handleResponseSubmit (Copied from HomePage - simplified)
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
                // Manually update response count for the displayed saved thread
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

    // handleResponseKeyDown (Copied from HomePage)
    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };

    // renderResponses (Copied from HomePage)
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

                {renderResponses(threadResponses, threadId, threadType, response.id)}
            </div>
        ));
    };


    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Saved Threads</h2>
                    
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading saved threads...</p>
                    ) : (threads.length === 0) ? (
                        <p style={styles.loadingText}>You have no saved threads yet.</p>
                    ) : (
                        threads.map(thread => (
                            <div key={thread.id} style={styles.threadPost}>
                                <div style={styles.threadMetaTop}>
                                    <div style={styles.threadAuthorInfo}>
                                        <div style={styles.avatarCircleSmall}>{thread.author[0]}</div>
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
                                
                                <div style={styles.threadFooter}>
                                    <div style={styles.threadActions}>
                                        {/* Unsave Button */}
                                        <div 
                                            style={{
                                                ...styles.threadActionButton,
                                                color: '#ef4444', // Red for unsave
                                                fontWeight: '600',
                                            }}
                                            onClick={() => handleUnsave(thread.id, thread.type)}
                                        >
                                            <FiX size={18} /> Unsave
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

                {/* Right Panel (No jobPostTrigger needed) */}
                <RightPanel userName={userName} userEmail={userEmail} />
            </div>

            {/* RESPONSE MODAL (Copied from HomePage) */}
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

// --- Styles (Copied from HomePage for consistency) ---
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
        paddingRight: '340px', // Space for the fixed RightPanel
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