// frontend/src/admin/AdminDocumentsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Eye, FileText, User, 
    Calendar, Phone, Mail, MapPin, CheckCircle, XCircle, RefreshCcw, Loader, HardDrive, Download 
} from 'lucide-react';

// NOTE: Ensure this matches your actual API base URL.
const API_BASE_URL = 'http://localhost:5000/api'; 

// --- Utility Function: Format Date ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// --- Constants for Status, Document Types, and Forms ---
const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'];
const DOCUMENT_TYPES = [
    'All', 
    'Barangay Clearance', 
    'Certificate of Indigency', 
    'Business Permit Endorsement', 
    'Certificate of Residency'
];

// NEW CONSTANT: Map document types to available form templates (used by SelectFormModal)
const SELECTABLE_FORMS = {
    'Barangay Clearance': 'barangay_clearance_template.pdf',
    'Certificate of Indigency': 'certificate_of_indigency.pdf',
    'Business Permit Endorsement': 'business_permit_endorsement_template.pdf',
    'Certificate of Residency': 'certificate_of_residency_template.pdf',
};

// --- Helper for Status Styling ---
const getStatusBadge = (status) => {
    let backgroundColor, color;
    switch (status) {
        case 'Completed': backgroundColor = '#D1FAE5'; color = '#059669'; break; 
        case 'Approved': backgroundColor = '#DBEAFE'; color = '#2563EB'; break; 
        case 'Rejected': backgroundColor = '#FEE2E2'; color = '#DC2626'; break; 
        case 'Cancelled': backgroundColor = '#E5E7EB'; color = '#6B7280'; break; 
        case 'Pending': default: backgroundColor = '#FEF3C7'; color = '#F59E0B'; break; 
    }
    return { backgroundColor, color, padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', display: 'inline-block', letterSpacing: '0.5px' };
};

// --- Shared Styles (Inline styles) ---
const styles = {
    container: { padding: '20px', minHeight: '100vh', backgroundColor: 'white' }, 
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px',},
    controls: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', padding: '10px 0', borderBottom: '1px solid #E5E7EB' }, 
    searchContainer: { position: 'relative', maxWidth: '300px' }, 
    searchInput: { width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', transition: 'border-color 0.3s', outline: 'none' }, 
    searchIcon: { position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#6B7280' },
    select: { padding: '10px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: 'white', fontSize: '15px', minWidth: '160px', outline: 'none' }, 
    tableWrapper: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)', overflowX: 'auto', border: '1px solid #E5E7EB' }, 
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0' },
    th: { backgroundColor: '#F9FAFB', color: '#4B5563', fontWeight: '600', padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 },
    td: { padding: '15px', borderBottom: '1px solid #E5E7EB', color: '#374151', fontSize: '14px' },
    rowHover: { transition: 'background-color 0.2s' }, 
    actionButton: (color) => ({ padding: '8px 14px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', marginRight: '8px', transition: 'background-color 0.2s', outline: 'none' }),
    statusBadge: getStatusBadge, // Use the helper function here
    noResults: { textAlign: 'center', padding: '40px', fontSize: '16px', color: '#6B7280' },
    error: { padding: '15px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #FCA5A5', marginBottom: '15px' }
};

// --- Modals (Used internally by the main component) ---

const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;
    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)' },
        icon: { color: isSuccess ? '#10B981' : '#EF4444', marginBottom: '15px' },
        title: { fontSize: '22px', fontWeight: '700', marginBottom: '10px', color: '#1F2937' },
        body: { fontSize: '16px', color: '#4B5563', marginBottom: '25px' },
        button: { padding: '10px 20px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s' }
    };
    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                {isSuccess ? <CheckCircle size={48} style={modalStyles.icon} /> : <XCircle size={48} style={modalStyles.icon} />}
                <div style={modalStyles.title}>{title}</div>
                <div style={modalStyles.body}>{body}</div>
                <button style={modalStyles.button} onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

const DocumentViewModal = ({ show, document, onClose }) => {
    if (!show || !document) return null;

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '28px', fontWeight: '800', color: '#1F2937', marginBottom: '25px', borderBottom: '3px solid #4F46E5', paddingBottom: '10px', display: 'flex', alignItems: 'center' },
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '18px', fontSize: '16px' },
        label: { fontWeight: '700', color: '#374151', display: 'flex', alignItems: 'center', gap: '10px' },
        value: { color: '#374151' },
        sectionTitle: { fontSize: '20px', fontWeight: '700', color: '#4F46E5', marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid #E5E7EB', paddingBottom: '5px' },
        list: { listStyleType: 'none', marginLeft: '0', paddingLeft: '0' },
        listItem: { marginBottom: '8px' },
        fileLink: { color: '#2563EB', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
    };

    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <FileText size={32} style={{ marginRight: '10px' }}/> Request for: {document.documentType}
                </div>
                
                <div style={modalStyles.infoGrid}>
                    <div style={modalStyles.label}><User size={18} />Full Name:</div>
                    <div style={modalStyles.value}>{document.fullName}</div>
                    
                    <div style={modalStyles.label}><Calendar size={18} />Date Requested:</div>
                    <div style={modalStyles.value}>{formatDate(document.dateRequested)}</div>
                    
                    <div style={modalStyles.label}><Mail size={18} />Email:</div>
                    <div style={modalStyles.value}>{document.user_email}</div>
                    
                    <div style={modalStyles.label}><CheckCircle size={18} />Status:</div>
                    <div style={modalStyles.value}>
                        <span style={styles.statusBadge(document.status)}>{document.status}</span>
                    </div>
                </div>

                <div style={modalStyles.sectionTitle}>Purpose of Document</div>
                <div style={modalStyles.value}>{document.purpose || '*Not specified*'}</div>

                <div style={modalStyles.sectionTitle}>Payment Details</div>
                <div style={{ ...modalStyles.infoGrid, gridTemplateColumns: '1fr 1fr' }}>
                    <div style={modalStyles.label}>Method:</div>
                    <div style={modalStyles.value}>{document.payment_method || 'N/A'}</div>
                    <div style={modalStyles.label}>Ref. Number:</div>
                    <div style={modalStyles.value}>{document.payment_reference_number || 'N/A'}</div>
                </div>

                <div style={modalStyles.sectionTitle}>Requirements Details/Notes</div>
                <div style={modalStyles.value}>{document.requirements_details || '*None provided*'}</div>

                <div style={modalStyles.sectionTitle}>Uploaded Requirements</div>
                {document.requirementsFilePaths && document.requirementsFilePaths.length > 0 ? (
                    <ul style={modalStyles.list}>
                        {document.requirementsFilePaths.map((path, index) => (
                            <li key={index} style={modalStyles.listItem}>
                                <a 
                                    // Assuming path is a public URL (e.g., /uploads/file.pdf)
                                    href={path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={modalStyles.fileLink}
                                >
                                    <FileText size={16}/> View Requirement File #{index + 1}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={modalStyles.value}>*No files uploaded.*</div>
                )}
                
                {/* Display link to the generated document if approved (Relies on server returning the path on fetch) */}
                {document.status === 'Approved' && document.generatedDocumentPath && (
                    <div style={{...modalStyles.sectionTitle, color: '#059669'}}>Generated Document</div>
                    
                )}

                <div style={{ textAlign: 'right', marginTop: '30px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                    <button style={styles.actionButton('#6B7280')} onClick={onClose}>Close Details</button>
                </div>
            </div>
        </div>
    );
};

// NEW MODAL: For selecting the form template when approving
const SelectFormModal = ({ show, document, onClose, onSelect }) => {
    
    const [loading, setLoading] = useState(false);
    
    // Determine available forms based on document type
    const availableForms = SELECTABLE_FORMS[document?.documentType] 
                            ? [SELECTABLE_FORMS[document.documentType]]
                            : Object.values(SELECTABLE_FORMS);
                            
    const [selectedForm, setSelectedForm] = useState(availableForms[0] || '');

    useEffect(() => {
        if (show && document) {
            const defaultForm = SELECTABLE_FORMS[document.documentType] || availableForms[0] || '';
            setSelectedForm(defaultForm);
        }
    }, [show, document, availableForms]);

    if (!show || !document) return null;

    const handleSelect = async () => {
        if (!selectedForm) return;
        setLoading(true);
        // Pass the document ID and the selected form file name to the main component handler
        await onSelect(document.id, selectedForm); 
        // Note: Loading state is managed by the parent component's onSelect handler
        // The parent component handles setting setLoading(false) after the operation.
    };

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '22px', fontWeight: '700', color: '#1F2937', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
        subHeader: { color: '#6B7280', marginBottom: '25px', fontSize: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '16px' },
        select: { width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '16px', marginBottom: '30px', outline: 'none' },
        buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: (color) => ({ 
            padding: '10px 15px', 
            backgroundColor: color, 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: '600', 
            cursor: 'pointer', 
            transition: 'background-color 0.2s' 
        }),
    };
    
    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>
                    <HardDrive size={24}/> Select Form Template
                </div>
                <div style={modalStyles.subHeader}>
                    Approve Request for: **{document.fullName}** | Document Type: **{document.documentType}**
                </div>

                <label style={modalStyles.label}>
                    Select PDF Template:
                    <select
                        style={modalStyles.select}
                        value={selectedForm}
                        onChange={(e) => setSelectedForm(e.target.value)}
                        disabled={loading}
                    >
                        {availableForms.map(form => (
                            <option key={form} value={form}>{form}</option>
                        ))}
                    </select>
                </label>
                
                <div style={modalStyles.buttonContainer}>
                    <button style={modalStyles.button('#6B7280')} onClick={onClose} disabled={loading}>Cancel</button>
                    <button 
                        style={modalStyles.button('#4F46E5')} 
                        onClick={handleSelect} 
                        disabled={loading || !selectedForm} 
                    >
                        {loading ? <Loader size={18} className="spinner" /> : <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16}/> Approve & Generate</div>}
                    </button>
                </div>
            </div>
        </div>
    );
};


const UpdateStatusModal = ({ show, document, onClose, onUpdate, onApprove }) => {
    const [newStatus, setNewStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && document) {
            setNewStatus(document.status);
        }
    }, [show, document]);

    if (!show || !document) return null;

    const handleSave = async () => {
        if (!newStatus || newStatus === document.status) {
            onClose(); 
            return;
        }

        // Intercept 'Approved' status to trigger form selection
        if (newStatus === 'Approved') {
            onApprove(document, 'Approved'); // Triggers SelectFormModal
            onClose();
            return;
        }
        
        setLoading(true);
        await onUpdate(document.id, newStatus); // For all other status changes (Pending, Rejected, Completed)
        setLoading(false);
    };

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '22px', fontWeight: '700', color: '#1F2937', marginBottom: '10px' },
        subHeader: { color: '#6B7280', marginBottom: '25px', fontSize: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '16px' },
        select: { width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '16px', marginBottom: '30px', outline: 'none' },
        buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: (color) => ({ 
            padding: '10px 15px', 
            backgroundColor: color, 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: '600', 
            cursor: 'pointer', 
            transition: 'background-color 0.2s' 
        }),
    };

    const updatableStatusOptions = STATUS_OPTIONS.filter(s => s !== 'All' && s !== 'Cancelled');
    
    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>Update Status for Document #{document.id}</div>
                <div style={modalStyles.subHeader}>Applicant: {document.fullName} | Current Status: <span style={styles.statusBadge(document.status)}>{document.status}</span></div>

                <label style={modalStyles.label}>
                    New Status:
                    <select
                        style={modalStyles.select}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                    >
                        {updatableStatusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </label>
                
                <div style={modalStyles.buttonContainer}>
                    <button style={modalStyles.button('#6B7280')} onClick={onClose} disabled={loading}>Cancel</button>
                    <button 
                        style={modalStyles.button(newStatus === 'Approved' ? '#4F46E5' : '#10B981')} 
                        onClick={handleSave} 
                        disabled={loading || newStatus === document.status} 
                    >
                        {loading ? <Loader size={18} className="spinner" /> : newStatus === 'Approved' ? 'Continue to Form Selection' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const AdminDocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'dateRequested', direction: 'descending' });

    // Modals state
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });
    const [viewModal, setViewModal] = useState({ show: false, document: null });
    const [statusModal, setStatusModal] = useState({ show: false, document: null });
    const [selectFormModal, setSelectFormModal] = useState({ show: false, document: null, newStatus: null });


    // --- Data Fetching ---
    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/documents`);
            // Assuming the server returns an array of applications with user info joined
            setDocuments(response.data);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Failed to fetch document applications. Check network or server logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // --- Status Update Logic for non-Approved statuses ---
    const confirmStatusUpdate = async (documentId, newStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/documents/update-status/${documentId}`, { newStatus });

            // Update local state
            setDocuments(prevDocs => 
                prevDocs.map(doc => 
                    doc.id === documentId ? { ...doc, status: newStatus } : doc
                )
            );

            setMessageModal({
                show: true,
                title: 'Success!',
                body: `Document #${documentId} status updated to **${newStatus}**.`,
                isSuccess: true,
            });
        } catch (err) {
            console.error('Error updating status:', err);
            setMessageModal({
                show: true,
                title: 'Update Failed',
                body: err.response?.data?.message || 'Could not update document status. Please try again.',
                isSuccess: false,
            });
        } finally {
            setStatusModal({ show: false, document: null });
        }
    };
    
    // NEW LOGIC: Trigger Form Selection Modal
    const handleStatusApprove = (document, newStatus) => {
        setSelectFormModal({ show: true, document, newStatus });
    };

    // NEW CORE LOGIC: Finalize Approval and Document Generation (Direct Download)
    const generateDocumentAndApprove = async (documentId, selectedFormTemplate) => {
        setSelectFormModal({ show: false, document: null, newStatus: null });
        setLoading(true);
        
        try {
            // 1. Send request, expecting a binary file response (Blob/Buffer)
            // CRITICAL CORRECTION: Using the ID in the URL path (matching the backend route)
            const response = await axios.post(
                `${API_BASE_URL}/admin/documents/generate-and-approve/${documentId}`, 
                {
                    templateFileName: selectedFormTemplate, 
                    newStatus: 'Approved' // Optional data to send, main data is templateFileName
                },
                {
                    // CRUCIAL: Tell axios to expect a binary file (PDF blob)
                    responseType: 'blob', 
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            // 2. Extract filename from headers (sent by server.js) or default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${documentId}_generated_document.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/i);
                if (match && match[1]) {
                    // Remove surrounding quotes and trim
                    fileName = match[1].replace(/['"]/g, '').trim(); 
                }
            }

            // 3. Handle the file download in the browser (using Blob)
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            
            // Automatically trigger the download
            document.body.appendChild(link);
            link.click();
            
            link.remove();
            window.URL.revokeObjectURL(url);
            
            // 4. Update the table status after successful generation and download
            // Calling fetchDocuments() ensures the table state is synchronized with the database
            await fetchDocuments(); 
            
            setMessageModal({
                show: true,
                title: 'Document Approved & Generated! ✅',
                body: `Document **#${documentId}** approved. File **${fileName}** downloaded successfully.`,
                isSuccess: true,
            });

        } catch (error) {
            console.error('Error generating document:', error);
            
            let errorMessage = 'Could not generate and approve document. Please check the server logs.';
            
            // KEY FIX: If an error response is a Blob (due to responseType: 'blob'), read its contents as text/JSON.
            if (error.response && error.response.data instanceof Blob) {
                const errorText = await error.response.data.text();
                try {
                    // Try to parse the text as JSON (as the server is expected to send JSON errors)
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch { 
                    // If parsing fails, use the raw error text
                    console.warn("Server error response was a Blob but not valid JSON.");
                    errorMessage = errorText || errorMessage;
                }
            } else if (error.response?.data?.message) {
                 // Fallback for non-blob JSON errors
                 errorMessage = error.response.data.message;
            }

            setMessageModal({
                show: true,
                title: 'Generation Failed ❌',
                body: errorMessage,
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    };


    // --- Filtering and Sorting ---
    const sortedDocuments = useMemo(() => {
        let sortableItems = [...documents];
        
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key.includes('date')) {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

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
    }, [documents, sortConfig]);

    const filteredDocuments = useMemo(() => {
        
        return sortedDocuments.filter(doc => {
            const matchesSearch = doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (doc.user_email && doc.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (doc.purpose && doc.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
            const matchesType = typeFilter === 'All' || doc.documentType === typeFilter;
            
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [sortedDocuments, searchTerm, statusFilter, typeFilter]);

    // --- UI/Helper Functions ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    // --- Render ---
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Document Applications</h1>
                <button style={styles.actionButton('#4F46E5')} onClick={fetchDocuments} disabled={loading}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {loading ? <Loader size={18} className="spinner" /> : <RefreshCcw size={18} />}
                        Fetch All
                    </div>
                </button>
            </div>

            {error && (
                <div style={styles.error}>
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            <div style={styles.controls}>
                <div style={styles.searchContainer}>
                    <Search size={20} style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or purpose..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div style={{ flexGrow: 1 }} />

                <select 
                    style={styles.select} 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    {DOCUMENT_TYPES.map(type => (
                        <option key={type} value={type}>Type: {type}</option>
                    ))}
                </select>

                <select 
                    style={styles.select} 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>Status: {status}</option>
                    ))}
                </select>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th} onClick={() => requestSort('id')}>
                                ID {getSortIndicator('id')}
                            </th>
                            <th style={styles.th} onClick={() => requestSort('fullName')}>
                                Applicant Name {getSortIndicator('fullName')}
                            </th>
                            <th style={styles.th} onClick={() => requestSort('documentType')}>
                                Document Type {getSortIndicator('documentType')}
                            </th>
                            <th style={styles.th} onClick={() => requestSort('dateRequested')}>
                                Date Requested {getSortIndicator('dateRequested')}
                            </th>
                            <th style={styles.th} onClick={() => requestSort('status')}>
                                Status {getSortIndicator('status')}
                            </th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={styles.noResults}>
                                    <Loader size={20} className="spinner" style={{ marginRight: '10px' }} />
                                    Loading applications...
                                </td>
                            </tr>
                        ) : filteredDocuments.length > 0 ? (
                            filteredDocuments.map((doc) => (
                                <tr key={doc.id} style={styles.rowHover}>
                                    <td style={styles.td}>{doc.id}</td>
                                    <td style={styles.td}>{doc.fullName}</td>
                                    <td style={styles.td}>{doc.documentType}</td>
                                    <td style={styles.td}>{formatDate(doc.dateRequested)}</td>
                                    <td style={styles.td}>
                                        <span style={styles.statusBadge(doc.status)}>{doc.status}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button 
                                            style={styles.actionButton('#4F46E5')}
                                            onClick={() => setViewModal({ show: true, document: doc })}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Eye size={16} /> View</div>
                                        </button>
                                        <button 
                                            style={styles.actionButton(doc.status === 'Cancelled' ? '#9CA3AF' : (doc.status === 'Approved' ? '#059669' : '#F59E0B'))}
                                            onClick={() => setStatusModal({ show: true, document: doc })}
                                            disabled={doc.status === 'Cancelled'} 
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {doc.status === 'Approved' ? <CheckCircle size={16} /> : <RefreshCcw size={16} />} 
                                                {doc.status === 'Approved' ? 'Approved' : 'Update Status'}
                                            </div>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">
                                    <div style={styles.noResults}>
                                        No document applications found matching your criteria.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* MODALS */}
            
            <DocumentViewModal
                show={viewModal.show}
                document={viewModal.document}
                onClose={() => setViewModal({ show: false, document: null })}
            />

            <UpdateStatusModal
                show={statusModal.show}
                document={statusModal.document}
                onClose={() => setStatusModal({ show: false, document: null })}
                onUpdate={confirmStatusUpdate}
                onApprove={handleStatusApprove}
            />
            
            {/* NEW FORM SELECTION MODAL */}
            <SelectFormModal
                show={selectFormModal.show}
                document={selectFormModal.document}
                onClose={() => setSelectFormModal({ show: false, document: null, newStatus: null })}
                onSelect={generateDocumentAndApprove}
            />

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

// Simple CSS for the spinner animation
const styleSheet = document.createElement('style');
styleSheet.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`;
document.head.appendChild(styleSheet);


export default AdminDocumentsPage;