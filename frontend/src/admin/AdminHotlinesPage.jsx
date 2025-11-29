// frontend/src/admin/AdminHotlinesPage.jsx
// This file now uses a Card/Grid layout for displaying hotlines instead of a table.

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, Trash2, CheckCircle, Plus, Edit, 
    Phone, X, Save, XCircle, Volume2, Shield,
    // ADDED ICONS for consistency with public page
    Zap, Stethoscope, Home, HeartHandshake, PhoneCall 
} from 'lucide-react'; 

// NOTE: Ensure this matches your actual API base URL from server.js.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Utility Function: Format Date (Reused from other Admin Pages) ---
const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
    };
    let formattedDate = date.toLocaleDateString('en-US', options);
    if (includeTime) {
        // NOTE: Adjusted to match the time format in AdminAnnouncementsPage.jsx/AdminNewsPage.jsx
        formattedDate += ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return formattedDate;
};

// --- Constants for Dropdowns ---
const HOTLINE_CATEGORIES = [
    'Emergency (Police/Fire/Medical)', 'Barangay Office', 'Health Services', 
    'Disaster Management', 'Social Welfare', 'General Inquiry', 'Other'
];

// --- Base Input Style (for consistency across all forms) ---
const baseInputStyle = {
    width: '100%', padding: '10px', border: '1px solid #D1D5DB', // Use consistent border color
    borderRadius: '8px', boxSizing: 'border-box', 
    fontSize: '16px', color: '#1F2937',
    transition: 'border-color 0.2s',
};

// --- Shared Modal Styles (Consistent with AdminNewsPage/AdminAnnouncementPage) ---
const baseModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    // Main Form Modal Container Style (for Add/Edit Hotlines)
    formModal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative' // Consistent shadow and radius
    },
    // Header for Form Modal (Consistent typography)
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '10px', fontWeight: '700'
    },
    // Form Elements
    formGroup: { 
        display: 'flex', flexDirection: 'column', marginBottom: '15px' 
    },
    label: { 
        fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '8px' 
    },
    input: baseInputStyle,
    select: baseInputStyle,
    textarea: { 
        ...baseInputStyle, minHeight: '100px', resize: 'vertical' 
    },
    // Buttons (Consistent colors, padding, and border-radius)
    buttonPrimary: { // Save/Add button (Indigo: #6366F1)
        padding: '10px 20px', backgroundColor: '#6366F1', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonDanger: { // Delete button (Red: #DC2626)
        padding: '10px 20px', backgroundColor: '#DC2626', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonSecondary: { // Cancel button (Gray: #9CA3AF)
        padding: '10px 20px', backgroundColor: '#9CA3AF', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonContainer: { 
        display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' 
    },
    // Message Modal / Delete Confirmation Modal Small Container
    smallModal: {
        backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', 
        width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)', 
        position: 'relative', textAlign: 'center'
    }
};

// ===========================================
// HOTLINE FORM MODAL COMPONENT (Add/Edit Logic)
// ===========================================

const HotlineFormModal = ({ show, initialData, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        hotline_number: '',
        description: '',
        category: categories[0] || 'General Inquiry',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (show) {
            setFormError(null);
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    hotline_number: initialData.hotline_number || '',
                    description: initialData.description || '',
                    category: initialData.category || categories[0],
                });
            } else {
                setFormData({
                    title: '',
                    hotline_number: '',
                    description: '',
                    category: categories[0],
                });
            }
        }
    }, [show, initialData, categories]);

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.title || !formData.hotline_number || !formData.category) {
            setFormError('Title, Hotline Number, and Category are required fields.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setFormError(null);

        try {
            if (initialData) {
                // EDIT operation
                await axios.put(`${API_BASE_URL}/hotlines/${initialData.id}`, formData);
            } else {
                // ADD operation
                await axios.post(`${API_BASE_URL}/hotlines`, formData);
            }
            onSave(true);
        } catch (err) {
            console.error('Error saving hotline:', err);
            setFormError(err.response?.data?.message || 'Failed to save hotline.');
            onSave(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={baseModalStyles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={baseModalStyles.formModal}>
                <div style={baseModalStyles.header}>
                    <h2 style={{fontSize: '28px', fontWeight: '700', margin: 0, color: '#1F2937'}}>{initialData ? 'Edit Hotline' : 'Add New Hotline'}</h2>
                    <button style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280'}} onClick={onClose} title="Close">
                        <X size={28} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {formError && <p style={{ color: '#DC2626', marginBottom: '20px', padding: '10px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>Error: {formError}</p>}

                    {/* Title */}
                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Hotline Title (e.g., Police Emergency)</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            style={baseModalStyles.input}
                            placeholder="Enter the title for the hotline"
                            required
                        />
                    </div>

                    {/* Hotline Number */}
                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Hotline Number</label>
                        <input 
                            type="text" 
                            name="hotline_number" 
                            value={formData.hotline_number} 
                            onChange={handleChange} 
                            style={baseModalStyles.input}
                            placeholder="Enter the phone number or shortcode"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Category</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            style={baseModalStyles.select}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Description (e.g., Operating Hours, Services offered)</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            style={baseModalStyles.textarea}
                            placeholder="Provide a brief description or additional info"
                        />
                    </div>

                    <div style={baseModalStyles.buttonContainer}>
                        <button type="button" onClick={onClose} style={baseModalStyles.buttonSecondary} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" style={baseModalStyles.buttonPrimary} disabled={isLoading}>
                            <Save size={20} style={{marginRight: '5px'}}/> {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Hotline')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===========================================
// DELETE CONFIRMATION MODAL (Consistent with AdminNewsPage)
// ===========================================
const DeleteConfirmationModal = ({ show, title, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div style={baseModalStyles.backdrop}>
            <div style={baseModalStyles.smallModal}>
                <button 
                    onClick={onCancel} 
                    style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: '#6B7280' }}
                >
                    &times;
                </button>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0', color: '#DC2626' }}>{title}</h3>
                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '20px' }}>Are you sure you want to permanently delete this hotline? This action cannot be undone.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <button style={{...baseModalStyles.buttonSecondary, flexGrow: 1}} onClick={onCancel}>Cancel</button>
                    <button style={{...baseModalStyles.buttonDanger, flexGrow: 1}} onClick={onConfirm}>
                        <Trash2 size={20} style={{marginRight: '5px'}}/> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===========================================
// ADMIN MESSAGE MODAL (Success/Error) (Consistent with AdminNewsPage)
// ===========================================
const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;

    const modalStyles = {
        backdrop: baseModalStyles.backdrop,
        modal: baseModalStyles.smallModal,
        closeButton: { position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: '#6B7280' },
        content: {
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginBottom: '15px', color: isSuccess ? '#059669' : '#DC2626'
        },
        title: { fontSize: '22px', fontWeight: '700', margin: 0 },
        body: { fontSize: '16px', color: '#374151', marginBottom: '20px' },
        successButton: { 
            width: '100%', padding: '10px', backgroundColor: isSuccess ? '#10B981' : '#DC2626', 
            color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
            transition: 'background-color 0.2s' 
        }
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <button onClick={onClose} style={modalStyles.closeButton}>&times;</button>
                <div style={modalStyles.content}>
                    {isSuccess ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>
                <h3 style={modalStyles.title}>{title}</h3>
                <p style={modalStyles.body}>{body}</p>
                <button onClick={onClose} style={modalStyles.successButton}>Close</button>
            </div>
        </div>
    );
};


// ===========================================
// HOTLINE CARD COMPONENT (Replacing Table Rows)
// ===========================================

// --- Helper function to select icon and color based on category (UPDATED) ---
const getHotlineIconAndColor = (category) => {
    let Icon = PhoneCall; // Default Icon
    let color = '#6B7280'; // Default Gray
    const editColor = '#3B82F6'; // Consistent Edit button color (Blue)

    switch(category) {
        case 'Emergency (Police/Fire/Medical)':
            Icon = Zap; // Consistent with public page
            color = '#EF4444'; // Red
            break;
        case 'Barangay Office':
            Icon = Home; // Consistent with public page
            color = '#2563EB'; // Blue
            break;
        case 'Health Services':
            Icon = Stethoscope; // Consistent with public page
            color = '#10B981'; // Green
            break;
        case 'Disaster Management':
            Icon = Shield; // Consistent with public page
            color = '#F97316'; // Orange
            break;
        case 'Social Welfare':
            Icon = HeartHandshake; // Consistent with public page
            color = '#9333ea'; // Purple
            break;
        case 'General Inquiry':
        case 'Other':
        default:
            Icon = PhoneCall; 
            color = '#6B7280'; // Gray
    }
    return { Icon, color, editColor };
};

const HotlineCard = ({ hotline, onEdit, onDelete }) => {
    // State to manage hover for dynamic styling
    const [isHovered, setIsHovered] = useState(false);
    
    // UPDATED: Use the new consistent function and Icon name
    const { Icon: CategoryIcon, color: iconColor, editColor } = getHotlineIconAndColor(hotline.category);
    
    // Styles for the card display (based on user's image)
    const cardStyles = {
        padding: '25px',
        backgroundColor: '#FFFFFF', // Card itself keeps white background
        borderRadius: '16px',
        border: `1px solid #E5E7EB`, 
        // Dynamic box shadow based on hover state
        boxShadow: isHovered 
            ? '0 8px 20px rgba(0, 0, 0, 0.15)' 
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        // Dynamic transform for a subtle lift on hover
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    };

    const iconContainerStyle = {
        color: iconColor,
        border: `2px solid ${iconColor}40`, // Lightened border for the icon container
        borderRadius: '8px',
        padding: '5px',
        width: 'fit-content',
        marginBottom: '5px'
    };

    const titleStyle = {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1F2937',
        margin: '0',
        lineHeight: '1.3'
    };

    const descriptionStyle = {
        fontSize: '14px',
        color: '#6B7280',
        margin: '0',
    };

    const numberStyle = {
        fontSize: '18px',
        fontWeight: '700',
        color: iconColor,
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px dashed #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    };
    
    const actionContainerStyle = {
        position: 'absolute',
        top: '15px',
        right: '15px',
        display: 'flex',
        gap: '5px'
    };

    const actionButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        transition: 'color 0.2s',
    };
    
    // NEW: Style for the Category Tag (Consistent with HotlinesPage.jsx)
    const categoryTagStyle = {
        position: 'absolute',
        top: '20px',
        left: '20px', // Positioning changed to left to avoid collision with actions
        padding: '4px 10px',
        backgroundColor: iconColor, // Use the determined color
        color: 'white',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10,
    };


    return (
        <div 
            style={cardStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* NEW: Category Tag */}
            <span style={categoryTagStyle}>{hotline.category}</span>
            
            {/* Actions */}
            <div style={actionContainerStyle}>
                <button 
                    onClick={() => onEdit(hotline)} 
                    style={{...actionButtonStyle, color: editColor}} // Color is applied here
                    title="Edit Hotline"
                >
                    <Edit size={18} />
                </button>
                <button 
                    onClick={() => onDelete(hotline)} 
                    style={{...actionButtonStyle, color: '#DC2626'}} // Red for delete
                    title="Delete Hotline"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            
            {/* Icon Container - Adjust padding/margin if overlap occurs with tag */}
            <div style={{...iconContainerStyle, marginTop: '25px'}}> 
                <CategoryIcon size={20} />
            </div>

            {/* Title */}
            <h3 style={titleStyle}>{hotline.title}</h3>
            
            {/* Description */}
            {hotline.description && (
                <p style={descriptionStyle}>{hotline.description}</p>
            )}

            {/* Hotline Number */}
            <div style={numberStyle}>
                <Phone size={18} />
                <span>{hotline.hotline_number}</span>
            </div>
            
            <p style={{fontSize: '11px', color: '#9CA3AF', margin: 0, marginTop: '5px'}}>
                Last Updated: {formatDate(hotline.updated_at || hotline.created_at, false)}
            </p>
        </div>
    );
};

// ===========================================
// MAIN ADMIN HOTLINES PAGE
// ===========================================

// --- Main Page Styles ---
const styles = {
    container: {
        padding: '30px',
        backgroundColor: '#F9FAFB', // Light gray background
        minHeight: '100vh',
    },
    header: {
         fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px',
    },
    addButton: {
        display: 'flex', alignItems: 'center', padding: '10px 20px', 
        backgroundColor: '#6366F1', // Indigo primary color
        color: 'white', border: 'none', borderRadius: '8px', 
        cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s'
    },
    controls: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '30px', backgroundColor: 'white', 
        padding: '15px', borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    searchInput: {
        padding: '10px', border: '1px solid #D1D5DB', 
        borderRadius: '8px', width: '100%', maxWidth: '350px', 
        display: 'flex', alignItems: 'center', boxSizing: 'border-box'
    },
    searchIcon: { 
        marginRight: '10px', color: '#6B7280' 
    },
    cardGridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Responsive card grid
        gap: '25px',
    },
    noResults: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#6B7280',
        fontWeight: '500',
        gridColumn: '1 / -1' // Span across the entire grid
    },
};

// Removed getCategoryTagStyle function

const AdminHotlinesPage = () => {
    const [hotlines, setHotlines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHotline, setEditingHotline] = useState(null);

    // Search and Sort
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    
    // Modals
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, title: '' });
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });


    // --- Data Fetching ---
    const fetchHotlines = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/hotlines`);
            setHotlines(response.data);
        } catch (err) {
            console.error('Error fetching hotlines:', err);
            setError('Failed to fetch hotlines. Please check the server connection.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHotlines();
    }, []);

    // Function to close/reset form modal states
    const handleCloseAddEditModal = () => {
        setIsModalOpen(false);
        setEditingHotline(null);
    };

    // Function to handle save complete (refetch data, show message)
    const handleSaveComplete = (success) => {
        handleCloseAddEditModal();
        if (success) {
            fetchHotlines(); // Refresh data
            setMessageModal({ 
                show: true, 
                title: 'Success!', 
                body: editingHotline ? 'Hotline updated successfully.' : 'New hotline added successfully.', 
                isSuccess: true 
            });
        } else {
            setMessageModal({ 
                show: true, 
                title: 'Error Saving', 
                body: 'The hotline could not be saved. Please try again.', 
                isSuccess: false 
            });
        }
    };

    // --- CRUD Handlers ---
    const handleAddHotline = () => {
        setEditingHotline(null);
        setIsModalOpen(true);
    };

    const handleEditHotline = (hotline) => {
        setEditingHotline(hotline);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (hotline) => {
        setDeleteModal({ show: true, id: hotline.id, title: `Confirm Deletion of Hotline: "${hotline.title}"` });
    };
    
    const confirmDelete = async () => {
        const id = deleteModal.id;
        setDeleteModal({ show: false, id: null, title: '' }); // Close confirmation modal
        
        try {
            await axios.delete(`${API_BASE_URL}/hotlines/${id}`);
            // Optimistically update the list by filtering the deleted item
            setHotlines(prev => prev.filter(h => h.id !== id));
            setMessageModal({ 
                show: true, 
                title: 'Deleted!', 
                body: 'Hotline successfully deleted.', 
                isSuccess: true 
            });
        } catch (err) {
            console.error('Error deleting hotline:', err);
            setMessageModal({ 
                show: true, 
                title: 'Deletion Failed', 
                body: 'Failed to delete the hotline. Please check server status.', 
                isSuccess: false 
            });
        }
    };

    // --- Sorting Logic (Used internally to order cards) ---
    const sortedHotlines = useMemo(() => {
        let sortableItems = [...hotlines];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                // Handle null/undefined values for comparison safety
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [hotlines, sortConfig]);

    const filteredAndSortedHotlines = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return sortedHotlines.filter(hotline => 
            hotline.title.toLowerCase().includes(lowerCaseSearchTerm) || 
            (hotline.description || '').toLowerCase().includes(lowerCaseSearchTerm) || 
            hotline.hotline_number.toLowerCase().includes(lowerCaseSearchTerm) || 
            hotline.category.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [sortedHotlines, searchTerm]);


    return (
        <div style={styles.container}>
            <h1 style={styles.header}>
                Admin Hotline Management
            </h1>
            
            {/* Controls Section (Search & Add Button) */}
            <div style={styles.controls}>
                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}/>
                    <input
                        type="text"
                        placeholder="Search hotlines (title, number, category...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{...styles.searchInput, paddingLeft: '40px'}}
                    />
                </div>
                <button 
                    onClick={handleAddHotline} 
                    style={styles.addButton}
                >
                    <Plus size={20} style={{marginRight: '8px'}}/> Add New Hotline
                </button>
            </div>

            {/* Error Message */}
            {error && <div style={{ color: '#DC2626', marginBottom: '20px', padding: '15px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>Error: {error}</div>}

            {/* Main Content Area (Card Grid) */}
            {isLoading ? (
                <div style={styles.noResults}>Loading hotlines...</div>
            ) : (
                <div style={styles.cardGridContainer}>
                    {filteredAndSortedHotlines.length > 0 ? (
                        filteredAndSortedHotlines.map((hotline) => (
                            <HotlineCard 
                                key={hotline.id} 
                                hotline={hotline}
                                onEdit={handleEditHotline}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    ) : (
                        <div style={styles.noResults}>
                            No hotlines found matching your search criteria.
                        </div>
                    )}
                </div>
            )}
            
            {/* ADD/EDIT MODAL (Form) */}
            <HotlineFormModal
                show={isModalOpen}
                initialData={editingHotline}
                categories={HOTLINE_CATEGORIES}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveComplete}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                title={deleteModal.title}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ ...deleteModal, show: false })}
            />
            
            {/* MESSAGE MODAL */}
            <AdminMessageModal
                show={messageModal.show}
                title={messageModal.title}
                body={messageModal.body}
                isSuccess={messageModal.isSuccess}
                onClose={() => setMessageModal({ ...messageModal, show: false })}
            />
        </div>
    );
};

export default AdminHotlinesPage;