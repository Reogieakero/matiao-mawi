import React, { useState, useEffect, useMemo } from 'react'; 
import axios from 'axios'; 
import { 
    Zap, 
    Shield, 
    Stethoscope, 
    BadgeAlert, 
    Home, 
    HeartHandshake, 
    PhoneCall,
    Filter
} from 'lucide-react'; 

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// Define the color palette used across the application for consistency
const colors = {
    primary: '#2563eb', // Blue
    secondary: '#f97316', // Orange
    text: '#374151', // Dark Gray
    background: '#f3f4f6', // Light Gray
    cardBackground: '#ffffff', // White
    success: '#10b981', // Green
    error: '#ef4444', // Red
};

const styles = {
    container: {
        padding: '20px 0',
        maxWidth: '1200px',
        margin: '0 13px',
    },
    header: {
        fontSize: '32px',
        fontWeight: '800',
        color: colors.primary,
        marginBottom: '10px',
        borderBottom: `2px solid ${colors.secondary}`,
        paddingBottom: '10px',
    },
    subHeader: {
        fontSize: '18px',
        fontWeight: '500',
        color: colors.text,
        marginBottom: '30px',
    },
    // Filter container styles
    filterContainer: {
        marginBottom: '30px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    filterLabel: {
        fontSize: '16px',
        fontWeight: '700',
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        marginRight: '10px',
    },
    filterButton: {
        padding: '8px 15px',
        borderRadius: '20px',
        border: '1px solid #ddd',
        backgroundColor: colors.cardBackground,
        color: colors.text,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '14px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
    },
    filterButtonActive: (color) => ({
        backgroundColor: color,
        color: colors.cardBackground,
        border: `1px solid ${color}`,
        boxShadow: `0 4px 6px -1px ${color}33`,
    }),
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
    },
};


// --- Helper Function to get Icon and Color based on Category ---
const getIconAndColor = (category) => {
    const normalizedCategory = category ? category.toLowerCase().trim() : '';
    let color = colors.text; // Default

    if (normalizedCategory.includes('emergency') || normalizedCategory.includes('police') || normalizedCategory.includes('fire') || normalizedCategory.includes('medical')) {
        color = colors.error; // Red
        return { Icon: Zap, color }; 
    }
    if (normalizedCategory.includes('health') || normalizedCategory.includes('services')) {
        color = colors.success; // Green
        return { Icon: Stethoscope, color }; 
    }
    if (normalizedCategory.includes('barangay') || normalizedCategory.includes('government') || normalizedCategory.includes('office')) {
        color = colors.primary; // Blue
        return { Icon: Home, color }; 
    }
    if (normalizedCategory.includes('disaster') || normalizedCategory.includes('management')) {
        color = colors.secondary; // Orange
        return { Icon: Shield, color }; 
    }
    if (normalizedCategory.includes('social welfare') || normalizedCategory.includes('support')) {
        color = '#9333ea'; // Purple
        return { Icon: HeartHandshake, color }; 
    }
    
    // Default fallback
    return { Icon: PhoneCall, color }; 
};


// --- HotlineCard Component (MODIFIED to accept and display category) ---
const HotlineCard = ({ title, number, description, Icon, color, category }) => { // ADD category here
    const [isHovered, setIsHovered] = useState(false); 

    const iconColor = color;

    // Define base and hover styles
    const baseCardStyle = {
        backgroundColor: colors.cardBackground,
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', 
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px', 
        border: '1px solid transparent', 
    };

    const hoverCardStyle = {
        transform: 'translateY(-5px)', 
        boxShadow: `0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px ${color}55`, 
    };

    const cardStyle = {
        ...baseCardStyle,
        ...(isHovered ? hoverCardStyle : {}),
    };

    const iconContainerStyle = {
        backgroundColor: `${color}1a`, 
        borderRadius: '8px',
        padding: '12px',
        width: 'fit-content',
        marginBottom: '15px',
        transition: 'transform 0.2s',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)', 
        position: 'relative', // Set relative for absolute category tag
    };

    const titleStyle = {
        fontSize: '20px',
        fontWeight: '700',
        color: colors.text,
        margin: '0 0 5px 0',
        lineHeight: '1.3',
    };
    const descriptionStyle = {
        fontSize: '14px',
        color: '#6B7280',
        margin: '0',
        flexGrow: 1, 
    };
    const numberStyle = {
        fontSize: '18px',
        fontWeight: '700',
        color: iconColor,
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px dashed #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    };
    
    // NEW: Style for the Category Tag
    const categoryTagStyle = {
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '4px 10px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
    };

    return (
        <div 
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* NEW: Category Tag */}
            <span style={categoryTagStyle}>{category}</span>

            <div style={iconContainerStyle}>
                <Icon size={24} color={iconColor} />
            </div>
            <h3 style={titleStyle}>{title}</h3>
            <p style={descriptionStyle}>{description}</p>
            <p style={numberStyle}>
                <PhoneCall size={18} style={{ marginRight: '5px' }} /> 
                {number}
            </p>
        </div>
    );
};


const HotlinesPage = () => {
    // State for fetched hotlines
    const [hotlines, setHotlines] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null); 

    // State for active filter, initialized to 'All'
    const [activeFilter, setActiveFilter] = useState('All');

    // Fetch data on component mount
    useEffect(() => {
        const fetchHotlines = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/hotlines`);
                // 1. Map DB fields to UI fields
                // 2. Add icon/color mapping
                const processedHotlines = response.data.map(hotline => ({
                    ...hotline,
                    number: hotline.hotline_number, // Map DB column to component prop
                    ...getIconAndColor(hotline.category),
                }));
                setHotlines(processedHotlines);
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching hotlines:", err);
                setError("Failed to load hotlines. Please try again later.");
                setIsLoading(false);
            }
        };

        fetchHotlines();
    }, []); // Run once on mount


    // Dynamically calculate categories from fetched hotlines
    const categories = useMemo(() => {
        const uniqueCategories = [
            'All', // Always include 'All'
            ...new Set(hotlines.map(h => h.category))
        ].filter(Boolean); // Filter out any null/undefined categories
        return uniqueCategories;
    }, [hotlines]);


    // Filter hotlines based on the active filter
    const filteredHotlines = useMemo(() => {
        if (activeFilter === 'All') {
            return hotlines;
        }
        return hotlines.filter(hotline => hotline.category === activeFilter);
    }, [hotlines, activeFilter]);


    // Handle case where the active filter category might be removed by admin
    useEffect(() => {
        if (activeFilter !== 'All' && !categories.includes(activeFilter)) {
            setActiveFilter('All');
        }
    }, [categories, activeFilter]);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Community Hotlines</h1>
            <p style={styles.subHeader}>
                Immediate contact numbers for emergency, health, and government services in Barangay Matiao.
            </p>
            
            {/* Display Loading, Error, or Content */}
            {isLoading ? (
                <p style={{ color: colors.primary, fontSize: '18px', textAlign: 'center' }}>Loading hotlines...</p>
            ) : error ? (
                <p style={{ color: colors.error, fontSize: '18px', textAlign: 'center', padding: '20px', border: `1px solid ${colors.error}33`, borderRadius: '8px' }}>{error}</p>
            ) : (
                <>
                    {/* Filter Section */}
                    {categories.length > 1 && ( // Only show filter if there are categories besides 'All'
                        <div style={styles.filterContainer}>
                            <span style={styles.filterLabel}>
                                <Filter size={18} style={{ marginRight: '5px' }} /> Filter By:
                            </span>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveFilter(category)}
                                    style={{
                                        ...styles.filterButton,
                                        // Use the filterButtonActive function defined in styles
                                        ...(activeFilter === category ? styles.filterButtonActive(colors.primary) : {}), 
                                    }}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* Hotline Cards Grid */}
                    <div style={styles.cardGrid}>
                        {filteredHotlines.length > 0 ? (
                            filteredHotlines.map((hotline) => (
                                <HotlineCard 
                                    key={hotline.id || hotline.title} 
                                    title={hotline.title}
                                    number={hotline.number}
                                    description={hotline.description}
                                    Icon={hotline.Icon}
                                    color={hotline.color}
                                    category={hotline.category} // PASS category here
                                />
                            ))
                        ) : (
                            <p style={{ color: colors.text, gridColumn: '1 / -1' }}>
                                {activeFilter === 'All' 
                                    ? "No hotlines have been posted by the admin yet."
                                    : `No hotlines found for the "${activeFilter}" category.`
                                }
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default HotlinesPage;