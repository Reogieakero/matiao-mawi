import React, { useState } from 'react';
import { FiFileText, FiDownload, FiInfo, FiSend } from 'react-icons/fi';
// NOTE: Sidebar is correctly omitted here as it is rendered globally in App.jsx
import RightPanel from '../components/RightPanel'; 

// Define the available documents
const documentTypes = [
    { id: 1, name: "Barangay Clearance", description: "Required for employment, school, or business permit applications.", fee: 50.00 },
    { id: 2, name: "Certificate of Indigency", description: "For free legal aid, medical assistance, or scholarship applications.", fee: 0.00 },
    { id: 3, name: "Certificate of Residency", description: "Proof that you are a bonafide resident of the barangay.", fee: 20.00 },
    { id: 4, name: "Business Permit Recommendation", description: "Endorsement for starting or renewing a small business.", fee: 100.00 },
];

// NEW: Define the available downloadable documents (based on user1.pdf and user2.pdf in public/forms)
const availableDownloads = [
    { id: 'u1', name: "Barangay Clearance", file: "user1.pdf" },
    { id: 'u2', name: "Certificate of Residency", file: "user2.pdf" },
];


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
const ApplicationModal = ({ document, onClose, userName, userEmail }) => {
    const [purpose, setPurpose] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!purpose.trim()) return;

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            console.log(`Application submitted for ${document.name}:`, { userName, userEmail, purpose });
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div style={documentStyles.modalBackdrop}>
                <div style={documentStyles.modalContent}>
                    <h2 style={documentStyles.modalHeader}>✅ Application Sent!</h2>
                    <p>Your application for {document.name} has been successfully submitted.</p>
                    <p style={{ color: '#059669', fontWeight: 'bold' }}>
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
            </div>
        </div>
    );
};


// Main Documents Page Component
export default function DocumentsPage({ userName, userEmail, profilePictureUrl }) {
    const [selectedDocument, setSelectedDocument] = useState(null);

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
                        Your Available Documents
                    </h2>
                    <div style={documentStyles.downloadList}>
                        {/* MODIFIED: Dynamically generate links with download icon and no extra text */}
                        {availableDownloads.map(item => (
                            <a 
                                key={item.id} 
                                href={`/forms/${item.file}`} 
                                download 
                                // This style has been modified below to implement flex and space-between
                                style={documentStyles.downloadLink} 
                            >
                                <span>{item.name}</span>
                                <FiDownload size={18} />
                            </a>
                        ))}
                    </div>
                </section>
            </main>
            {/* RightPanel is rendered here to maintain the fixed layout */}
            <RightPanel userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />
            {selectedDocument && (
                <ApplicationModal document={selectedDocument} onClose={handleModalClose} userName={userName} userEmail={userEmail} />
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
        paddingRight: '370px', 
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

    // --- Modal Styles (Unchanged) ---
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
        // borderTop: '3px solid #60a5fa', <-- REMOVED
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
    // MODIFIED: Changed to display: 'flex' and justifyContent: 'space-between' 
    // to put the download icon on the right.
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
        borderLeft: '3px solid #60a5fa',
        transition: 'background-color 0.2s',
    },
};