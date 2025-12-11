import React, { useState } from 'react';
import { UserCircle, ChevronDown, LogOut } from 'lucide-react'; 
import { useLocation } from 'react-router-dom';

const AdminHeader = ({ adminName, onLogout }) => { 
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false); 

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentPage = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : 'Dashboard';
    const formattedPageName = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ');

    const handleLogoutClick = () => {
        setTimeout(() => setShowDropdown(false), 0); 
        onLogout(); 
    };
    
    const handleBlur = () => {
        setTimeout(() => setShowDropdown(false), 200);
    };

    return (
        <header style={styles.header}>
            <div style={styles.title}>
                <span style={styles.breadcrumb}>Admin / </span>
                <h1 style={styles.pageName}>{formattedPageName}</h1>
            </div>
            
            <div style={styles.rightContent}>
                
                <div 
                    style={styles.profileArea} 
                    onClick={() => setShowDropdown(!showDropdown)} 
                    onBlur={handleBlur} 
                    tabIndex="0" 
                >
                    <div style={styles.avatar}>
                        <UserCircle size={28} color="#64748B" strokeWidth={1.5}/>
                    </div>
                    <span style={styles.adminName}>{adminName || "Administrator"}</span>
                    <ChevronDown size={16} color="#64748B" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    
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
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', 
    },
    title: {
        display: 'flex',
        alignItems: 'baseline',
    },
    breadcrumb: {
        fontSize: '14px',
        color: '#64748B', 
        marginRight: '5px',
    },
    pageName: {
        fontSize: '22px',
        color: '#1E293B', 
        fontWeight: '700',
        margin: 0,
    },
    rightContent: {
        display: 'flex',
        alignItems: 'center',
    },
    
    profileArea: {
        position: 'relative', 
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid transparent', 
        transition: 'background-color 0.2s, border-color 0.2s',
        ':hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.05)', 
            borderColor: '#C7D2FE', 
        }
    },
    adminName: {
        fontSize: '15px',
        color: '#1E293B', 
        fontWeight: '500',
    },
    
    dropdownMenu: {
        position: 'absolute',
        top: '50px', 
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
            backgroundColor: 'rgba(37, 99, 235, 0.05)', 
        }
    },
    dropdownIcon: {
        marginRight: '10px',
        color: '#EF4444', 
    }
};

export default AdminHeader;