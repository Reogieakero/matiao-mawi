import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
// ⭐ IMPORT useNavigate
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredLink, setHoveredLink] = useState(null);
    const location = useLocation();
    // ⭐ INITIALIZE useNavigate
    const navigate = useNavigate(); 

    const handleSearch = () => {
        if (searchTerm.trim()) {
            // ⭐ UPDATED: Use navigate to redirect to the search route
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm(''); // Clear search input after navigating
        }
    };

    const navItems = [
// ... (rest of navItems unchanged)
        { name: 'About', path: '/about' },
        { name: 'Hotlines', path: '/hotlines' },
        { name: 'Contact', path: '/contact' },
    ];

    const sidebarPaths = ['/home', '/news', '/announcements', '/documents', '/services'];

    const profilePicUrl = "https://via.placeholder.com/30/2563eb/ffffff?text=P";

// ... (rest of getLinkStyle unchanged)
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
                            placeholder="Search posts, services, or events..."
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

                        {/* Profile Picture */}
                        <Link to="/profile" style={styles.navLink}>
                            <img 
                                src={profilePicUrl}
                                alt="Profile"
                                style={styles.profilePicture}
                            />
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

// ... (styles unchanged)
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
    },
    navLink: {
        textDecoration: 'none',
    },
    profilePicture: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #2563eb',
    }
};

export default Header;