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

const API_BASE_URL = 'http://localhost:5000/api'; 

const colors = {
    primary: '#2563eb',
    secondary: '#f97316',
    text: '#374151', 
    background: '#f3f4f6', 
    cardBackground: '#ffffff',
    success: '#10b981', 
    error: '#ef4444', 
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


const getIconAndColor = (category) => {
    const normalizedCategory = category ? category.toLowerCase().trim() : '';
    let color = colors.text; 

    if (normalizedCategory.includes('emergency') || normalizedCategory.includes('police') || normalizedCategory.includes('fire') || normalizedCategory.includes('medical')) {
        color = colors.error; 
        return { Icon: Zap, color }; 
    }
    if (normalizedCategory.includes('health') || normalizedCategory.includes('services')) {
        color = colors.success;
        return { Icon: Stethoscope, color }; 
    }
    if (normalizedCategory.includes('barangay') || normalizedCategory.includes('government') || normalizedCategory.includes('office')) {
        color = colors.primary; 
        return { Icon: Home, color }; 
    }
    if (normalizedCategory.includes('disaster') || normalizedCategory.includes('management')) {
        color = colors.secondary; 
        return { Icon: Shield, color }; 
    }
    if (normalizedCategory.includes('social welfare') || normalizedCategory.includes('support')) {
        color = '#9333ea'; 
        return { Icon: HeartHandshake, color }; 
    }
    
    return { Icon: PhoneCall, color }; 
};


const HotlineCard = ({ title, number, description, Icon, color, category }) => { 
    const [isHovered, setIsHovered] = useState(false); 

    const iconColor = color;

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
        position: 'relative',
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
    const [hotlines, setHotlines] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null); 

    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        document.title = "Hotlines";
        const fetchHotlines = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/hotlines`);
                const processedHotlines = response.data.map(hotline => ({
                    ...hotline,
                    number: hotline.hotline_number, 
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
    }, []); 


    const categories = useMemo(() => {
        const uniqueCategories = [
            'All', 
            ...new Set(hotlines.map(h => h.category))
        ].filter(Boolean); 
        return uniqueCategories;
    }, [hotlines]);


    const filteredHotlines = useMemo(() => {
        if (activeFilter === 'All') {
            return hotlines;
        }
        return hotlines.filter(hotline => hotline.category === activeFilter);
    }, [hotlines, activeFilter]);


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
            
            {isLoading ? (
                <p style={{ color: colors.primary, fontSize: '18px', textAlign: 'center' }}>Loading hotlines...</p>
            ) : error ? (
                <p style={{ color: colors.error, fontSize: '18px', textAlign: 'center', padding: '20px', border: `1px solid ${colors.error}33`, borderRadius: '8px' }}>{error}</p>
            ) : (
                <>
                    {categories.length > 1 && ( 
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
                                        ...(activeFilter === category ? styles.filterButtonActive(colors.primary) : {}), 
                                    }}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                    
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
                                    category={hotline.category}
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