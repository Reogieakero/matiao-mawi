// frontend/src/admin/AdminUsersPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    // CHANGED: Default sort column from 'id' to 'name'
    const [sortBy, setSortBy] = useState('name'); 
    const [sortDirection, setSortDirection] = useState('asc');

    // --- Data Fetching ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Assuming your Express server runs on port 5000
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

    // --- Sorting and Filtering Logic ---
    const filteredAndSortedUsers = useMemo(() => {
        let currentUsers = [...users];

        // 1. Filtering
        if (searchTerm) {
            currentUsers = currentUsers.filter(user =>
                (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Using 'name' based on last error
                (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // 2. Sorting
        currentUsers.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
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

    const handleDelete = (userId, userName) => {
        if (window.confirm(`Are you sure you want to permanently delete user: ${userName} (ID: ${userId})?`)) {
            // NOTE: You need to implement the DELETE /api/admin/users/:id endpoint in server.js
            console.log(`[ACTION] Deleting user ${userId}... (API call needed)`);
            // Add axios.delete() call here and update state on success
        }
    };
    
    if (loading) return <div style={styles.center}><p style={{ color: '#2563eb', fontSize: '18px' }}>🚀 Loading User Data...</p></div>;
    if (error) return <div style={styles.center}><p style={{ color: '#DC2626', fontSize: '18px' }}>❌ Error: {error}</p></div>;


    return (
        <div style={styles.container}>
            {/* Title and Subtitle placement aligned with AdminDashboardPage */}
            <h1 style={styles.pageTitle}>User Management</h1>
            <p style={styles.subtitle}>
                Manage all registered users. Total: <strong style={{color: '#1F2937'}}>{users.length.toLocaleString()}</strong>
            </p>
            
            <div style={{...styles.toolbar, marginTop: '25px'}}> 
                <div style={styles.searchBox}>
                    <Search size={18} color="#6B7280" style={{ marginRight: '10px' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
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
                            <TableHeader onClick={() => handleSort('name')} sortBy={sortBy} sortKey='name' sortDirection={sortDirection}>Name</TableHeader>
                            <TableHeader onClick={() => handleSort('email')} sortBy={sortBy} sortKey='email' sortDirection={sortDirection}>Email</TableHeader>
                            <TableHeader onClick={() => handleSort('role')} sortBy={sortBy} sortKey='role' sortDirection={sortDirection}>Role</TableHeader>
                            <TableHeader onClick={() => handleSort('created_at')} sortBy={sortBy} sortKey='created_at' sortDirection={sortDirection}>Registered</TableHeader>
                            {/* REMOVED: TableHeader for Last Login */}
                            <th style={{...styles.th, cursor: 'default'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedUsers.map(user => (
                            <tr key={user.id} style={styles.tr}>
                                <td style={styles.td}>{user.name || 'N/A'}</td>
                                <td style={{...styles.td, fontWeight: '500'}}>{user.email}</td>
                                <td style={styles.td}>
                                    <span style={user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}>
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                                {/* REMOVED: Data cell for Last Login */}
                                <td style={styles.tdActions}>
                                    <button style={{...styles.actionButton, color: '#2563EB'}} title="Edit User">
                                        <Edit size={16} />
                                    </button>
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
        </div>
    );
};

// --- Sub-Component for Clean Table Header ---
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

// --- Styles Object (Updated: styles.tdDate is removed) ---
const styles = {
    container: {
        padding: '30px', 
        height: '100%', 
        overflowY: 'auto', // Allows scrolling if content is too long
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
    },
    table: {
        width: '100%',
        borderCollapse: 'separate', // Use separate for rounded corners on cells (more modern)
        borderSpacing: '0',
    },
    tableHead: {
        backgroundColor: '#F3F4F6', // Light gray background for header
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
        // Hover effect for table row (if using inline styles, would need a state)
        // ':hover': { backgroundColor: '#F9FAFB' }
    },
    td: {
        padding: '14px 20px',
        fontSize: '14px',
        color: '#4B5563',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
    },
    // REMOVED: styles.tdDate
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
        backgroundColor: '#EFF6FF', // Light blue
        color: '#1D4ED8',
        padding: '4px 10px',
        borderRadius: '9999px', // Pill shape
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    badgeAdmin: {
        backgroundColor: '#FEF2F2', // Light red
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
};

export default AdminUsersPage;