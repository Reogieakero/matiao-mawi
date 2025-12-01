// frontend/src/pages/DocumentsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    FiFileText, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiLogIn, FiX, 
    FiPaperclip, FiCreditCard, FiClock, FiCalendar, FiUser, FiTrash2, FiDownload, FiInfo 
} from 'react-icons/fi'; 
import { useNavigate } from 'react-router-dom';

// --- Configuration Constants ---
const API_BASE_URL = 'http://localhost:5000/api';
// Define the host where the generated files are served (must match your server's host/port)
const BASE_HOST = 'http://localhost:5000'; 
// Define the max download limit
const MAX_DOWNLOAD_LIMIT = 2; // NEW CONSTANT
// -------------------------------

// Utility function to get the correct badge style
const getStatusBadge = (status) => {
    let color = '#374151';
    let backgroundColor = '#f3f4f6';
    let icon = <FiClock size={12} />;
    
    if (status === 'Pending') {
        color = '#92400e';
        backgroundColor = '#fffbeb';
        icon = <FiClock size={12} />;
    } else if (status === 'Approved') {
        color = '#065f46';
        backgroundColor = '#d1fae5';
        icon = <FiCheckCircle size={12} />;
    } else if (status === 'Completed') {
        color = '#1f2937';
        backgroundColor = '#e5e7eb';
        icon = <FiCheckCircle size={12} />;
    } else if (status === 'Rejected') {
        color = '#991b1b';
        backgroundColor = '#fee2e2';
        icon = <FiX size={12} />;
    } else if (status === 'Cancelled') {
        color = '#4b5563';
        backgroundColor = '#e5e7eb';
        icon = <FiAlertTriangle size={12} />;
    }
    
    return {
        style: {
            color,
            backgroundColor,
            padding: '5px 10px',
            borderRadius: '15px',
            fontWeight: '700',
            fontSize: '12px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
        },
        icon
    };
};

// --- Helper Components ---

// Document Template Component
const DocumentTemplates = () => {
    // The path in the href attribute is relative to the public/ directory
    const templates = [
        { name: 'Barangay Blotter Form', path: '/forms/Blotter.pdf', icon: <FiFileText /> },
        { name: 'Barangay Volunteer Application Form', path: '/forms/Volunteer.pdf', icon: <FiUser /> },
    ];

    return (
        <div style={styles.templatesSection}>
            <h2 style={styles.templatesHeader}><FiDownload size={20} style={{marginRight: '10px'}} /> Download Document Templates</h2>
            <p style={styles.templatesSubheader}>You can download these official forms for reference or to prepare required documents.</p>
            <div style={styles.templateGrid}>
                {templates.map((template, index) => (
                    <a 
                        key={index} 
                        href={template.path} 
                        download // This attribute triggers the browser to download the file
                        style={styles.templateCard}
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        <div style={styles.templateCardContent}>
                            <div style={styles.templateIcon}>{template.icon}</div>
                            <span style={styles.templateName}>{template.name}</span>
                        </div>
                        <FiDownload size={18} style={styles.templateDownloadIcon} />
                    </a>
                ))}
            </div>
        </div>
    );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmStyle }) => {
    if (!isOpen) return null;

    const modalStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1001,
    };

    const contentStyle = {
        backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px',
        width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
    };

    const headerStyle = {
        fontSize: '1.5rem',
        color: confirmStyle === 'delete' ? '#dc2626' : (confirmStyle === 'cancel' ? '#dc2626' : '#2563eb'),
        marginBottom: '10px',
    };

    const messageStyle = {
        color: '#4b5563', marginBottom: '20px',
    };

    const confirmButtonStyle = {
        backgroundColor: confirmStyle === 'delete' ? '#dc2626' : '#2563eb', 
        color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px',
        cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px',
    };

    const cancelButtonStyle = {
        backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none',
        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
    };

    return (
        <div style={modalStyle}>
            <div style={contentStyle}>
                <h3 style={headerStyle}>{title}</h3>
                <p style={messageStyle}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button onClick={onCancel} style={cancelButtonStyle}>
                        Keep Application
                    </button>
                    <button onClick={onConfirm} style={confirmButtonStyle}>
                        {confirmStyle === 'delete' && <FiTrash2 size={18} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Application Modal Component (Simplified for brevity, assuming existing styles are present)
const ApplicationModal = ({ 
    show, document, onClose, onSubmit, fullName, setFullName, purpose, setPurpose, 
    requirementsFiles, handleRequirementsChange, paymentMethod, setPaymentMethod, 
    referenceNumber, setReferenceNumber, barangayPaymentDetails, feeRequired,
    // START OF CHANGE: Add new props
    purok, setPurok, birthdate, setBirthdate 
    // END OF CHANGE
}) => {
    if (!show || !document) return null;
    
    // Use the existing modalStyles for the structure
    const modalStyles = styles.modalStyles;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.modalHeader}>
                    <h2>Apply for {document.document_name}</h2>
                    <button onClick={onClose} style={modalStyles.closeButton}><FiX size={20} /></button>
                </div>
                <form onSubmit={onSubmit}>
                    {/* Form Groups */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>Applicant Full Name *</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={modalStyles.input} required />
                    </div>
                    
                    {/* START OF CHANGE: Add Purok and Birthdate fields */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                            <label style={modalStyles.label}>Purok / Zone *</label>
                            <input type="text" value={purok} onChange={(e) => setPurok(e.target.value)} style={modalStyles.input} placeholder="e.g., Purok 5" required />
                        </div>
                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                            <label style={modalStyles.label}>Birthdate *</label>
                            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} style={modalStyles.input} required />
                        </div>
                    </div>
                    {/* END OF CHANGE */}

                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>Purpose of Application *</label>
                        <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} style={modalStyles.textarea} placeholder="e.g., Job application, School registration, Business permit renewal" required />
                    </div>
                    
                    {/* Requirements Section */}
                    <div style={modalStyles.requirementsBox}>
                        <h3 style={modalStyles.requirementsHeader}><FiPaperclip /> Required Documents</h3>
                        <p style={modalStyles.requirementsList}> {document.requirements} </p>
                        <div style={modalStyles.formGroup}>
                            <label style={modalStyles.label}>Upload Requirements *</label>
                            <input type="file" onChange={handleRequirementsChange} style={modalStyles.fileInput} multiple accept="image/*,application/pdf" required={requirementsFiles.length === 0} />
                            {requirementsFiles.length > 0 && <small style={modalStyles.hint}>Files ready: {requirementsFiles.length} uploaded.</small> }
                            <small style={modalStyles.hint}>Accepted formats: Image (PNG, JPG) or PDF. Max 5 files.</small>
                        </div>
                    </div>
                    
                    {/* Payment Section (if fee is required) */}
                    {feeRequired && (
                        <div style={modalStyles.paymentBox}>
                            <h3 style={modalStyles.requirementsHeader}>Payment Details (Fee: ₱{document.fee.toLocaleString()})</h3>
                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Payment Method *</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={modalStyles.input} required>
                                    {barangayPaymentDetails.map((detail, index) => (
                                        <option 
                                            key={index} 
                                            value={detail.method_name}
                                        >
                                            {/* START OF CHANGE: Display method name and account number */}
                                            {detail.method_name} (No: {detail.account_number})
                                            {/* END OF CHANGE */}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Payment Reference Number *</label>
                                <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} style={modalStyles.input} placeholder="Enter transaction reference number" required />
                            </div>
                            <small style={modalStyles.hint}>Please pay the required fee using the selected method and enter the reference number before submitting.</small>
                        </div>
                    )}

                    <button type="submit" style={modalStyles.submitButton}>Submit Application</button>
                </form>
            </div>
        </div>
    );
};


// --- Main Component ---
const DocumentsPage = ({ userEmail, userName, profilePictureUrl }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // History, Modal, Confirmation states
    const [applicationHistory, setApplicationHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); 
    const [targetApplication, setTargetApplication] = useState(null); 
    
    // START OF CHANGE: Add state to track download counts per application
    const [downloadCounts, setDownloadCounts] = useState({}); // { applicationId: count, ... }
    // END OF CHANGE
    
    // Form States
    const [fullName, setFullName] = useState(userName || '');
    // START OF CHANGE: Add new form states
    const [purok, setPurok] = useState('');
    const [birthdate, setBirthdate] = useState('');
    // END OF CHANGE
    const [purpose, setPurpose] = useState('');
    const [requirementsFiles, setRequirementsFiles] = useState([]); 
    
    // Payment States
    const [paymentMethod, setPaymentMethod] = useState(''); 
    const [referenceNumber, setReferenceNumber] = useState(''); 
    const [barangayPaymentDetails, setBarangayPaymentDetails] = useState([]); 
    
    const isLoggedIn = !!userEmail; 
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
        fetchPaymentDetails(); 
        if (isLoggedIn && userEmail) {
            fetchApplicationHistory();
        }
    }, [isLoggedIn, userEmail]);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents`); 
            if (!response.ok) {
                throw new Error('Failed to fetch barangay documents. Check server status.');
            }
            const data = await response.json();
            setDocuments(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };
    
    const fetchPaymentDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-details`);
            if (!response.ok) {
                throw new Error('Failed to fetch payment details.');
            }
            const data = await response.json();
            setBarangayPaymentDetails(data);
            if (data.length > 0) {
                setPaymentMethod(data[0].method_name); 
            }
        } catch (err) {
            console.error("Error fetching payment details:", err.message);
        }
    };

    const fetchApplicationHistory = async () => {
        if (!userEmail) return;
        try {
            // Server endpoint should return generated_path and exclude soft-deleted documents
            const response = await fetch(`${API_BASE_URL}/documents/history/${userEmail}`); 
            if (!response.ok) {
                throw new Error('Failed to fetch application history.');
            }
            const data = await response.json();
            setApplicationHistory(data);
        } catch (err) {
            console.error("Error fetching history:", err.message);
        }
    };
    
    const handleOpenConfirmation = (action, id, documentName) => {
        setConfirmAction(action);
        setTargetApplication({ id, name: documentName });
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmation = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
        setTargetApplication(null);
    };

    const handleConfirmAction = () => {
        if (confirmAction === 'cancel') {
            executeCancelApplication(targetApplication.id, targetApplication.name);
        } else if (confirmAction === 'delete') {
            executeDeleteApplication(targetApplication.id, targetApplication.name);
        }
        handleCloseConfirmation();
    };

    const executeCancelApplication = async (applicationId, documentName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents/cancel/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Cancellation Error: ${data.message || 'Failed to cancel application.'}`);
            } else {
                fetchApplicationHistory(); 
                setSuccessMessage(`Application ID ${applicationId} for ${documentName} has been CANCELLED.`);
                setTimeout(() => setSuccessMessage(''), 7000); 
            }

        } catch (err) {
            alert(`Network Error during cancellation: ${err.message}`);
        }
    };

    const executeDeleteApplication = async (applicationId, documentName) => {
        try {
            // Soft-delete endpoint
            const response = await fetch(`${API_BASE_URL}/documents/remove-from-history/${applicationId}`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail }), 
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Removal Error: ${data.message || 'Failed to remove application from history.'}`);
            } else {
                setApplicationHistory(prevHistory => 
                    prevHistory.filter(app => app.id !== applicationId)
                );
                // Also remove from download counts if it's being removed
                setDownloadCounts(prevCounts => {
                    const newCounts = { ...prevCounts };
                    delete newCounts[applicationId];
                    return newCounts;
                });
                setSuccessMessage(`Application ID ${applicationId} for ${documentName} has been REMOVED from your history.`);
                setTimeout(() => setSuccessMessage(''), 7000); 
            }

        } catch (err) {
            alert(`Network Error during removal: ${err.message}`);
        }
    };
    
    const openApplyModal = (doc) => {
        if (!isLoggedIn) {
            alert('Please log in to apply for a document.');
            navigate('/login');
            return;
        }
        setCurrentDocument(doc);
        setFullName(userName || ''); 
        // START OF CHANGE: Reset new form states
        setPurok('');
        setBirthdate('');
        // END OF CHANGE
        setPurpose('');
        setRequirementsFiles([]); 
        setPaymentMethod(barangayPaymentDetails.length > 0 ? barangayPaymentDetails[0].method_name : '');
        setReferenceNumber(''); 
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentDocument(null);
    };
    
    const handleRequirementsChange = (e) => {
        setRequirementsFiles(Array.from(e.target.files));
    };

    const handleApply = async (e) => {
        e.preventDefault();
        
        // START OF CHANGE: Include new form fields in validation
        if (!currentDocument || !fullName || !purok || !birthdate || !purpose || requirementsFiles.length === 0) {
            alert('Please fill out all required text fields (Name, Purok, Birthdate, Purpose) and upload the necessary requirements.');
            return;
        }
        // END OF CHANGE
        
        const feeRequired = currentDocument.fee > 0;
        
        if (feeRequired) {
             if (!paymentMethod || !referenceNumber) {
                 alert('This document requires a fee. Please select a payment method and provide a reference number.');
                 return;
             }
        }

        const formData = new FormData();
        formData.append('document_id', currentDocument.id);
        formData.append('user_email', userEmail);
        formData.append('full_name', fullName);
        // START OF CHANGE: Append new form fields to FormData
        formData.append('purok', purok);
        formData.append('birthdate', birthdate);
        // END OF CHANGE
        formData.append('purpose', purpose);
        formData.append('requirements_details', currentDocument.requirements); 
        
        requirementsFiles.forEach((file) => {
            formData.append('requirements', file); 
        });
        
        if (feeRequired) {
             formData.append('payment_method', paymentMethod); 
             formData.append('payment_reference_number', referenceNumber); 
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/documents/apply`, {
                method: 'POST',
                body: formData, 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit application due to a server error.');
            }
            
            closeModal();
            fetchApplicationHistory(); 

            setSuccessMessage(
                `Successfully applied for: ${currentDocument.document_name}.\nYour application is Pending review. Application ID: ${data.applicationId}`
            );
            setTimeout(() => setSuccessMessage(''), 7000); 

        } catch (err) {
            alert(`Application Submission Error: ${err.message}`);
        }
    };
    
    // START OF CHANGE: Download logic updated to enforce max download limit
    const handleDownload = (application) => {
        const applicationId = application.id;
        const currentCount = downloadCounts[applicationId] || 0;
        
        if (currentCount >= MAX_DOWNLOAD_LIMIT) {
             alert(`Download limit (${MAX_DOWNLOAD_LIMIT}) reached for this document.`);
             return;
        }
        
        if (application.generated_path && (application.status === 'Approved' || application.status === 'Completed')) {
            // Prepend the host/port to the partial path to create the full, publicly accessible URL
            const fullUrl = `${BASE_HOST}${application.generated_path}`;
            window.open(fullUrl, '_blank');
            
            // Increment the count only if the download is initiated (client-side enforcement)
            setDownloadCounts(prevCounts => ({
                ...prevCounts,
                [applicationId]: currentCount + 1
            }));
        } else {
            alert('The document is not yet approved or the generated file is not available.');
        }
    };
    // END OF CHANGE


    if (loading) {
        return <div style={{...styles.container, textAlign: 'center'}}>Loading documents...</div>;
    }

    if (error) {
        return <div style={{...styles.container, color: 'red', textAlign: 'center'}}><FiAlertTriangle /> Error: {error}</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Barangay Document Applications</h1>
            <p style={styles.subheader}>
                Apply for official documents and certificates. Your application will be processed using the email registered to your account: <strong>{userEmail || 'N/A'}</strong>.
            </p>

            {successMessage && <div style={styles.successBox}><FiCheckCircle /> {successMessage}</div>}

            {!isLoggedIn && (
                <div style={styles.loginAlert}>
                    <FiLogIn size={20} style={{marginRight: '10px'}} />
                    Please log in to apply for documents and view your application history.
                </div>
            )}
            
            <DocumentTemplates />

            {/* Document Cards Section */}
            <div style={styles.documentGrid}>
                {documents.map(doc => (
                    <div key={doc.id} style={styles.documentCard}>
                        <div style={styles.cardHeader}>
                            <FiFileText size={24} style={styles.icon} />
                            <h3 style={styles.documentName}>{doc.document_name}</h3>
                        </div>
                        <p style={styles.description}>{doc.description}</p>
                        <div style={styles.details}>
                            <p style={styles.detailItem}>
                                
                                Fee: <strong>{doc.fee > 0 ? `₱${doc.fee.toLocaleString()}` : 'FREE'}</strong>
                            </p>
                        </div>
                        <p style={styles.requirements}> 
                            <strong>Requirements:</strong> {doc.requirements || 'Varies based on purpose.'} 
                        </p>
                        <button 
                            style={isLoggedIn ? styles.applyButton : styles.disabledButton} 
                            onClick={() => openApplyModal(doc)} 
                            disabled={!isLoggedIn}
                        >
                            {isLoggedIn ? 'Apply Now' : 'Log in to Apply'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Application History Section - Professional Design */}
            {isLoggedIn && (
                <div style={styles.historySection}>
                    <h2 style={styles.historyHeader}><FiClock size={20} style={{marginRight: '10px'}} /> Application History</h2>
                    {applicationHistory.length === 0 ? (
                        <p style={styles.noHistory}>No document applications found. Start your first application above!</p>
                    ) : (
                        <div style={styles.historyGrid}>
                            {applicationHistory.map(app => {
                                const statusBadge = getStatusBadge(app.status);
                                // START OF CHANGE: Determine if download is disabled
                                const applicationId = app.id;
                                const currentCount = downloadCounts[applicationId] || 0;
                                const isDownloadLimitReached = currentCount >= MAX_DOWNLOAD_LIMIT;
                                const isDownloadAvailable = (app.status === 'Approved' || app.status === 'Completed') && app.generated_path;
                                // END OF CHANGE
                                
                                return (
                                <div key={app.id} style={styles.proHistoryItem}> 
                                    {app.status === 'Cancelled' && ( <div style={styles.cancelledWatermark}>CANCELLED</div> )}
                                    
                                    <div style={styles.historyItemHeader}>
                                        <h3 style={styles.historyDocumentName}>{app.document_name}</h3>
                                        <span style={statusBadge.style}>{statusBadge.icon} {app.status}</span>
                                    </div>
                                    
                                    

                                    <div style={styles.historyDetailsWrapper}>
                                        <br />

                                        <p style={styles.proHistoryDetail}>
                                            <FiInfo size={14} style={styles.proIcon} /> <strong>Purok:</strong> {app.purok || 'N/A'}
                                        </p>
                                        <p style={styles.proHistoryDetail}>
                                            <FiCalendar size={14} style={styles.proIcon} /> <strong>Birthdate:</strong> {app.birthdate ? new Date(app.birthdate).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p style={styles.proHistoryDetail}>
                                            <FiCreditCard size={14} style={styles.proIcon} /> <strong>Payment:</strong> {app.payment_reference_number ? `Ref: ${app.payment_reference_number.substring(0, 10)}...` : 'N/A (No Fee or Pending Ref)'}
                                        </p>
                                        <p style={styles.proHistoryPurpose}>
                                            <FiFileText size={14} style={styles.proIcon} /> <strong>Purpose:</strong> {app.purpose.substring(0, 60)}{app.purpose.length > 60 ? '...' : ''}
                                        </p>
                                    </div>


                                    <div style={styles.historyActions}>
                                        {/* Download Button for Approved/Completed Documents */}
                                        {/* START OF CHANGE: Add disabled condition and title attribute */}
                                        {isDownloadAvailable && (
                                            <button 
                                                onClick={() => handleDownload(app)} 
                                                style={isDownloadLimitReached ? styles.historyDisabledDownloadButton : styles.historyDownloadButton} 
                                                title={isDownloadLimitReached ? `Download limit (${MAX_DOWNLOAD_LIMIT}) reached. Downloaded ${currentCount} times.` : `Download Approved ${app.document_name} (Downloaded ${currentCount}/${MAX_DOWNLOAD_LIMIT} times)`}
                                                disabled={isDownloadLimitReached}
                                            >
                                                <FiDownload size={18} /> {isDownloadLimitReached ? 'Limit Reached' : 'Download'}
                                            </button>
                                        )}
                                        {/* END OF CHANGE */}
                                        
                                        {/* Cancel Button */}
                                        {(app.status === 'Pending' || app.status === 'Rejected') && (
                                            <button 
                                                onClick={() => handleOpenConfirmation('cancel', app.id, app.document_name)}
                                                style={styles.historyCancelButton}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        
                                        {/* Delete Button (Remove from History - Soft Delete) */}
                                        {(app.status === 'Cancelled' || app.status === 'Rejected' || app.status === 'Completed') && (
                                            <button 
                                                onClick={() => handleOpenConfirmation('delete', app.id, app.document_name)}
                                                style={styles.historyDeleteButton}
                                            >
                                                <FiTrash2 size={16} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}


            {/* Application Modal */}
            <ApplicationModal
                show={isModalOpen}
                document={currentDocument}
                onClose={closeModal}
                onSubmit={handleApply}
                fullName={fullName}
                setFullName={setFullName}
                // START OF CHANGE: Pass new props
                purok={purok}
                setPurok={setPurok}
                birthdate={birthdate}
                setBirthdate={setBirthdate}
                // END OF CHANGE
                purpose={purpose}
                setPurpose={setPurpose}
                requirementsFiles={requirementsFiles}
                handleRequirementsChange={handleRequirementsChange}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                referenceNumber={referenceNumber}
                setReferenceNumber={setReferenceNumber}
                barangayPaymentDetails={barangayPaymentDetails}
                feeRequired={currentDocument?.fee > 0}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title={confirmAction === 'delete' ? 'Remove from History?' : 'Cancel Application?'}
                message={
                    confirmAction === 'delete' 
                        ? `Are you sure you want to remove Application ID ${targetApplication?.id} (${targetApplication?.name}) from your history? You will not be able to track it later.`
                        : `Are you sure you want to CANCEL Application ID ${targetApplication?.id} (${targetApplication?.name})? This action cannot be undone.`
                }
                onConfirm={handleConfirmAction}
                onCancel={handleCloseConfirmation}
                confirmText={confirmAction === 'delete' ? 'Remove from History' : 'Yes, Cancel Application'}
                confirmStyle={confirmAction}
            />

            {/* Styles Definition (Included for completeness) */}
            <style jsx>{` /* Global Styles */ button { transition: background-color 0.2s; } button:hover:not(:disabled) { opacity: 0.9; } button:disabled { cursor: not-allowed; opacity: 0.6; } `}</style> 
        </div>
    );
};

// Styles object for DocumentsPage (Partial styles for brevity, assuming existing comprehensive styles)
const styles = {
    // ... (Existing styles for container, header, subheader, successBox, loginAlert, documentGrid, etc.)
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', },
    header: { fontSize: '24px', fontWeight: '700', color: '#1e40af', marginBottom: '15px', },
    subheader: { color: '#4b5563', marginBottom: '30px', fontSize: '16px', },
    successBox: { backgroundColor: '#d1fae5', color: '#065f46', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #1e40af', },
    
    // MODIFIED: Enforce 3 columns
    documentGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        marginBottom: '40px', 
    },
    
    // MODIFIED: Added hover effect
    documentCard: { 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)', 
        display: 'flex', 
        flexDirection: 'column', 
        transition: 'transform 0.3s ease, box-shadow 0.3s ease', // Added transition for hover
        ':hover': { 
            transform: 'translateY(-5px)', 
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
        },
    },
    cardHeader: { display: 'flex', alignItems: 'center', marginBottom: '10px', },
    icon: { color: '#2563eb', marginRight: '10px', },
    documentName: { fontSize: '1.4rem', color: '#1f2937', margin: '0', },
    description: { color: '#6b7280', fontSize: '0.95rem', marginBottom: '15px', flexGrow: 1, },
    details: { borderTop: '1px solid #f3f4f6', paddingTop: '15px', marginBottom: '15px', },
    detailItem: { display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#1e40af', marginBottom: '5px', fontWeight: '600', },
    requirements: { fontSize: '0.85rem', color: '#4b5563', marginTop: '10px', },
    applyButton: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', marginTop: 'auto', },
    disabledButton: { backgroundColor: '#9ca3af', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', marginTop: 'auto', },
    
    // History Section Styles
    historySection: { marginBottom: '40px', },
    historyHeader: { fontSize: '22px', fontWeight: '700', color: '#1e40af', marginBottom: '20px', display: 'flex', alignItems: 'center', },
    
    // MODIFIED: Enforce 3 columns
    historyGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
    },
    
    // --- PROFESSIONAL HISTORY CARD STYLES ---
    // MODIFIED: Added smoother transition and enhanced hover effect
    proHistoryItem: { 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.08)', 
        transition: 'transform 0.3s ease, box-shadow 0.3s ease', // Added transition for hover
        position: 'relative', 
        overflow: 'hidden', 
        ':hover': { 
            transform: 'translateY(-5px)', 
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
        },
    },
    cancelledWatermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '3rem', fontWeight: '900', color: 'rgba(220, 38, 38, 0.1)', pointerEvents: 'none', zIndex: 1, whiteSpace: 'nowrap', },
    historyItemHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px', 
    },
    historyDocumentName: { fontSize: '1.4rem', fontWeight: '700', color: '#1f2937', margin: '0', },
    
    historyMetaRow: { // New Row for ID and Date
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '10px',
        borderBottom: '1px dashed #e5e7eb',
        marginBottom: '10px',
    },
    historyID: { fontSize: '0.85rem', fontWeight: '700', color: '#6b7280', },
    historyDate: { fontSize: '0.85rem', color: '#9ca3af', display: 'flex', alignItems: 'center', },
    
    historyDetailsWrapper: { marginBottom: '15px', },
    proHistoryDetail: { fontSize: '0.9rem', color: '#4b5563', margin: '5px 0', display: 'flex', alignItems: 'center', },
    proHistoryPurpose: { fontSize: '0.9rem', color: '#4b5563', margin: '5px 0', display: 'flex', alignItems: 'flex-start', }, // For purpose
    proIcon: { marginRight: '8px', color: '#1e40af', minWidth: '14px', }, // MODIFIED: Icon color changed to #1e40af
    
    historyActions: { 
        marginTop: '20px', 
        paddingTop: '15px', 
        borderTop: '1px solid #f3f4f6', 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        zIndex: 2, 
    },
    historyCancelButton: { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', },
    historyDeleteButton: { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', },
    historyDownloadButton: { backgroundColor: '#1e40af', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', },
    // START OF CHANGE: Add disabled download button style
    historyDisabledDownloadButton: { backgroundColor: '#9ca3af', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7, },
    // END OF CHANGE
    
    noHistory: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', },
    // --- END PROFESSIONAL HISTORY CARD STYLES ---

    // Template Section Styles
    templatesSection: { padding: '25px', backgroundColor: '#f0f9ff', borderRadius: '12px', marginBottom: '40px', border: '1px solid #bae6fd' },
    templatesHeader: { fontSize: '1.5rem', color: '#0369a1', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center' },
    templatesSubheader: { color: '#4b5563', marginBottom: '20px' },
    templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' },
    templateCard: { textDecoration: 'none', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s, boxShadow 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0f2fe', ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' } },
    templateCardContent: { display: 'flex', alignItems: 'center' },
    templateIcon: { color: '#3b82f6', marginRight: '10px' },
    templateName: { color: '#1f2937', fontWeight: '600', fontSize: '0.95rem' },
    templateDownloadIcon: { color: '#3b82f6' },
    
    // Modal Styles (Partial/Placeholder)
    modalStyles: {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, },
        modal: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '95%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', position: 'relative' },
        modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' },
        closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' },
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', fontWeight: '600', marginBottom: '5px', color: '#374151' },
        input: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', minHeight: '100px' },
        fileInput: { padding: '10px 0', },
        hint: { display: 'block', fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' },
        requirementsBox: { padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' },
        requirementsHeader: { fontSize: '1.1rem', fontWeight: '700', color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
        requirementsList: { fontSize: '0.9rem', color: '#4b5563', marginBottom: '10px', paddingLeft: '10px', borderLeft: '3px solid #f59e0b', },
        paymentBox: { border: '2px dashed #34d399', backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '8px', marginBottom: '20px', },
        submitButton: { width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
    }
};

export default DocumentsPage;