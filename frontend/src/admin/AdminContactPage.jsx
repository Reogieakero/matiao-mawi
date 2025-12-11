import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Trash2, Mail, CheckCircle, X
} from 'lucide-react'; 

const API_BASE_URL = 'http://localhost:5000/api'; 

const SuccessAlert = ({ message, style }) => {
    if (!message) return null;
    return (
        <div style={{...styles.successAlert, ...style}}>
            <CheckCircle size={20} style={{ marginRight: '10px' }} />
            {message}
        </div>
    );
};

const DeleteConfirmationModal = ({ show, message, onConfirm, onCancel }) => {
    if (!show || !message) return null;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.header}>Confirm Deletion</h3>
                <p style={modalStyles.body}>
                    Are you sure you want to permanently delete this contact message: 
                    <strong style={{ display: 'block', marginTop: '5px' }}>Subject: {message.subject} (ID: {message.id})</strong>?
                </p>
                <p style={modalStyles.warning}>
                    ⚠️ This action is irreversible. The message will be permanently removed from the database.
                </p>
                <div style={modalStyles.footer}>
                    <button onClick={onCancel} style={modalStyles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={modalStyles.deleteButton}>
                        Yes, Delete Message
                    </button>
                </div>
            </div>
        </div>
    );
};

const MessageViewModal = ({ show, messageItem, onClose }) => {
    if (!show || !messageItem) return null;

    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={{...modalStyles.modal, maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
                <div style={viewModalStyles.header}>
                    <h3 style={viewModalStyles.title}>Full Message: {messageItem.subject}</h3>
                    <button onClick={onClose} style={viewModalStyles.closeButton}>
                        <X size={20} />
                    </button>
                </div>
                
                <div style={viewModalStyles.details}>
                    <p style={viewModalStyles.detailItem}>
                        <strong>From:</strong> {messageItem.full_name} 
                        {messageItem.user_id && <span style={styles.badgeUser}>User</span>}
                    </p>
                    <p style={viewModalStyles.detailItem}>
                        <strong>Email:</strong> {messageItem.email_address}
                    </p>
                    <p style={viewModalStyles.detailItem}>
                        <strong>Date Submitted:</strong> {messageItem.created_at}
                    </p>
                </div>

                <div style={viewModalStyles.messageBody}>
                    <h4 style={viewModalStyles.messageTitle}>Message Content:</h4>
                    <p style={viewModalStyles.messageText}>
                        {messageItem.message}
                    </p>
                </div>
                
                <div style={modalStyles.footer}>
                    <button onClick={onClose} style={modalStyles.cancelButton}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminContactPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null); 
    const [successMessage, setSuccessMessage] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMessageForView, setSelectedMessageForView] = useState(null); 

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/contact-messages`);
            setMessages(response.data);
            setSuccessMessage(null); 
        } catch (err) {
            console.error("Error fetching contact messages:", err);
            setError('Failed to load contact messages from the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const filteredAndSortedMessages = useMemo(() => {
        let currentMessages = [...messages];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            currentMessages = currentMessages.filter(message =>
                message.full_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                message.email_address.toLowerCase().includes(lowerCaseSearchTerm) ||
                message.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
                message.message.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        currentMessages.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : comparison * -1;
        });

        return currentMessages;
    }, [messages, searchTerm, sortColumn, sortDirection]);

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? <ChevronUp size={14} style={styles.sortIcon} /> : <ChevronDown size={14} style={styles.sortIcon} />;
    };

    const openDeleteModal = (message) => {
        setMessageToDelete(message);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;
        const messageId = messageToDelete.id;
        const messageSubject = messageToDelete.subject;
        setShowDeleteModal(false);
        setLoading(true);

        try {
            await axios.delete(`${API_BASE_URL}/admin/contact-messages/${messageId}`);
            setSuccessMessage(`Message with subject "${messageSubject}" deleted successfully.`);
            await fetchMessages(); 
            setTimeout(() => { setSuccessMessage(null); }, 5000);
        } catch (err) {
            console.error(`Error deleting message ${messageId}:`, err);
            const err_msg = `Failed to delete message with subject "${messageSubject}". Check server logs.`;
            setError(err_msg);
            setTimeout(() => { setError(prev => (prev === err_msg ? null : prev)); }, 5000);
        } finally {
            setLoading(false);
            setMessageToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMessageToDelete(null);
    };

    const openViewModal = (message) => {
        setSelectedMessageForView(message);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedMessageForView(null);
    };
    
    const MessagePreview = ({ content }) => {
        const MAX_LENGTH = 100;
        return (
            <span title={content}>
                {content.length > MAX_LENGTH 
                    ? content.substring(0, MAX_LENGTH) + '...'
                    : content}
            </span>
        );
    };


    if (loading && messages.length === 0) return <div style={styles.center}><p style={{ color: '#2563eb', fontSize: '18px' }}>🚀 Loading Contact Messages...</p></div>;
    

    return (
        <div style={styles.container}>
            <DeleteConfirmationModal 
                show={showDeleteModal}
                message={messageToDelete}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            <MessageViewModal
                show={isViewModalOpen}
                messageItem={selectedMessageForView}
                onClose={handleCloseViewModal}
            />

            <h1 style={styles.pageTitle}>Contact Messages</h1>
            <p style={styles.subtitle}>Manage all issues, feedback, and reports submitted by users. Total: {messages.length}</p>

            {successMessage && <SuccessAlert message={successMessage} style={{ marginBottom: '20px' }} />}
            {error && <div style={styles.errorAlert}>{error}</div>}
            
            <div style={styles.header}>
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name, email, subject, or message content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            <div style={styles.tableWrapper}>
                {loading && messages.length > 0 && <div style={styles.overlay}><p style={{ color: '#2563eb' }}>Updating List...</p></div>}
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.tableHeader} onClick={() => handleSort('created_at')}>
                                <div style={styles.headerContent}>
                                    Date <SortIcon column="created_at" />
                                </div>
                            </th>
                            <th style={styles.tableHeader} onClick={() => handleSort('full_name')}>
                                <div style={styles.headerContent}>
                                    Sender <SortIcon column="full_name" />
                                </div>
                            </th>
                            <th style={styles.tableHeader} onClick={() => handleSort('email_address')}>
                                <div style={styles.headerContent}>
                                    Email <SortIcon column="email_address" />
                                </div>
                            </th>
                            <th style={styles.tableHeader} onClick={() => handleSort('subject')}>
                                <div style={styles.headerContent}>
                                    Subject <SortIcon column="subject" />
                                </div>
                            </th>
                            <th style={styles.tableHeader} onClick={() => handleSort('message')}>
                                <div style={styles.headerContent}>
                                    Message Preview <SortIcon column="message" />
                                </div>
                            </th>
                            <th style={styles.tableHeader}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedMessages.length > 0 ? (
                            filteredAndSortedMessages.map((message) => (
                                <tr key={message.id}>
                                    <td style={styles.tableData}>{message.created_at}</td>
                                    <td style={styles.tableData}>{message.full_name} {message.user_id && <span style={styles.badgeUser} title={`User ID: ${message.user_id}`}>User</span>}</td>
                                    <td style={styles.tableData}>{message.email_address}</td>
                                    <td style={styles.tableData}><strong>{message.subject}</strong></td>
                                    <td style={{...styles.tableData, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                        <MessagePreview content={message.message} />
                                    </td>
                                    <td style={styles.tableDataActions}>
                                        <button 
                                            onClick={() => openDeleteModal(message)} 
                                            style={styles.actionButton(true)}
                                            title="Delete Message"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => openViewModal(message)} 
                                            style={styles.actionButton(false)}
                                            title="View Full Message"
                                        >
                                            <Mail size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{...styles.tableData, textAlign: 'center', padding: '20px'}}>
                                    {searchTerm ? 'No contact messages match your search criteria.' : 'No contact messages found in the database.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {filteredAndSortedMessages.length === 0 && !searchTerm && !loading && (
                 <div style={styles.emptyState}>
                    <Mail size={40} style={{ color: '#9CA3AF' }}/>
                    <p>No contact messages have been submitted yet.</p>
                </div>
            )}
            
        </div>
    );
};

const viewModalStyles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '15px',
        marginBottom: '15px',
    },
    title: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#6B7280',
        cursor: 'pointer',
        padding: '5px',
    },
    details: {
        backgroundColor: '#F3F4F6',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #E5E7EB',
    },
    detailItem: {
        fontSize: '14px',
        color: '#4B5563',
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
    },
    messageBody: {
        marginBottom: '20px',
    },
    messageTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: '10px',
    },
    messageText: {
        fontSize: '15px',
        color: '#4B5563',
        whiteSpace: 'pre-wrap', 
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
    }
};

const styles = {
    container: {
        padding: '30px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB', 
        position: 'relative',
    },
    center: { 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
    },
    pageTitle: { 
        fontSize: '28px',
        fontWeight: '800',
        color: '#1F2937', 
        marginBottom: '5px',
    },
    subtitle: { 
        fontSize: '16px',
        color: '#6B7280', 
        marginBottom: '20px',
    },
    header: {  
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    searchContainer: { 
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        padding: '8px 15px',
        width: '400px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    searchIcon: { 
        color: '#6B7280',
        marginRight: '10px',
    },
    searchInput: { 
        border: 'none',
        outline: 'none',
        fontSize: '15px',
        width: '100%',
    },
    tableWrapper: {  
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflowX: 'auto',
        border: '1px solid #E5E7EB',
        position: 'relative',
    },
    table: { 
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
    },
    tableHeader: {
        padding: '15px',
        textAlign: 'left',
        backgroundColor: '#F3F4F6', 
        color: '#374151', 
        fontWeight: '700',
        cursor: 'pointer',
        userSelect: 'none',
        borderBottom: '2px solid #E5E7EB',
        whiteSpace: 'nowrap',
    },
    headerContent: { 
        display: 'flex',
        alignItems: 'center',
    },
    sortIcon: { 
        marginLeft: '5px',
        color: '#4B5563',
    },
    tableData: { 
        padding: '15px',
        borderBottom: '1px solid #E5E7EB',
        color: '#4B5563', 
        fontSize: '15px',
    },
    tableDataActions: {
        padding: '15px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        whiteSpace: 'nowrap',
    },
    actionButton: (isDelete) => ({ 
        backgroundColor: isDelete ? '#FEE2E2' : '#EFF6FF', 
        color: isDelete ? '#DC2626' : '#1D4ED8',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }),
    badgeUser: { 
        backgroundColor: '#EFF6FF', 
        color: '#1D4ED8',
        padding: '4px 8px',
        marginLeft: '8px',
        borderRadius: '9999px', 
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emptyState: {
        textAlign: 'center',
        padding: '50px',
        color: '#6B7280',
        fontSize: '16px',
    },
    successAlert: { 
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#D1FAE5', 
        color: '#047857', 
        border: '1px solid #6EE7B7',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginBottom: '15px',
    },
    errorAlert: { 
        padding: '15px',
        backgroundColor: '#FEE2E2', 
        color: '#991B1B', 
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '15px',
        marginBottom: '15px',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: '12px',
    }
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
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        maxHeight: '90vh',
        overflowY: 'auto',
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
        marginTop: '20px',
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#E5E7EB',
        color: '#374151',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
    deleteButton: {
        padding: '10px 20px',
        backgroundColor: '#DC2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    }
};

export default AdminContactPage;