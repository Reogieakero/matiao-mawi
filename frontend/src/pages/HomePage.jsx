import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageSquare, FiBookmark, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import RightPanel from '../components/RightPanel';

// Utility function to format the time (Unchanged)
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

// MODIFIED: Added Job-Specific Categories (Unchanged)
const postCategories = ["General", "Invention", "Achievement", "Competition", "Events", "Maintenance"];
const jobCategories = ["Full-Time", "Part-Time", "Contract", "Internship"];

// MODIFIED: Accepts onBookmarkChange prop to pass the handleBookmark function
export default function HomePage({ userName, userEmail }) {
    const [threads, setThreads] = useState([]);
    const [postContent, setPostContent] = useState('');
    // Use an initial category that's valid for 'post' type
    const [postCategory, setPostCategory] = useState(postCategories[0]); 
    const [postType, setPostType] = useState("post");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // NEW: State to force refresh job counts in sidebar
    const [jobPostTrigger, setJobPostTrigger] = useState(0); 

    // --- STATE FOR RESPONSES (Unchanged) ---
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
    
    // Helper to get the correct categories based on post type (Unchanged)
    const currentCategories = postType === 'job' ? jobCategories : postCategories;

    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 

    // Function to fetch threads, including bookmark status check
    const fetchThreads = async () => {
        // If coming from SavedPage, this prop won't be passed, 
        // but we'll use a new SavedPage component for that.
        // The main HomePage fetches all threads.
        
        // Step 1: Fetch All Threads
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

        // Step 2: Fetch User Bookmarks to check status
        if (userId) {
            try {
                const bookmarkRes = await fetch(`http://localhost:5000/api/bookmarks/${userId}`);
                if (!bookmarkRes.ok) throw new Error("Failed to fetch bookmarks");
                const bookmarks = await bookmarkRes.json();
                
                // Convert bookmarks to a fast lookup map: { 'post-12': true, 'job-5': true }
                const bookmarkMap = bookmarks.reduce((acc, thread) => {
                    acc[`${thread.type}-${thread.id}`] = true;
                    return acc;
                }, {});

                // Step 3: Merge bookmark status into threads
                const threadsWithStatus = allThreads.map(thread => ({
                    ...thread,
                    isBookmarked: bookmarkMap[`${thread.type}-${thread.id}`] || false,
                }));
                setThreads(threadsWithStatus);

            } catch (error) {
                console.warn("Error fetching bookmark status:", error);
                // Fallback: If bookmark status fails, show threads without status
                setThreads(allThreads.map(t => ({...t, isBookmarked: false})));
            }
        } else {
             setThreads(allThreads.map(t => ({...t, isBookmarked: false})));
        }
        
        setIsLoading(false);
    };

    // Fetch threads on component mount
    useEffect(() => {
        fetchThreads();
    }, [userId]); // Re-fetch if the user changes

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
            
            if (!res.ok) throw new Error("API call failed");

            const data = await res.json();
            
            if (!res.ok) {
                 // Revert optimistic update on failure
                 alert(data.message || `Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
                 setThreads(prevThreads => prevThreads.map(t => 
                    t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
                 ));
            }
            
            // Note: If success, the optimistic update holds, and no further action is needed.

        } catch (error) {
            console.error("Bookmark network error:", error);
            alert(`A network error occurred. Failed to ${isBookmarked ? 'unsave' : 'save'} thread.`);
            // Revert optimistic update on network error
            setThreads(prevThreads => prevThreads.map(t => 
                t.id === threadId && t.type === threadType ? { ...t, isBookmarked: isBookmarked } : t
            ));
        }
    };
    
    // Function to fetch responses for a specific thread (Unchanged)
    const fetchResponses = async (threadId, threadType) => {
        // ... (implementation unchanged)
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
    
    // Function to toggle response view (Unchanged)
    const toggleResponses = (threadId, threadType) => {
        if (expandedThreadId === threadId) {
            setExpandedThreadId(null);
        } else {
            setExpandedThreadId(threadId); 
            fetchResponses(threadId, threadType); 
        }
    };

    // Handle category change when postType changes (Unchanged)
    const handlePostTypeChange = (type) => {
        setPostType(type);
        setPostCategory(type === 'job' ? jobCategories[0] : postCategories[0]);
    };


    // MODIFIED: handlePostSubmit to update jobPostTrigger (Unchanged)
    const handlePostSubmit = async () => {
        if (!userId) {
             alert('User ID not found. Please log in again to post.');
             setIsModalOpen(false);
             return;
        }

        if (!postContent.trim()) return alert('Post cannot be empty!');
        if (!postCategory) return alert('Please select a category.');

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
            isBookmarked: false, // Optimistic posts start as unsaved
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
                    // NEW: If a job was successfully posted, update the trigger
                    if (postType === 'job') {
                        setJobPostTrigger(prev => prev + 1);
                    }
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
        setPostCategory(currentCategories[0]); 
        setPostType("post");
    };
    
    // handleReplyClick (Unchanged)
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

    // handleResponseSubmit (Unchanged)
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

    // handlePostKeyDown (Unchanged)
    const handlePostKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handlePostSubmit();
        }
    };

    // handleResponseKeyDown (Unchanged)
    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };

    // renderResponses (Unchanged)
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
                    <h2 style={styles.sectionTitle}>Community Threads</h2>
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
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading threads...</p>
                    ) : (
                        threads.map(thread => (
                            <div key={thread.id} style={{
                                ...styles.threadPost, 
                                opacity: thread.isSubmitting ? 0.7 : 1, 
                            }}>
                                {/* ... (thread display content unchanged) */}
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
                                        {/* MODIFIED: Bookmark Button */}
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

                {/* Right Panel (MODIFIED to pass jobPostTrigger) */}
                <RightPanel 
                    userName={userName} 
                    userEmail={userEmail} 
                    jobPostTrigger={jobPostTrigger} // Pass the trigger state
                />
            </div>

            {/* Post Modal (Unchanged) */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    {/* ... (modal content unchanged) */}
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>Create {postType === "job" ? "Job" : "Post"}</h3>
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={() => setIsModalOpen(false)} />
                        </div>

                        <div style={styles.postTypeToggle}>
                            <button
                                onClick={() => handlePostTypeChange("post")}
                                style={{
                                    ...styles.toggleButton,
                                    ...(postType === "post" ? styles.toggleButtonActive : {})
                                }}
                            >
                                Post
                            </button>
                            <button
                                onClick={() => handlePostTypeChange("job")}
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

                        <div style={styles.categoryContainer}>
                            {currentCategories.map(cat => (
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
                            onKeyDown={handlePostKeyDown} 
                            style={styles.modalTextarea}
                        />

                        <button onClick={handlePostSubmit} style={styles.modalPostButton}>
                            <FiPlus color="#fff" /> {postType === "job" ? "Post Job" : "Post"}
                        </button>
                    </div>
                </div>
            )}
            
            {/* RESPONSE MODAL (Unchanged) */}
            {isResponseModalOpen && threadToReplyDetails && (
                <div style={styles.modalOverlay}>
                    {/* ... (response modal content unchanged) */}
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ color: '#1e40af' }}>
                                Reply to {threadTypeToReply === 'job' ? 'Job Post' : 'Community Post'}
                            </h3>
                            <FiX 
                                size={28} 
                                style={{ cursor: 'pointer', color: '#1e3a8a' }} 
                                onClick={() => setIsResponseModalOpen(false)} 
                            />
                        </div>

                        <div style={styles.replyContextBox}>
                            {parentResponseId ? (
                                <>
                                    <p style={styles.replyingToText}>
                                        Replying to @{parentResponseAuthor}'s comment:
                                    </p>
                                    <p style={styles.replyContentSnippet}>
                                        {parentResponseContent.substring(0, 150)}
                                        {parentResponseContent.length > 150 ? '...' : ''}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={styles.replyingToText}>
                                        Replying to the main {threadTypeToReply} topic:
                                    </p>
                                    <p style={styles.threadSnippet}>
                                        {threadToReplyDetails.body.substring(0, 150)}
                                        {threadToReplyDetails.body.length > 150 ? '...' : ''}
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

// --- Styles (Unchanged) ---
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
        fontWeight: '700', 
        color: '#2563eb',
        fontSize: '14px'
    },
    responseContent: {
        fontSize: '14px',
        color: '#374151',
        marginLeft: '33px', 
        whiteSpace: 'pre-wrap',
        marginTop: '2px', 
        marginBottom: '2px',
    },
    responseActionLine: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginLeft: '33px', 
        marginTop: '2px'
    },
    responseReplyButton: {
        fontSize: '12px',
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
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    replyContentSnippet: {
        fontSize: '14px',
        color: '#1e40af',
        fontWeight: '500',
        margin: '5px 0 0 0',
        maxHeight: '40px',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        textOverflow: 'ellipsis',
    }
};