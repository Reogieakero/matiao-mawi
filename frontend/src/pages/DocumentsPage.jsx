import React, { useState, useEffect } from 'react'; // MODIFIED: Added useEffect
import { FiFileText, FiDownload, FiInfo, FiSend } from 'react-icons/fi';
// NOTE: Sidebar is correctly omitted here as it is rendered globally in App.jsx
import RightPanel from '../components/RightPanel'; 

// Define the available documents
const documentTypes = [
    { 
        id: 1, 
        name: "Barangay Clearance", 
        description: "Required for employment, school, or business permit applications.", 
        fee: 50.00,
        // MODIFIED: Added requirements field
        requirements: ["Valid ID (e.g., Driver's License, Passport, or Voter's ID)", "Proof of Residency (e.g., latest utility bill)", "Community Tax Certificate (Cedula)"], 
    },
    { 
        id: 2, 
        name: "Certificate of Indigency", 
        description: "For free legal aid, medical assistance, or scholarship applications.", 
        fee: 0.00,
        // MODIFIED: Added requirements field
        requirements: ["Valid ID (with barangay address)", "Proof of Income Status (e.g., No Income Certification from the Barangay Captain)"], 
    },
    { 
        id: 3, 
        name: "Certificate of Residency", 
        description: "Proof that you are a bonafide resident of the barangay.", 
        fee: 20.00,
        // MODIFIED: Added requirements field
        requirements: ["Valid ID", "Proof of Residency for at least 6 months (e.g., utility bill or land title)"], 
    },
    { 
        id: 4, 
        name: "Business Permit Recommendation", 
        description: "Endorsement for starting or renewing a small business.", 
        fee: 100.00,
        // MODIFIED: Added requirements field
        requirements: ["DTI or SEC Registration (for new business)", "Previous Business Permit (for renewal)", "Sketch of Business Location"], 
    },
];

// NEW: Define the available downloadable documents (based on user1.pdf and user2.pdf in public/forms)
const availableDownloads = [
    { id: 'u1', name: "Barangay Clearance", file: "user1.pdf" },
    { id: 'u2', name: "Certificate of Residency", file: "user2.pdf" },
];


// NEW: Transaction History Component
const TransactionHistory = ({ currentUserId }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const idToFetch = currentUserId || 1; // Use 1 as a fallback for the placeholder

        if (!idToFetch) {
            setError("User ID is required to fetch transactions.");
            setIsLoading(false);
            return;
        }

        const fetchTransactions = async () => {
            try {
                // This URL assumes the server is running on localhost:5000 as defined in server.js
                const response = await fetch(`http://localhost:5000/api/document-applications/${idToFetch}`);
                const data = await response.json();

                if (response.ok) {
                    setTransactions(data);
                } else {
                    setError(data.message || 'Failed to fetch transaction history.');
                }
            } catch (err) {
                console.error("Fetch transaction error:", err);
                setError('Network error. Could not connect to the server.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [currentUserId]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { backgroundColor: '#fff7ed', color: '#b45309', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
            case 'Approved': return { backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
            case 'Rejected': return { backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
            default: return { backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
        }
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (isLoading) {
        // Apply transactionSection styles here for padding/background
        return (
            <section style={documentStyles.transactionSection}>
                <p style={{ textAlign: 'center', color: '#4b5563' }}>Loading application status...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section style={documentStyles.transactionSection}>
                <p style={{ textAlign: 'center', color: '#ef4444', padding: '10px 0' }}>Error: {error}</p>
            </section>
        );
    }
    
    return (
        <section style={documentStyles.transactionSection}>
            <h2 style={documentStyles.sectionTitle}>
                <FiInfo size={24} style={{ marginRight: '8px', color: '#3b82f6' }} />
                Your Application Status
            </h2>
            {transactions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '10px 0' }}>
                    You have no document application transactions yet.
                </p>
            ) : (
                <div style={documentStyles.transactionList}>
                    {transactions.map((transaction) => (
                        <div key={transaction.id} style={documentStyles.transactionItem}>
                            <div style={documentStyles.transactionHeader}>
                                <span style={documentStyles.transactionDocName}>
                                    {transaction.document_name}
                                </span>
                                <span style={getStatusStyle(transaction.status)}>
                                    {transaction.status}
                                </span>
                            </div>
                            <p style={documentStyles.transactionPurpose}>Purpose: {transaction.purpose}</p>
                            <div style={documentStyles.transactionFooter}>
                                <span style={documentStyles.transactionInfo}>
                                    Date: {formatDate(transaction.created_at)}
                                </span>
                                <span style={documentStyles.transactionInfo}>
                                    Fee: ₱{parseFloat(transaction.fee).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};


// Document Card Component
const DocumentCard = ({ doc, onApplyClick }) => {
    return (
        <div style={documentStyles.card}>
            <div style={documentStyles.cardHeader}>
                <FiFileText size={24} style={documentStyles.icon} />
                <h3 style={documentStyles.docName}>{doc.name}</h3>
            </div>
            <p style={documentStyles.docDescription}>{doc.description}</p>
            <div style={documentStyles.cardFooter}>
                <span style={documentStyles.docFee(doc.fee)}>{doc.fee === 0.00 ? 'FREE' : `₱${doc.fee.toFixed(2)}`}</span>
                <button
                    style={documentStyles.applyButton}
                    onClick={() => onApplyClick(doc)}
                >
                    <FiSend size={16} /> Apply Now
                </button>
            </div>
        </div>
    );
};


// Application Modal Component
// MODIFIED: Added currentUserId prop
const ApplicationModal = ({ document, onClose, userName, userEmail, currentUserId }) => {
    const [purpose, setPurpose] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!purpose.trim() || !currentUserId) {
            setSubmitMessage("Error: Missing purpose or User ID.");
            return;
        }

        setIsLoading(true);
        setSubmitMessage('');

        const applicationData = {
            userId: currentUserId,
            documentName: document.name,
            purpose: purpose,
            fee: document.fee
        };

        try {
            const response = await fetch('http://localhost:5000/api/document-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationData),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitMessage(`Application submitted successfully! Transaction ID: ${data.transactionId}. Status: ${data.status}`);
                setIsSubmitted(true);
            } else {
                setSubmitMessage(`Submission failed: ${data.message || 'Server error.'}`);
            }

        } catch (error) {
            console.error('Application submission error:', error);
            setSubmitMessage('Network error. Failed to connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div style={documentStyles.modalBackdrop}>
                <div style={documentStyles.modalContent}>
                    <h2 style={documentStyles.modalHeader}>✅ Application Sent!</h2>
                    <p>Your application for {document.name} has been successfully submitted.</p>
                    <p style={{ color: '#059669', fontWeight: 'bold' }}>
                        {submitMessage}
                    </p>
                    <p>
                        You will be notified via email ({userEmail}) regarding the status.
                    </p>
                    <button style={documentStyles.closeButtonSuccess} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={documentStyles.modalContent}>
                <h2 style={documentStyles.modalHeader}>Apply for: {document.name}</h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                {/* NEW: Document Requirements Section */}
                {document.requirements && (
                    <div style={documentStyles.requirementsSection}>
                        <h3 style={documentStyles.requirementsTitle}>Required Documents / Information:</h3>
                        <ul style={documentStyles.requirementsList}>
                            {document.requirements.map((req, index) => (
                                <li key={index} style={documentStyles.requirementItem}>
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <p style={documentStyles.modalInfo}>
                    <FiInfo size={14} style={{ marginRight: '5px' }} />
                    Fee: {document.fee === 0.00 ? 'FREE' : `₱${document.fee.toFixed(2)}`}
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={documentStyles.formGroup}>
                        <label style={documentStyles.label}>Applicant Name:</label>
                        <input type="text" value={userName} readOnly style={documentStyles.inputReadOnly} />
                    </div>
                    <div style={documentStyles.formGroup}>
                        <label style={documentStyles.label}>Email Address:</label>
                        <input type="email" value={userEmail} readOnly style={documentStyles.inputReadOnly} />
                    </div>
                    {/* User ID for backend transaction tracking (Hidden/Read-only for display) */}
                    <div style={documentStyles.formGroup}>
                        <label style={documentStyles.label}>Applicant ID (for transaction):</label>
                        <input type="text" value={currentUserId} readOnly style={documentStyles.inputReadOnly} />
                    </div>
                    <div style={documentStyles.formGroup}>
                        <label htmlFor="purpose" style={documentStyles.label}>
                            Purpose of Document <span style={{ color: 'red' }}>*</span>
                        </label>
                        <textarea
                            id="purpose"
                            rows="4"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            required
                            style={documentStyles.textarea}
                            placeholder="e.g., Job application, Scholarship, Business permit renewal, etc."
                        />
                    </div>
                    <button
                        type="submit"
                        style={documentStyles.submitButton(isLoading)}
                        disabled={isLoading || !purpose.trim()}
                    >
                        {isLoading ? 'Processing...' : <><FiSend size={16} /> Submit Application</>}
                    </button>
                </form>
                {submitMessage && !isSubmitted && (
                    <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
                        {submitMessage}
                    </p>
                )}
            </div>
        </div>
    );
};


// Main Documents Page Component
// MODIFIED: Added currentUserId prop
export default function DocumentsPage({ userName, userEmail, profilePictureUrl, currentUserId }) {
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    // Placeholder ID if currentUserId is not provided (for demonstration)
    const PLACEHOLDER_USER_ID = currentUserId || 1; 

    const handleApplyClick = (doc) => {
        setSelectedDocument(doc);
    };

    const handleModalClose = () => {
        setSelectedDocument(null);
    };

    return (
        <div style={documentStyles.pageContainer}>
            {/* The main content area */}
            <main style={documentStyles.contentArea}>
                <h1 style={documentStyles.mainTitle}> 
                    Barangay Documents Application
                </h1>
                <p style={documentStyles.subtitle}>
                    Apply for official barangay documents online. Processing times may vary.
                </p>

                <div style={documentStyles.gridContainer}>
                    {documentTypes.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} onApplyClick={handleApplyClick} />
                    ))}
                </div>

                <section style={documentStyles.downloadSection}>
                    <h2 style={documentStyles.sectionTitle}>
                        <FiDownload size={24} style={{ marginRight: '8px' }} />
                        Available Documents
                    </h2>
                    <div style={documentStyles.downloadList}>
                        {/* Dynamically generate links with download icon and no extra text */}
                        {availableDownloads.map(item => (
                            <a 
                                key={item.id} 
                                href={`/forms/${item.file}`} 
                                download 
                                // Left border is removed via updated documentStyles.downloadLink
                                style={documentStyles.downloadLink} 
                            >
                                <span>{item.name}</span>
                                <FiDownload size={18} />
                            </a>
                        ))}
                    </div>
                </section>

                {/* NEW: Transaction History Section */}
                <TransactionHistory currentUserId={PLACEHOLDER_USER_ID} /> 
                
            </main>
            {/* RightPanel is rendered here to maintain the fixed layout */}
            <RightPanel userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />
            {selectedDocument && (
                <ApplicationModal 
                    document={selectedDocument} 
                    onClose={handleModalClose} 
                    userName={userName} 
                    userEmail={userEmail} 
                    currentUserId={PLACEHOLDER_USER_ID} // Passed for transaction logging
                />
            )}
        </div>
    );
}

const documentStyles = {
    // MODIFIED: Removed display: 'flex' as RightPanel is a fixed element
    pageContainer: { 
        minHeight: '100vh', 
        width: '100%',
    },
    // MODIFIED: Added sufficient paddingRight and paddingTop to prevent overlap with fixed RightPanel and Header
    contentArea: {
        width: '100%',
        paddingTop: '30px', // Aligns with HomePage.jsx top padding for Header clearance
        paddingLeft: '15px', 
        // Right padding to clear the 320px wide RightPanel + 20px right offset + ~20px gap = 360px clearance
        paddingRight: '350px', 
        paddingBottom: '50px',
        boxSizing: 'border-box',
    },
    
    mainTitle: { 
        fontSize: '24px', // Matches HomePage.jsx styles.sectionTitle
        fontWeight: '700', // Matches HomePage.jsx styles.sectionTitle
        color: '#1e40af', // Matches HomePage.jsx styles.sectionTitle
        margin: '0', 
        marginBottom: '5px', // Tighter spacing to subtitle
    },
    subtitle: {
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 30px 0', // Added bottom margin for spacing before the grid, similar to spacing in HomePage.jsx
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        // Left border removed as requested
        transition: 'box-shadow 0.3s',
        minHeight: '180px',
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
    docName: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1e3a8a',
        margin: '0',
    },
    docDescription: {
        fontSize: '14px',
        color: '#4b5563',
        flexGrow: 1,
        marginBottom: '15px',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
    },
    docFee: (fee) => ({
        fontSize: '16px',
        fontWeight: '700',
        color: fee === 0 ? '#059669' : '#b45309',
        padding: '5px 10px',
        backgroundColor: fee === 0 ? '#ecfdf5' : '#fff7ed',
        borderRadius: '6px',
    }),
    applyButton: {
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
    },

    // --- Modal Styles (Updated for Requirements) ---
    modalBackdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        position: 'relative',
    },
    modalHeader: {
        color: '#1e40af',
        borderBottom: '2px solid #eff6ff',
        paddingBottom: '10px',
        marginBottom: '20px',
        fontSize: '22px',
    },
    modalClose: {
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#9ca3af',
    },
    modalInfo: {
        backgroundColor: '#f0f9ff',
        borderLeft: '4px solid #3b82f6',
        padding: '10px',
        marginBottom: '20px', 
        fontSize: '14px',
        color: '#1e40af',
        display: 'flex',
        alignItems: 'center',
    },
    // NEW Styles for Requirements Section
    requirementsSection: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
    },
    requirementsTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#374151',
        margin: '0 0 10px 0',
        paddingBottom: '5px',
        borderBottom: '1px dashed #d1d5db',
    },
    requirementsList: {
        listStyle: 'disc',
        paddingLeft: '20px',
        margin: '0',
    },
    requirementItem: {
        fontSize: '14px',
        color: '#4b5563',
        marginBottom: '5px',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '600',
        color: '#374151',
        fontSize: '14px',
    },
    inputReadOnly: {
        width: '95%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
        fontSize: '16px',
    },
    textarea: {
        width: '95%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        resize: 'vertical',
        fontSize: '16px',
    },
    submitButton: (isLoading) => ({
        width: '100%',
        padding: '12px',
        backgroundColor: isLoading ? '#60a5fa' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.2s',
    }),
    closeButtonSuccess: {
        backgroundColor: '#059669',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        marginTop: '20px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
    
    // MODIFIED: Removed borderTop
    downloadSection: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px', // Added bottom margin to separate from the new section
    },
    sectionTitle: {
        fontSize: '20px',
        color: '#1e3a8a',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        fontWeight: '600',
    },
    downloadList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    // MODIFIED: borderLeft is removed here as requested.
    downloadLink: { 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 15px',
        backgroundColor: '#eff6ff',
        color: '#1e40af',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '500',
        // borderLeft: '3px solid #60a5fa', <-- REMOVED
        transition: 'background-color 0.2s',
    },

    // NEW Styles for Transaction Section
    transactionSection: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginTop: '20px', // Spacing after download section
    },
    transactionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    transactionItem: {
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#f9fafb',
    },
    transactionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px dotted #d1d5db',
    },
    transactionDocName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e40af',
    },
    transactionPurpose: {
        fontSize: '14px',
        color: '#4b5563',
        margin: '0 0 10px 0',
    },
    transactionFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6b7280',
    },
    transactionInfo: {
        // Style for date/fee info in the footer
    },
};