import React, { useState, useEffect } from 'react';
// Added FiClock for history section header
// ADDED FiTrash2 to the imports
import { FiFileText, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiLogIn, FiX, FiPaperclip, FiCreditCard, FiClock, FiCalendar, FiUser, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// New Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmStyle }) => {
    if (!isOpen) return null;

    const modalStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
    };

    const contentStyle = {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
    };

    const headerStyle = {
        fontSize: '1.5rem',
        color: confirmStyle === 'delete' ? '#dc2626' : (confirmStyle === 'cancel' ? '#dc2626' : '#2563eb'),
        marginBottom: '10px',
    };

    const messageStyle = {
        color: '#4b5563',
        marginBottom: '20px',
    };

    const buttonGroupStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    };

    // Modified button styles to match the page's new blue palette consistency
    const confirmButtonStyle = {
        // Red for Delete action, Blue for Cancel (the main destructive action in the modal)
        backgroundColor: confirmStyle === 'delete' ? '#dc2626' : '#2563eb', 
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        // MODIFICATION: Add styles for icon alignment
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', 
        gap: '8px',
    };

    const cancelButtonStyle = {
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
    };

    return (
        <div style={modalStyle}>
            <div style={contentStyle}>
                <h3 style={headerStyle}>{title}</h3>
                <p style={messageStyle}>{message}</p>
                <div style={buttonGroupStyle}>
                    <button onClick={onCancel} style={cancelButtonStyle}>
                        Keep Application
                    </button>
                    <button onClick={onConfirm} style={confirmButtonStyle}>
                        {/* MODIFICATION: Conditionally render FiTrash2 icon for delete action */}
                        {confirmStyle === 'delete' && <FiTrash2 size={18} />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DocumentsPage = ({ userEmail, userName, profilePictureUrl }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // State for application history
    const [applicationHistory, setApplicationHistory] = useState([]);

    // State for the Application Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);

    // State for the Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'cancel' or 'delete'
    const [targetApplication, setTargetApplication] = useState(null); // { id, name }

    // State for the Form Inputs
    const [fullName, setFullName] = useState(userName || '');
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
        // Only fetch history if the user is logged in
        if (isLoggedIn && userEmail) {
            fetchApplicationHistory();
        }
    }, [isLoggedIn, userEmail]); // Depend on login status and email

    const fetchDocuments = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/documents'); 
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
        // ... (Existing logic for fetching payment details) ...
        try {
            const response = await fetch('http://localhost:5000/api/payment-details');
            if (!response.ok) {
                throw new Error('Failed to fetch payment details.');
            }
            const data = await response.json();
            setBarangayPaymentDetails(data);
            if (data.length > 0) {
                setPaymentMethod(data[0].method_name); // Set default payment method
            }
        } catch (err) {
            console.error("Error fetching payment details:", err.message);
        }
    };

    // Fetch user's application history
    const fetchApplicationHistory = async () => {
        if (!userEmail) return;
        try {
            // This endpoint is updated in server.js to include requirements_file_paths
            const response = await fetch(`http://localhost:5000/api/documents/history/${userEmail}`); 
            if (!response.ok) {
                throw new Error('Failed to fetch application history.');
            }
            const data = await response.json();
            setApplicationHistory(data);
        } catch (err) {
            console.error("Error fetching history:", err.message);
        }
    };
    
    // Confirmation Handler: Show Modal
    const handleOpenConfirmation = (action, id, documentName) => {
        setConfirmAction(action);
        setTargetApplication({ id, name: documentName });
        setIsConfirmModalOpen(true);
    };

    // Confirmation Handler: Close Modal
    const handleCloseConfirmation = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
        setTargetApplication(null);
    };

    // Confirmation Handler: Execute Action
    const handleConfirmAction = () => {
        if (confirmAction === 'cancel') {
            executeCancelApplication(targetApplication.id, targetApplication.name);
        } else if (confirmAction === 'delete') {
            executeDeleteApplication(targetApplication.id, targetApplication.name);
        }
        handleCloseConfirmation();
    };

    // Function: Execute Cancel Application
    const executeCancelApplication = async (applicationId, documentName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/documents/cancel/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Cancellation Error: ${data.message || 'Failed to cancel application.'}`);
            } else {
                fetchApplicationHistory(); // Refresh history on success
                setSuccessMessage(`Application ID ${applicationId} for ${documentName} has been CANCELLED.`);
                setTimeout(() => setSuccessMessage(''), 7000); 
            }

        } catch (err) {
            alert(`Network Error during cancellation: ${err.message}`);
        }
    };

    // Function: Execute Delete Application
    const executeDeleteApplication = async (applicationId, documentName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/documents/delete/${applicationId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail }), // Send userEmail for security/verification
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Deletion Error: ${data.message || 'Failed to delete application.'}`);
            } else {
                fetchApplicationHistory(); // Refresh history on success
                setSuccessMessage(`Application ID ${applicationId} for ${documentName} has been PERMANENTLY DELETED.`);
                setTimeout(() => setSuccessMessage(''), 7000); 
            }

        } catch (err) {
            alert(`Network Error during deletion: ${err.message}`);
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
        setPurpose('');
        setRequirementsFiles([]); // Reset files
        // Reset payment states
        setPaymentMethod(barangayPaymentDetails.length > 0 ? barangayPaymentDetails[0].method_name : '');
        setReferenceNumber(''); 
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentDocument(null);
    };
    
    // Helper function to handle multiple file change
    const handleRequirementsChange = (e) => {
        setRequirementsFiles(Array.from(e.target.files));
    };

    const handleApply = async (e) => {
        e.preventDefault();
        
        // ... (Existing form validation logic) ...
        if (!currentDocument || !fullName || !purpose || requirementsFiles.length === 0) {
            alert('Please fill out all required text fields and upload the necessary requirements.');
            return;
        }
        
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
            const response = await fetch('http://localhost:5000/api/documents/apply', {
                method: 'POST',
                body: formData, 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit application due to a server error.');
            }
            
            closeModal();
            // IMPORTANT: Refresh history after submitting a new application
            fetchApplicationHistory(); 

            setSuccessMessage(
                `Successfully applied for: ${currentDocument.document_name}.\nYour application is Pending review. Application ID: ${data.applicationId}`
            );
            setTimeout(() => setSuccessMessage(''), 7000); 

        } catch (err) {
            alert(`Application Submission Error: ${err.message}`);
        }
    };

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
                    <FiLogIn size={20} style={{marginRight: '10px'}}/>
                    Action Required: You must be logged in to submit an application. Please log in or create an account.
                </div>
            )}

            <div style={styles.documentGrid}>
                {documents.map(doc => (
                    <div key={doc.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <FiFileText size={24} style={styles.icon} />
                            <h2 style={styles.documentName}>{doc.document_name}</h2>
                        </div>
                        <p style={styles.description}>{doc.description}</p>
                        
                        <div style={styles.details}>
                            <div style={styles.detailItem}>
                                <strong><FiCreditCard size={14} style={{marginRight: '5px'}} /> Fee:</strong> 
                                <span>{doc.fee > 0 ? `₱${doc.fee.toFixed(2)}` : 'FREE'}</span>
                            </div>
                            <p style={styles.requirements}>
                                <strong>Requirements:</strong> {doc.requirements || 'Varies based on purpose.'}
                            </p>
                        </div>
                        
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
                            {applicationHistory.map(app => (
                                <div key={app.id} style={styles.proHistoryItem}> {/* Applied new style */}
                                    {/* ADDED CANCELLED WATERMARK */}
                                    {app.status === 'Cancelled' && (
                                        <div style={styles.cancelledWatermark}>CANCELLED</div>
                                    )}
                                    <div style={styles.historyItemHeader}>
                                        <h3 style={styles.historyDocumentName}>{app.document_name}</h3>
                                        <span style={styles.statusBadge(app.status)}>{app.status}</span>
                                    </div>
                                    <p style={styles.proHistoryDetail}>
                                        <FiUser size={14} style={styles.proIcon} /> 
                                        <strong>Applicant:</strong> {app.applicant_name}
                                    </p>
                                    <p style={styles.proHistoryDetail}>
                                        <FiFileText size={14} style={styles.proIcon} /> 
                                        <strong>Purpose:</strong> {app.purpose}
                                    </p>
                                    <p style={styles.proHistoryDetail}>
                                        <FiCalendar size={14} style={styles.proIcon} /> 
                                        <strong>Date Applied:</strong> {new Date(app.application_date).toLocaleDateString()}
                                    </p>
                                    <p style={styles.proHistoryDetail}>
                                        <FiDollarSign size={14} style={styles.proIcon} /> 
                                        <strong>Fee:</strong> {app.fee > 0 ? `₱${app.fee.toFixed(2)}` : 'FREE'}
                                    </p>
                                    {app.fee > 0 && app.payment_method && (
                                        <p style={styles.proHistoryDetailSmall}>
                                            <FiCreditCard size={12} style={styles.proIconSmall} /> 
                                            <span style={{fontStyle: 'italic'}}>Payment: {app.payment_method} (Ref: {app.payment_reference_number})</span>
                                        </p>
                                    )}

                                    {/* Display Submitted Files */}
                                    {app.requirements_file_paths && app.requirements_file_paths.length > 0 && (
                                        <div style={styles.fileList}>
                                            <strong><FiPaperclip size={14} style={{marginRight: '5px'}} /> Submitted Files ({app.requirements_file_paths.length}):</strong>
                                            <div style={styles.fileLinks}>
                                                {app.requirements_file_paths.map((fileUrl, index) => (
                                                    <a 
                                                        key={index} 
                                                        href={fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        style={styles.fileLink}
                                                    >
                                                        File {index + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={styles.historyActions}>
                                        {(app.status === 'Pending' || app.status === 'Cancelled') && (
                                            <button 
                                                style={styles.actionButton('delete')} 
                                                onClick={() => handleOpenConfirmation('delete', app.id, app.document_name)}
                                            >
                                                {/* MODIFICATION: Icon-only delete button */}
                                                <FiTrash2 size={18} /> 
                                            </button>
                                        )}
                                        {app.status === 'Pending' && (
                                            <button 
                                                style={styles.actionButton('cancel')} 
                                                onClick={() => handleOpenConfirmation('cancel', app.id, app.document_name)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {/* REMOVED VIEW BUTTON */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Application Modal */}
            {isModalOpen && currentDocument && (
                <div style={modalStyles.backdrop}>
                    <div style={modalStyles.modal}>
                        <div style={modalStyles.modalHeader}>
                            <h2>Apply for {currentDocument.document_name}</h2>
                            <button onClick={closeModal} style={modalStyles.closeButton}><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleApply}>
                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Applicant Full Name *</label>
                                <input 
                                    type="text" 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    style={modalStyles.input} 
                                    required 
                                />
                            </div>
                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Purpose of Application *</label>
                                <textarea 
                                    value={purpose} 
                                    onChange={(e) => setPurpose(e.target.value)} 
                                    style={modalStyles.textarea} 
                                    placeholder="e.g., Job application, School registration, Business permit renewal"
                                    required 
                                />
                            </div>

                            {/* Requirements Section */}
                            <div style={modalStyles.requirementsBox}>
                                <h3 style={modalStyles.requirementsHeader}><FiPaperclip /> Required Documents</h3>
                                <p style={modalStyles.requirementsList}>
                                    {currentDocument.requirements}
                                </p>
                                
                                <div style={modalStyles.formGroup}>
                                    <label style={modalStyles.label}>Upload Requirements *</label>
                                    <input 
                                        type="file" 
                                        onChange={handleRequirementsChange} 
                                        style={modalStyles.fileInput} 
                                        multiple 
                                        accept="image/*,application/pdf"
                                        required={requirementsFiles.length === 0}
                                    />
                                    {requirementsFiles.length > 0 && <small style={modalStyles.hint}>Files ready: {requirementsFiles.length} uploaded.</small> }
                                    <small style={modalStyles.hint}>Accepted formats: Image (PNG, JPG) or PDF. Max 5 files.</small>
                                </div>
                            </div>

                            {/* Payment Section (if fee is required) */}
                            {currentDocument.fee > 0 && (
                                <div style={modalStyles.paymentBox}>
                                    <h3 style={modalStyles.requirementsHeader}><FiDollarSign /> Payment Details</h3>
                                    <p style={modalStyles.paymentFee}>
                                        Required Fee: ₱{currentDocument.fee.toFixed(2)}
                                    </p>
                                    
                                    {/* Barangay Payment Accounts */}
                                    {barangayPaymentDetails.length > 0 && (
                                        <div style={modalStyles.paymentAccountList}>
                                            <h4 style={modalStyles.accountHeader}><FiCreditCard size={16} /> Pay to:</h4>
                                            {barangayPaymentDetails.map((detail, index) => (
                                                <p key={index} style={modalStyles.accountDetail}>
                                                    <strong>{detail.method_name} ({detail.account_name}):</strong> {detail.account_number}
                                                </p>
                                            ))}
                                            <small style={modalStyles.hint}>Please pay the fee to one of the accounts above before submitting.</small>
                                        </div>
                                    )}
                                    
                                    {/* User Payment Method and Reference Number Input */}
                                    <div style={modalStyles.paymentInputGroup}>
                                        <div style={{...modalStyles.formGroup, flex: 1}}>
                                            <label style={modalStyles.label}>Payment Method Used *</label>
                                            <select 
                                                value={paymentMethod} 
                                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                                style={modalStyles.input} 
                                                required={currentDocument.fee > 0}
                                            >
                                                <option value="" disabled>Select Method</option>
                                                {barangayPaymentDetails.map((detail, index) => (
                                                    <option key={index} value={detail.method_name}>{detail.method_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{...modalStyles.formGroup, flex: 2}}>
                                            <label style={modalStyles.label}>Payment Reference Number *</label>
                                            <input 
                                                type="text" 
                                                placeholder="Enter reference number (e.g., 1234567890)"
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                style={modalStyles.input}
                                                required={currentDocument.fee > 0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" style={modalStyles.submitButton} disabled={!isLoggedIn}>
                                Submit Application
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                title={confirmAction === 'delete' ? 'Confirm Permanent Deletion' : 'Confirm Cancellation'}
                message={
                    confirmAction === 'delete' 
                        ? `WARNING: This will permanently DELETE your application for ${targetApplication?.name} (ID: ${targetApplication?.id}). This action cannot be undone.`
                        : `Are you sure you want to CANCEL your application for ${targetApplication?.name} (ID: ${targetApplication?.id})? You can delete it later if needed.`
                }
                onConfirm={handleConfirmAction}
                onCancel={handleCloseConfirmation}
                confirmText={confirmAction === 'delete' ? 'Permanently Delete' : 'Yes, Cancel Application'}
                confirmStyle={confirmAction}
            />
            
            {/* Styles Definition (Must be included last or in a separate file/style-block) */}
            <style jsx>{`
                /* Global Styles */
                button {
                    transition: background-color 0.2s;
                }
                button:hover:not(:disabled) {
                    opacity: 0.9;
                }
                button:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
};

// Styles object for DocumentsPage
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px',
    },
    subheader: {
        color: '#4b5563',
        marginBottom: '30px',
        fontSize: '16px',
    },
    successBox: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid #10b981',
    },
    loginAlert: {
        backgroundColor: '#fffbeb',
        color: '#92400e',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #f59e0b',
    },
    documentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
    },
    card: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
    },
    icon: {
        color: '#2563eb',
        marginRight: '10px',
    },
    documentName: {
        fontSize: '1.4rem',
        color: '#1f2937',
        margin: '0',
    },
    description: {
        color: '#6b7280',
        fontSize: '0.95rem',
        marginBottom: '15px',
        flexGrow: 1,
    },
    details: {
        borderTop: '1px solid #f3f4f6',
        paddingTop: '15px',
        marginBottom: '15px',
    },
    detailItem: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '1rem',
        color: '#10b981',
        marginBottom: '5px',
        fontWeight: '600',
    },
    requirements: {
        fontSize: '0.85rem',
        color: '#4b5563',
        marginTop: '10px',
    },
    applyButton: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        marginTop: 'auto', 
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '8px',
        cursor: 'not-allowed',
        fontSize: '1rem',
        fontWeight: '600',
        marginTop: 'auto',
    },
    
    // History Section Styles
    historySection: {
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb',
    },
    historyHeader: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '15px',
    },
    historyGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
    },
    // * NEW PROFESSIONAL HISTORY ITEM STYLE *
    proHistoryItem: {
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s',
        position: 'relative', // ADDED: Required for watermark positioning
        overflow: 'hidden', // ADDED: To contain the rotated watermark
    },
    historyItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '10px',
        zIndex: 2, // Ensure header is above watermark
    },
    historyDocumentName: {
        fontSize: '1.3rem',
        color: '#1f2937',
        margin: '0',
        fontWeight: '700',
    },
    proHistoryDetail: {
        fontSize: '0.95rem',
        color: '#4b5563',
        margin: '5px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 2,
    },
    proHistoryDetailSmall: {
        fontSize: '0.85rem',
        color: '#6b7280',
        margin: '3px 0 0 0',
        paddingLeft: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderLeft: '2px solid #e5e7eb',
        zIndex: 2,
    },
    proIcon: {
        color: '#2563eb',
    },
    proIconSmall: {
        color: '#6b7280',
    },
    // * END NEW PROFESSIONAL HISTORY ITEM STYLE *
    
    // NEW Styles for File List (MODIFIED FOR HORIZONTAL ALIGNMENT)
    fileList: {
        marginTop: '15px',
        padding: '10px 0',
        borderTop: '1px dashed #e5e7eb',
        fontSize: '0.9rem',
        color: '#1f2937',
        zIndex: 2,
    },
    fileLinks: {
        marginTop: '5px',
        display: 'flex',
        flexDirection: 'row', // MODIFIED for horizontal alignment
        flexWrap: 'wrap',    // ADDED to allow wrapping if too many files
        gap: '8px',          // MODIFIED: Increased gap for better horizontal spacing
    },
    fileLink: {
        color: '#2563eb',
        textDecoration: 'none',
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'color 0.2s',
    },
    // End NEW Styles
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
    statusBadge: (status) => {
        let color = '#374151'; 
        let backgroundColor = '#f3f4f6';
        if (status === 'Pending') {
            color = '#92400e'; 
            backgroundColor = '#fffbeb';
        } else if (status === 'Approved') {
            color = '#065f46'; 
            backgroundColor = '#d1fae5';
        } else if (status === 'Rejected') {
            color = '#991b1b'; 
            backgroundColor = '#fee2e2';
        } else if (status === 'Cancelled' || status === 'Completed') {
            color = '#4b5563'; 
            backgroundColor = '#e5e7eb';
        }
        return {
            color,
            backgroundColor,
            padding: '5px 10px',
            borderRadius: '15px',
            fontWeight: '600',
            textAlign: 'center',
            fontSize: '0.8rem', // Slightly smaller for professional look
            zIndex: 2,
        };
    },
    // UPDATED: Action Button Styles
    actionButton: (type) => {
        let common = {
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'background-color 0.2s, color 0.2s',
            // ADDED: For icon alignment/centering
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
        };

        if (type === 'delete') {
            // MODIFIED: Icon-only button styles
            return {
                ...common,
                backgroundColor: '#dc2626', // Red for danger/delete
                color: 'white',
                padding: '8px 10px', // Smaller padding suitable for an icon
            };
        } else if (type === 'cancel') {
            // Secondary action: Muted blue background, blue text for theme consistency
            return {
                ...common,
                backgroundColor: '#eff6ff', // Very light blue
                color: '#2563eb', // Primary Blue text
                border: '1px solid #bfdbfe', // Light Blue border
                padding: '8px 12px',
            };
        }
        return common; 
    },
    cancelledWatermark: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '3.5rem',
        fontWeight: '900',
        color: 'rgba(239, 68, 68, 0.12)', // Red/Pink tint, semi-transparent
        pointerEvents: 'none',
        zIndex: 1,
        whiteSpace: 'nowrap',
    },
    noHistory: {
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    }
};

// Styles object for Modal
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
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '15px',
        marginBottom: '20px',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#6b7280',
    },
    formGroup: {
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontWeight: '600',
        marginBottom: '5px',
        color: '#1f2937',
    },
    input: {
        padding: '10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '1rem',
    },
    textarea: {
        padding: '10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '1rem',
        minHeight: '80px',
        resize: 'vertical',
    },
    hint: {
        fontSize: '0.8rem',
        color: '#6b7280',
        marginTop: '5px',
    },
    fileInput: {
        padding: '10px 0',
    },
    requirementsBox: {
        border: '2px dashed #f59e0b',
        backgroundColor: '#fffbeb',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    requirementsHeader: {
        fontSize: '1.2rem',
        color: '#92400e',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    requirementsList: {
        fontSize: '0.9rem',
        color: '#4b5563',
        marginBottom: '10px',
        paddingLeft: '10px',
        borderLeft: '3px solid #f59e0b',
    },
    paymentBox: {
        border: '2px dashed #34d399',
        backgroundColor: '#ecfdf5',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
    },
    paymentFee: {
        color: '#065f46',
        fontWeight: '700',
        marginBottom: '10px',
        fontSize: '1.1rem',
    },
    paymentAccountList: {
        backgroundColor: '#ffffff',
        border: '1px solid #a7f3d0',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '10px',
    },
    accountHeader: {
        fontSize: '1rem',
        color: '#047857',
        borderBottom: '1px dashed #d1fae5',
        paddingBottom: '5px',
        marginBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    accountDetail: {
        fontSize: '0.9rem',
        color: '#10b981',
        margin: '3px 0',
    },
    paymentInputGroup: {
        display: 'flex',
        gap: '15px',
        marginTop: '15px',
    },
    submitButton: {
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1.1rem',
        fontWeight: '700',
        width: '100%',
        marginTop: '20px',
    }
};

export default DocumentsPage;