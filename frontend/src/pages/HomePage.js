import React, { useState } from 'react';
import { FiPlus, FiMessageSquare, FiBookmark, FiX } from 'react-icons/fi';
import RightPanel from '../components/RightPanel';

// --- Mock Data ---
const mockThreads = [
  {
    id: 1,
    type: "post",
    title: "Lecture Rescheduling",
    author: "Elisabeth May",
    time: "6h ago",
    tag: "Accounting",
    body: "Hi mates, so I talked with Dr Hellen and because of her illness we need to reschedule the upcoming lecture...",
    reactions: 11
  },
  {
    id: 2,
    type: "job",
    title: "Community Cleanup Drive Volunteers Needed",
    author: "Admin",
    time: "1d ago",
    tag: "General",
    body: "The annual barangay cleanup drive is scheduled for next Saturday. Volunteers are encouraged to sign up!",
    reactions: 5
  }
];

const categories = ["General", "Invention", "Achievement", "Competition", "Events", "Maintenance"];

export default function HomePage({ userName, userEmail }) {
  const [threads, setThreads] = useState(mockThreads);
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState(categories[0]);
  const [postType, setPostType] = useState("post"); // "post" or "job"
  const [isModalOpen, setIsModalOpen] = useState(false);

  const firstName = userName ? userName.split(' ')[0] : 'User';

  const handlePostSubmit = () => {
    if (!postContent.trim()) return alert('Post cannot be empty!');
    const newThread = {
      id: threads.length + 1,
      type: postType,
      title: postContent.substring(0, 50) + (postContent.length > 50 ? '...' : ''),
      author: userName || 'User',
      time: 'Just now',
      tag: postCategory,
      body: postContent,
      reactions: 0,
    };
    setThreads([newThread, ...threads]);
    setPostContent('');
    setPostCategory(categories[0]);
    setPostType("post");
    setIsModalOpen(false);
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
          {threads.map(thread => (
            <div key={thread.id} style={styles.threadPost}>
              <h2 style={styles.threadTitle}>
                {thread.type === "job" ? "💼 " : ""}{thread.title}
              </h2>
              <div style={styles.threadMeta}>
                <div style={styles.threadAuthorInfo}>
                  <div style={styles.avatarCircle}>{thread.author[0]}</div>
                  <span style={styles.threadAuthorName}>{thread.author}</span>
                  <span style={styles.threadTime}>{thread.time}</span>
                </div>
                <span style={styles.threadTag}>{thread.tag}</span>
              </div>
              <p style={styles.threadBody}>{thread.body}</p>
              <div style={styles.threadFooter}>
                <div style={styles.threadActions}>
                  <div style={styles.threadActionButton}><FiBookmark size={18} /> Bookmark</div>
                  <div style={styles.threadActionButton}><FiMessageSquare size={18} /> Add Response</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <RightPanel userName={userName} userEmail={userEmail} />
      </div>

      {/* Post Modal */}
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
    </div>
  );
}

// --- Styles ---
const styles = {
  page: { minHeight: '100vh', padding: '10px' },
  container: { 
    display: 'flex', 
    gap: '30px', 
    alignItems: 'flex-start', 
    width: '100%', 
    maxWidth: '1200px', 
    margin: '0 auto',
    paddingRight: '340px', // Reserve space for RightPanel
    boxSizing: 'border-box'
  },
  mainContent: { flex: 1, minWidth: '600px' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '20px', borderBottom: '2px solid #1e40af', paddingBottom: '5px' },
  avatarCircle: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0 },
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
  threadTitle: { fontSize: '26px', fontWeight: '700', marginBottom: '10px' },
  threadMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  threadAuthorInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  threadAuthorName: { fontWeight: '600', color: '#1e40af' },
  threadTime: { fontSize: '14px', color: '#555' },
  threadTag: { backgroundColor: '#dbeafe', color: '#1e3a8a', padding: '4px 12px', borderRadius: '15px', fontSize: '14px', fontWeight: '600' },
  threadBody: { fontSize: '16px', color: '#333', lineHeight: '1.6', marginBottom: '15px' },
  threadFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #c7d2fe' },
  threadActions: { display: 'flex', gap: '20px' },
  threadActionButton: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#555', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' },
};
