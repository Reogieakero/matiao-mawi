// ServicesPage.jsx
// frontend/src/pages/ServicesPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, RefreshCw, AlertTriangle, Eye, HardHat, Calendar, User, Users, 
    XCircle, Clock, Image, FileText, Zap, Activity, Phone, Home, Plus
} from 'lucide-react'; 

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Constants ---
const SERVICE_CATEGORIES = [
    'Document Request', 'Health Services', 'Infrastructure', 
    'Social Welfare', 'Community Support', 'Emergency Response', 
    'Livelihood Programs', 'Other'
];

// --- Utility Functions ---

const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        ...(includeTime && { hour: '2-digit', minute: '2-digit', hour12: true })
    };
    return date.toLocaleDateString(undefined, options);
};

// Function to get a color and icon for the service category tag
const getCategoryColor = (category) => {
    switch (category) {
        case 'Emergency Response': return { bg: '#FEE2E2', text: '#DC2626', icon: Zap }; // Red
        case 'Document Request': return { bg: '#FEF3C7', text: '#D97706', icon: FileText }; // Amber
        case 'Health Services': return { bg: '#D1FAE5', text: '#059669', icon: Plus }; // Green
        case 'Infrastructure': return { bg: '#DBEAFE', text: '#2563EB', icon: HardHat }; // Blue
        case 'Social Welfare': return { bg: '#EDE9FE', text: '#7C3AED', icon: Users }; // Violet
        default: return { bg: '#F3F4F6', text: '#6B7280', icon: Activity }; // Gray
    }
};

// --- Common Base Styles ---
const styles = {
    container: { padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        },
    header: {fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px', },
    subHeader: { color: '#4b5563',
        marginBottom: '30px',
        fontSize: '16px',},
    searchContainer: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
    searchInput: {
        padding: '12px 15px', border: '2px solid #E5E7EB', borderRadius: '8px', 
        fontSize: '16px', width: '350px', outline: 'none', 
        transition: 'border-color 0.2s',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    serviceGrid: {
        display: 'grid', gap: '30px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
    },
    loadingText: { 
        textAlign: 'center', color: '#6B7280', fontSize: '18px', 
        padding: '50px 0', display: 'flex', justifyContent: 'center', 
        alignItems: 'center'
    },
    error: {
        padding: '15px', borderRadius: '8px', marginBottom: '20px',
        fontWeight: '600', display: 'flex', alignItems: 'center',
    },
    cardMeta: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        fontSize: '0.9rem',
        color: '#6b7280',
    }
};

const baseViewModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    modal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative'
    },
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700'
    },
    contentGrid: { 
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '20px' 
    },
    detailBox: { 
        padding: '15px', border: '1px solid #E5E7EB', borderRadius: '10px', 
        backgroundColor: '#F9FAFB' 
    },
    detailLabel: { 
        fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '5px' 
    },
    detailValue: { 
        fontSize: '16px', color: '#1F2937', fontWeight: '500' 
    },
    closeButton: { 
        padding: '10px 20px', backgroundColor: '#6B7280', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        fontSize: '16px', transition: 'background-color 0.2s', width: '100%', 
    }
};

// --- Service View Modal Component (Enhanced Cleaning) ---
const ServiceViewModal = ({ show, serviceItem, onClose }) => {
    if (!show || !serviceItem) return null;
    
    const tagColor = getCategoryColor(serviceItem.category);
    const TagIcon = tagColor.icon;

    // Helper function to remove leading/trailing quotes and brackets
    const cleanRequirementText = (text) => {
        if (typeof text !== 'string') return text;
        
        let cleaned = text.trim();
        
        // Step 1: Remove leading/trailing brackets ([], {})
        cleaned = cleaned.replace(/^\[|\]$|^\{|\}$/g, '').trim();

        // Step 2: Remove leading/trailing quotes (single ' or double ")
        // Apply this aggressively to the whole string, or to individual items later
        cleaned = cleaned.replace(/^['"]|['"]$/g, '').trim();
        
        return cleaned;
    };

    // MODIFIED LOGIC START 
    let rawRequirements = serviceItem.requirements_list || '';
    
    // Aggressively clean the entire string first (e.g., removes outer [""])
    rawRequirements = cleanRequirementText(rawRequirements);
    
    let requirementsArray;
    
    if (rawRequirements.includes('\n')) {
        // Preferred: Split by newline
        requirementsArray = rawRequirements.split('\n');
    } else if (rawRequirements.includes(',')) {
        // Fallback: Split by comma (handles old JSON-like comma separation)
        requirementsArray = rawRequirements.split(',');
    } else {
        // Single item or truly empty
        requirementsArray = [rawRequirements];
    }
    
    const requirements = requirementsArray
        .map(req => cleanRequirementText(req)) // Clean each individual item again
        .filter(req => req.length > 0); // Filter out any empty lines/items
    // MODIFIED LOGIC END 

    return (
        <div style={baseViewModalStyles.backdrop} onClick={onClose}>
            <div style={baseViewModalStyles.modal} onClick={e => e.stopPropagation()}>
                
                <h2 style={baseViewModalStyles.header}>
                    <TagIcon size={30} style={{ color: tagColor.text }} />
                    {serviceItem.title}
                </h2>

                <div style={baseViewModalStyles.contentGrid}>
                    {/* Left Content (Details) */}
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '5px' }}>
                                Description:
                            </p>
                            <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {serviceItem.description || 'No detailed description provided.'}
                            </p>
                        </div>
                        
                        {/* Requirements List (Now using the cleaned 'requirements' array) */}
                        {requirements.length > 0 && (
                            <div style={{ 
                                padding: '20px', border: '1px solid #BFDBFE', 
                                borderRadius: '10px', backgroundColor: '#EFF6FF' 
                            }}>
                                <h3 style={{ 
                                    fontSize: '18px', fontWeight: '700', color: '#1D4ED8', 
                                    marginBottom: '15px', display: 'flex', alignItems: 'center', 
                                    gap: '10px' 
                                }}>
                                    <FileText size={20}/> Requirements List
                                </h3>
                                
                                {/* ⭐️ MODIFICATION START: Use Flexbox for Tag-like Display ⭐️ */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {requirements.map((req, index) => (
                                        <div key={index} 
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '8px', 
                                                padding: '10px 15px', backgroundColor: '#F0F9FF', // Lighter blue background
                                                borderRadius: '8px', color: '#0B5394', // Darker blue text
                                                fontWeight: '600', 
                                                border: '1px solid #BFDBFE', // Blue border
                                                flexShrink: 0, // Prevent shrinking
                                                fontSize: '15px' 
                                            }}
                                        >
                                            <FileText size={16}/> {req}
                                        </div>
                                    ))}
                                </div>
                                {/* ⭐️ MODIFICATION END ⭐️ */}
                            </div>
                        )}
                        {/* Message for No Requirements */}
                        {requirements.length === 0 && (
                            <div style={{ padding: '15px', border: '1px dashed #D1D5DB', borderRadius: '8px', textAlign: 'center', color: '#6B7280' }}>
                                No specific requirements are listed for this service.
                            </div>
                        )}
                    </div>
                    
                    {/* Right Content (Side Details) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Person</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_person || 'N/A'}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Contact Number</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.contact_number || 'N/A'}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Availability</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.availability || 'N/A'}</div>
                        </div>
                        <div style={baseViewModalStyles.detailBox}>
                            <div style={baseViewModalStyles.detailLabel}><Home size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Department</div>
                            <div style={baseViewModalStyles.detailValue}>{serviceItem.department || 'N/A'}</div>
                        </div>

                         {/* Featured Image (If available) */}
                        {serviceItem.featured_image_url && (
                            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                <img 
                                    src={serviceItem.featured_image_url} 
                                    alt="Service Preview" 
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: '250px', 
                                        objectFit: 'cover', 
                                        borderRadius: '10px', 
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                                    }} 
                                />
                            </div>
                        )}
                        
                        <div style={{marginTop: '15px'}}>
                            <button onClick={onClose} style={baseViewModalStyles.closeButton}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Service Card Component ---
const ServiceCard = ({ service, onReadMore }) => {
    const color = getCategoryColor(service.category);
    const TagIcon = color.icon;
    
    const cardStyles = useMemo(() => ({
        card: { 
            backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
            transition: 'transform 0.2s, boxShadow 0.2s', cursor: 'pointer',
        },
        imageContainer: { height: '180px', overflow: 'hidden', backgroundColor: '#F3F4F6' },
        image: { width: '100%', height: '100%', objectFit: 'cover' },
        content: { padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 },
        tag: { 
            backgroundColor: color.bg, color: color.text, padding: '6px 12px', borderRadius: '9999px', 
            fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', 
            gap: '6px', marginBottom: '12px', alignSelf: 'flex-start'
        },
        cardTitle: { 
            fontSize: '18px', fontWeight: '700', color: '#1F2937', marginBottom: '10px', 
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3' 
        },
        summary: { 
            fontSize: '14px', color: '#6B7280', lineHeight: '1.4', marginBottom: '15px', 
            flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '60px' 
        },
        readMoreButton: { 
            padding: '10px 15px', 
            backgroundColor: '#1e40af', // Primary blue color
            color: 'white', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
            fontSize: '14px', transition: 'background-color 0.2s', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }
    }), [color]);

    return (
        <div 
            style={cardStyles.card} 
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => onReadMore(service)} // Main click action
        >
            <div style={cardStyles.imageContainer}>
                {service.featured_image_url ? (
                    <img 
                        src={service.featured_image_url} 
                        alt={service.title} 
                        style={cardStyles.image}
                        onError={(e) => { e.target.onerror = null; e.target.src = "placeholder_url_if_available" }} // Placeholder if image fails
                    />
                ) : (
                    <div style={{ ...cardStyles.image, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        <Image size={40} />
                    </div>
                )}
            </div>
            <div style={cardStyles.content}>
                <span style={cardStyles.tag}>
                    <TagIcon size={14} /> {service.category}
                </span>
                <h3 style={cardStyles.cardTitle}>{service.title}</h3>
                <p style={cardStyles.summary}>
                    {service.description || 'Click "Read More" for more information about this service offered by the barangay.'}
                </p>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={(e) => { e.stopPropagation(); onReadMore(service); }} style={cardStyles.readMoreButton}>
                        <Eye size={16} /> Read More 
                    </button>
                </div>
                
                <div style={styles.cardMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} /> Posted: {formatDate(service.created_at, false)}
                    </span>
                </div>
            </div>
        </div>
    );
};


// --- Main Services Page Component ---
const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedServiceForView, setSelectedServiceForView] = useState(null);

    // --- Fetch Services from the public endpoint ---
    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Use the public services endpoint
            const response = await axios.get(`${API_BASE_URL}/services`);
            
            // ⭐️ Sort services by created_at in descending order (latest first) ⭐️
            const sortedServices = response.data.sort((a, b) => {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                // Sort descending (b - a)
                return dateB - dateA; 
            });

            setServices(sortedServices);
            // ⭐️ END Sort ⭐️

        } catch (err) {
            console.error("Fetch Services Error:", err);
            setError('Failed to fetch barangay services. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // --- Filtering Logic ---
    const filteredServices = useMemo(() => {
        if (!searchTerm) {
            return services;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return services.filter(service =>
            service.title.toLowerCase().includes(lowerCaseSearch) ||
            service.description.toLowerCase().includes(lowerCaseSearch) ||
            service.category.toLowerCase().includes(lowerCaseSearch) ||
            service.department.toLowerCase().includes(lowerCaseSearch) ||
            service.contact_person.toLowerCase().includes(lowerCaseSearch)
        );
    }, [services, searchTerm]);

    // --- Handlers for Modals ---
    const handleReadMore = (serviceItem) => {
        setSelectedServiceForView(serviceItem);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedServiceForView(null);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Barangay Services Directory</h1>
            <p style={styles.subHeader}>
                Explore the complete list of services, programs, and assistance offered by the local barangay office.
            </p>

            {/* Search Bar */}
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search for a service by name, category, or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ ...styles.error, color: '#DC2626', backgroundColor: '#FEE2E2' }}>
                    <AlertTriangle size={24} style={{ marginRight: '10px' }} /> {error}
                </div>
            )}

            {/* Content Display */}
            {isLoading ? (
                <div style={styles.loadingText}>
                    <RefreshCw size={24} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} /> Loading services...
                </div>
            ) : filteredServices.length > 0 ? (
                <div style={styles.serviceGrid}>
                    {filteredServices.map(item => (
                        <ServiceCard 
                            key={item.id} 
                            service={item} 
                            onReadMore={handleReadMore}
                        />
                    ))}
                </div>
            ) : (
                <div style={styles.loadingText}>
                    No services found matching your criteria.
                </div>
            )}
            
            {/* VIEW MODAL */}
            <ServiceViewModal
                show={isViewModalOpen}
                serviceItem={selectedServiceForView}
                onClose={handleCloseViewModal}
            />
        </div>
    );
};

export default ServicesPage;