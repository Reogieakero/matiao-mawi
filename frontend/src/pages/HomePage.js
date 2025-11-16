import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageSquare, FiBookmark, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
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

const categories = ["General", "Invention", "Achievement", "Competition", "Events", "Maintenance"];

export default function HomePage({ userName, userEmail }) {
    const [threads, setThreads] = useState([]);
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState(categories[0]);
    const [postType, setPostType] = useState("post");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- STATE FOR RESPONSES ---
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [threadIdToReply, setThreadIdToReply] = useState(null);
    const [threadTypeToReply, setThreadTypeToReply] = useState(null);
    const [parentResponseId, setParentResponseId] = useState(null); 
    const [responseContent, setResponseContent] = useState('');
    const [expandedThreadId, setExpandedThreadId] = useState(null);
    const [responses, setResponses] = useState({}); 
    const [isFetchingResponses, setIsFetchingResponses] = useState(false);
    // ---------------------------------

    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 

    // Fetch threads on component mount
    useEffect(() => {
        const fetchThreads = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/threads");
                if (!res.ok) throw new Error("Failed to fetch threads");
                
                const data = await res.json();
                setThreads(data);
            } catch (error) {
                console.error("Error fetching threads:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchThreads();
    }, []);
    
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
            
            // CRITICAL FIX: Reverse the array for newest-to-oldest display
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

    const handlePostSubmit = async () => {
        if (!userId) {
             alert('User ID not found. Please log in again to post.');
             setIsModalOpen(false);
             return;
        }

        if (!postContent.trim()) return alert('Post cannot be empty!');

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
                }),
            });

            const data = await res.json();
            
            setThreads(prevThreads => {
                const updatedThreads = prevThreads.filter(t => t.id !== tempId);
                
                if (res.ok && data.thread) {
                    return [data.thread, ...updatedThreads];
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
        
        setPostContent('');
        setPostCategory(categories[0]);
        setPostType("post");
    };
    
    // UPDATED: Handler function to open reply modal for a Thread OR a Response
    const handleReplyClick = (threadId, threadType, replyToResponseId = null) => {
        if (!userId) return alert('You must be logged in to reply.');
        setThreadIdToReply(threadId);
        setThreadTypeToReply(threadType);
        setParentResponseId(replyToResponseId); // Set the parent ID if replying to a response
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
            parentResponseId: parentResponseId // NEW: Include parent ID
        };
        
        try {
            const res = await fetch("http://localhost:5000/api/responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(responseData),
            });

            const data = await res.json();

            if (res.ok) {
                // Manually update the response count (only for top-level responses)
                if (!parentResponseId) {
                    setThreads(prevThreads => prevThreads.map(t => 
                        t.id === threadIdToReply ? { ...t, responseCount: (t.responseCount || 0) + 1 } : t
                    ));
                }

                // If the response section is open, refetch the responses to display the new one
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

        // Close and reset all response-related states
        setIsResponseModalOpen(false);
        setResponseContent('');
        setThreadIdToReply(null);
        setThreadTypeToReply(null);
        setParentResponseId(null); // IMPORTANT: Reset parent ID
    };

    // UPDATED: Helper to render responses and their reply buttons (now without a card background)
    const renderResponses = (threadResponses, threadId, threadType) => {
        return threadResponses.map(response => (
            <div key={response.id} style={{
                ...styles.responseItem,
                // Nested style for replies to responses (simple indentation)
                marginLeft: response.parent_id ? '30px' : '0', 
            }}>
                {/* Meta line: Avatar and Author Name */}
                <div style={styles.responseMeta}>
                    <div style={styles.avatarCircleTiny}>{response.author[0]}</div>
                    <span style={styles.responseAuthorName}>{response.author}</span>
                    {/* Time is now in the action line below */}
                </div>
                
                {/* Content */}
                <p style={styles.responseContent}>
                    {/* Display who they are replying to */}
                    {response.parent_author && (
                        <span style={styles.replyToText}>@{response.parent_author} </span>
                    )}
                    {response.content}
                </p>
                
                {/* NEW Action Line: Reply Button and Time */}
                <div style={styles.responseActionLine}>
                    <div 
                        style={styles.responseReplyButton}
                        // Pass the response ID as the parent ID
                        onClick={() => handleReplyClick(threadId, threadType, response.id)}
                    >
                        Reply
                    </div>
                    <span style={styles.responseTimeSmall}>
                        {getTimeSince(response.time)}
                    </span>
                </div>
            </div>
        ));
    };


    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Community Threads</h2>

                    {/* New Thread Box */}
                    <div style={styles.newThreadBox}>
                        <div style={styles.newThreadHeader}>
                            <div style={styles.avatarCircle}>{firstName[0]}</div>
                            <div
                                style={styles.newThreadInputTrigger}
                                onClick={() => setIsModalOpen(true)}
                            >
                                What's on your mind, {firstName}?
                            </div>
                            <button style={styles.newThreadButton} onClick={() => setIsModalOpen(true)}>
                                <FiPlus size={24} color="#fff" />
                            </button>
                        </div>
                    </div>

                    {/* Threads Feed */}
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading threads...</p>
                    ) : (
                        threads.map(thread => (
                            <div key={thread.id} style={{
                                ...styles.threadPost, 
                                opacity: thread.isSubmitting ? 0.7 : 1, 
                            }}>
                                
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
                                
                                <p style={styles.threadBodyModified}>
                                    {thread.body}
                                </p>
                                
                                <div style={styles.threadFooter}>
                                    <div style={styles.threadActions}>
                                        <div style={styles.threadActionButton}><FiBookmark size={18} /> Bookmark</div>
                                        
                                        {/* Add onClick handler to open response modal (top-level thread reply) */}
                                        <div 
                                            style={styles.threadActionButton}
                                            onClick={() => handleReplyClick(thread.id, thread.type)}
                                        >
                                            <FiMessageSquare size={18} /> Add Response
                                        </div>
                                    </div>
                                    
                                    {/* Toggle button for responses with correct count display */}
                                    <div
                                        style={styles.responseToggleButton}
                                        onClick={() => toggleResponses(thread.id, thread.type)}
                                    >
                                        {thread.responseCount ?? 0} {thread.responseCount === 1 ? 'Response' : 'Responses'} 
                                        {expandedThreadId === thread.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                    </div>
                                </div>
                                
                                {/* Response Section */}
                                {expandedThreadId === thread.id && (
                                    <div style={styles.responsesContainer}>
                                        {isFetchingResponses && expandedThreadId === thread.id ? (
                                            <p style={styles.loadingResponsesText}>Loading responses...</p>
                                        ) : (
                                            (responses[thread.id] && responses[thread.id].length > 0) ? (
                                                renderResponses(responses[thread.id], thread.id, thread.type) // Use helper function
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
                <RightPanel userName={userName} userEmail={userEmail} />
            </div>

            {/* Post Modal (Unchanged) */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>Create {postType === "job" ? "Job" : "Post"}</h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setIsModalOpen(false)} />
                        </div>

                        <div style={styles.postTypeToggle}>
                            <button
                                onClick={() => setPostType("post")}
                                style={{
                                    ...styles.toggleButton,
                                    ...(postType === "post" ? styles.toggleButtonActive : {})
                                }}
                            >
                                Post
                            </button>
                            <button
                                onClick={() => setPostType("job")}
                                style={{
                                    ...styles.toggleButton,
                                    ...(postType === "job" ? styles.toggleButtonActive : {})
                                }}
                            >
                                Job
                            </button>
                        </div>

                        <div style={styles.modalUserSection}>
                            <div style={styles.avatarCircle}>{firstName[0]}</div>
                            <span style={styles.modalUserName}>{userName}</span>
                        </div>

                        {/* Category Buttons */}
                        <div style={styles.categoryContainer}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setPostCategory(cat)}
                                    style={{
                                        ...styles.categoryButton,
                                        ...(postCategory === cat ? styles.categoryButtonActive : {})
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder={`What's on your mind, ${firstName}?`}
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                            style={styles.modalTextarea}
                        />

                        <button onClick={handlePostSubmit} style={styles.modalPostButton}>
                            <FiPlus color="#fff" /> {postType === "job" ? "Post Job" : "Post"}
                        </button>
                    </div>
                </div>
            )}
            
            {/* RESPONSE MODAL */}
            {isResponseModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>
                                {parentResponseId ? "Reply to Response" : `Add Response to ${threadTypeToReply}`}
                            </h3>
                            <FiX 
                                size={28} 
                                style={{ cursor: 'pointer', color: '#1e3a8a' }} 
                                onClick={() => setIsResponseModalOpen(false)} 
                            />
                        </div>

                        <div style={styles.modalUserSection}>
                            <div style={styles.avatarCircle}>{firstName[0]}</div>
                            <span style={styles.modalUserName}>{userName}</span>
                        </div>

                        <textarea
                            placeholder={parentResponseId ? "Type your reply here..." : `Reply to the ${threadTypeToReply} here...`}
                            value={responseContent}
                            onChange={e => setResponseContent(e.target.value)}
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

// --- Styles (Updated for Facebook-style, no-card look) ---
const styles = {
    page: { minHeight: '100vh', padding: '10px' },
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
    mainContent: { flex: 1, minWidth: '600px' },
    sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '20px', borderBottom: '2px solid #1e40af', paddingBottom: '5px' },
    avatarCircle: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0 },
    avatarCircleSmall: { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#93c5fd', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px', flexShrink: 0 },
    avatarCircleTiny: { width: '25px', height: '25px', borderRadius: '50%', backgroundColor: '#bfdbfe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '12px', flexShrink: 0 },
    newThreadBox: { backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', padding: '12px 15px', marginBottom: '20px' },
    newThreadHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
    newThreadInputTrigger: { flex: 1, border: 'none', padding: '12px 15px', fontSize: '16px', outline: 'none', cursor: 'pointer', color: '#555', borderRadius: '12px', backgroundColor: '#f1f5f9', transition: 'all 0.2s' },
    newThreadButton: { backgroundColor: '#1e40af', border: 'none', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' },

    postTypeToggle: { display: 'flex', gap: '10px', marginBottom: '10px' },
    toggleButton: { flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #93c5fd', backgroundColor: '#e0f2fe', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' },
    toggleButtonActive: { backgroundColor: '#3b82f6', color: '#fff', border: '1px solid #2563eb' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', width: '520px', maxWidth: '95%', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c7d2fe', paddingBottom: '12px' },
    modalUserSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    modalUserName: { fontWeight: 600, fontSize: '16px', color: '#1e3a8a' },

    categoryContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' },
    categoryButton: { padding: '8px 14px', borderRadius: '20px', border: '1px solid #93c5fd', backgroundColor: '#e0f2fe', color: '#1e3a8a', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' },
    categoryButtonActive: { backgroundColor: '#3b82f6', color: '#fff', border: '1px solid #2563eb' },

    modalTextarea: { width: '94%', minHeight: '160px', padding: '15px', borderRadius: '14px', border: '1px solid #93c5fd', resize: 'vertical', outline: 'none', fontSize: '16px', backgroundColor: '#f0f9ff' },
    modalPostButton: { padding: '12px 18px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '16px', transition: 'all 0.2s' },

    threadPost: { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' },
    
    threadMetaTop: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px', 
    },
    
    threadTagModified: { 
        backgroundColor: '#dbeafe', 
        color: '#1e3a8a', 
        padding: '6px 12px', 
        borderRadius: '15px', 
        fontSize: '14px', 
        fontWeight: '600',
        whiteSpace: 'nowrap' 
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
    
    threadAuthorInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    threadAuthorName: { fontWeight: '600', color: '#1e40af' },
    threadTime: { fontSize: '14px', color: '#555' },
    threadFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #c7d2fe' },
    threadActions: { display: 'flex', gap: '20px' },
    threadActionButton: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#555', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' },
    loadingText: { textAlign: 'center', padding: '20px', fontSize: '18px', color: '#6b7280' },
    
    // Styles for the response section
    responseToggleButton: {
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        cursor: 'pointer', 
        color: '#3b82f6', 
        fontWeight: '600',
        transition: 'all 0.2s',
        fontSize: '15px'
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
    // UPDATED STYLE: Flat, no-card look
    responseItem: {
        padding: '5px 0', 
        position: 'relative', 
    },
    responseMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    responseAuthorName: {
        fontWeight: '700', // Made author name bold
        color: '#2563eb',
        fontSize: '14px'
    },
    responseContent: {
        fontSize: '14px',
        color: '#374151',
        marginLeft: '33px', // Aligned under the avatar
        whiteSpace: 'pre-wrap',
        marginTop: '2px', // Closer to the meta line
        marginBottom: '2px',
    },
    // NEW STYLE: For the Reply and Time line
    responseActionLine: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginLeft: '33px', // Aligned with content
        marginTop: '2px'
    },
    // MODIFIED STYLE: Reply button
    responseReplyButton: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#60a5fa',
        cursor: 'pointer',
        padding: '2px 0',
        width: 'fit-content'
    },
    // NEW STYLE: For small time text next to reply
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