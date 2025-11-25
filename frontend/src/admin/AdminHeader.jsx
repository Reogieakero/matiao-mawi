import React, { useState } from 'react';
// Removed Bell and Search imports
import { UserCircle, ChevronDown, LogOut } from 'lucide-react'; 
import { useLocation } from 'react-router-dom';

const AdminHeader = ({ adminName, onLogout }) => { 
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false); 

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentPage = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : 'Dashboard';
    const formattedPageName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ');

    // Function to handle logout and close dropdown
    const handleLogoutClick = () => {
        // Delay closing the dropdown to ensure the onClick event registers before onBlur fires
        setTimeout(() => setShowDropdown(false), 0); 
        onLogout(); 
    };
    
    // Function to close the dropdown when focus is lost (onBlur event)
    const handleBlur = () => {
        // Use a slight delay to allow click events on the dropdown to register 
        // before the focus is considered lost.
        setTimeout(() => setShowDropdown(false), 200);
    };

    return (
        <header style={styles.header}>
            <div style={styles.title}>
                <span style={styles.breadcrumb}>Admin / </span>
                <h1 style={styles.pageName}>{formattedPageName}</h1>
            </div>
            
            {/* The rightContent is now simplified to only contain the profile area */}
            <div style={styles.rightContent}>
                
                {/* Profile Area with Dropdown Functionality */}
                <div 
                    style={styles.profileArea} 
                    onClick={() => setShowDropdown(!showDropdown)} // Toggle dropdown
                    onBlur={handleBlur} // Close on blur
                    tabIndex="0" // Makes the div focusable for onBlur to work
                >
                    <div style={styles.avatar}>
                        <UserCircle size={28} color="#64748B" strokeWidth={1.5}/>
                    </div>
                    <span style={styles.adminName}>{adminName || "Administrator"}</span>
                    <ChevronDown size={16} color="#64748B" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    
                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div style={styles.dropdownMenu}>
                            <div style={styles.dropdownItem} onClick={handleLogoutClick}>
                                <LogOut size={16} style={styles.dropdownIcon} />
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// Updated Styles
const styles = {
    header: {
        position: 'fixed',
        top: 0,
        left: '290px', 
        right: 0,
        height: '70px', 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
    title: {
        display: 'flex',
        alignItems: 'baseline',
    },
    breadcrumb: {
        fontSize: '14px',
        color: '#94A3B8',
        marginRight: '5px',
    },
    pageName: {
        fontSize: '22px',
        color: '#1E293B',
        fontWeight: '700',
        margin: 0,
    },
    rightContent: {
        // No longer needs gap/spacing logic since only one element remains
        display: 'flex',
        alignItems: 'center',
    },
    // Removed searchContainer, searchInput, iconBtn, badge, and separator styles
    
    profileArea: {
        position: 'relative', 
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid transparent', // Added for a cleaner boundary
        transition: 'background-color 0.2s, border-color 0.2s',
        ':hover': {
            backgroundColor: '#F8FAFC',
            borderColor: '#E2E8F0',
        }
    },
    adminName: {
        fontSize: '15px',
        color: '#1E293B',
        fontWeight: '500',
    },
    avatar: {
        // Icon color is set directly on UserCircle
    },
    dropdownMenu: {
        position: 'absolute',
        top: '50px', // Adjusted position
        right: '0',
        width: '150px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E2E8F0',
        padding: '5px 0',
        zIndex: 110,
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        fontSize: '14px',
        color: '#1E293B',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        ':hover': {
            backgroundColor: '#F1F5F9', 
        }
    },
    dropdownIcon: {
        marginRight: '10px',
        color: '#EF4444', 
    }
};

export default AdminHeader;