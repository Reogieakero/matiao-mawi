// AnnouncementPage.jsx
// frontend/src/pages/AnnouncementPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
// Using Lucide icons for visual elements
import { 
    RefreshCw, AlertTriangle, Search, Bell, Calendar, User, Users, 
    XCircle, Clock, Globe, Zap, FileText, Volume2, Eye 
} from 'lucide-react'; 

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Constants (Reused from AdminAnnouncementsPage.jsx) ---
const ANNOUNCEMENT_CATEGORIES = [
    'General Information', 'Closure Notice', 'Service Interruption', 
    'Urgent Call to Action', 'Office Hours Update', 'Upcoming Event', 
    'Official Statement'
];

// --- Utility Functions (Reused/Adapted) ---

// 1. Date Formatting (Reused from AdminAnnouncementsPage.jsx)
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}; //

// 2. Category Color and Icon (Reused from AdminAnnouncementsPage.jsx)
const getCategoryColor = (category) => {
    switch (category) {
        case 'Urgent Call to Action': return { bg: '#FEE2E2', text: '#DC2626', icon: Zap }; // Red
        case 'Service Interruption': return { bg: '#FEF3C7', text: '#D97706', icon: XCircle }; // Amber
        case 'General Information': return { bg: '#D1FAE5', text: '#059669', icon: Globe }; // Green
        case 'Official Statement': return { bg: '#DBEAFE', text: '#2563EB', icon: FileText }; // Blue
        case 'Upcoming Event': return { bg: '#EDE9FE', text: '#7C3AED', icon: Calendar }; // Violet
        default: return { bg: '#F3F4F6', text: '#6B7280', icon: Volume2 }; // Gray
    }
}; //

// -------------------------------------------------------------------
// --- Announcement Card Component (Adapted from NewsPage.jsx Card) ---
// -------------------------------------------------------------------
const AnnouncementCard = ({ announcementItem, onReadMore }) => {
    const [isHovered, setIsHovered] = useState(false);
    const tagColor = getCategoryColor(announcementItem.category);
    const TagIcon = tagColor.icon;

    // Styles for the card (ADAPTED TO MATCH NewsPage.jsx)
    const styles = {
        card: { // Matches styles.newsCard
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
        },
        cardHover: { // Matches styles.newsCardHover
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
        },
        cardImage: { // Matches styles.cardImage
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            backgroundColor: '#f3f4f6', // Placeholder background
            display: 'block',
            borderBottom: '1px solid #f3f4f6',
        },
        cardContent: { // Matches styles.cardContent
            padding: '15px',
            flexGrow: 1,
        },
        cardTitle: { // Matches styles.cardTitle (reduced size)
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '8px',
            lineHeight: '1.3',
        },
        cardTag: (color) => ({ // Converted to function to match NewsPage styles.cardTag
            backgroundColor: color.bg,
            color: color.text,
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '10px',
        }),
        readMoreButton: { // Matches styles.readMoreButton
            background: '#1e40af', 
            color: 'white', 
            border: 'none', 
            padding: '8px 15px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontWeight: '600',
            display: 'inline-flex', 
            alignItems: 'center', 
            transition: 'background-color 0.2s',
            fontSize: '0.9rem',
            marginTop: '10px',
        },
        cardMeta: { // Matches styles.cardMeta
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #f3f4f6',
            fontSize: '0.9rem',
            color: '#6b7280',
        },
    };

    // Use a maximum of 150 characters for the summary preview
    const summary = announcementItem.content.substring(0, 100) + 
                    (announcementItem.content.length > 100 ? '...' : '');

    const handleCardClick = (e) => {
        // Only open the modal if the button wasn't clicked directly
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) { 
            onReadMore(announcementItem);
        }
    };

    return (
        <div 
            style={{ ...styles.card, ...(isHovered ? styles.cardHover : {}) }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
        >
            {/* Image/Placeholder Block */}
            {announcementItem.featured_image_url ? (
                <img 
                    src={announcementItem.featured_image_url} 
                    alt={announcementItem.title} 
                    style={styles.cardImage} 
                />
            ) : (
                <div style={{ 
                    ...styles.cardImage, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#9CA3AF' 
                }}>
                    <Volume2 size={40} />
                </div>
            )}
            
            <div style={styles.cardContent}>
                {/* Category Tag */}
                <span style={styles.cardTag(tagColor)}>
                    <TagIcon size={14} /> {announcementItem.category} 
                </span>
                
                {/* Title and Snippet */}
                <h3 style={styles.cardTitle}>{announcementItem.title}</h3>
                <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '10px' }}>{summary}</p>
                
                {/* Read More Button */}
                <button 
                    style={styles.readMoreButton}
                    onClick={() => onReadMore(announcementItem)}
                >
                    <Eye size={16} style={{ marginRight: '6px' }} /> Read More
                </button>

                {/* Footer/Meta */}
                <div style={styles.cardMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={14} /> {announcementItem.posted_by}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {formatDate(announcementItem.date_published, false)}
                    </span>
                </div>
            </div>
        </div>
    );
};


// -------------------------------------------------------------------
// --- Announcement View Modal (Reused/Adapted from AdminAnnouncementsPage.jsx) ---
// -------------------------------------------------------------------
const baseViewModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    }, //
    modal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative'
    }, //
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700'
    }, //
    contentGrid: { 
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '20px' 
    }, //
    detailBox: { 
        padding: '15px', border: '1px solid #E5E7EB', borderRadius: '10px', 
        backgroundColor: '#F9FAFB' 
    }, //
    detailLabel: { 
        fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '5px' 
    }, //
    detailValue: { 
        fontSize: '16px', color: '#1F2937', fontWeight: '500' 
    }, //
    closeButton: { 
        padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        fontSize: '16px', transition: 'background-color 0.2s', width: '100%' 
    } //
};

const AnnouncementViewModal = ({ show, announcementItem, onClose }) => {
    if (!show || !announcementItem) return null;

    const tagColor = getCategoryColor(announcementItem.category);
    const TagIcon = tagColor.icon;
    
    // Attachments should already be parsed by the backend
    let attachments = Array.isArray(announcementItem.attachments) 
        ? announcementItem.attachments 
        : []; 

    const cardTagStyle = (color) => ({
        backgroundColor: color.bg, color: color.text, 
        padding: '6px 10px', borderRadius: '9999px', 
        fontSize: '14px', fontWeight: '700', 
        display: 'inline-flex', alignItems: 'center', gap: '8px'
    });
    
    return (
        <div style={baseViewModalStyles.backdrop}>
            <div style={baseViewModalStyles.modal}>
                <h3 style={baseViewModalStyles.header}>
                    <Eye size={28} /> Full Announcement Details: {announcementItem.title}
                </h3>
                <button 
                    onClick={onClose} 
                    style={{ 
                        position: 'absolute', top: '25px', right: '30px', 
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6B7280'
                    }}
                >
                    <XCircle size={28} />
                </button>

                <div style={baseViewModalStyles.contentGrid}>
                    {/* Main Content Area */}
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <span style={cardTagStyle(tagColor)}>
                                <TagIcon size={16} /> {announcementItem.category}
                            </span>
                        </div>
                        
                        {announcementItem.featured_image_url && (
                            <img 
                                src={announcementItem.featured_image_url} 
                                alt="Featured" 
                                style={{ 
                                    width: '100%', maxHeight: '400px', objectFit: 'cover', 
                                    borderRadius: '10px', marginBottom: '20px',
                                    border: '1px solid #E5E7EB'
                                }} 
                            />
                        )}

                        <div style={{ fontSize: '18px', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap' }}>
                            {announcementItem.content}
                        </div>
                        
                        {/* Attachments Section */}
                        {attachments.length > 0 && (
                            <div style={{ marginTop: '30px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={20} /> Supporting Documents / Links
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {attachments.map((att, index) => (
                                        <a key={index} href={att} target="_blank" rel="noopener noreferrer" 
                                           style={{ 
                                                display: 'flex', alignItems: 'center', gap: '8px', 
                                                padding: '10px 15px', backgroundColor: '#DBEAFE', 
                                                borderRadius: '8px', color: '#1E40AF', textDecoration: 'none', 
                                                fontWeight: '600', transition: 'background-color 0.2s' 
                                           }}>
                                            <FileText size={16}/> View Attachment {index + 1} 
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Side Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Clock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Date Published</div>
                            <div style={baseViewModalStyles.detailValue}>{formatDate(announcementItem.date_published)}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Posted By</div>
                            <div style={baseViewModalStyles.detailValue}>{announcementItem.posted_by}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Users size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Target Audience</div>
                            <div style={baseViewModalStyles.detailValue}>{announcementItem.target_audience}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Valid Until</div>
                            <div style={baseViewModalStyles.detailValue}>
                                {announcementItem.valid_until ? formatDate(announcementItem.valid_until, false) : 'No Expiry Set'}
                            </div>
                        </div>
                        
                        {/* Closing Button */}
                        <div style={{marginTop: '15px'}}>
                            <button onClick={onClose} style={baseViewModalStyles.closeButton}> 
                                Close View 
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// -------------------------------------------------------------------
// --- Main Announcement Page Component ---
// -------------------------------------------------------------------
const AnnouncementPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAnnouncementForView, setSelectedAnnouncementForView] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Styles for the main page layout (Adapted from NewsPage.jsx)
    const styles = {
        container: {
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            // Background is removed as requested earlier
        },
        header: {
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1e40af', 
            marginBottom: '15px', 
        },
        subHeader: {
            fontSize: '1.1rem',
            color: '#4B5563',
            marginBottom: '25px',
        },
        // NEW searchContainer: Aligns to the left, smaller width.
        searchContainer: {
            // New styles for alignment and width reduction
            width: '100%', 
            maxWidth: '500px', // Reduced max width
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            padding: '10px 20px',
            border: '1px solid #D1D5DB',
            borderRadius: '10px',
            backgroundColor: 'white',
            marginBottom: '30px', // Moved spacing back here
        },
        searchInput: {
            flexGrow: 1,
            padding: '10px',
            fontSize: '1rem',
            border: 'none',
            outline: 'none',
        },
        cardGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '30px',
        },
        loadingText: {
            textAlign: 'center',
            fontSize: '1.2rem',
            color: '#6B7280',
            padding: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        error: {
            padding: '15px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
        },
    };

    // --- Data Fetching ---
    const fetchAnnouncements = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using the new API endpoint
            const response = await axios.get(`${API_BASE_URL}/announcements`);
            setAnnouncements(response.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
            setError('Failed to load announcements. Please try again later. Check your server connection and /api/announcements route.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // --- Handlers ---
    const handleReadMore = (announcementItem) => {
        setSelectedAnnouncementForView(announcementItem);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedAnnouncementForView(null);
    };

    // --- Search Filtering ---
    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>
                 Barangay Official Announcements
            </h1>
            <p style={styles.subHeader}>
                Stay informed with the latest public notices, advisories, and updates directly from the Barangay administration.
            </p>

            {/* Search Bar (Left-aligned and reduced width) */}
            <div style={styles.searchContainer}>
                <Search size={20} style={{ color: '#6B7280' }}/>
                <input
                    type="text"
                    placeholder="Search announcements by title, content, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {error && (
                <div style={{ ...styles.error, color: '#dc2626', backgroundColor: '#fee2e2' }}>
                    <AlertTriangle size={24} style={{ marginRight: '10px' }} /> {error}
                </div>
            )}

            {loading ? (
                <div style={styles.loadingText}>
                    <RefreshCw size={24} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} /> Loading announcements...
                </div>
            ) : filteredAnnouncements.length > 0 ? (
                <div style={styles.cardGrid}>
                    {filteredAnnouncements.map(item => (
                        <AnnouncementCard 
                            key={item.id} 
                            announcementItem={item} 
                            onReadMore={handleReadMore}
                        />
                    ))}
                </div>
            ) : (
                <div style={styles.loadingText}>
                    No active announcements found matching your search criteria.
                </div>
            )}
            
            {/* VIEW MODAL */}
            <AnnouncementViewModal
                show={isViewModalOpen}
                announcementItem={selectedAnnouncementForView}
                onClose={handleCloseViewModal}
            />
        </div>
    );
};

export default AnnouncementPage;