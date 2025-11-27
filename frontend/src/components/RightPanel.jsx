import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// NOTE: userName, userEmail, and profilePictureUrl are still accepted
// as props but are no longer used in the component's render output.
export default function RightPanel({ userName, userEmail, profilePictureUrl }) {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to group officials by their category
  const groupOfficialsByCategory = (officials) => {
    return officials.reduce((acc, official) => {
        // Use official.category, falling back to 'Other Officials' if not present or empty
        const category = official.category && official.category.trim() !== '' ? official.category : 'Other Officials';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(official);
        return acc;
    }, {});
  };

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        // Fetch officials from the backend API
        const response = await fetch('http://localhost:5000/api/admin/officials');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOfficials(data);
      } catch (error) {
        console.error("Failed to fetch barangay officials:", error);
        setOfficials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, []); // Run once on mount
  
  // Group the fetched officials for rendering
  const categorizedOfficials = groupOfficialsByCategory(officials);
  const categories = Object.keys(categorizedOfficials);


  const statusColors = {
    // Status color mapping for the badge
    "Working": "#22c55e",
    "AWOL": "#1d17d2ff",
    "On Site": "#f59e0b",
    "On Leave": "#ef4444",
  };

  const styles = {
    rightSidebar: { width: '320px', position: 'fixed', top: '20px', right: '20px', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' },
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
    // NEW style for category headers
    categoryHeader: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1f2937', 
        marginTop: '15px',
        marginBottom: '5px',
        padding: '5px 0',
        borderBottom: '1px solid #d1d5db',
    },
    officialList: { listStyle: 'none', padding: 0, margin: 0, width: '100%' },
    officialItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#333' },
    officialInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatarSmall: { 
        width: '36px', 
        height: '36px', 
        borderRadius: '50%', 
        backgroundColor: '#dbeafe', 
        color: '#1e40af', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: 'bold', 
        flexShrink: 0,
        overflow: 'hidden' 
    },
    statusBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '3px 8px',
        borderRadius: '12px',
        color: 'white',
        flexShrink: 0,
    }
  };

  return (
    <div style={{ ...styles.rightSidebar, top: '20px', height: 'calc(100vh - 40px)' }}>
      <div style={{ ...styles.sidebarBlock, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <h3 style={styles.sidebarTitle}>Barangay Officials</h3>
        
        {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading officials...</p>
        ) : officials.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>No officials found in the database.</p>
        ) : (
            <div style={{ width: '100%' }}>
                {/* Iterate over each category */}
                {categories.map(category => (
                    <div key={category}>
                        {/* Display Category Header */}
                        <h4 style={styles.categoryHeader}>{category} ({categorizedOfficials[category].length})</h4>
                        
                        <ul style={styles.officialList}>
                            {/* Iterate over officials in the current category */}
                            {categorizedOfficials[category].map((official) => (
                                <li key={official.id} style={styles.officialItem}>
                                    <div style={styles.officialInfo}>
                                        {/* Profile (Picture) */}
                                        <div style={styles.avatarSmall}>
                                            {official.profile_picture_url ? (
                                                <img 
                                                    src={official.profile_picture_url} 
                                                    alt={`${official.first_name} ${official.last_name}`} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                // Fallback to initials if no picture URL
                                                `${official.first_name.charAt(0)}${official.last_name.charAt(0)}`
                                            )}
                                        </div>
                                        <div>
                                            {/* Official Name */}
                                            <div style={{  fontWeight: '600',fontSize: '15px', color: '#1e40af'}}>{`${official.first_name} ${official.last_name}`}</div>
                                            {/* Position */}
                                            <div style={{ color: '#6b7280', fontSize: '12px' }}>{official.position}</div> 
                                        </div>
                                    </div>
                                    {/* Status */}
                                    <div style={{ ...styles.statusBadge, backgroundColor: statusColors[official.status] || '#9ca3af' }}>
                                        {official.status}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}