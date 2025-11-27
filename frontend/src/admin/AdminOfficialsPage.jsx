// frontend/src/admin/AdminOfficialsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Trash2, CheckCircle, Plus, UserPlus, Image, UserX } from 'lucide-react';

// --- Constants ---
const OFFICIAL_CATEGORIES = [
    'Barangay Official', 'SK Official', 'Staff', 'Tanod', 'Other'
];
const OFFICIAL_STATUSES = [
    'Working', 'On Site', 'On Leave', 'AWOL'
];

// --- NEW CONSTANTS FOR POSITION AND COMMITTEE ---
const BARANGAY_POSITIONS = [
    'Barangay Captain', 'Kagawad', 'Secretary', 'Treasurer'
];

const SK_POSITIONS = [
    'SK Chairperson', 'SK Kagawad'
];

const OTHER_POSITIONS = [
    'Staff', 'Tanod', 'Other' // Use categories as positions for these.
];

const COMMITTEES = [
    'None', // Default for Captain, Staff, Tanod, or when not applicable
    'Appropriation', 'Peace and Order', 'Education', 'Health and Sanitation', 
    'Agriculture', 'Youth and Sports Development', 'Women and Family', 
    'Infrastructure', 'Environmental Protection'
];

// Helper to get positions based on category
const getPositionsForCategory = (category) => {
    switch (category) {
        case 'Barangay Official':
            return BARANGAY_POSITIONS;
        case 'SK Official':
            return SK_POSITIONS;
        default:
            return OTHER_POSITIONS.includes(category) ? [category] : OTHER_POSITIONS;
    }
};
// --- END NEW CONSTANTS ---

// --- Helper Components ---

const SuccessAlert = ({ message, style }) => {
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

// --- Modal for Deletion ---
const DeleteConfirmationModal = ({ show, official, onConfirm, onCancel }) => {
    if (!show || !official) return null;
    const fullName = `${official.first_name} ${official.last_name}`;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.header}>Confirm Deletion</h3>
                <p style={modalStyles.body}>
                    Are you sure you want to permanently delete the official: 
                    <strong style={{ display: 'block', marginTop: '5px' }}>{fullName} (ID: {official.id})</strong>?
                </p>
                <p style={modalStyles.warning}>
                    ⚠️ This action is irreversible. The official's record will be removed from the database.
                </p>
                <div style={modalStyles.footer}>
                    <button onClick={onCancel} style={modalStyles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={modalStyles.deleteButton}>
                        Yes, Delete Official
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal for Adding Official ---
const AddOfficialModal = ({ show, onHide, onOfficialAdded }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        middleInitial: '',
        lastName: '',
        contactNumber: '',
        category: OFFICIAL_CATEGORIES[0],
        status: OFFICIAL_STATUSES[0],
        // --- NEW: position and committee in initial state ---
        position: getPositionsForCategory(OFFICIAL_CATEGORIES[0])[0], 
        committee: COMMITTEES[0],
        // ---------------------------------------------------
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState(null); // URL from server
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Reset state when modal is hidden
        if (!show) {
            setFormData({
                firstName: '', middleInitial: '', lastName: '', contactNumber: '',
                category: OFFICIAL_CATEGORIES[0], status: OFFICIAL_STATUSES[0],
                // --- NEW: Reset position and committee ---
                position: getPositionsForCategory(OFFICIAL_CATEGORIES[0])[0], 
                committee: COMMITTEES[0],
                // -----------------------------------------
            });
            setFile(null);
            setPreviewUrl(null);
            setProfilePictureUrl(null);
            setError(null);
            setLoading(false);
        }
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // --- NEW LOGIC: Dynamic position and committee reset based on category ---
        if (name === 'category') {
            const newPositions = getPositionsForCategory(value);
            setFormData({ 
                ...formData, 
                [name]: value,
                position: newPositions[0], // Reset position to the first available for the new category
                committee: COMMITTEES[0], // Reset committee to None
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        // --- END NEW LOGIC ---
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handlePictureUpload = async () => {
        if (!file) return null; // No file, nothing to upload

        setLoading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('official_picture', file); // 'official_picture' matches server multer field name

        try {
            const response = await axios.post('http://localhost:5000/api/admin/officials/upload-picture', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfilePictureUrl(response.data.profilePictureUrl);
            setLoading(false);
            return response.data.profilePictureUrl;
        } catch (err) {
            console.error("Profile picture upload failed:", err.response ? err.response.data : err);
            setError('Failed to upload profile picture.');
            setLoading(false);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Upload picture first, if a file is selected
            let finalPictureUrl = profilePictureUrl;
            if (file) {
                finalPictureUrl = await handlePictureUpload();
                if (!finalPictureUrl) {
                    setLoading(false);
                    return; // Stop if picture upload failed
                }
            }

            // 2. Submit official data
            const payload = {
                ...formData,
                profilePictureUrl: finalPictureUrl,
                // Ensure new fields are explicitly included
                position: formData.position, 
                committee: formData.committee,
            };

            const response = await axios.post('http://localhost:5000/api/admin/officials', payload);
            
            // Success
            onOfficialAdded(response.data.official);
            onHide();

        } catch (err) {
            console.error("Add official failed:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || 'An unknown error occurred while adding the official.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    // --- NEW: Get current positions based on selected category ---
    const currentPositions = getPositionsForCategory(formData.category);
    // -------------------------------------------------------------

    return (
        <div style={modalStyles.backdrop}>
            <div style={{...modalStyles.modal, width: '90%', maxWidth: '600px'}}>
                <h3 style={modalStyles.header}>
                    <UserPlus size={24} style={{ marginRight: '10px', color: '#6366F1' }} />
                    Add New Barangay Official
                </h3>
                <form onSubmit={handleSubmit}>
                    {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ Error: {error}</p></div>}
                    
                    <div style={addModalStyles.grid}>
                        {/* Column 1: Profile Picture */}
                        <div style={addModalStyles.picUploadContainer}>
                            <p style={addModalStyles.label}>Profile Picture (Optional)</p>
                            <div style={addModalStyles.picPreview} onClick={() => document.getElementById('official-pic-upload').click()}>
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={addModalStyles.picImage} />
                                ) : (
                                    <div style={addModalStyles.picPlaceholder}>
                                        <Image size={40} color="#9CA3AF" />
                                        <p style={{ margin: '10px 0 0 0', color: '#9CA3AF', fontSize: '12px' }}>Click to Upload</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    id="official-pic-upload"
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    style={{ display: 'none' }} 
                                />
                            </div>
                            <p style={addModalStyles.hint}>Max 2MB. Only image files.</p>
                        </div>
                        
                        {/* Column 2: Details */}
                        <div style={addModalStyles.detailsContainer}>
                            <p style={addModalStyles.label}>Full Name *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr', gap: '10px', marginBottom: '15px' }}>
                                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} style={addModalStyles.input} required />
                                <input type="text" name="middleInitial" placeholder="M.I." value={formData.middleInitial} onChange={handleInputChange} style={addModalStyles.input} maxLength="1" />
                                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} style={addModalStyles.input} required />
                            </div>

                            <p style={addModalStyles.label}>Category *</p>
                            <select name="category" value={formData.category} onChange={handleInputChange} style={{...addModalStyles.input, marginBottom: '15px'}} required>
                                {OFFICIAL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* NEW: Position Field */}
                            <p style={addModalStyles.label}>Position *</p>
                            <select name="position" value={formData.position} onChange={handleInputChange} style={{...addModalStyles.input, marginBottom: '15px'}} required>
                                {currentPositions.map(pos => (
                                    <option key={pos} value={pos}>{pos}</option>
                                ))}
                            </select>
                            {/* END NEW: Position Field */}

                            {/* NEW: Committee Field (Conditional) */}
                            {(formData.category === 'Barangay Official' || formData.category === 'SK Official') && (
                                <>
                                    <p style={addModalStyles.label}>Committee (Mandatory for Kagawads)</p>
                                    <select name="committee" value={formData.committee} onChange={handleInputChange} style={{...addModalStyles.input, marginBottom: '15px'}}>
                                        {COMMITTEES.map(comm => (
                                            <option key={comm} value={comm}>{comm}</option>
                                        ))}
                                    </select>
                                </>
                            )}
                            {/* END NEW: Committee Field */}

                            <p style={addModalStyles.label}>Status *</p>
                            <select name="status" value={formData.status} onChange={handleInputChange} style={{...addModalStyles.input, marginBottom: '15px'}} required>
                                {OFFICIAL_STATUSES.map(stat => (
                                    <option key={stat} value={stat}>{stat}</option>
                                ))}
                            </select>

                            <p style={addModalStyles.label}>Contact Number (Optional)</p>
                            <input type="text" name="contactNumber" placeholder="e.g., 09123456789" value={formData.contactNumber} onChange={handleInputChange} style={addModalStyles.input} />
                        </div>
                    </div>

                    <div style={{...modalStyles.footer, marginTop: '20px'}}>
                        <button type="button" onClick={onHide} style={modalStyles.cancelButton} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" style={addModalStyles.addButton} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Official'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main Component ---

const AdminOfficialsPage = () => {
    const [officials, setOfficials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id'); 
    const [sortDirection, setSortDirection] = useState('asc');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [officialToDelete, setOfficialToDelete] = useState(null); // { id, name }
    const [showAddModal, setShowAddModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null); 

    const fetchOfficials = async () => {
        setLoading(true);
        setError(null);
        try {
            // The API call to fetch officials will now return position and committee
            const response = await axios.get('http://localhost:5000/api/admin/officials');
            setOfficials(response.data);
        } catch (err) {
            console.error("Error fetching officials data:", err);
            setError('Failed to load officials data from the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficials();
    }, []);

    const toggleSort = (key) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('asc');
        }
    };

    const handleDeleteClick = (official) => {
        setOfficialToDelete(official);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!officialToDelete) return;
        setShowDeleteModal(false);
        setError(null);
        setSuccessMessage(null);
        const officialName = `${officialToDelete.first_name} ${officialToDelete.last_name}`;
        const officialId = officialToDelete.id;
        try {
            await axios.delete(`http://localhost:5000/api/admin/officials/${officialId}`);
            setOfficials(prev => prev.filter(o => o.id !== officialId));
            setSuccessMessage(`Official ${officialName} deleted successfully.`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error(`Error deleting official ${officialId}:`, err);
            setError(err.response?.data?.message || 'Failed to delete official.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleOfficialAdded = (newOfficial) => {
        setOfficials(prev => [newOfficial, ...prev]);
        setSuccessMessage(`Official ${newOfficial.first_name} ${newOfficial.last_name} added successfully!`);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const filteredAndSortedOfficials = useMemo(() => {
        let currentOfficials = officials.filter(official => {
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${official.first_name} ${official.last_name} ${official.middle_initial || ''}`.toLowerCase();
            
            // --- NEW: Include position and committee in search filter ---
            const positionLower = (official.position || '').toLowerCase();
            const committeeLower = (official.committee || '').toLowerCase();
            // -------------------------------------------------------------

            return (
                fullName.includes(searchLower) ||
                (official.contact_number && official.contact_number.includes(searchLower)) ||
                official.category.toLowerCase().includes(searchLower) ||
                official.status.toLowerCase().includes(searchLower) ||
                positionLower.includes(searchLower) || // NEW
                committeeLower.includes(searchLower) // NEW
            );
        });

        currentOfficials.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (sortBy === 'id' || sortBy === 'created_at') {
                if (sortBy === 'created_at') {
                    // Convert to timestamp for accurate date comparison
                    const aTime = new Date(aValue).getTime();
                    const bTime = new Date(bValue).getTime();
                    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
                }
                // For 'id', direct numeric comparison
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                // String comparison (case-insensitive)
                if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) return sortDirection === 'asc' ? -1 : 1;
                if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return currentOfficials;
    }, [officials, searchTerm, sortBy, sortDirection]);

    const renderSortIcon = (key) => {
        if (sortBy !== key) return null;
        const Icon = sortDirection === 'asc' ? ChevronUp : ChevronDown;
        return <Icon size={14} style={styles.sortIcon} />;
    };

    const SortableHeader = ({ title, sortKey }) => (
        <th onClick={() => toggleSort(sortKey)} style={{...styles.tableHeader, cursor: 'pointer', minWidth: '100px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                {title} {renderSortIcon(sortKey)}
            </div>
        </th>
    );

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Working':
                return { backgroundColor: '#D1FAE5', color: '#047857' };
            case 'On Site':
                return { backgroundColor: '#FEF9C3', color: '#A16207' };
            case 'On Leave':
                return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
            case 'AWOL':
                return { backgroundColor: '#FBCFE8', color: '#9D174D' };
            default:
                return { backgroundColor: '#E5E7EB', color: '#4B5563' };
        }
    };

    if (loading) return <div style={styles.center}><p style={{ color: '#2563eb', fontSize: '18px' }}>🚀 Loading Officials Data...</p></div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>Barangay Officials Management</h1>
            <p style={styles.subtitle}> 
                Manage all barangay and SK officials, staff, and tanods. Total: <strong style={{color: '#1F2937'}}>{officials.length.toLocaleString()}</strong> 
            </p>

            {/* Toolbar: Search and Add Button */}
            <div style={styles.toolbar}>
                <div style={styles.searchBox}>
                    <Search size={20} color="#6B7280" style={{ marginLeft: '10px' }}/>
                    <input 
                        type="text" 
                        placeholder="Search by name, contact, category..." 
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
                    <Plus size={20} style={{ marginRight: '5px' }} />
                    Add New Official
                </button>
            </div>

            {successMessage && <SuccessAlert message={successMessage} />}
            {error && <div style={{...styles.errorAlert, marginBottom: '15px'}}><p style={{ margin: 0 }}>❌ Error: {error}</p></div>}

            {/* Officials Table */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <SortableHeader title="ID" sortKey="id" />
                            <th style={{...styles.tableHeader, width: '40px'}}>Pic</th>
                            <SortableHeader title="Name" sortKey="last_name" />
                            <SortableHeader title="Category" sortKey="category" />
                            {/* NEW: Position Header */}
                            <SortableHeader title="Position" sortKey="position" />
                            {/* NEW: Committee Header */}
                            <SortableHeader title="Committee" sortKey="committee" />
                            <SortableHeader title="Status" sortKey="status" />
                            <SortableHeader title="Contact" sortKey="contact_number" />
                            <SortableHeader title="Added On" sortKey="created_at" />
                            <th style={{...styles.tableHeader, width: '80px', textAlign: 'center'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedOfficials.map(official => (
                            <tr key={official.id} style={styles.tableRow}>
                                <td style={styles.tableData}>{official.id}</td>
                                <td style={styles.tableData}>
                                    {official.profile_picture_url ? (
                                        <img src={official.profile_picture_url} alt="Profile" style={styles.avatarTable} />
                                    ) : (
                                        <div style={styles.avatarPlaceholderTable}>
                                            <UserX size={20} color="#6B7280" />
                                        </div>
                                    )}
                                </td>
                                <td style={{...styles.tableData, fontWeight: '600'}}>
                                    {official.first_name} {official.middle_initial ? official.middle_initial + '. ' : ''}{official.last_name}
                                </td>
                                <td style={styles.tableData}>{official.category}</td>
                                
                                {/* NEW: Position Data */}
                                <td style={{...styles.tableData, fontWeight: '500'}}>{official.position}</td>

                                {/* NEW: Committee Data */}
                                <td style={styles.tableData}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px', 
                                        fontWeight: '600',
                                        // Use a light green/teal for assigned committees, or gray for 'None'/null
                                        backgroundColor: official.committee === 'None' || !official.committee ? '#F3F4F6' : '#D1FAE5', 
                                        color: official.committee === 'None' || !official.committee ? '#4B5563' : '#047857'
                                    }}>
                                        {official.committee || 'None'}
                                    </span>
                                </td>

                                <td style={styles.tableData}>
                                    <span style={{...styles.statusBadge, ...getStatusBadgeStyle(official.status)}}>
                                        {official.status}
                                    </span>
                                </td>
                                <td style={styles.tableData}>{official.contact_number || 'N/A'}</td>
                                <td style={styles.tableData}>{new Date(official.created_at).toLocaleDateString()}</td>
                                <td style={{...styles.tableData, textAlign: 'center'}}>
                                    <button onClick={() => handleDeleteClick(official)} style={styles.actionButton} title="Delete Official" >
                                        <Trash2 size={18} color="#DC2626" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedOfficials.length === 0 && (
                            <tr>
                                <td colSpan="10" style={styles.noResults}>No officials found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                official={officialToDelete} 
                onConfirm={confirmDelete} 
                onCancel={() => setShowDeleteModal(false)} 
            />
            <AddOfficialModal 
                show={showAddModal} 
                onHide={() => setShowAddModal(false)} 
                onOfficialAdded={handleOfficialAdded} 
            />
        </div>
    );
};

// --- Styles ---
const styles = {
    container: {
        padding: '30px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB',
    },
    center: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
    },
    pageTitle: {
        color: '#1F2937',
        marginBottom: '5px',
        fontSize: '28px',
        fontWeight: '700',
    },
    subtitle: {
        color: '#6B7280',
        fontSize: '15px',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #E5E7EB'
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        width: '350px',
        padding: '5px',
    },
    searchInput: {
        border: 'none',
        outline: 'none',
        padding: '8px 10px',
        flexGrow: 1,
        fontSize: '15px',
        backgroundColor: 'transparent',
    },
    addButton: {
        backgroundColor: '#6366F1',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#4F46E5',
        }
    },
    tableWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '1200px', // Ensure horizontal scrolling if too narrow
    },
    tableHeader: {
        padding: '15px 20px',
        textAlign: 'left',
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        fontSize: '13px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '2px solid #E5E7EB',
    },
    tableRow: {
        borderBottom: '1px solid #E5E7EB',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#F9FAFB',
        }
    },
    tableData: {
        padding: '15px 20px',
        color: '#1F2937',
        fontSize: '14px',
    },
    noResults: {
        textAlign: 'center',
        padding: '30px',
        color: '#9CA3AF',
        fontSize: '16px',
    },
    statusBadge: {
        padding: '5px 10px',
        borderRadius: '50px',
        fontWeight: '700',
        fontSize: '12px',
        display: 'inline-block',
        minWidth: '80px',
        textAlign: 'center',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        marginLeft: '5px',
        transition: 'transform 0.1s',
        ':hover': {
            transform: 'scale(1.1)',
        }
    },
    successAlert: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#D1FAE5', // Light green
        color: '#047857', // Dark green text
        border: '1px solid #6EE7B7',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginBottom: '15px',
    },
    // New: Error Alert Styles
    errorAlert: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#FEE2E2', // Light red
        color: '#991B1B', // Dark red text
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginTop: '15px',
    },
    avatarTable: {
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #E5E7EB',
    },
    avatarPlaceholderTable: {
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #E5E7EB',
    },
};

const modalStyles = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '450px',
        width: '100%',
    },
    header: {
        color: '#1F2937',
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '22px',
        fontWeight: '700',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
    },
    body: {
        color: '#4B5563',
        fontSize: '16px',
        lineHeight: '1.5',
        marginBottom: '15px',
    },
    warning: {
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '14px',
        border: '1px solid #FCA5A5',
        marginBottom: '20px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '30px',
        paddingTop: '15px',
        borderTop: '1px solid #E5E7EB',
    },
    cancelButton: {
        backgroundColor: '#E5E7EB',
        color: '#4B5563',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#D1D5DB',
        }
    },
    deleteButton: {
        backgroundColor: '#DC2626',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#B91C1C',
        }
    },
};

const addModalStyles = {
    ...modalStyles,
    addButton: {
        backgroundColor: '#10B981', // Emerald green
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#059669',
        }
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: '20px',
    },
    detailsContainer: {
        padding: '10px',
    },
    label: {
        color: '#374151',
        marginBottom: '5px',
        marginTop: '10px',
        fontWeight: '600',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        fontSize: '15px',
        boxSizing: 'border-box',
        ':focus': {
            borderColor: '#6366F1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            outline: 'none',
        }
    },
    picUploadContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
    },
    picPreview: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: '#E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        border: '3px dashed #D1D5DB',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        ':hover': {
            borderColor: '#6366F1',
        }
    },
    picImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    picPlaceholder: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hint: {
        fontSize: '11px',
        color: '#6B7280',
        marginTop: '10px',
    }
};


export default AdminOfficialsPage;