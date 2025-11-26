import React, { useState } from 'react';
import { FiSearch, FiLogOut, FiUser } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// CRITICAL FIX: Header now accepts the single 'currentUser' object
const Header = ({ currentUser, onLogout }) => { 
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredLink, setHoveredLink] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
    const location = useLocation();
    const navigate = useNavigate(); 
    
    // NEW: Extract profile details from the currentUser object
    const userName = currentUser?.name || 'Guest';
    const profilePictureUrl = currentUser?.profilePictureUrl || null;


    const handleSearch = () => {
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm(''); 
        }
    };
    
    const toggleDropdown = (e) => {
        e.preventDefault(); 
        setIsDropdownOpen(prev => !prev);
    };

    const handleLogoutClick = () => {
        // Pass 'true' to ensure local storage is cleared
        onLogout(true); 
        navigate('/login'); 
        setIsDropdownOpen(false); 
    };

    const navItems = [
        { name: 'About', path: '/about' },
        { name: 'Hotlines', path: '/hotlines' },
        { name: 'Contact', path: '/contact' },
    ];

    const sidebarPaths = ['/home', '/news', '/announcements', '/documents', '/services'];

    // LOGIC FOR INITIALS (Fallback only, if profilePictureUrl is null)
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

                        {/* Profile Picture / Initials with Dropdown */}
                        <div style={styles.profileDropdownContainer}> 
                            <div 
                                onClick={toggleDropdown} 
                                style={styles.profileAvatarClickable}
                            >
                                {/* CRITICAL: Use profilePictureUrl from the fetched user object */}
                                {profilePictureUrl ? (
                                    <img 
                                        src={profilePictureUrl}
                                        alt="Profile"
                                        style={styles.profilePicture}
                                    />
                                ) : (
                                    // FALLBACK: Display initials only if no picture is available
                                    <div style={styles.avatarCircleHeader}> 
                                        {initials}
                                    </div>
                                )}
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div style={styles.dropdownMenu}>
                                    {/* Display User Name */}
                                    <div style={styles.profileNameDisplay}>
                                        {userName}
                                    </div>

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
        width: '180px', // Adjusted width for name display
        padding: '8px 0',
        zIndex: 1010, 
        border: '1px solid #e5e7eb',
    },
    // NEW style for displaying the name inside the dropdown
    profileNameDisplay: {
        padding: '10px 15px',
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#1f2937',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '8px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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