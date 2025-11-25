import React, { useState } from 'react';
import { FiSearch, FiLogOut, FiUser } from 'react-icons/fi';
// тнР IMPORT useNavigate
import { Link, useLocation, useNavigate } from 'react-router-dom';

// тнР MODIFIED: Accept userName, profilePictureUrl, and onLogout props
const Header = ({ userName, profilePictureUrl, onLogout }) => { 
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredLink, setHoveredLink] = useState(null);
    // NEW: Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
    const location = useLocation();
    // тнР INITIALIZE useNavigate
    const navigate = useNavigate(); 

    const handleSearch = () => {
        if (searchTerm.trim()) {
            // тнР UPDATED: Use navigate to redirect to the search route
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm(''); // Clear search input after navigating
        }
    };
    
    // NEW: Handler to toggle dropdown
    const toggleDropdown = (e) => {
        e.preventDefault(); 
        setIsDropdownOpen(prev => !prev);
    };

    // NEW: Handler for Log Out
    const handleLogoutClick = () => {
        onLogout(); // Call the logout handler passed from App.jsx
        // Explicitly navigate to /login for immediate redirect after clearing user data
        navigate('/login'); 
        setIsDropdownOpen(false); // Close dropdown
    };

    const navItems = [
        { name: 'About', path: '/about' },
        { name: 'Hotlines', path: '/hotlines' },
        { name: 'Contact', path: '/contact' },
    ];

    const sidebarPaths = ['/home', '/news', '/announcements', '/documents', '/services'];

    // тнР NEW: Calculate initials for fallback
    const initials = userName
        ? userName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
        : 'U';

    const getLinkStyle = (path) => {
        const isSidebarPage = sidebarPaths.includes(location.pathname);
        const isActive = !isSidebarPage && location.pathname === path;
        return {
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: isActive ? 700 : 500,
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'color 0.2s',
            color: isActive
                ? '#2563eb'
                : hoveredLink === path
                    ? '#1d4ed8'
                    : '#333'
        };
    };

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                {/* Left: Logo + Search */}
                <div style={styles.leftContainer}>
                    <div style={styles.logoContainer}>
                        <Link to="/home" style={styles.logoLink}>
                            <span style={styles.brandName}>Mawii</span>
                        </Link>
                    </div>

                    <div style={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search posted threads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                            style={styles.searchInput}
                        />
                        <button onClick={handleSearch} style={styles.searchButton}>
                            <FiSearch size={18} color="#fff" />
                        </button>
                    </div>
                </div>

                {/* Right: Navigation + Profile */}
                <div style={styles.rightContainer}>
                    <nav style={styles.nav}>
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={getLinkStyle(item.path)}
                                onMouseEnter={() => setHoveredLink(item.path)}
                                onMouseLeave={() => setHoveredLink(null)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* тнР MODIFIED: Profile Picture / Initials with Dropdown */}
                        <div style={styles.profileDropdownContainer}> 
                            <div 
                                onClick={toggleDropdown} 
                                style={styles.profileAvatarClickable}
                            >
                                {profilePictureUrl ? (
                                    <img 
                                        src={profilePictureUrl}
                                        alt="Profile"
                                        style={styles.profilePicture}
                                    />
                                ) : (
                                    <div style={styles.avatarCircleHeader}> 
                                        {initials}
                                    </div>
                                )}
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div style={styles.dropdownMenu}>
                                    <Link to="/profile" 
                                        style={styles.dropdownItem}
                                        onClick={() => setIsDropdownOpen(false)} 
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <FiUser size={16} style={{ marginRight: '8px' }} />
                                        Profile
                                    </Link>
                                    <div 
                                        onClick={handleLogoutClick} 
                                        style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <FiLogOut size={16} style={{ marginRight: '8px' }} />
                                        Log Out
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
};

const styles = {
    header: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '10px 20px',
    },
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        gap: '750px', // gap between left and right
    },
    leftContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    rightContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    logoLink: {
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
    },
    brandName: {
        fontSize: '24px',
        fontWeight: '900',
        color: '#2563eb',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff6f6ff',
        borderRadius: '20px',
        overflow: 'hidden',
        maxWidth: '600px',
    },
    searchInput: {
        border: 'none',
        outline: 'none',
        padding: '10px 15px',
        fontSize: '14px',
        flexGrow: 1,
        minWidth: '200px',
        backgroundColor: 'transparent',
        color: '#111',
    },
    searchButton: {
        backgroundColor: '#2563eb',
        border: 'none',
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        position: 'relative', // IMPORTANT for dropdown positioning
    },
    navLink: {
        textDecoration: 'none',
    },
    // NEW styles for dropdown
    profileDropdownContainer: {
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
        marginLeft: '10px', 
    },
    profileAvatarClickable: {
        display: 'block',
        width: '34px', 
        height: '34px',
        borderRadius: '50%',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '40px', 
        right: '0',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '150px',
        padding: '8px 0',
        zIndex: 1010, 
        border: '1px solid #e5e7eb',
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        fontSize: '15px',
        color: '#333',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        whiteSpace: 'nowrap',
    },
    logoutItem: {
        color: '#dc2626',
    },
    dropdownItemHover: { 
        backgroundColor: '#f3f4f6', 
    },
    // Existing avatar styles
    profilePicture: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #2563eb',
    },
    avatarCircleHeader: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '700',
        border: '2px solid #2563eb', 
    }
};

export default Header;