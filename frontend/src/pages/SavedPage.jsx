import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiBookmark,FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import RightPanel from '../components/RightPanel';

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

const MAX_POST_LENGTH = 300; 


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
                    alt={`${initial}'s profile`} 
                    style={styles.avatarImage} 
                />
            </div>
        );
    }

    return (
        <div style={style}>{initial ? initial[0] : 'U'}</div> 
    );
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
            <img 
                src={url} 
                alt="Post media" 
                style={imageStyle} 
            />
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

export default function SavedPage({ userName, userEmail, profilePictureUrl }) {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
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
    
    const [isReadModalOpen, setIsReadModalOpen] = useState(false);
    const [readModalThread, setReadModalThread] = useState(null); 
    
    const firstName = userName ? userName.split(' ')[0] : 'User';
    const userId = localStorage.getItem('userId'); 

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
            setThreads(data.map(t => ({...t, isBookmarked: true}))); 
        } catch (error) {
            console.error("Error fetching saved threads:", error);
            setThreads([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Saved";
        fetchSavedThreads();
    }, [userId]); 

    const handleUnsave = async (threadId, threadType) => {
        if (!userId) return alert('You must be logged in to unsave a thread.');
        
        setThreads(prevThreads => prevThreads.filter(t => 
            !(t.id === threadId && t.type === threadType)
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
            
            if (!res.ok || data.bookmarked) {
                 alert(data.message || `Failed to unsave thread. Please refresh.`);
                 fetchSavedThreads(); 
            }

        } catch (error) {
            console.error("Unsave network error:", error);
            alert(`A network error occurred. Failed to unsave thread.`);
            fetchSavedThreads(); 
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

    const openReadModal = (thread) => {
        setReadModalThread(thread);
        setIsReadModalOpen(true);
    };

    const closeReadModal = () => {
        setIsReadModalOpen(false);
        setReadModalThread(null);
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

    const handleResponseKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleResponseSubmit();
        }
    };
    
    const renderPostBody = (thread) => {
        const bodyContent = thread.body || ""; 
        const isLongPost = bodyContent.length > MAX_POST_LENGTH;

        if (isLongPost) {
            const truncatedContent = bodyContent.substring(0, MAX_POST_LENGTH).trim() + '...';
            return (
                <>
                    <p style={styles.threadBodyModified}>
                        {truncatedContent}
                    </p>
                    <div 
                        style={styles.readMoreButton} 
                        onClick={() => openReadModal(thread)} 
                    >
                        <FiChevronDown size={14} /> Read More
                    </div>
                </>
            );
        }

        return (
            <p style={styles.threadBodyModified}>
                {bodyContent}
            </p>
        );
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

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>Saved Threads</h2>
                    {isLoading ? (
                        <p style={styles.loadingText}>Loading saved threads...</p>
                    ) : (threads.length === 0) ? (
                        <p style={styles.loadingText}>You have no saved threads yet.</p>
                    ) : (
                        threads.map(thread => {
                            const { 
                                id, 
                                type, 
                                author, 
                                title, 
                                tag, 
                                time, 
                                responseCount, 
                                author_picture_url, 
                                mediaUrls,
                            } = thread;

                            return (
                                <div key={id} style={styles.threadPost}>
                                    <div style={styles.threadMetaTop}>
                                        <div style={styles.threadAuthorInfo}>
                                            {renderAvatar(author_picture_url, author, 'small')}
                                            <span style={styles.threadAuthorName}>{author}</span>
                                            <span style={styles.threadTime}>
                                                {getTimeSince(time)}
                                            </span>
                                        </div>
                                        <span style={styles.threadTagModified}>{tag}</span>
                                    </div>
                                    
                                    {renderPostBody(thread)}
                                    
                                    {renderMediaGallery(mediaUrls)}

                                    <div style={styles.threadFooter}>
                                        <div style={styles.threadActions}>
                                            <div 
                                                style={{ 
                                                    ...styles.threadActionButton, 
                                                    color: '#ef4444', 
                                                    fontWeight: '600',
                                                }}
                                                onClick={() => handleUnsave(id, type)}
                                            >
                                                <FiX size={18} /> Unsave
                                            </div>
                                            <div 
                                                style={styles.threadActionButton}
                                                onClick={() => handleReplyClick(id, type)}
                                            >
                                                <FiMessageSquare size={18} /> Add Response
                                            </div>
                                        </div>
                                        <div 
                                            style={styles.responseToggleButton}
                                            onClick={() => toggleResponses(id, type)}
                                        >
                                            {responseCount ?? 0} {responseCount === 1 ? 'Response' : 'Responses'}
                                            {expandedThreadId === id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                        </div>
                                    </div>

                                    {expandedThreadId === id && (
                                        <div style={styles.responsesContainer}>
                                            {isFetchingResponses && expandedThreadId === id ? (
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
                            )
                        })
                    )}
                </div>

                <RightPanel 
                    userName={userName} 
                    userEmail={userEmail} 
                    profilePictureUrl={profilePictureUrl} 
                />
            </div>
            
            {isReadModalOpen && readModalThread && (
                <div style={styles.modalOverlay} onClick={closeReadModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeaderNoBorder}> 
                            <FiX size={28} style={{ cursor: 'pointer', color: '#1e3a8a' }} onClick={closeReadModal} />
                        </div>
                        
                        <div style={styles.modalUserSection}>
                            {renderAvatar(readModalThread.author_picture_url, readModalThread.author, 'large')} 
                            <span style={styles.modalUserName}>{readModalThread.author}</span>
                            <span style={styles.modalTime}>{getTimeSince(readModalThread.time)}</span>
                            <span style={styles.threadTagModified}>{readModalThread.tag}</span>
                        </div>
                        
                        <p style={styles.modalThreadBody}>
                            {readModalThread.body}
                        </p>

                        {renderMediaGallery(readModalThread.mediaUrls)}

                        <button onClick={closeReadModal} style={styles.modalCloseButton}>
                            <FiChevronUp size={16} style={{ marginRight: '5px' }} /> Close View
                        </button>
                    </div>
                </div>
            )}

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
        </div>
    );
}

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
        margin: '0 0 0 0', 
        lineHeight: '1.5', 
        wordWrap: 'break-word', 
        overflowWrap: 'break-word', 
    }, 
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
        width: '90%', 
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
    }, 
    modalHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #c7d2fe', 
        paddingBottom: '12px' 
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
    modalTextarea: { 
        width: '100%', 
        minHeight: '100px', 
        padding: '12px', 
        marginTop: '15px', 
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
    modalThreadBody: {
        fontSize: '15px',
        color: '#4b5563',
        margin: '15px 0',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap', 
    },
    modalCloseButton: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        width: '100%', 
        padding: '12px', 
        borderRadius: '10px', 
        backgroundColor: '#60a5fa', 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: '16px', 
        border: 'none', 
        cursor: 'pointer', 
        transition: 'background-color 0.2s',
        marginTop: '20px',
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
    },
};