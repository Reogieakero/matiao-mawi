import React, { useState, useEffect, useCallback } from 'react';
import { 
    FiFileText, 
    FiDownload, 
    FiInfo, 
    FiSend, 
    FiUploadCloud, 
    FiTrash2, 
    FiClock, 
    FiCheckSquare, // New Icon for Select All
    FiSquare,      // New Icon for Select Mode Toggle
    FiXCircle      // New Icon for Bulk Cancel
} from 'react-icons/fi'; 
import RightPanel from '../components/RightPanel';

// Define the available documents
const documentTypes = [
    {
        id: 1,
        name: "Barangay Clearance",
        description: "Required for employment, school, or business permit applications.",
        fee: 50.00,
        requirements: ["Valid ID (e.g., Driver's License, Passport, or Voter's ID)", "Proof of Residency (e.g., latest utility bill)", "Community Tax Certificate (Cedula)"],
    },
    {
        id: 2,
        name: "Certificate of Indigency",
        description: "For free legal aid, medical assistance, or scholarship applications.",
        fee: 0.00,
        requirements: ["Valid ID (with barangay address)", "Proof of Income Status (e.g., No Income Certification from the Barangay Captain)"],
    },
    {
        id: 3,
        name: "Certificate of Residency",
        description: "Proof that you are a bonafide resident of the barangay.",
        fee: 20.00,
        requirements: ["Valid ID", "Proof of Residency for at least 6 months (e.g., utility bill or land title)"],
    },
    {
        id: 4,
        name: "Business Permit Recommendation",
        description: "Endorsement for starting or renewing a small business.",
        fee: 100.00,
        requirements: ["DTI or SEC Registration (for new business)", "Previous Business Permit (for renewal)", "Sketch of Business Location"],
    },
];

// Define the available downloadable documents
const availableDownloads = [
    { id: 'u1', name: "Volunteer Program Form.pdf", file: "/forms/Volunteer.pdf" }, 
    { id: 'u2', name: "Blotter Intake Form.pdf", file: "/forms/Blotter.pdf" }, 
];

// ⭐ Reusable Modal Components -------------------------------------------------------------------

// Single Cancellation Confirmation Modal Component (Kept for individual action)
const CancellationConfirmationModal = ({ transactionId, documentName, onConfirm, onClose }) => {
    // ... (content is the same as before)
    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={{ ...documentStyles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ ...documentStyles.modalHeader, color: '#ef4444' }}>
                    <FiInfo size={24} style={{ marginRight: '8px' }} />
                    Confirm Cancellation
                </h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '20px' }}>
                    Are you sure you want to cancel the application for {documentName} (ID: {transactionId})?
                </p>
                <p style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: '30px' }}>
                    This action updates the status to 'Cancelled' and cannot be reverted to 'Pending'.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={onClose} style={documentStyles.cancelButtonSecondary}>
                        No, Keep Application
                    </button>
                    <button
                        onClick={() => onConfirm(transactionId)}
                        style={documentStyles.cancelButtonPrimary}
                    >
                        Yes, Cancel Application
                    </button>
                </div>
            </div>
        </div>
    );
};

// Single Deletion Confirmation Modal Component (Kept for individual action)
const DeletionConfirmationModal = ({ transactionId, documentName, onConfirm, onClose }) => {
    // ... (content is the same as before)
    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={{ ...documentStyles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ ...documentStyles.modalHeader, color: '#b91c1c' }}>
                    <FiTrash2 size={24} style={{ marginRight: '8px' }} />
                    Confirm Deletion
                </h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '20px' }}>
                    Are you sure you want to permanently delete the record for {documentName} (ID: {transactionId})?
                </p>
                <p style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: '30px' }}>
                    This will remove the transaction from your history. This action cannot be undone.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={onClose} style={documentStyles.cancelButtonSecondary}>
                        No, Keep Record
                    </button>
                    <button
                        onClick={() => onConfirm(transactionId)}
                        style={documentStyles.deleteButtonPrimary} 
                    >
                        Yes, Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

// ⭐ NEW: Bulk Cancellation Confirmation Modal Component
const BulkCancellationConfirmationModal = ({ ids, onConfirm, onClose }) => {
    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={{ ...documentStyles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ ...documentStyles.modalHeader, color: '#ef4444' }}>
                    <FiXCircle size={24} style={{ marginRight: '8px' }} />
                    Confirm Bulk Cancellation
                </h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '20px' }}>
                    Are you sure you want to cancel **{ids.length} pending application(s)**?
                </p>
                <p style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: '30px' }}>
                    Only applications with 'Pending' status will be updated to 'Cancelled'.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={onClose} style={documentStyles.cancelButtonSecondary}>
                        No, Go Back
                    </button>
                    <button
                        onClick={() => onConfirm(ids)}
                        style={documentStyles.cancelButtonPrimary}
                    >
                        Yes, Cancel All ({ids.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

// ⭐ NEW: Bulk Deletion Confirmation Modal Component
const BulkDeletionConfirmationModal = ({ ids, onConfirm, onClose }) => {
    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={{ ...documentStyles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ ...documentStyles.modalHeader, color: '#b91c1c' }}>
                    <FiTrash2 size={24} style={{ marginRight: '8px' }} />
                    Confirm Bulk Deletion
                </h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '20px' }}>
                    Are you sure you want to permanently delete **{ids.length} cancelled record(s)**?
                </p>
                <p style={{ color: '#b91c1c', fontWeight: 'bold', marginBottom: '30px' }}>
                    Only records with 'Cancelled' status will be permanently removed from history. This action cannot be undone.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={onClose} style={documentStyles.cancelButtonSecondary}>
                        No, Go Back
                    </button>
                    <button
                        onClick={() => onConfirm(ids)}
                        style={documentStyles.deleteButtonPrimary} 
                    >
                        Yes, Delete All ({ids.length})
                    </button>
                </div>
            </div>
        </div>
    );
};


// -------------------------------------------------------------------

// Transaction History Component
const TransactionHistory = ({ currentUserId, refreshKey }) => { 
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    // --- New States for Selection and Bulk Actions ---
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [cancellationTarget, setCancellationTarget] = useState(null); // Single target
    const [deletionTarget, setDeletionTarget] = useState(null); // Single target
    const [bulkCancellationTarget, setBulkCancellationTarget] = useState(null); // Bulk target
    const [bulkDeletionTarget, setBulkDeletionTarget] = useState(null); // Bulk target
    // ---------------------------------------------------

    const fetchTransactions = useCallback(async (idToFetch) => {
        // ... (fetch logic remains the same)
        if (!idToFetch) {
            setError("User ID is required to fetch transactions.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetch(`http://localhost:5000/api/document-applications/${idToFetch}`);
            const data = await response.json();

            if (response.ok) {
                setTransactions(data.map(t => ({
                    ...t,
                    requirementsMediaUrl: t.requirementsMediaUrl || [] 
                })));
            } else {
                setError(data.message || 'Failed to fetch transaction history.');
            }
        } catch (err) {
            console.error("Fetch transaction error:", err);
            setError('Network error. Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const idToFetch = currentUserId || 1;
        fetchTransactions(idToFetch);
        // Clear selection and turn off select mode on refresh
        setSelectedTransactions([]);
        setIsSelectMode(false);
    }, [currentUserId, fetchTransactions, refreshKey]); 

    // --- New Selection Handlers ---
    const handleToggleSelect = () => {
        setIsSelectMode(prev => !prev);
        setSelectedTransactions([]); // Clear selection when toggling mode
    };
    
    const handleTransactionSelect = (transactionId) => {
        setSelectedTransactions(prevSelected => {
            if (prevSelected.includes(transactionId)) {
                return prevSelected.filter(id => id !== transactionId);
            } else {
                return [...prevSelected, transactionId];
            }
        });
    };

    // Derived lists for eligible bulk actions
    const pendingTransactions = transactions.filter(t => t.status === 'Pending');
    const cancelledTransactions = transactions.filter(t => t.status === 'Cancelled');

    const pendingSelectedIds = selectedTransactions.filter(id => 
        pendingTransactions.some(t => t.id === id)
    );
    
    const cancelledSelectedIds = selectedTransactions.filter(id => 
        cancelledTransactions.some(t => t.id === id)
    );

    // --- New Bulk Action Handlers (using the new API routes) ---
    
    // Function to handle bulk cancellation API call
    const handleBulkCancelExecute = async (transactionIds) => {
        setBulkCancellationTarget(null); 
        setError(null);
        setSuccessMessage(null);

        try {
            setIsLoading(true);
            
            const response = await fetch(`http://localhost:5000/api/document-application/bulk-cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, transactionIds }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || `${data.affectedRows} application(s) successfully cancelled.`);
                setSelectedTransactions([]); 
                fetchTransactions(currentUserId || 1);
            } else {
                setError(`Bulk Cancellation failed: ${data.message}`);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Bulk cancel transaction error:", err);
            setError('Network error. Could not connect to the server or cancel applications.');
            setIsLoading(false);
        }
    };
    
    // Function to handle bulk deletion API call
    const handleBulkDeleteExecute = async (transactionIds) => {
        setBulkDeletionTarget(null); 
        setError(null);
        setSuccessMessage(null);

        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:5000/api/document-applications/bulk-delete`, {
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, transactionIds }), 
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || `${data.affectedRows} record(s) successfully deleted.`);
                setSelectedTransactions([]); 
                fetchTransactions(currentUserId || 1);
            } else {
                setError(`Bulk Deletion failed: ${data.message}`);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Bulk delete transaction error:", err);
            setError('Network error. Could not connect to the server or delete records.');
            setIsLoading(false);
        }
    };

    // --- Single Action Handlers (updated to use new target states) ---

    // Cancellation handler that executes the API call (PUT to UPDATE status)
    const handleCancelExecute = async (transactionId) => {
        setCancellationTarget(null);
        // ... (Single cancel logic remains the same, calling the single cancel API)
        setError(null);
        setSuccessMessage(null);

        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:5000/api/document-application/cancel/${transactionId}`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || `Application ${transactionId} has been successfully cancelled.`);
                fetchTransactions(currentUserId || 1);
            } else {
                setError(`Cancellation failed: ${data.message}`);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Cancel transaction error:", err);
            setError('Network error. Could not connect to the server or cancel the application.');
            setIsLoading(false);
        }
    };
    
    // Deletion handler that executes the API call (DELETE for permanent removal)
    const handleDeleteExecute = async (transactionId) => {
        setDeletionTarget(null);
        // ... (Single delete logic remains the same, calling the single delete API)
        setError(null);
        setSuccessMessage(null);

        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:5000/api/document-applications/${transactionId}`, {
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || `Record ${transactionId} has been successfully deleted.`);
                fetchTransactions(currentUserId || 1);
            } else {
                setError(`Deletion failed: ${data.message}`);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Delete transaction error:", err);
            setError('Network error. Could not connect to the server or delete the record.');
            setIsLoading(false);
        }
    };


    // --- UI Logic Helpers ---
    const getStatusStyle = (status) => {
        // ... (styles remain the same)
        switch (status) {
            case 'Pending': return { backgroundColor: '#fff7ed', color: '#b45309', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' };
            case 'Approved': return { backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
            case 'Rejected': return { backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
            case 'Cancelled': return { backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' };
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

    // Determine the text for the selection button
    const selectButtonText = isSelectMode ? 'Exit Selection Mode' : 'Select Applications';

    if (isLoading && transactions.length === 0 && refreshKey === 0) { 
        return (
            <section style={documentStyles.transactionSection}>
                <p style={{ textAlign: 'center', color: '#4b5563' }}><FiClock size={16} style={{marginRight: '5px'}}/> Loading application status...</p>
            </section>
        );
    }
    

    return (
        <section style={documentStyles.transactionSection}>
            <div style={documentStyles.transactionHeaderActions}> {/* New wrapper for Title + Actions */}
                <h2 style={documentStyles.sectionTitle}>
                    <FiInfo size={24} style={{ marginRight: '8px', color: '#3b82f6' }} />
                    Your Application Status
                </h2>

                <button
                    onClick={handleToggleSelect}
                    style={documentStyles.selectModeButton(isSelectMode)}
                >
                    {isSelectMode ? <FiXCircle size={16} /> : <FiCheckSquare size={16} />} 
                    {selectButtonText}
                </button>
            </div>


            {/* Bulk Action Bar */}
            {selectedTransactions.length > 0 && (
                <div style={documentStyles.bulkActionBar}>
                    <span style={documentStyles.bulkActionText}>
                        {selectedTransactions.length} item(s) selected.
                    </span>

                    {/* Bulk Cancel Button (Only if Pending transactions are selected) */}
                    {pendingSelectedIds.length > 0 && (
                        <button 
                            onClick={() => setBulkCancellationTarget(pendingSelectedIds)}
                            style={documentStyles.bulkActionButton.cancel}
                            disabled={isLoading}
                        >
                            <FiXCircle size={16} /> Bulk Cancel ({pendingSelectedIds.length})
                        </button>
                    )}

                    {/* Bulk Delete Button (Only if Cancelled transactions are selected) */}
                    {cancelledSelectedIds.length > 0 && (
                        <button 
                            onClick={() => setBulkDeletionTarget(cancelledSelectedIds)}
                            style={documentStyles.bulkActionButton.delete}
                            disabled={isLoading}
                        >
                            <FiTrash2 size={16} /> Bulk Delete ({cancelledSelectedIds.length})
                        </button>
                    )}
                </div>
            )}


            {/* Display Messages */}
            {successMessage && (
                <div style={documentStyles.successMessage}>
                    {successMessage}
                </div>
            )}

            {error && (
                <p style={documentStyles.errorMessage}>
                    Error: {error}
                </p>
            )}
            
            {isLoading && transactions.length > 0 && (
                 <div style={documentStyles.updatingMessage}>
                    Updating list...
                </div>
            )}

            {transactions.length === 0 && !isLoading ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '10px 0' }}>
                    You have no document application transactions yet.
                </p>
            ) : (
                <div style={documentStyles.transactionList}>
                    {transactions.map((transaction) => {
                        const mediaUrls = transaction.requirementsMediaUrl || []; 
                        const isSelected = selectedTransactions.includes(transaction.id);

                        return (
                            <div 
                                key={transaction.id} 
                                style={documentStyles.transactionItem}
                                // Handle click for selection when in select mode
                                onClick={isSelectMode ? () => handleTransactionSelect(transaction.id) : null}
                            >
                                {/* Checkbox for selection mode */}
                                {isSelectMode && (
                                    <div 
                                        style={documentStyles.checkboxContainer}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card onClick from firing
                                            handleTransactionSelect(transaction.id);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            style={documentStyles.checkbox}
                                        />
                                    </div>
                                )}
                                
                                <div style={documentStyles.transactionContent}> {/* Wrap content for cleaner flex layout */}
                                    <div style={documentStyles.transactionHeader}>
                                        <span style={documentStyles.transactionDocName}>
                                            {transaction.document_name}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={getStatusStyle(transaction.status)}>
                                                {transaction.status === 'Pending' && <FiClock size={14} />}
                                                {transaction.status}
                                            </span>

                                            {/* Cancellation Button (Only for Pending, disabled in select mode) */}
                                            {transaction.status === 'Pending' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent selection
                                                        if (!isSelectMode) setCancellationTarget({ id: transaction.id, name: transaction.document_name });
                                                    }}
                                                    style={documentStyles.cancelButton}
                                                    title="Cancel Application"
                                                    disabled={isLoading || isSelectMode}
                                                >
                                                    &#x2715;
                                                </button>
                                            )}
                                            
                                            {/* Deletion Button (Only for Cancelled, disabled in select mode) */}
                                            {transaction.status === 'Cancelled' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent selection
                                                        if (!isSelectMode) setDeletionTarget({ id: transaction.id, name: transaction.document_name });
                                                    }}
                                                    style={documentStyles.deleteButton} 
                                                    title="Delete Record Permanently"
                                                    disabled={isLoading || isSelectMode}
                                                >
                                                    <FiTrash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p style={documentStyles.transactionPurpose}>Purpose: {transaction.purpose}</p>

                                    {mediaUrls.length > 0 && (
                                        <div style={documentStyles.transactionRequirements}>
                                            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#10b981' }}>
                                                Submitted Requirements:
                                            </p>
                                            {mediaUrls.map((url, index) => (
                                                <a
                                                    key={index}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={documentStyles.requirementLink}
                                                >
                                                    <FiUploadCloud size={14} style={{ marginRight: '5px' }} />
                                                    File {index + 1}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    <div style={documentStyles.transactionFooter}>
                                        <span style={documentStyles.transactionInfo}>
                                            Date Filed: {formatDate(transaction.created_at)}
                                        </span>
                                        <span style={documentStyles.transactionInfo}>
                                            Fee: ₱{parseFloat(transaction.fee).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Single Action Modals */}
            {cancellationTarget && (
                <CancellationConfirmationModal
                    transactionId={cancellationTarget.id}
                    documentName={cancellationTarget.name}
                    onConfirm={handleCancelExecute}
                    onClose={() => setCancellationTarget(null)}
                />
            )}
            {deletionTarget && (
                <DeletionConfirmationModal
                    transactionId={deletionTarget.id}
                    documentName={deletionTarget.name}
                    onConfirm={handleDeleteExecute}
                    onClose={() => setDeletionTarget(null)}
                />
            )}

            {/* Bulk Action Modals */}
            {bulkCancellationTarget && (
                <BulkCancellationConfirmationModal
                    ids={bulkCancellationTarget}
                    onConfirm={handleBulkCancelExecute}
                    onClose={() => setBulkCancellationTarget(null)}
                />
            )}
            {bulkDeletionTarget && (
                <BulkDeletionConfirmationModal
                    ids={bulkDeletionTarget}
                    onConfirm={handleBulkDeleteExecute}
                    onClose={() => setBulkDeletionTarget(null)}
                />
            )}
        </section>
    );
};


// ... (DocumentCard, ApplicationModal, and main DocumentsPage components remain largely the same)

// Main Documents Page Component
export default function DocumentsPage({ userName, userEmail, profilePictureUrl, currentUserId }) {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    const PLACEHOLDER_USER_ID = currentUserId || 1;

    const handleApplyClick = (doc) => {
        setSelectedDocument(doc);
    };

    const handleModalClose = () => {
        setSelectedDocument(null);
    };
    
    const handleApplicationSuccess = () => {
        setRefreshTrigger(prev => prev + 1); 
        setSelectedDocument(null); 
    };

    return (
        <div style={documentStyles.pageContainer}>
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
                        Downloadable Forms
                    </h2>
                    <div style={documentStyles.downloadList}>
                        {availableDownloads.map(item => (
                            <a
                                key={item.id}
                                href={item.file}
                                download
                                style={documentStyles.downloadLink}
                            >
                                <span>{item.name}</span>
                                <FiDownload size={18} />
                            </a>
                        ))}
                    </div>
                </section>

                <TransactionHistory currentUserId={PLACEHOLDER_USER_ID} refreshKey={refreshTrigger} /> 

            </main>
            <RightPanel userName={userName} userEmail={userEmail} profilePictureUrl={profilePictureUrl} />
            {selectedDocument && (
                <ApplicationModal
                    document={selectedDocument}
                    onClose={handleModalClose}
                    onSuccess={handleApplicationSuccess}
                    userName={userName}
                    userEmail={userEmail}
                    currentUserId={PLACEHOLDER_USER_ID}
                />
            )}
        </div>
    );
}


// Document Card Component (No changes)
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

// Application Modal Component (No changes)
const ApplicationModal = ({ document, onClose, userName, userEmail, currentUserId, onSuccess }) => {
    const [purpose, setPurpose] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setSelectedFiles(files);
        setSubmitMessage('');
    };

    const uploadRequirements = async () => {
        // ... (upload logic remains the same)
        if (selectedFiles.length === 0) {
            return null;
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('requirements', file);
        });

        try {
            const response = await fetch('http://localhost:5000/api/upload-requirements', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                return data.mediaUrls; 
            } else {
                throw new Error(data.message || 'Requirements upload failed.');
            }
        } catch (error) {
            console.error('Requirements upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        // ... (submit logic remains the same)
        e.preventDefault();

        if (!purpose.trim() || !currentUserId) {
            setSubmitMessage("Error: Missing purpose or User ID.");
            return;
        }

        const requirementsExist = document.requirements && document.requirements.length > 0;
        if (requirementsExist && selectedFiles.length === 0) {
            setSubmitMessage("Error: Please attach the required documents (images) before submitting.");
            return;
        }

        setIsLoading(true);
        setSubmitMessage('Uploading requirements...');
        let uploadedUrls = null;

        try {
            if (selectedFiles.length > 0) {
                uploadedUrls = await uploadRequirements();
            }

            setSubmitMessage('Submitting application...');

            const applicationData = {
                userId: currentUserId,
                documentName: document.name,
                purpose: purpose,
                fee: document.fee,
                requirementsMediaUrl: uploadedUrls && uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null,
            };

            const response = await fetch('http://localhost:5000/api/document-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applicationData),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitMessage(`Application submitted successfully! Transaction ID: ${data.transactionId}. Status: ${data.status}`);
                setIsSubmitted(true);
                setTimeout(onSuccess, 1500); 
            } else {
                throw new Error(data.message || 'Server error during application submission.');
            }

        } catch (error) {
            console.error('Application submission error:', error);
            setSubmitMessage(`Submission failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div style={documentStyles.modalBackdrop}>
                <div style={documentStyles.modalContent}>
                    <h2 style={documentStyles.modalHeader}>Application Sent!</h2>
                    <p>Your application for {document.name} has been successfully submitted.</p>
                    <p style={{ color: '#059669', fontWeight: 'bold' }}>
                        {submitMessage}
                    </p>
                    <p>
                        The transaction history will refresh shortly.
                    </p>
                    <button style={documentStyles.closeButtonSuccess} onClick={onSuccess}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const requirementsExist = document.requirements && document.requirements.length > 0;

    return (
        <div style={documentStyles.modalBackdrop}>
            <div style={documentStyles.modalContent}>
                <h2 style={documentStyles.modalHeader}>Apply for: {document.name}</h2>
                <button style={documentStyles.modalClose} onClick={onClose}>&times;</button>

                {requirementsExist && (
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
                            onChange={(e) => {
                                setPurpose(e.target.value);
                                setSubmitMessage('');
                            }}
                            required
                            style={documentStyles.textarea}
                            placeholder="e.g., Job application, Scholarship, Business permit renewal, etc."
                        />
                    </div>

                    <div style={documentStyles.formGroup}>
                        <label htmlFor="requirements-upload" style={documentStyles.label}>
                            Attach Requirements (Images Only, Max 5 Files)
                            {requirementsExist && <span style={{ color: 'red' }}> *</span>}
                        </label>
                        <input
                            type="file"
                            id="requirements-upload"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            style={documentStyles.fileInput}
                        />
                        {selectedFiles.length > 0 && (
                            <p style={documentStyles.fileCountText}>
                                {selectedFiles.length} file(s) selected: {selectedFiles.map(f => f.name).join(', ').substring(0, 100) + '...'}
                            </p>
                        )}
                        <p style={documentStyles.modalSmallPrint}>
                             Please ensure you have digitally scanned or taken clear photos of all documents listed above.
                        </p>
                    </div>

                    <button
                        type="submit"
                        style={documentStyles.submitButton(isLoading)}
                        disabled={isLoading}
                    >
                        {isLoading ? submitMessage : <><FiSend size={16} /> Submit Application</>}
                    </button>
                </form>
                {submitMessage && !isSubmitted && !isLoading && (
                    <p style={{
                        color: submitMessage.startsWith('Error') ? 'red' : '#b45309',
                        marginTop: '10px',
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        {submitMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

// ⭐ Styles (Updated to include new bulk action and selection styles)
const documentStyles = {
    pageContainer: {
        minHeight: '100vh',
        width: '100%',
    },
    contentArea: {
        width: '100%',
        paddingTop: '30px',
        paddingLeft: '15px',
        paddingRight: '350px',
        paddingBottom: '50px',
        boxSizing: 'border-box',
    },
    mainTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        margin: '0',
        marginBottom: '5px',
    },
    subtitle: {
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 30px 0',
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s',
        minHeight: '180px',
        border: '1px solid #e5e7eb',
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
        maxHeight: '90vh',
        overflowY: 'auto',
    },
    modalHeader: {
        color: '#1e40af',
        borderBottom: '2px solid #eff6ff',
        paddingBottom: '10px',
        marginBottom: '20px',
        fontSize: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
    fileInput: {
        display: 'block',
        width: '95%',
        padding: '10px',
        border: '2px dashed #93c5fd',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#f7faff',
        fontSize: '14px',
    },
    fileCountText: {
        fontSize: '12px',
        color: '#10b981',
        marginTop: '5px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    modalSmallPrint: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '5px',
    },
    submitButton: (isLoading) => ({
        width: '100%',
        backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 20px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.2s',
        marginTop: '20px',
    }),
    closeButtonSuccess: {
        backgroundColor: '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        marginTop: '20px',
        width: '100%',
    },
    downloadSection: {
        marginBottom: '40px',
    },
    downloadList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
    },
    downloadLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#f0f9ff',
        color: '#2563eb',
        textDecoration: 'none',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #bfdbfe',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        flexGrow: 1,
        maxWidth: '350px',
    },
    // --- Transaction History Styles ---
    transactionSection: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
    },
    transactionHeaderActions: { // New style for header wrapper
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '10px',
        borderBottom: '1px solid #eff6ff',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#3b82f6',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
    },
    selectModeButton: (isActive) => ({
        backgroundColor: isActive ? '#fef2f2' : '#eff6ff',
        color: isActive ? '#ef4444' : '#2563eb',
        border: isActive ? '1px solid #fecaca' : '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background-color 0.2s',
    }),
    bulkActionBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #93c5fd',
        padding: '10px 15px',
        borderRadius: '8px',
        marginBottom: '15px',
    },
    bulkActionText: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e40af',
        marginRight: '10px',
    },
    bulkActionButton: {
        cancel: {
            backgroundColor: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'background-color 0.2s',
        },
        delete: {
            backgroundColor: '#b91c1c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'background-color 0.2s',
        }
    },
    successMessage: {
        textAlign: 'center',
        color: '#059669',
        backgroundColor: '#ecfdf5',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '15px',
        fontWeight: 'bold'
    },
    errorMessage: {
        textAlign: 'center', 
        color: '#ef4444', 
        padding: '10px 0', 
        backgroundColor: '#fee2e2', 
        borderRadius: '8px', 
        marginBottom: '15px'
    },
    updatingMessage: {
        textAlign: 'center',
        color: '#2563eb',
        backgroundColor: '#eff6ff',
        padding: '5px',
        borderRadius: '8px',
        marginBottom: '10px',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    transactionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    transactionItem: {
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '15px',
        backgroundColor: '#f9fafb',
        display: 'flex', // Added flex to align checkbox
        alignItems: 'flex-start',
        cursor: 'default',
        transition: 'border 0.2s',
    },
    checkboxContainer: {
        paddingRight: '10px',
        paddingTop: '5px',
        flexShrink: 0,
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
    },
    transactionContent: { // New wrapper for original item content
        flexGrow: 1,
    },
    transactionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '8px',
    },
    transactionDocName: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1f2937',
    },
    transactionPurpose: {
        fontSize: '14px',
        color: '#4b5563',
        margin: '5px 0',
    },
    transactionRequirements: {
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px dashed #e5e7eb',
    },
    requirementLink: {
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#10b981',
        textDecoration: 'none',
        marginRight: '15px',
        backgroundColor: '#ecfdf5',
        padding: '3px 8px',
        borderRadius: '4px',
    },
    transactionFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #e5e7eb',
    },
    transactionInfo: {
        fontSize: '12px',
        color: '#6b7280',
    },
    cancelButton: {
        backgroundColor: '#fef2f2',
        color: '#ef4444',
        border: '1px solid #fecaca',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
    cancelButtonPrimary: {
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
    cancelButtonSecondary: {
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#fef2f2',
        color: '#b91c1c',
        border: '1px solid #fecaca',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
    deleteButtonPrimary: {
        backgroundColor: '#b91c1c',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 15px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
};