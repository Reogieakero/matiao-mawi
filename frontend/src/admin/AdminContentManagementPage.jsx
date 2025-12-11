
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Eye, MessageSquare, Briefcase, FileText, CheckCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api'; 

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const SuccessAlert = ({ message, style }) => {
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

const selectBaseStyles = {
    label: { color: '#374151', marginBottom: '5px', marginTop: '10px', fontWeight: '600', fontSize: '14px', },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB', 
        borderRadius: '8px',
        fontSize: '16px',
        boxSizing: 'border-box',
        outline: 'none',
        backgroundColor: '#FFFFFF', 
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ':focus': {
            borderColor: '#6366F1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            outline: 'none',
        }
    },
};

const CustomSelect = ({ label, name, value, options, onChange, required = false, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(options.findIndex(opt => opt === value));
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex + 1) % options.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prevIndex => (prevIndex - 1 + options.length) % options.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const selectedValue = options[activeIndex];
                if (selectedValue) {
                    onChange({ target: { name, value: selectedValue } });
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                if (containerRef.current) {
                    containerRef.current.querySelector('button').focus();
                }
                break;
            default:
                break;
        }
    }, [isOpen, options, activeIndex, name, onChange]);

    useEffect(() => {
        setActiveIndex(options.findIndex(opt => opt === value));
    }, [options, value]);

    const handleSelect = (selectedValue) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        if (containerRef.current) {
            containerRef.current.querySelector('button').focus();
        }
    };

    const selectDisplayStyles = {
        ...selectBaseStyles.input,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        color: value && options.includes(value) ? '#1F2937' : '#9CA3AF',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        marginBottom: '0', 
    };
    
    const listContainerStyles = {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        marginTop: '4px',
        borderRadius: '8px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
        border: '1px solid #E5E7EB',
        maxHeight: '200px',
        overflowY: 'auto',
    };
    
    const listItemStyles = (index) => ({
        padding: '10px 15px',
        fontSize: '15px',
        color: '#1F2937',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        backgroundColor: index === activeIndex ? '#F3F4F6' : (options[index] === value ? '#EFF6FF' : 'white'),
        fontWeight: options[index] === value ? '700' : '400',
        ':hover': {
            backgroundColor: '#F3F4F6',
        }
    });

    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'relative', 
                minWidth: '200px', 
                ...style
            }}
            onKeyDown={handleKeyDown}
        >
            <p style={{...selectBaseStyles.label, marginTop: '0', marginBottom: '5px'}}>
                {label} {required ? '*' : ''}
            </p>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={selectDisplayStyles}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Current ${label}: ${value}`}
            >
                {value || `Select ${label}...`}
                {isOpen ? <ChevronUp size={18} color="#6B7280" /> : <ChevronDown size={18} color="#6B7280" />}
            </button>

            {isOpen && (
                <div style={listContainerStyles} role="listbox">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {options.map((option, index) => (
                            <li
                                key={option}
                                role="option"
                                aria-selected={option === value}
                                style={listItemStyles(index)}
                                onClick={() => handleSelect(option)}
                                ref={(el) => {
                                    if (index === activeIndex && el && isOpen) {
                                        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                                    }
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const AdminContentManagementPage = () => {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All'); 
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [responsesError, setResponsesError] = useState(null);

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

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    const filteredAndSortedContent = useMemo(() => {
        let currentContent = [...content];

        if (filterType !== 'All') {
            const filterValue = filterType === 'Thread' ? 'Post' : filterType; 
            currentContent = currentContent.filter(item => item.content_type === filterValue);
        }

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentContent = currentContent.filter(item =>
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.author_name || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.content_type || '').toLowerCase().includes(lowerCaseQuery)
            );
        }

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
    }, [content, searchQuery, sortBy, sortDirection, filterType]); 



    const handleViewResponses = (item) => {
        setSelectedContent(item);
        setIsDetailModalOpen(true);
        fetchResponses(item.id, item.content_type); 
    };
    
    const renderSortIcon = (columnKey) => {
        if (sortBy === columnKey) {
            return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
        }
        return null;
    };

    const DetailModal = () => {
        if (!isDetailModalOpen || !selectedContent) return null;
        
        const isPost = selectedContent.content_type === 'Post';
        const typeText = isPost ? 'Thread' : 'Job Listing';
        const responsesLabel = isPost ? 'Responses' : 'Responses';
        
        const threadColor = '#BFDBFE'; 
        const jobColor = '#60A5FA'; 

        return (
            <div style={modalStyles.backdrop}>
                <div style={modalStyles.modal}>
                    <div style={modalStyles.headerContainer}>
                        <h3 style={modalStyles.header}>
                             {isPost ? <MessageSquare size={24} style={{marginRight: '10px'}} /> : <Briefcase size={24} style={{marginRight: '10px'}} />}
                            {selectedContent.title} 
                            <span style={styles.badge(isPost ? threadColor : jobColor)}>
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

                </div>
            </div>
        );
    };

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Content Management</h1>
            <p style={styles.pageSubtitle}>Manage and moderate all community threads and job listings, including their responses/applications.</p>
            {error && <p style={styles.errorText}>{error}</p>}
            
            <div style={styles.controlBar}>
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

                <div style={styles.filterContainer}> 
                    <CustomSelect 
                        label="Filter By Content Type" 
                        name="filterType" 
                        value={filterType} 
                        options={['All', 'Thread', 'Job']} 
                        onChange={(e) => setFilterType(e.target.value)} 
                        required={false}
                    />
                </div>
            </div>

            {loading ? (
                <p style={styles.loadingText}>Loading content data...</p>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                            <tr>
                                <th onClick={() => handleSort('id')} style={{...styles.tableHeaderCell, cursor: 'pointer', width: '60px'}}>
                                    ID {renderSortIcon('id')}
                                </th>
                                <th onClick={() => handleSort('title')} style={{...styles.tableHeaderCell, cursor: 'pointer'}}>
                                    Title {renderSortIcon('title')}
                                </th>
                                <th onClick={() => handleSort('author_name')} style={{...styles.tableHeaderCell, cursor: 'pointer', width: '150px'}}>
                                    Author {renderSortIcon('author_name')}
                                </th>
                                <th onClick={() => handleSort('content_type')} style={{...styles.tableHeaderCell, cursor: 'pointer', width: '120px'}}>
                                    Type {renderSortIcon('content_type')}
                                </th>
                                <th onClick={() => handleSort('created_at')} style={{...styles.tableHeaderCell, cursor: 'pointer', width: '150px'}}>
                                    Posted On {renderSortIcon('created_at')}
                                </th>
                                <th style={{...styles.tableHeaderCell, width: '100px', textAlign: 'center'}}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedContent.map(item => (
                                <tr key={item.id} style={styles.tableRow}>
                                    <td style={styles.tableData}>{item.id}</td>
                                    <td style={{...styles.tableData, fontWeight: '600'}}>{item.title}</td>
                                    <td style={styles.tableData}>{item.author_name || 'N/A'}</td>
                                    <td style={styles.tableData}>
                                        <span style={styles.badge(item.content_type === 'Post' ? '#BFDBFE' : '#60A5FA')}>
                                            {item.content_type === 'Post' ? 'Thread' : 'Job'}
                                        </span>
                                    </td>
                                    <td style={styles.tableData}>{formatDate(item.created_at)}</td>
                                    <td style={{...styles.tableData, textAlign: 'center'}}>
                                        <button 
                                            onClick={() => handleViewResponses(item)}
                                            style={styles.actionButton}
                                            title="View Responses"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredAndSortedContent.length === 0 && (
                         <div style={styles.noResults}>
                            <p>No content found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}
            
            <DetailModal />
        </div>
    );
};

const styles = {
    pageContainer: {
        padding: '30px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB',
    },
    pageTitle: {
        color: '#1F2937',
        marginBottom: '5px',
        fontSize: '28px',
        fontWeight: '700',
    },
    pageSubtitle: {
        color: '#6B7280',
        fontSize: '15px',
        marginBottom: '20px',
    },
    errorText: {
        textAlign: 'center',
        padding: '15px',
        fontSize: '16px',
        color: '#DC2626',
        backgroundColor: '#FEE2E2',
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        fontWeight: '500',
        marginBottom: '20px',
    },
    loadingText: {
        textAlign: 'center',
        padding: '20px',
        fontSize: '16px',
        color: '#4B5563',
    },

    controlBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end', 
        marginBottom: '20px',
        gap: '20px'
    },
    searchContainer: { 
        position: 'relative', 
        flexGrow: 1, 
        maxWidth: '400px',
    },
    searchIcon: { 
        position: 'absolute', 
        top: '50%', 
        left: '12px', 
        transform: 'translateY(-50%)', 
        color: '#9CA3AF',
    },
    searchInput: { 
        width: '100%', 
        padding: '10px 10px 10px 40px', 
        border: '1px solid #D1D5DB', 
        borderRadius: '8px', 
        fontSize: '16px', 
        boxSizing: 'border-box', 
        outline: 'none',
    },
    filterContainer: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
    }, 
    tableContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        backgroundColor: '#F3F4F6',
    },
    tableHeaderCell: {
        padding: '12px 20px',
        textAlign: 'left',
        color: '#4B5563',
        fontSize: '14px',
        fontWeight: '700',
        textTransform: 'uppercase',
        borderBottom: '2px solid #E5E7EB',
    },
    tableRow: {
        borderBottom: '1px solid #E5E7EB',
        transition: 'background-color 0.1s',
        ':hover': {
            backgroundColor: '#F9FAFB',
        }
    },
    tableData: {
        padding: '12px 20px',
        fontSize: '15px',
        color: '#374151',
    },
    actionButton: {
        backgroundColor: '#FEF3C7', 
        color: '#F59E0B',
        border: 'none',
        borderRadius: '50%',
        padding: '8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, transform 0.1s',
        ':hover': {
            backgroundColor: '#FDE68A', 
            transform: 'scale(1.05)'
        },
        marginRight: '8px',
    },
    badge: (color) => ({
        padding: '4px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: color,
        color: '#1E40AF', 
        opacity: 0.9,
    }),
    noResults: {
        textAlign: 'center',
        padding: '40px',
        color: '#6B7280',
        fontSize: '16px',
    },
    contentDetailMeta: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '15px',
        borderBottom: '1px dashed #E5E7EB',
        paddingBottom: '10px',
    },
    contentDetailBody: {
        fontSize: '16px',
        color: '#1F2937',
        marginBottom: '20px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap', 
        maxHeight: '200px',
        overflowY: 'auto',
        paddingRight: '10px',
    },
    divider: {
        border: '0',
        height: '1px',
        backgroundColor: '#E5E7EB',
        margin: '20px 0',
    },
    responsesHeader: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
    },
    responsesListContainer: {
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '10px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        backgroundColor: '#F9FAFB',
    },
    responseItem: {
        padding: '15px',
        borderBottom: '1px solid #E5E7EB',
        borderRadius: '6px',
        backgroundColor: '#FFFFFF',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    responseHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
    },
    responseAuthor: {
        fontSize: '15px',
        color: '#1F2937',
        fontWeight: '600',
    },
    responseDate: {
        fontSize: '12px',
        color: '#9CA3AF',
    },
    responseBody: {
        fontSize: '14px',
        color: '#4B5563',
        margin: '0',
    },
    noResponsesText: {
        textAlign: 'center',
        padding: '20px',
        color: '#6B7280',
        fontSize: '15px',
    },
};

const modalStyles = {
    backdrop: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000, 
    },
    modal: { 
        backgroundColor: '#FFFFFF', 
        padding: '30px', 
        borderRadius: '12px', 
        width: '90%', 
        maxWidth: '750px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        maxHeight: '90vh', 
        overflowY: 'auto', 
        position: 'relative', 
    },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px',
    },
    header: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1F2937',
        margin: '0',
        display: 'flex',
        alignItems: 'center',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '30px',
        color: '#9CA3AF',
        cursor: 'pointer',
        lineHeight: '1',
        padding: '0 5px',
        transition: 'color 0.2s',
        ':hover': {
            color: '#4B5563',
        },
    },
};

export default AdminContentManagementPage;