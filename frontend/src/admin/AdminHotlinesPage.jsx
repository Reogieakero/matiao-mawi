import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'; 
import axios from 'axios';
import { 
    Search, Trash2, CheckCircle, Plus, Edit, ChevronDown, ChevronUp, 
    Phone, X, Save, XCircle, Volume2, Shield,
    Zap, Stethoscope, Home, HeartHandshake, PhoneCall 
} from 'lucide-react'; 

const API_BASE_URL = 'http://localhost:5000/api'; 

const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
    };
    let formattedDate = date.toLocaleDateString('en-US', options);
    if (includeTime) {
        formattedDate += ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return formattedDate;
};

const HOTLINE_CATEGORIES = [
    'Emergency (Police/Fire/Medical)', 'Barangay Office', 'Health Services', 
    'Disaster Management', 'Social Welfare', 'General Inquiry', 'Other'
];

const baseInputStyle = {
    width: '100%', padding: '10px', border: '1px solid #D1D5DB',
    borderRadius: '8px', boxSizing: 'border-box', 
    fontSize: '16px', color: '#1F2937',
    transition: 'border-color 0.2s',
};

const baseModalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000, 
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    formModal: {
        backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', 
        width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)', position: 'relative' 
    },
    header: { 
        margin: '0 0 25px 0', fontSize: '28px', color: '#1F2937', 
        borderBottom: '2px solid #F3F4F6', paddingBottom: '15px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '10px', fontWeight: '700'
    },
    formGroup: { 
        display: 'flex', flexDirection: 'column', marginBottom: '15px' 
    },
    label: { 
        fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '8px' 
    },
    input: baseInputStyle,
    select: baseInputStyle,
    textarea: { 
        ...baseInputStyle, minHeight: '100px', resize: 'vertical' 
    },
    buttonPrimary: {
        padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonDanger: { 
        padding: '10px 20px', backgroundColor: '#DC2626', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonSecondary: {
        padding: '10px 20px', backgroundColor: '#9CA3AF', color: 'white', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s', fontSize: '16px'
    },
    buttonContainer: { 
        display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' 
    },
    smallModal: {
        backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', 
        width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)', 
        position: 'relative', textAlign: 'center'
    }
};

const CustomSelect = ({ label, name, value, options, onChange, required = false, style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(options.findIndex(opt => opt === value));
    const containerRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsFocused(false);
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
        const newIndex = options.findIndex(opt => opt === value);
        setActiveIndex(newIndex > -1 ? newIndex : 0); 
    }, [options, value]);

    const handleSelect = (selectedValue) => {
        onChange({ target: { name, value: selectedValue } });
        setIsOpen(false);
        if (containerRef.current) {
            containerRef.current.querySelector('button').focus();
        }
    };

    const selectDisplayStyles = {
        ...baseInputStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        color: value && options.includes(value) ? '#1F2937' : '#9CA3AF',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        borderColor: isFocused || isOpen ? '#6366F1' : '#D1D5DB',
        boxShadow: isFocused || isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
        height: '42px',
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
        boxShadow: '0 0 15px -3px rgba(0, 0, 0, 0.1)',
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
    });

    const handleListHover = (e, index) => {
        setActiveIndex(index);
        e.currentTarget.style.backgroundColor = '#F3F4F6';
    }

    const handleListLeave = (e, index) => {
        if (options[index] === value) {
             e.currentTarget.style.backgroundColor = '#EFF6FF';
        } else {
             e.currentTarget.style.backgroundColor = 'white';
        }
       
    }


    return (
        <div 
            ref={containerRef} 
            style={{ 
                position: 'relative', 
                ...style
            }}
            onKeyDown={handleKeyDown}
        >
            <p style={baseModalStyles.label}>{label} {required ? '*' : ''}</p> 
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setTimeout(() => setIsFocused(false), 150);
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = isFocused || isOpen ? '#6366F1' : '#D1D5DB'}
                style={selectDisplayStyles}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Current ${label}: ${value}`}
                tabIndex={0}
            >
                <span style={{color: value ? '#1F2937' : '#9CA3AF' }}>
                    {value || `Select ${label}...`}
                </span>
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
                                onMouseEnter={(e) => handleListHover(e, index)}
                                onMouseLeave={(e) => handleListLeave(e, index)}
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

const HotlineFormModal = ({ show, initialData, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        hotline_number: '',
        description: '',
        category: categories[0] || 'General Inquiry',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (show) {
            setFormError(null);
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    hotline_number: initialData.hotline_number || '',
                    description: initialData.description || '',
                    category: initialData.category || categories[0],
                });
            } else {
                setFormData({
                    title: '',
                    hotline_number: '',
                    description: '',
                    category: categories[0],
                });
            }
        }
    }, [show, initialData, categories]);

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.title || !formData.hotline_number || !formData.category) {
            setFormError('Title, Hotline Number, and Category are required fields.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setFormError(null);

        try {
            if (initialData) {
                await axios.put(`${API_BASE_URL}/hotlines/${initialData.id}`, formData);
            } else {
                await axios.post(`${API_BASE_URL}/hotlines`, formData);
            }
            onSave(true);
        } catch (err) {
            console.error('Error saving hotline:', err);
            setFormError(err.response?.data?.message || 'Failed to save hotline.');
            onSave(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={baseModalStyles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={baseModalStyles.formModal}>
                <div style={baseModalStyles.header}>
                    <h2 style={{fontSize: '28px', fontWeight: '700', margin: 0, color: '#1F2937'}}>{initialData ? 'Edit Hotline' : 'Add New Hotline'}</h2>
                    <button style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280'}} onClick={onClose} title="Close">
                        <X size={28} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {formError && <p style={{ color: '#DC2626', marginBottom: '20px', padding: '10px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>Error: {formError}</p>}

                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Hotline Title (e.g., Police Emergency)</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            style={baseModalStyles.input}
                            placeholder="Enter the title for the hotline"
                            required
                        />
                    </div>

                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Hotline Number</label>
                        <input 
                            type="text" 
                            name="hotline_number" 
                            value={formData.hotline_number} 
                            onChange={handleChange} 
                            style={baseModalStyles.input}
                            placeholder="Enter the phone number or shortcode"
                            required
                        />
                    </div>

                    <div style={baseModalStyles.formGroup}>
                        <CustomSelect 
                            label="Category"
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            options={categories}
                            required
                        />
                    </div>

                    <div style={baseModalStyles.formGroup}>
                        <label style={baseModalStyles.label}>Description (e.g., Operating Hours, Services offered)</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            style={baseModalStyles.textarea}
                            placeholder="Provide a brief description or additional info"
                        />
                    </div>

                    <div style={baseModalStyles.buttonContainer}>
                        <button type="button" onClick={onClose} style={baseModalStyles.buttonSecondary} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" style={baseModalStyles.buttonPrimary} disabled={isLoading}>
                            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Hotline')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ show, title, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div style={baseModalStyles.backdrop}>
            <div style={baseModalStyles.smallModal}>
                <button 
                    onClick={onCancel} 
                    style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: '#6B7280' }}
                >
                    &times;
                </button>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0', color: '#DC2626' }}>{title}</h3>
                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '20px' }}>Are you sure you want to permanently delete this hotline? This action cannot be undone.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <button style={{...baseModalStyles.buttonSecondary, flexGrow: 1}} onClick={onCancel}>Cancel</button>
                    <button style={{...baseModalStyles.buttonDanger, flexGrow: 1}} onClick={onConfirm}>
                        <Trash2 size={20} style={{marginRight: '5px'}}/> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminMessageModal = ({ show, title, body, isSuccess, onClose }) => {
    if (!show) return null;

    const modalStyles = {
        backdrop: baseModalStyles.backdrop,
        modal: baseModalStyles.smallModal,
        closeButton: { position: 'absolute', top: '10px', right: '10px', fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none', color: '#6B7280' },
        content: {
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginBottom: '15px', color: isSuccess ? '#1e40af' : '#DC2626'
        },
        title: { fontSize: '22px', fontWeight: '700', margin: 0 },
        body: { fontSize: '16px', color: '#374151', marginBottom: '20px' },
        successButton: { 
            width: '100%', padding: '10px', backgroundColor: isSuccess ? '#1e40af' : '#DC2626', 
            color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', 
            transition: 'background-color 0.2s' 
        }
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.modal}>
                <button onClick={onClose} style={modalStyles.closeButton}>&times;</button>
                <div style={modalStyles.content}>
                    {isSuccess ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>
                <h3 style={modalStyles.title}>{title}</h3>
                <p style={modalStyles.body}>{body}</p>
                <button onClick={onClose} style={modalStyles.successButton}>Close</button>
            </div>
        </div>
    );
};


const getHotlineIconAndColor = (category) => {
    let Icon = PhoneCall; 
    let color = '#6B7280'; 
    const editColor = '#3B82F6';

    switch(category) {
        case 'Emergency (Police/Fire/Medical)':
            Icon = Zap; 
            color = '#EF4444';
            break;
        case 'Barangay Office':
            Icon = Home; 
            color = '#2563EB';
            break;
        case 'Health Services':
            Icon = Stethoscope; 
            color = '#10B981'; 
            break;
        case 'Disaster Management':
            Icon = Shield; 
            color = '#F97316'; 
            break;
        case 'Social Welfare':
            Icon = HeartHandshake; 
            color = '#9333ea';
            break;
        case 'General Inquiry':
        case 'Other':
        default:
            Icon = PhoneCall; 
            color = '#6B7280'; 
    }
    return { Icon, color, editColor };
};

const HotlineCard = ({ hotline, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const { Icon: CategoryIcon, color: iconColor, editColor } = getHotlineIconAndColor(hotline.category);
    
    const cardStyles = {
        padding: '25px',
        backgroundColor: '#FFFFFF', 
        borderRadius: '16px',
        border: `1px solid #E5E7EB`, 
        boxShadow: isHovered 
            ? '0 8px 20px rgba(0, 0, 0, 0.15)' 
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
    };

    const iconContainerStyle = {
        color: iconColor,
        border: `2px solid ${iconColor}40`,
        borderRadius: '8px',
        padding: '5px',
        width: 'fit-content',
        marginBottom: '5px'
    };

    const titleStyle = {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1F2937',
        margin: '0',
        lineHeight: '1.3'
    };

    const descriptionStyle = {
        fontSize: '14px',
        color: '#6B7280',
        margin: '0',
    };

    const numberStyle = {
        fontSize: '18px',
        fontWeight: '700',
        color: iconColor,
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px dashed #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    };
    
    const actionContainerStyle = {
        position: 'absolute',
        top: '15px',
        right: '15px',
        display: 'flex',
        gap: '5px'
    };

    const actionButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        transition: 'color 0.2s',
    };
    
    const categoryTagStyle = {
        position: 'absolute',
        top: '20px',
        left: '20px', 
        padding: '4px 10px',
        backgroundColor: iconColor,
        color: 'white',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10,
    };


    return (
        <div 
            style={cardStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span style={categoryTagStyle}>{hotline.category}</span>
            
            <div style={actionContainerStyle}>
                <button 
                    onClick={() => onEdit(hotline)} 
                    style={{...actionButtonStyle, color: editColor}} 
                    title="Edit Hotline"
                >
                    <Edit size={18} />
                </button>
                <button 
                    onClick={() => onDelete(hotline)} 
                    style={{...actionButtonStyle, color: '#DC2626'}} 
                    title="Delete Hotline"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            
            <div style={{...iconContainerStyle, marginTop: '25px'}}> 
                <CategoryIcon size={20} />
            </div>

            <h3 style={titleStyle}>{hotline.title}</h3>
            
            {hotline.description && (
                <p style={descriptionStyle}>{hotline.description}</p>
            )}

            <div style={numberStyle}>
                <Phone size={18} />
                <span>{hotline.hotline_number}</span>
            </div>
            
            <p style={{fontSize: '11px', color: '#9CA3AF', margin: 0, marginTop: '5px'}}>
                Last Updated: {formatDate(hotline.updated_at || hotline.created_at, false)}
            </p>
        </div>
    );
};

const styles = {
    container: {
        padding: '30px',
        backgroundColor: '#F9FAFB', 
        minHeight: '100vh',
    },
    header: {
         fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '5px',
    },
    addButton: {
        display: 'flex', alignItems: 'center', padding: '10px 20px', 
        backgroundColor: '#1e40af', 
        color: 'white', border: 'none', borderRadius: '8px', 
        cursor: 'pointer', fontWeight: '600', 
        transition: 'background-color 0.2s'
    },
    controls: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '30px', backgroundColor: 'white', 
        padding: '15px', borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    searchInput: {
        padding: '10px', border: '1px solid #D1D5DB', 
        borderRadius: '8px', width: '100%', maxWidth: '350px', 
        display: 'flex', alignItems: 'center', boxSizing: 'border-box'
    },
    searchIcon: { 
        marginRight: '10px', color: '#6B7280' 
    },
    cardGridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '25px',
    },
    noResults: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#6B7280',
        fontWeight: '500',
        gridColumn: '1 / -1' 
    },
};


const AdminHotlinesPage = () => {
    const [hotlines, setHotlines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHotline, setEditingHotline] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, title: '' });
    const [messageModal, setMessageModal] = useState({ show: false, title: '', body: '', isSuccess: false });


    const fetchHotlines = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/hotlines`);
            setHotlines(response.data);
        } catch (err) {
            console.error('Error fetching hotlines:', err);
            setError('Failed to fetch hotlines. Please check the server connection.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHotlines();
    }, []);

    const handleCloseAddEditModal = () => {
        setIsModalOpen(false);
        setEditingHotline(null);
    };

    const handleSaveComplete = (success) => {
        handleCloseAddEditModal();
        if (success) {
            fetchHotlines();
            setMessageModal({ 
                show: true, 
                title: 'Success!', 
                body: editingHotline ? 'Hotline updated successfully.' : 'New hotline added successfully.', 
                isSuccess: true 
            });
        } else {
            setMessageModal({ 
                show: true, 
                title: 'Error Saving', 
                body: 'The hotline could not be saved. Please try again.', 
                isSuccess: false 
            });
        }
    };

    const handleAddHotline = () => {
        setEditingHotline(null);
        setIsModalOpen(true);
    };

    const handleEditHotline = (hotline) => {
        setEditingHotline(hotline);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (hotline) => {
        setDeleteModal({ show: true, id: hotline.id, title: `Confirm Deletion of Hotline: "${hotline.title}"` });
    };
    
    const confirmDelete = async () => {
        const id = deleteModal.id;
        setDeleteModal({ show: false, id: null, title: '' }); 
        
        try {
            await axios.delete(`${API_BASE_URL}/hotlines/${id}`);
            setHotlines(prev => prev.filter(h => h.id !== id));
            setMessageModal({ 
                show: true, 
                title: 'Deleted!', 
                body: 'Hotline successfully deleted.', 
                isSuccess: true 
            });
        } catch (err) {
            console.error('Error deleting hotline:', err);
            setMessageModal({ 
                show: true, 
                title: 'Deletion Failed', 
                body: 'Failed to delete the hotline. Please check server status.', 
                isSuccess: false 
            });
        }
    };

    const sortedHotlines = useMemo(() => {
        let sortableItems = [...hotlines];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                
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
    }, [hotlines, sortConfig]);

    const filteredAndSortedHotlines = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return sortedHotlines.filter(hotline => 
            hotline.title.toLowerCase().includes(lowerCaseSearchTerm) || 
            (hotline.description || '').toLowerCase().includes(lowerCaseSearchTerm) || 
            hotline.hotline_number.toLowerCase().includes(lowerCaseSearchTerm) || 
            hotline.category.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [sortedHotlines, searchTerm]);


    return (
        <div style={styles.container}>
            <h1 style={styles.header}>
                Admin Hotline Management
            </h1>
            
            <div style={styles.controls}>
                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}/>
                    <input
                        type="text"
                        placeholder="Search hotlines (title, number, category...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{...styles.searchInput, paddingLeft: '40px'}}
                    />
                </div>
                <button 
                    onClick={handleAddHotline} 
                    style={styles.addButton}
                >
                    <Plus size={20} style={{marginRight: '8px'}}/> Add New Hotline
                </button>
            </div>

            {error && <div style={{ color: '#DC2626', marginBottom: '20px', padding: '15px', border: '1px solid #FCA5A5', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>Error: {error}</div>}

            {isLoading ? (
                <div style={styles.noResults}>Loading hotlines...</div>
            ) : (
                <div style={styles.cardGridContainer}>
                    {filteredAndSortedHotlines.length > 0 ? (
                        filteredAndSortedHotlines.map((hotline) => (
                            <HotlineCard 
                                key={hotline.id} 
                                hotline={hotline}
                                onEdit={handleEditHotline}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    ) : (
                        <div style={styles.noResults}>
                            No hotlines found matching your search criteria.
                        </div>
                    )}
                </div>
            )}
            
            <HotlineFormModal
                show={isModalOpen}
                initialData={editingHotline}
                categories={HOTLINE_CATEGORIES}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveComplete}
            />

            <DeleteConfirmationModal
                show={deleteModal.show}
                title={deleteModal.title}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ ...deleteModal, show: false })}
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

export default AdminHotlinesPage;