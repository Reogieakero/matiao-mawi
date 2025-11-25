import React from 'react';
import { Link } from 'react-router-dom'; 

// ⭐ MODIFIED: Accept profilePictureUrl prop
export default function RightPanel({ userName, userEmail, profilePictureUrl }) {
  const initials = userName
    ? userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  // ⭐ MODIFIED: Added the 'committee' field to the mock data list
  const officialList = [
    { id: 1, name: "John Doe", position: "Barangay Captain", committee: "Peace & Order", profileLink: "/profile", status: "On Duty" },
    { id: 2, name: "Jane Smith", position: "Council Member", committee: "Health & Sanitation", profileLink: "/profile", status: "On Leave" },
    { id: 3, name: "Mark Johnson", position: "Council Member", committee: "Education & Youth", profileLink: "/profile", status: "Busy" },
    { id: 4, name: "Emily Davis", position: "Secretary", committee: "", profileLink: "/profile", status: "On Duty" }, // Committee left empty
    { id: 5, name: "Michael Brown", position: "Treasurer", committee: "Finance & Budget", profileLink: "/profile", status: "Offline" },
    { id: 6, name: "Sarah Wilson", position: "Youth Leader", committee: "SK Affairs", profileLink: "/profile", status: "On Leave" },
    { id: 7, name: "David Lee", position: "Barangay Tanod", committee: "Security", profileLink: "/profile", status: "On Duty" },
    { id: 8, name: "Anna Taylor", position: "Senior Citizen Rep", committee: "Welfare & Services", profileLink: "/profile", status: "Busy" },
    { id: 9, name: "Chris Evans", position: "Environmental Officer", committee: "Environment", profileLink: "/profile", status: "On Duty" },
  ];

  const statusColors = {
    "On Duty": "#22c55e",
    "On Leave": "#f59e0b",
    "Busy": "#ef4444",
    "Offline": "#9ca3af",
  };

  return (
    <div style={styles.rightSidebar}>
      
      {/* Account Overview (Wrapped in Link for navigation) */}
      <Link to="/profile" style={styles.accountLinkWrapper}>
        <div style={styles.sidebarBlock}>
          <h3 style={styles.sidebarTitle}>Account Overview</h3>
          <div style={styles.accountOverview}>
            {/* Display profile picture or initials */}
            {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Profile" style={styles.profilePicture} />
            ) : (
                <div style={styles.avatarCircle}>{initials}</div>
            )}
            <div style={styles.accountDetails}>
              <span style={styles.accountName}>{userName}</span>
              <span style={styles.accountEmail}>{userEmail}</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Official List */}
      <div style={{ ...styles.sidebarBlock, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <h3 style={styles.sidebarTitle}>Officials & Friends</h3>
        <ul style={styles.officialList}>
          {officialList.map(official => (
            <li key={official.id} style={styles.officialItem}>
              <div style={styles.officialInfo}>
                <div style={{ ...styles.avatarSmall, backgroundColor: '#2563eb' }}>
                  {official.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                {/* ⭐ MODIFIED: Added Committee Span */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={styles.officialName}>{official.name}</span>
                  <span style={styles.officialPosition}>{official.position}</span>
                  {official.committee && (
                    <span style={styles.officialCommittee}>{official.committee}</span>
                  )}
                </div>
                {/* END MODIFIED */}
              </div>
              <div style={styles.statusWrapper}>
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor: statusColors[official.status] || '#ccc',
                  }}
                />
                <span style={styles.statusText}>{official.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  rightSidebar: {
    width: '320px',
    position: 'fixed',
    top: '70px',
    right: '20px',
    height: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
  },
  accountLinkWrapper: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    display: 'block',
    marginBottom: '20px', 
  },
  sidebarBlock: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '14px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '15px',
    color: '#1e40af',
    borderBottom: '1px solid #c7d2fe',
    width: '100%',
    textAlign: 'center',
    paddingBottom: '5px',
  },
  accountOverview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  profilePicture: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #3b82f6', 
  },
  avatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
  },
  accountDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  accountName: { fontWeight: '700', fontSize: '16px', color: '#1e40af', textAlign: 'center' },
  accountEmail: { fontSize: '14px', color: '#555', textAlign: 'center' },

  officialList: { listStyle: 'none', padding: 0, margin: 0, width: '100%' },
  officialItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#333' },
  officialInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '50%', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  officialName: { fontWeight: '500' },
  officialPosition: { fontSize: '12px', color: '#555', fontStyle: 'italic'  },
  
  // ⭐ NEW STYLE: Committee Style
  officialCommittee: {
    fontSize: '11px', 
    color: '#059669', // A clear green color for distinction
    fontStyle: 'normal',
    marginTop: '2px', 
    fontWeight: '500', 
  },
  
  statusWrapper: { display: 'flex', alignItems: 'center', gap: '6px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%' },
  statusText: { fontSize: '12px', color: '#555' },
};