import React, { useState } from 'react';
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
    // NEW: Filter container styles
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
        transition: 'all 0.2s ease',
        fontWeight: '600',
        whiteSpace: 'nowrap',
    },
    filterButtonActive: (color) => ({
        backgroundColor: colors.primary,
        color: colors.cardBackground,
        borderColor: colors.primary,
        boxShadow: `0 4px 8px ${color}30`,
    }),
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '25px',
    },
    card: {
        padding: '25px',
        backgroundColor: colors.cardBackground,
        borderRadius: '12px',
        border: `1px solid #e2e8f0`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textDecoration: 'none', 
        cursor: 'pointer',
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '5px',
    },
    cardText: {
        fontSize: '16px',
        color: colors.primary,
        fontWeight: '600',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
    },
    cardIcon: {
        color: colors.secondary,
        marginBottom: '15px',
        size: 30,
    },
};

const hotlines = [
    {
        title: "Barangay Matiao Emergency Response",
        number: "911",
        description: "For all immediate emergencies (Fire, Police, Medical).",
        icon: Zap,
        color: colors.error,
        category: 'Emergency', // ADDED CATEGORY
    },
    {
        title: "City Disaster Risk Reduction Management Office (CDRRMO)",
        number: "0917-123-4567",
        description: "Coordination for natural disasters and rescue operations.",
        icon: Shield,
        color: colors.secondary,
        category: 'Government', // ADDED CATEGORY
    },
    {
        title: "Davao Oriental Provincial Hospital",
        number: "087-821-2345",
        description: "Non-emergency medical inquiries and hospital admission.",
        icon: Stethoscope,
        color: colors.success,
        category: 'Health', // ADDED CATEGORY
    },
    {
        title: "PNP Matiao Station",
        number: "0998-543-2109",
        description: "Police assistance and crime reporting (non-emergency).",
        icon: BadgeAlert,
        color: colors.primary,
        category: 'Police', // ADDED CATEGORY
    },
    {
        title: "Barangay Matiao Administration Office",
        number: "087-388-7654",
        description: "Official inquiries, documents, and general community concerns.",
        icon: Home,
        color: colors.text,
        category: 'Government', // ADDED CATEGORY
    },
    {
        title: "Mental Health Support Line",
        number: "1553",
        description: "Confidential crisis intervention and emotional support.",
        icon: HeartHandshake,
        color: colors.primary,
        category: 'Health', // ADDED CATEGORY
    },
];

// Defined categories for the filter buttons
const categories = ['All', 'Emergency', 'Police', 'Health', 'Government'];

const HotlineCard = ({ title, number, description, Icon, color }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardHoverStyle = isHovered ? { 
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transform: 'translateY(-5px) scale(1.005)',
        borderColor: color, 
    } : {};

    return (
        <a 
            href={`tel:${number}`} 
            style={{ 
                ...styles.card, 
                borderColor: color + '30', 
                ...cardHoverStyle,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Icon size={styles.cardIcon.size} style={{ ...styles.cardIcon, color: color }} />
            <h3 style={styles.cardTitle}>{title}</h3>
            <p style={{ fontSize: '15px', color: colors.text, marginBottom: '15px', lineHeight: '1.4' }}>{description}</p>
            <p style={{ ...styles.cardText, color: color }}>
                <PhoneCall size={16} style={{ marginRight: '8px' }} />
                {number}
            </p>
        </a>
    );
};


const HotlinesPage = () => {
    // NEW: State to track the active filter
    const [activeFilter, setActiveFilter] = useState('All');

    // Filtering logic
    const filteredHotlines = hotlines.filter(hotline => 
        activeFilter === 'All' || hotline.category === activeFilter
    );

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Community Hotlines & Emergency Contacts</h1>
            <p style={styles.subHeader}>
                A directory of essential hotlines and contact information for the Barangay Matiao community.
                For immediate life-threatening emergencies, always dial 911.
            </p>

            {/* NEW: Filter Buttons UI */}
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
            
            <div style={styles.cardGrid}>
                {filteredHotlines.length > 0 ? (
                    filteredHotlines.map((hotline, index) => (
                        <HotlineCard 
                            key={index}
                            title={hotline.title}
                            number={hotline.number}
                            description={hotline.description}
                            Icon={hotline.icon}
                            color={hotline.color}
                        />
                    ))
                ) : (
                    <p style={{ color: colors.text, gridColumn: '1 / -1' }}>No hotlines found for the selected category.</p>
                )}
            </div>
        </div>
    );
};

export default HotlinesPage;