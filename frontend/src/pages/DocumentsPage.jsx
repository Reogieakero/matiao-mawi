import React, { useState, useEffect } from 'react';
// Added FiCreditCard for payment details
import { FiFileText, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiLogIn, FiX, FiPaperclip, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const DocumentsPage = ({ userEmail, userName, profilePictureUrl }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // State for the Application Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);

    // State for the Form Inputs
    const [fullName, setFullName] = useState(userName || '');
    const [purpose, setPurpose] = useState('');
    const [requirementsFiles, setRequirementsFiles] = useState([]); 
    
    // NEW Payment States
    const [paymentMethod, setPaymentMethod] = useState(''); // Selected payment method (e.g., 'GCash')
    const [referenceNumber, setReferenceNumber] = useState(''); // Reference number input
    // State for fetched Barangay payment accounts
    const [barangayPaymentDetails, setBarangayPaymentDetails] = useState([]); 
    
    const isLoggedIn = !!userEmail; 
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
        fetchPaymentDetails(); // NEW: Fetch payment details on load
    }, []);

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
    
    // Function to fetch Barangay payment details
    const fetchPaymentDetails = async () => {
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
        // Reset new payment states
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
        
        if (!currentDocument || !fullName || !purpose || requirementsFiles.length === 0) {
            alert('Please fill out all required text fields and upload the necessary requirements.');
            return;
        }
        
        const feeRequired = currentDocument.fee > 0;
        
        // Conditional check for payment method/reference number
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
        // requirementsDetails is optional, but still sent
        formData.append('requirements_details', currentDocument.requirements); 
        
        // Append all requirements files
        requirementsFiles.forEach((file) => {
            formData.append('requirements', file); // 'requirements' must match multer field name
        });
        
        // Append new payment details
        if (feeRequired) {
             formData.append('payment_method', paymentMethod); 
             formData.append('payment_reference_number', referenceNumber); 
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/documents/apply', {
                method: 'POST',
                // Content-Type is NOT set for FormData with files
                body: formData, 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit application due to a server error.');
            }
            
            closeModal();
            setSuccessMessage(
                `Successfully applied for: ${currentDocument.document_name}.\nYour application is **Pending** review. Application ID: ${data.applicationId}`
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
                    **Action Required:** You must be logged in to submit an application. Please log in or create an account.
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
                                Fee: 
                                <span>{doc.fee > 0 ? `₱${doc.fee.toFixed(2)}` : 'FREE'}</span>
                            </div>
                            {/* Display requirements prominently in the card */}
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
            
            {/* ========================================================= */}
            {/* APPLICATION MODAL */}
            {/* ========================================================= */}
            {isModalOpen && currentDocument && (
                <div style={modalStyles.backdrop}>
                    <div style={modalStyles.modal}>
                        <div style={modalStyles.modalHeader}>
                            <h2>Application for: {currentDocument.document_name}</h2>
                            <button onClick={closeModal} style={modalStyles.closeButton}><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleApply} style={modalStyles.form}>
                            
                            {/* Document Requirements Display (Updated Style) */}
                            <div style={modalStyles.requirementsBox}>
                                <h3 style={modalStyles.requirementsHeader}><FiPaperclip /> Official Requirements</h3>
                                <p style={modalStyles.requirementsContent}>
                                    {currentDocument.requirements || "No specific requirements listed. Please provide all necessary supporting documents."}
                                </p>
                            </div>

                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Full Name of Applicant *</label>
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
                                    required 
                                />
                                <small style={modalStyles.hint}>e.g., Job application, School requirement, Financial assistance.</small>
                            </div>
                            
                            {/* Requirements File Upload */}
                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>Upload Requirements (Max 5 files) *</label>
                                <input 
                                    type="file" 
                                    accept="image/*,application/pdf" 
                                    onChange={handleRequirementsChange} 
                                    style={modalStyles.fileInput} 
                                    multiple // Allows multiple file selection
                                    required 
                                />
                                {requirementsFiles.length > 0 && 
                                    <small style={modalStyles.hint}>Files ready: {requirementsFiles.length} uploaded.</small>
                                }
                                <small style={modalStyles.hint}>Accepted formats: Image (PNG, JPG) or PDF. Max 5 files.</small>
                            </div>
                            
                            {/* Payment Section (if fee is required) */}
                            {currentDocument.fee > 0 && (
                                <div style={modalStyles.paymentBox}>
                                    <h3 style={modalStyles.requirementsHeader}><FiDollarSign /> Payment Details</h3>
                                    <p style={modalStyles.paymentFee}>
                                        **Required Fee: ₱{currentDocument.fee.toFixed(2)}** </p>
                                    
                                    {/* Barangay Payment Accounts (NEW) */}
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

                                    {/* User Payment Method and Reference Number Input (NEW) */}
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
                                    <small style={modalStyles.hint}>Providing the correct reference number is crucial for verification.</small>
                                </div>
                            )}

                            <div style={modalStyles.formActions}>
                                <button type="submit" style={modalStyles.submitButton}>
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
    },
    header: {
        color: '#2563eb',
        marginBottom: '10px',
        borderBottom: '2px solid #eff6ff',
        paddingBottom: '10px',
    },
    subheader: {
        color: '#4b5563',
        marginBottom: '30px',
        fontSize: '16px',
    },
    documentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
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
        lineHeight: '1.4',
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
        transition: 'background-color 0.3s',
        marginTop: 'auto',
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        color: '#f3f4f6',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'not-allowed',
        marginTop: 'auto',
    },
    successBox: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        whiteSpace: 'pre-wrap',
    },
    loginAlert: {
        backgroundColor: '#fffae6',
        color: '#92400e',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '1rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
    },
    noDocuments: {
        textAlign: 'center',
        marginTop: '50px',
        color: '#9ca3af',
    }
};


// Styles for the Modal Popup
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
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
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
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    formGroup: {
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
    paymentBox: {
        border: '2px dashed #34d399', // Changed color to green/success color
        backgroundColor: '#ecfdf5', // Light green background
        padding: '15px',
        borderRadius: '8px',
    },
    paymentFee: {
        color: '#065f46',
        fontWeight: '700',
        marginBottom: '10px',
        fontSize: '1.1rem',
    },
    paymentInputGroup: {
        display: 'flex',
        gap: '15px',
        marginTop: '15px',
    },
    paymentAccountList: {
        backgroundColor: '#fff',
        border: '1px solid #d1d5db',
        padding: '10px',
        borderRadius: '6px',
        marginTop: '10px',
        marginBottom: '15px',
    },
    accountHeader: {
        fontSize: '1rem',
        color: '#1f2937',
        margin: '0 0 5px 0',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    accountDetail: {
        fontSize: '0.9rem',
        margin: '5px 0',
        color: '#4b5563',
    },
    formActions: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end',
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
        transition: 'background-color 0.3s',
    },
    // UPDATED STYLE: Removed color bar and used a neutral border
    requirementsBox: { 
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
    },
    // UPDATED STYLE: Neutralized color
    requirementsHeader: {
        margin: '0 0 10px 0',
        color: '#1f2937', 
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #e5e7eb', // Added a subtle separator
        paddingBottom: '5px',
    },
    requirementsContent: {
        margin: 0,
        color: '#4b5563',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap', 
    }
};

export default DocumentsPage;