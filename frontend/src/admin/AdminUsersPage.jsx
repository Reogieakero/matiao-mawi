// frontend/src/admin/AdminUsersPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// REMOVED: Edit import
import { Search, ChevronDown, ChevronUp, Trash2, CheckCircle } from 'lucide-react'; // Added CheckCircle for the alert

// --- Success Alert Component (NEW) ---
const SuccessAlert = ({ message, style }) => {
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

// --- Modal Component (Inline Styles) (Omitted for brevity, unchanged) ---
const DeleteConfirmationModal = ({ show, user, onConfirm, onCancel }) => {
    if (!show || !user) return null;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.header}>Confirm Deletion</h3>
                <p style={modalStyles.body}>
                    Are you sure you want to permanently delete the user: 
                    <strong style={{ display: 'block', marginTop: '5px' }}>{user.name} (ID: {user.id})</strong>?
                </p>
                <p style={modalStyles.warning}>
                    ⚠️ This action is irreversible and will delete ALL their posts, jobs, responses, and profile data.
                </p>
                <div style={modalStyles.footer}>
                    <button onClick={onCancel} style={modalStyles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={modalStyles.deleteButton}>
                        Yes, Delete User
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- Modal Styles (Omitted for brevity, unchanged) ---
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
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    },
    header: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: '10px',
        borderBottom: '1px solid #FEE2E2',
        paddingBottom: '10px',
    },
    body: {
        fontSize: '16px',
        color: '#4B5563',
        marginBottom: '15px',
        lineHeight: '1.4',
    },
    warning: {
        fontSize: '14px',
        color: '#991B1B',
        backgroundColor: '#FEF2F2',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '25px',
        fontWeight: '500',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    cancelButton: {
        padding: '10px 20px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        backgroundColor: '#F9FAFB',
        color: '#4B5563',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
        minWidth: '100px',
    },
    deleteButton: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#DC2626',
        color: 'white',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
        minWidth: '150px',
    }
};

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id'); 
    const [sortDirection, setSortDirection] = useState('asc');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null); // { id, name }
    // NEW STATE for success message
    const [successMessage, setSuccessMessage] = useState(null); 

    // --- Data Fetching (Omitted for brevity, unchanged) ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/admin/users');
                setUsers(response.data);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError('Failed to load user data from the server. Check server.js query.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // --- Sorting and Filtering Logic (Omitted for brevity, unchanged) ---
    const filteredAndSortedUsers = useMemo(() => {
        let currentUsers = [...users];

        if (searchTerm) {
            currentUsers = currentUsers.filter(user =>
                (user.id && String(user.id).includes(searchTerm)) ||
                (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        currentUsers.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';

            if (sortBy === 'id') {
                const aNum = Number(aValue);
                const bNum = Number(bValue);
                if (aNum < bNum) return sortDirection === 'asc' ? -1 : 1;
                if (aNum > bNum) return sortDirection === 'asc' ? 1 : -1;
            } else {
                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return currentUsers;
    }, [users, searchTerm, sortBy, sortDirection]);

    // --- Handlers ---
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };
    
    // Opens the modal
    const handleDelete = (userId, userName) => {
        setUserToDelete({ id: userId, name: userName });
        setShowDeleteModal(true);
        setError(null); // Clear any previous error
    };

    // UPDATED: Function to handle deletion after confirmation
    const confirmDelete = async () => {
        if (!userToDelete) return;

        const userId = userToDelete.id;
        const userName = userToDelete.name;

        // Close the modal and reset state immediately
        setShowDeleteModal(false);
        setUserToDelete(null); 

        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);

            // Update local state: remove the deleted user
            setUsers(users.filter(user => user.id !== userId));
            
            // Set success message
            const msg = `User '${userName}' (ID: ${userId}) has been permanently deleted.`;
            setSuccessMessage(msg);

            // Automatically clear the message after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000); 

            console.log(`[SUCCESS] User ${userName} (ID: ${userId}) deleted successfully.`);
        } catch (err) {
            console.error(`Error deleting user ${userId}:`, err);
            // Provide feedback to the admin if the deletion fails
            const err_msg = `Failed to delete user ${userName}. Check server logs.`;
            setError(err_msg);
            // Clear error after 5 seconds if no new error occurs
            setTimeout(() => {
                setError(prev => (prev === err_msg ? null : prev));
            }, 5000);
        }
    };
    
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };
    
    if (loading) return <div style={styles.center}><p style={{ color: '#2563eb', fontSize: '18px' }}>🚀 Loading User Data...</p></div>;


    return (
        <div style={styles.container}>
            {/* Title and Subtitle placement aligned with AdminDashboardPage */}
            <h1 style={styles.pageTitle}>User Management</h1>
            <p style={styles.subtitle}>
                Manage all registered users. Total: <strong style={{color: '#1F2937'}}>{users.length.toLocaleString()}</strong>
            </p>
            
            {/* Display Error Message */}
            {error && <div style={styles.errorAlert}><p style={{ margin: 0 }}>❌ Error: {error}</p></div>}
            
            {/* NEW: Display Success Message */}
            <SuccessAlert message={successMessage} style={{marginTop: '15px'}} />

            <div style={{...styles.toolbar, marginTop: '25px'}}> 
                <div style={styles.searchBox}>
                    <Search size={18} color="#6B7280" style={{ marginRight: '10px' }} />
                    <input
                        type="text"
                        placeholder="Search by ID, name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                <div style={styles.filterInfo}>
                    {filteredAndSortedUsers.length} of {users.length} visible
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead style={styles.tableHead}>
                        <tr>
                            <TableHeader onClick={() => handleSort('id')} sortBy={sortBy} sortKey='id' sortDirection={sortDirection}>ID</TableHeader>
                            <TableHeader onClick={() => handleSort('name')} sortBy={sortBy} sortKey='name' sortDirection={sortDirection}>Name</TableHeader>
                            <TableHeader onClick={() => handleSort('email')} sortBy={sortBy} sortKey='email' sortDirection={sortDirection}>Email</TableHeader>
                            <TableHeader onClick={() => handleSort('role')} sortBy={sortBy} sortKey='role' sortDirection={sortDirection}>Role</TableHeader>
                            <TableHeader onClick={() => handleSort('created_at')} sortBy={sortBy} sortKey='created_at' sortDirection={sortDirection}>Registered</TableHeader>
                            <th style={{...styles.th, cursor: 'default'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedUsers.map(user => (
                            <tr key={user.id} style={styles.tr}>
                                <td style={{...styles.td, fontWeight: '600', color: '#6B7280'}}>{user.id}</td>
                                <td style={styles.td}>{user.name || 'N/A'}</td>
                                <td style={{...styles.td, fontWeight: '500'}}>{user.email}</td>
                                <td style={styles.td}>
                                    <span style={user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}>
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td style={styles.tdActions}>
                                    <button 
                                        style={{...styles.actionButton, color: '#DC2626'}} 
                                        onClick={() => handleDelete(user.id, user.name || user.email)} 
                                        title="Delete User"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredAndSortedUsers.length === 0 && (
                <div style={styles.noResults}>
                    <p>No users found matching your criteria.</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal 
                show={showDeleteModal}
                user={userToDelete}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

// --- Sub-Component for Clean Table Header (Omitted for brevity, unchanged) ---
const TableHeader = ({ children, onClick, sortBy, sortKey, sortDirection }) => (
    <th style={styles.th} onClick={onClick}>
        <div style={styles.thContent}>
            {children} 
            {sortBy === sortKey && (
                sortDirection === 'asc' 
                    ? <ChevronUp size={14} style={styles.sortIcon} /> 
                    : <ChevronDown size={14} style={styles.sortIcon} />
            )}
        </div>
    </th>
);

// --- Styles Object (Updated: Added successAlert and errorAlert styles) ---
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
        padding: '15px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        padding: '5px 15px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        width: '350px',
        transition: 'border-color 0.2s',
    },
    searchInput: {
        border: 'none',
        outline: 'none',
        flexGrow: 1,
        fontSize: '15px',
        padding: '5px 0',
        backgroundColor: 'transparent',
    },
    filterInfo: {
        fontSize: '14px',
        color: '#6B7280',
        fontWeight: '500',
    },
    tableContainer: {
        overflowX: 'auto',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        marginTop: '20px', // Adjusted margin to accommodate alerts
    },
    table: {
        width: '100%',
        borderCollapse: 'separate', 
        borderSpacing: '0',
    },
    tableHead: {
        backgroundColor: '#F3F4F6', 
    },
    th: {
        padding: '14px 20px',
        textAlign: 'left',
        color: '#374151',
        fontWeight: '600',
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
    },
    thContent: {
        display: 'flex',
        alignItems: 'center',
    },
    sortIcon: {
        marginLeft: '5px',
    },
    tr: {
        borderTop: '1px solid #E5E7EB',
        transition: 'background-color 0.15s',
    },
    td: {
        padding: '14px 20px',
        fontSize: '14px',
        color: '#4B5563',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
    },
    tdActions: {
        padding: '14px 20px',
        display: 'flex',
        gap: '10px',
        whiteSpace: 'nowrap',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#F3F4F6',
        }
    },
    noResults: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6B7280',
        fontSize: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
    },
    badgeUser: {
        backgroundColor: '#EFF6FF', 
        color: '#1D4ED8',
        padding: '4px 10px',
        borderRadius: '9999px', 
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    badgeAdmin: {
        backgroundColor: '#FEF2F2', 
        color: '#DC2626',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },
    // NEW: Success Alert Styles
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
    // Existing Error Alert Style (copied from previous turn if available, or defined here)
    errorAlert: {
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8d7da', 
        color: '#842029', 
        border: '1px solid #f5c2c7',
        borderRadius: '8px',
        fontWeight: 600,
        textAlign: 'center',
    },
};

export default AdminUsersPage;