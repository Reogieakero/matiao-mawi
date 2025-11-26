import React from 'react';
import { Link } from 'react-router-dom';

// NOTE: userName, userEmail, and profilePictureUrl are still accepted
// as props but are no longer used in the component's render output.
export default function RightPanel({ userName, userEmail, profilePictureUrl }) {
  // Mock data RETAINED
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
    // 💡 POLISH: Adjusted top and height to occupy the full sidebar space elegantly.
    <div style={{ ...styles.rightSidebar, top: '20px', height: 'calc(100vh - 40px)' }}>
      
      {/* Official List (Adjusted styles for full height of the sidebar) */}
      <div style={{ ...styles.sidebarBlock, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', marginBottom: '0px' }}>
        <h3 style={styles.sidebarTitle}>Officials & Friends</h3>
        <ul style={styles.officialList}>
          {officialList.map(official => (
            <li key={official.id} style={styles.officialItem}>
              <div style={styles.officialInfo}>
                <div 
                    style={{ 
                        ...styles.avatarSmall, 
                        backgroundColor: official.status === 'On Duty' ? '#2563eb' : official.status === 'On Leave' ? '#f97316' : '#9ca3af' 
                    }}
                >
                    {official.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                    <span style={styles.officialName}>{official.name}</span>
                    <span style={styles.officialPosition}>{official.position}</span>
                    {official.committee && official.committee !== "" && (
                        <span style={styles.officialCommittee}>({official.committee})</span>
                    )}
                </div>
              </div> 
              <div style={styles.statusWrapper}>
                <span style={{ ...styles.statusDot, backgroundColor: statusColors[official.status] || '#ccc', }} />
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
    // 💡 POLISH: Adjusted top to '20px' (instead of '70px')
    right: '20px',
    // 💡 POLISH: Adjusted height to 'calc(100vh - 40px)' to fill the space above and below
    height: 'calc(100vh - 40px)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
  },
  // accountLinkWrapper removed
  sidebarBlock: {
    backgroundColor: '#ffffffff',
    padding: '20px',
    paddingTop: '50px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'transform 0.2s',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '15px',
    borderBottom: '2px solid #eff6ff',
    paddingBottom: '10px',
  },
  // account overview styles removed
  officialList: { listStyle: 'none', padding: 0, margin: 0, width: '100%' },
  officialItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#333' },
  officialInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '50%', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  officialName: { fontWeight: '500' },
  officialPosition: { fontSize: '12px', color: '#555', fontStyle: 'italic' },
  officialCommittee: { fontSize: '12px', color: '#333', marginLeft: '5px' },
  statusWrapper: { display: 'flex', alignItems: 'center', gap: '5px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  statusText: { fontSize: '12px', color: '#555' },
};