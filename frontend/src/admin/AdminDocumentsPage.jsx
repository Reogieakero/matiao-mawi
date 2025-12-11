import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Search, ChevronDown, ChevronUp, Eye, FileText, User, 
    Calendar, Mail, MapPin, CheckCircle, XCircle, RefreshCcw, Loader, HardDrive, Download 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api'; 

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'];
const DOCUMENT_TYPES = [
    'All', 
    'Barangay Clearance', 
    'Certificate of Indigency', 
    'Business Permit Endorsement', 
    'Certificate of Residency'
];

const SELECTABLE_FORMS = {
    'Barangay Clearance': 'barangay_clearance_template.pdf',
    'Certificate of Indigency': 'barangay_indigency_template.pdf',
    'Business Permit Endorsement': 'business_permit_endorsement_template.pdf',
    'Certificate of Residency': 'certificate_of_residency_template.pdf',
};

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

const styles = {
    pageContainer: { padding: '30px', backgroundColor: '#F9FAFB', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: {  fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px', },
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
    statusBadge: getStatusBadge, 
    noResults: { textAlign: 'center', padding: '40px', fontSize: '16px', color: '#6B7280' },
    error: { padding: '15px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #FCA5A5', marginBottom: '15px' }
};


const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;
    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)' },
        icon: { color: isSuccess ? '#2563eb' : '#EF4444', marginBottom: '15px' },
        title: { fontSize: '22px', fontWeight: '700', marginBottom: '10px', color: '#1F2937' },
        body: { fontSize: '16px', color: '#4B5563', marginBottom: '25px' },
        button: { padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s' }
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

const RejectReasonModal = ({ show, document, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    if (!show || !document) return null;

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '22px', fontWeight: '700', color: '#DC2626', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
        subHeader: { color: '#6B7280', marginBottom: '25px', fontSize: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '16px' },
        textarea: { width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '16px', marginBottom: '20px', minHeight: '100px', resize: 'vertical', outline: 'none' },
        buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: (color) => ({ padding: '10px 15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }),
    };

    const handleSubmit = () => {
        if (reason.trim()) {
            onSubmit(document.id, reason);
            setReason('');
        } else {
            alert('Please provide a rejection reason.');
        }
    };

    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}><XCircle size={28} />Reject Document Application</div>
                <div style={modalStyles.subHeader}>
                    You are rejecting the application for **{document.documentType}** by **{document.fullName}**. A reason is required.
                </div>
                <label style={modalStyles.label}>Rejection Reason:</label>
                <textarea
                    style={modalStyles.textarea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the specific reason for rejecting this application (e.g., Missing ID, requirements are blurry, etc.)"
                />
                <div style={modalStyles.buttonContainer}>
                    <button style={modalStyles.button('#6B7280')} onClick={() => { setReason(''); onClose(); }}>Cancel</button>
                    <button style={modalStyles.button('#DC2626')} onClick={handleSubmit}>Confirm Reject</button>
                </div>
            </div>
        </div>
    );
};

const DocumentViewModal = ({ show, document, onClose }) => {
    if (!show || !document) return null;

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '800px', width: '90%', margin: '40px 0', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)' },
        header: { fontSize: '24px', fontWeight: '800', color: '#1e40af', marginBottom: '10px' },
        closeButton: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '15px 20px', alignItems: 'center', border: '1px solid #E5E7EB', padding: '20px', borderRadius: '8px', backgroundColor: '#F9FAFB' },
        label: { fontWeight: '600', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '10px' },
        value: { color: '#374151' },
        sectionTitle: { fontSize: '20px', fontWeight: '700', color: '#1e40af', marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid #E5E7EB', paddingBottom: '5px' },
        list: { listStyleType: 'none', marginLeft: '0', paddingLeft: '0' },
        listItem: { marginBottom: '8px' },
        fileLink: { color: '#2563EB', textDecoration: 'none', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
        rejectionBox: { marginTop: '20px', padding: '15px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px' },
        rejectionTitle: { fontWeight: '700', color: '#DC2626', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' },
        rejectionReason: { color: '#DC2626' }
    };
    
    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <button style={modalStyles.closeButton} onClick={onClose}><XCircle size={24} color="#6B7280" /></button>
                <div style={modalStyles.header}>Request for: {document.documentType}</div>
                <div style={styles.statusBadge(document.status)}>{document.status}</div>

                <div style={modalStyles.sectionTitle}>Applicant Information</div>
                <div style={modalStyles.infoGrid}>
                    <div style={modalStyles.label}><User size={18} />Full Name:</div> <div style={modalStyles.value}>{document.fullName}</div>
                    <div style={modalStyles.label}><MapPin size={18} />Purok:</div> <div style={modalStyles.value}>{document.purok}</div>
                    <div style={modalStyles.label}><Calendar size={18} />Birthdate:</div> <div style={modalStyles.value}>{document.birthdate || 'N/A'}</div>
                    <div style={modalStyles.label}><Mail size={18} />Email:</div> <div style={modalStyles.value}>{document.user_email}</div>
                    <div style={modalStyles.label}><FileText size={18} />Date Applied:</div> <div style={modalStyles.value}>{formatDate(document.dateRequested)}</div>
                </div>

                <div style={modalStyles.sectionTitle}>Application Details</div>
                <div style={modalStyles.infoGrid}>
                    <div style={modalStyles.label}>Purpose:</div> <div style={modalStyles.value}>{document.purpose}</div>
                    <div style={modalStyles.label}>Details:</div> <div style={modalStyles.value}>{document.requirements_details || 'N/A'}</div>
                    <div style={modalStyles.label}>Payment Method:</div> <div style={modalStyles.value}>{document.payment_method || 'N/A'}</div>
                    <div style={modalStyles.label}>Reference #:</div> <div style={modalStyles.value}>{document.payment_reference_number || 'N/A'}</div>
                </div>

                {document.status === 'Rejected' && document.rejectionReason && (
                    <div style={modalStyles.rejectionBox}>
                        <div style={modalStyles.rejectionTitle}><XCircle size={20} />Rejection Reason</div>
                        <div style={modalStyles.rejectionReason}>{document.rejectionReason}</div>
                    </div>
                )}
                
                {document.requirementsFilePaths && document.requirementsFilePaths.length > 0 && (
                    <>
                        <div style={modalStyles.sectionTitle}>Submitted Requirements</div>
                        <ul style={modalStyles.list}>
                            {document.requirementsFilePaths.map((path, index) => (
                                <li key={index} style={modalStyles.listItem}>
                                    <a 
                                        href={path} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={modalStyles.fileLink}
                                    >
                                        <HardDrive size={16} />
                                        Requirement File {index + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                
                {document.generated_path && document.status === 'Completed' && (
                    <>
                        <div style={modalStyles.sectionTitle}>Generated Document</div>
                        <a 
                            href={document.generated_path} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={modalStyles.fileLink}
                        >
                            <Download size={16} />
                            Download Generated Document
                        </a>
                    </>
                )}

            </div>
        </div>
    );
};

const UpdateStatusModal = ({ show, document, onClose, onUpdate, onApprove }) => {
    // Hooks must be called unconditionally at the top
    const [selectedStatus, setSelectedStatus] = useState('');
    
    useEffect(() => {
        if (document) {
            setSelectedStatus(document.status);
        }
    }, [document]);

    if (!show || !document) return null;

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '22px', fontWeight: '700', color: '#1F2937', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
        subHeader: { color: '#6B7280', marginBottom: '25px', fontSize: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '16px' },
        select: { width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '16px', marginBottom: '30px', outline: 'none' },
        buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: (color) => ({ padding: '10px 15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }),
    };

    const updatableStatusOptions = STATUS_OPTIONS.filter(s => s !== 'All' && s !== 'Pending' && s !== 'Approved'); 

    const handleSubmit = () => {
        if (selectedStatus === 'Approved') {
            onApprove(document);
        } else if (selectedStatus && selectedStatus !== document.status) {
            onUpdate(document, selectedStatus);
        } else {
            onClose();
        }
    };

    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}>Update Status for Document {document.id}</div>
                <div style={modalStyles.subHeader}>Applicant: {document.fullName} | Current Status: <span style={styles.statusBadge(document.status)}>{document.status}</span></div>
                <label style={modalStyles.label}>Select New Status:</label>
                <select 
                    style={modalStyles.select}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="">Select Status</option>
                    <option value="Approved">Approved (Start Generation)</option>
                    <option value="Rejected">Rejected (Requires Reason)</option>
                    {updatableStatusOptions.filter(s => s !== 'Rejected').map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <div style={modalStyles.buttonContainer}>
                    <button style={modalStyles.button('#6B7280')} onClick={onClose}>Cancel</button>
                    <button 
                        style={modalStyles.button(selectedStatus === 'Rejected' ? '#DC2626' : '#1e40af')} 
                        onClick={handleSubmit}
                        disabled={!selectedStatus || selectedStatus === document.status}
                    >
                        Confirm Update
                    </button>
                </div>
            </div>
        </div>
    );
};


const SelectFormModal = ({ show, document, onClose, onSelect }) => {
    // Hooks must be called unconditionally at the top
    const [selectedForm, setSelectedForm] = useState('');

    useEffect(() => {
        if (document) {
            const defaultForm = SELECTABLE_FORMS[document.documentType];
            setSelectedForm(defaultForm || '');
        }
    }, [document]);

    if (!show || !document) return null;

    const modalStyles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
        modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        header: { fontSize: '22px', fontWeight: '700', color: '#1F2937', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
        subHeader: { color: '#6B7280', marginBottom: '25px', fontSize: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '10px', color: '#374151', fontSize: '16px' },
        select: { width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '16px', marginBottom: '30px', outline: 'none' },
        buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: (color) => ({ padding: '10px 15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }),
    };

    const formOptions = Object.entries(SELECTABLE_FORMS).filter(([type, filename]) => type === document.documentType);

    const handleSubmit = () => {
        if (selectedForm) {
            onSelect(document.id, selectedForm);
        } else {
            alert('Please select a form template.');
        }
    };

    return (
        <div style={modalStyles.backdrop} onClick={onClose}>
            <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
                <div style={modalStyles.header}><FileText size={24} />Generate Document</div>
                <div style={modalStyles.subHeader}>
                    Confirm the template to use for **{document.documentType}** for **{document.fullName}**.
                </div>
                <label style={modalStyles.label}>Select Form Template:</label>
                <select 
                    style={modalStyles.select}
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                >
                    <option value="">Select Template</option>
                    {formOptions.map(([type, filename]) => (
                        <option key={filename} value={filename}>{type} - {filename}</option>
                    ))}
                </select>
                <div style={modalStyles.buttonContainer}>
                    <button style={modalStyles.button('#6B7280')} onClick={onClose}>Cancel</button>
                    <button 
                        style={modalStyles.button('#059669')} 
                        onClick={handleSubmit}
                        disabled={!selectedForm}
                    >
                        Generate & Approve
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminDocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'dateRequested', direction: 'descending' });
    const [viewModal, setViewModal] = useState({ show: false, document: null });
    const [statusModal, setStatusModal] = useState({ show: false, document: null });
    const [selectFormModal, setSelectFormModal] = useState({ show: false, document: null, newStatus: null });
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });
    const [rejectModal, setRejectModal] = useState({ show: false, document: null });

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/documents`);
            setDocuments(response.data);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Failed to fetch document applications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleStatusUpdate = async (documentId, newStatus, rejectionReason) => {
        setStatusModal({ show: false, document: null });
        setRejectModal({ show: false, document: null });
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/admin/documents/update-status/${documentId}`,
                { newStatus, rejectionReason }
            );
            fetchDocuments();
            setMessageModal({
                show: true,
                title: newStatus + ' Successfully',
                body: response.data.message,
                isSuccess: true,
            });
        } catch (error) {
            console.error('Error updating status:', error.response?.data || error.message);
            setMessageModal({
                show: true,
                title: 'Update Failed',
                body: error.response?.data?.message || 'An error occurred during status update. Please try again.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmStatusUpdate = (document, newStatus) => {
        if (newStatus === 'Approved') {
            handleStatusApprove(document, newStatus);
        } else if (newStatus === 'Rejected') {
            setStatusModal({ show: false, document: null });
            setRejectModal({ show: true, document: document });
        } else {
            handleStatusUpdate(document.id, newStatus, null);
        }
    };
    
    const handleStatusRejectSubmit = (documentId, reason) => {
        handleStatusUpdate(documentId, 'Rejected', reason);
    };

    const handleStatusApprove = (document) => {
        setStatusModal({ show: false, document: null });
        setSelectFormModal({ show: true, document, newStatus: 'Approved' });
    };

    const generateDocumentAndApprove = async (documentId, selectedFormTemplate) => {
        setSelectFormModal({ show: false, document: null, newStatus: null });
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/admin/documents/generate-and-approve/${documentId}`,
                { templateFileName: selectedFormTemplate, newStatus: 'Approved' },
                { responseType: 'blob', headers: { 'Content-Type': 'application/json' } }
            );
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${documentId}_generated_document.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/i);
                if (match && match[1]) {
                    fileName = match[1].replace(/['"]/g, '').trim();
                }
            }
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            fetchDocuments();

            setMessageModal({
                show: true,
                title: 'Document Approved',
                body: 'Document has been successfully generated, approved, and downloaded.',
                isSuccess: true,
            });

        } catch (error) {
            console.error('Error generating and approving document:', error.response?.data || error.message);
            setMessageModal({
                show: true,
                title: 'Generation/Approval Failed',
                body: error.response?.data?.message || 'An error occurred during document generation or approval. Please ensure all data is correct and try again.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const sortedDocuments = useMemo(() => {
        let sortableItems = [...documents];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'dateRequested') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else if (sortConfig.key === 'fullName' || sortConfig.key === 'documentType') {
                    aValue = aValue ? aValue.toLowerCase() : '';
                    bValue = bValue ? bValue.toLowerCase() : '';
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
            const matchesSearch = searchTerm === '' || 
                                  doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  doc.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
            const matchesType = typeFilter === 'All' || doc.documentType === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [sortedDocuments, searchTerm, statusFilter, typeFilter]);

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

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                <h1 style={styles.title}>Document Applications</h1>
                <button style={styles.actionButton('#1e40af')} onClick={fetchDocuments} disabled={loading}>
                    {loading ? <Loader size={20} className="spinner" /> : <RefreshCcw size={20} />}
                    <span style={{ marginLeft: '8px' }}>Refresh</span>
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
                        placeholder="Search by name, email, or document..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select 
                    style={styles.select}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status} Applications</option>
                    ))}
                </select>
                
                <select 
                    style={styles.select}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    {DOCUMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>
                    Total: {filteredDocuments.length}
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '5%' }}>ID</th>
                            <th style={{ ...styles.th, width: '25%' }} onClick={() => requestSort('fullName')}>
                                Applicant {getSortIndicator('fullName')}
                            </th>
                            <th style={{ ...styles.th, width: '25%' }} onClick={() => requestSort('documentType')}>
                                Document Type {getSortIndicator('documentType')}
                            </th>
                            <th style={{ ...styles.th, width: '20%' }} onClick={() => requestSort('dateRequested')}>
                                Date Applied {getSortIndicator('dateRequested')}
                            </th>
                            <th style={{ ...styles.th, width: '15%' }} onClick={() => requestSort('status')}>
                                Status {getSortIndicator('status')}
                            </th>
                            <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>
                                    <Loader size={30} className="spinner" color="#1e40af" />
                                </td>
                            </tr>
                        ) : filteredDocuments.length > 0 ? (
                            filteredDocuments.map((doc) => (
                                <tr key={doc.id} style={styles.rowHover} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                                    <td style={styles.td}>{doc.id}</td>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: '600' }}>{doc.fullName}</div>
                                        <div style={{ color: '#6B7280', fontSize: '12px' }}>{doc.user_email}</div>
                                    </td>
                                    <td style={styles.td}>{doc.documentType}</td>
                                    <td style={styles.td}>{formatDate(doc.dateRequested)}</td>
                                    <td style={styles.td}>
                                        <span style={styles.statusBadge(doc.status)}>{doc.status}</span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center', display: 'flex' }}>
                                        <button 
                                            style={styles.actionButton('#6B7280')}
                                            onClick={() => setViewModal({ show: true, document: doc })}
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            style={styles.actionButton(doc.status === 'Approved' ? '#059669' : '#1e40af')}
                                            onClick={() => setStatusModal({ show: true, document: doc })}
                                            disabled={doc.status === 'Completed' || doc.status === 'Cancelled'}
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ ...styles.td, ...styles.noResults }}>
                                    No document applications match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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
            
            <RejectReasonModal
                show={rejectModal.show}
                document={rejectModal.document}
                onClose={() => setRejectModal({ show: false, document: null })}
                onSubmit={handleStatusRejectSubmit}
            />
            
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

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }`;
document.head.appendChild(styleSheet);


export default AdminDocumentsPage;