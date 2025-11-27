// frontend/src/admin/AdminContentManagementPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Eye, MessageSquare, Briefcase, FileText, CheckCircle
} from 'lucide-react';

// NOTE: Please ensure you replace this with your actual API base URL.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Utility Function: Format Date ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- Success Alert Component ---
const SuccessAlert = ({ message, style }) => {
    // Keeping SuccessAlert for potential future use or consistency, but removing usage in main component
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

// --- Main Component ---
const AdminContentManagementPage = () => {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter/Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All'); // <-- NEW FILTER STATE
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [responsesError, setResponsesError] = useState(null);

    // Alert State (Removed successMessage as deletion is removed)

    /**
     * Fetches all posts (threads) and jobs from the server.
     */
    const fetchContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/content/all`, {
                withCredentials: true 
            });
            setContent(response.data.content || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching content:', err);
            setError('Failed to load content. Please ensure the admin endpoint is correctly implemented.');
            setLoading(false);
        }
    };

    /**
     * Fetches all responses/applications for a specific content item.
     */
    const fetchResponses = async (contentId, contentType) => {
        setResponsesLoading(true);
        setResponsesError(null);
        setResponses([]);
        try {
            const endpoint = `${API_BASE_URL}/admin/content/${contentType.toLowerCase()}/responses/${contentId}`;
            const response = await axios.get(endpoint, {
                withCredentials: true
            });
            setResponses(response.data.responses || []);
            setResponsesLoading(false);
        } catch (err) {
            console.error('Error fetching responses:', err);
            setResponsesError('Failed to load responses.');
            setResponsesLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    // --- Sorting Logic ---
    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    // --- Filtering and Sorting Memoized Data ---
    const filteredAndSortedContent = useMemo(() => {
        let currentContent = [...content];

        // 1. Filtering by Content Type (NEW)
        if (filterType !== 'All') {
            // Note: 'Thread' maps to 'Post' in the DB query alias
            const filterValue = filterType === 'Thread' ? 'Post' : filterType; 
            currentContent = currentContent.filter(item => item.content_type === filterValue);
        }

        // 2. Filtering by search query
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentContent = currentContent.filter(item =>
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.author_name || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.content_type || '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 3. Sorting
        currentContent.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'created_at') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return currentContent;
    }, [content, searchQuery, sortBy, sortDirection, filterType]); // <-- Added filterType dependency


    // --- Handlers ---

    const handleViewResponses = (item) => {
        setSelectedContent(item);
        setIsDetailModalOpen(true);
        fetchResponses(item.id, item.content_type); // Pass the content type (Post/Job)
    };
    
    // NOTE: handleDeleteContent has been removed as requested.
    
    // --- Render Helper: Sort Icon ---
    const renderSortIcon = (columnKey) => {
        if (sortBy === columnKey) {
            return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
        }
        return null;
    };

    // --- Detail Modal Component ---
    const DetailModal = () => {
        if (!isDetailModalOpen || !selectedContent) return null;
        
        const isPost = selectedContent.content_type === 'Post';
        const typeText = isPost ? 'Thread' : 'Job Listing';
        const responsesLabel = isPost ? 'Responses' : 'Responses';

        return (
            <div style={modalStyles.backdrop}>
                <div style={modalStyles.modal}>
                    <div style={modalStyles.headerContainer}>
                        <h3 style={modalStyles.header}>
                             {isPost ? <MessageSquare size={24} style={{marginRight: '10px'}} /> : <Briefcase size={24} style={{marginRight: '10px'}} />}
                            {selectedContent.title} 
                            <span style={styles.badge(isPost ? '#10B981' : '#F59E0B')}>
                                {typeText}
                            </span>
                        </h3>
                        <button style={modalStyles.closeButton} onClick={() => setIsDetailModalOpen(false)}>
                            &times;
                        </button>
                    </div>

                    <p style={styles.contentDetailMeta}>
                        Author: <strong>{selectedContent.author_name || 'N/A'}</strong> | Posted on: {formatDate(selectedContent.created_at)}
                    </p>
                    {/* The content_body field is available here */}
                    <p style={styles.contentDetailBody}>{selectedContent.content_body}</p>
                    
                    <hr style={styles.divider} />
                    
                    <h4 style={styles.responsesHeader}>
                        <FileText size={20} style={{marginRight: '8px'}} />
                        {responsesLabel} ({responses.length})
                    </h4>
                    
                    <div style={styles.responsesListContainer}>
                        {responsesLoading && <p style={styles.loadingText}>Loading {responsesLabel.toLowerCase()}...</p>}
                        {responsesError && <p style={styles.errorText}>{responsesError}</p>}
                        {!responsesLoading && responses.length === 0 && !responsesError && (
                            <p style={styles.noResponsesText}>No {responsesLabel.toLowerCase()} yet for this {selectedContent.content_type.toLowerCase()}.</p>
                        )}
                        
                        {!responsesLoading && responses.map(response => (
                            <div key={response.id} style={styles.responseItem}>
                                <div style={styles.responseHeader}>
                                    <strong style={styles.responseAuthor}>{response.author_name}</strong>
                                    <span style={styles.responseDate}>{formatDate(response.created_at)}</span>
                                </div>
                                <p style={styles.responseBody}>{response.response_content}</p>
                            </div>
                        ))}
                    </div>
                    {/* Deletion button removed */}
                </div>
            </div>
        );
    };

    // --- Main Render ---
    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Content Management</h1>
            <p style={styles.pageSubtitle}>Manage and moderate all community threads and job listings, including their responses/applications.</p>
            
            {/* SuccessAlert removed */}
            {error && <p style={styles.errorText}>{error}</p>}

            <div style={styles.controlBar}>
                {/* Search Input */}
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by title, author, or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                {/* Content Type Filter (NEW) */}
                <div style={styles.filterContainer}>
                    <label style={styles.filterLabel}>Filter By:</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="All">All Content</option>
                        <option value="Thread">Threads</option>
                        <option value="Job">Job Listings</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p style={styles.loadingText}>Loading content data...</p>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th} onClick={() => handleSort('title')}>
                                    Title {renderSortIcon('title')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('content_type')}>
                                    Type {renderSortIcon('content_type')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('author_name')}>
                                    Author {renderSortIcon('author_name')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('created_at')}>
                                    Date Posted {renderSortIcon('created_at')}
                                </th>
                                <th style={styles.th} onClick={() => handleSort('response_count')}>
                                    Responses {renderSortIcon('response_count')}
                                </th>
                                <th style={{...styles.th, width: '150px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedContent.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={styles.emptyTableText}>No content found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredAndSortedContent.map((item) => (
                                    <tr key={item.id} style={styles.tr}>
                                        <td style={styles.td}>{item.id}</td>
                                        <td style={styles.td}>{item.title}</td>
                                        <td style={styles.td}>
                                            <span style={styles.badge(item.content_type === 'Post' ? '#10B981' : '#F59E0B')}>
                                                {item.content_type === 'Post' ? 'Thread' : 'Job'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{item.author_name || 'N/A'}</td>
                                        <td style={styles.td}>{formatDate(item.created_at)}</td>
                                        <td style={{...styles.td, fontWeight: '700'}}>{item.response_count}</td>
                                        <td style={styles.td}>
                                            <div style={styles.actionsCell}>
                                                <button 
                                                    style={styles.actionButton}
                                                    title={`View ${item.content_type === 'Post' ? 'Responses' : 'Applications'}`}
                                                    onClick={() => handleViewResponses(item)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {/* Delete button removed */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            <DetailModal />
        </div>
    );
};

// --- Styles (Updated for Filter) ---
const styles = {
    pageContainer: { padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh', },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px', },
    pageSubtitle: { fontSize: '16px', color: '#6B7280', marginBottom: '25px', },
    controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' },
    
    // Search Styles
    searchContainer: { position: 'relative', flexGrow: 1, maxWidth: '400px', },
    searchIcon: { position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9CA3AF', },
    searchInput: { width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', outline: 'none', },
    
    // Filter Styles (NEW)
    filterContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
    filterLabel: { fontSize: '16px', color: '#4B5563', fontWeight: '600' },
    filterSelect: { padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', outline: 'none' },

    loadingText: { textAlign: 'center', padding: '20px', fontSize: '16px', color: '#4B5563', },
    errorText: { textAlign: 'center', padding: '20px', fontSize: '16px', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', marginBottom: '20px', },
    tableContainer: { backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', overflowX: 'auto', },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', },
    tableHeader: { backgroundColor: '#F3F4F6', },
    th: { padding: '15px 20px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4B5563', cursor: 'pointer', userSelect: 'none', borderBottom: '2px solid #E5E7EB', },
    tr: { transition: 'background-color 0.1s', },
    td: { padding: '15px 20px', fontSize: '15px', color: '#374151', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', },
    actionsCell: { display: 'flex', gap: '10px', alignItems: 'center', },
    actionButton: { backgroundColor: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', },
    // actionButtonDelete and deleteButton removed
    badge: (color) => ({ backgroundColor: color === '#10B981' ? '#D1FAE5' : '#FFEDD5', color: color, padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', display: 'inline-flex', alignSelf: 'center', marginLeft: '10px' }),
    emptyTableText: { textAlign: 'center', padding: '30px', color: '#6B7280', fontSize: '16px', },
    successAlert: { display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: '#D1FAE5', color: '#047857', border: '1px solid #6EE7B7', borderRadius: '8px', fontWeight: '600', fontSize: '15px', },
    contentDetailMeta: { fontSize: '14px', color: '#6B7280', marginBottom: '15px', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' },
    contentDetailBody: { fontSize: '16px', color: '#1F2937', lineHeight: '1.6', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto', paddingRight: '10px', },
    divider: { border: 'none', borderTop: '1px solid #E5E7EB', margin: '20px 0', },
    responsesHeader: { fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '15px', display: 'flex', alignItems: 'center', },
    responsesListContainer: { maxHeight: '300px', overflowY: 'auto', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB', },
    responseItem: { padding: '15px 15px', borderBottom: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#FFFFFF', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', },
    responseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', },
    responseAuthor: { fontSize: '15px', color: '#1F2937', fontWeight: '600', },
    responseDate: { fontSize: '12px', color: '#9CA3AF', },
    responseBody: { fontSize: '14px', color: '#4B5563', margin: '0', },
    noResponsesText: { textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '15px', },
};

const modalStyles = {
    backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, },
    modal: { backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '750px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto', position: 'relative', },
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #F3F4F6', paddingBottom: '10px', },
    header: { fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', },
    closeButton: { background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#9CA3AF', padding: '5px', },
};

export default AdminContentManagementPage;