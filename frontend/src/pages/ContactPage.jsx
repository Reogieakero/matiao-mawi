import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';

// Assumes the API is running on localhost:5000
const API_BASE_URL = 'http://localhost:5000/api'; 

// тнР NEW: Define subject options
const SUBJECT_OPTIONS = [
    { value: '', label: 'Select a Subject' },
    { value: 'Technical Support', label: 'Technical Support (App Errors, Bugs)' },
    { value: 'Document Inquiry', label: 'Inquiry about Document Requests' },
    { value: 'Community Concern', label: 'Community Thread or Job Post Concern' },
    { value: 'General Feedback', label: 'General Feedback/Suggestion' },
    { value: 'Other', label: 'Other' },
];

const ContactPage = ({ userName, userEmail, userId, profilePictureUrl }) => {
    const mapEmbedUrl = "https://maps.google.com/maps?q=Matiao,+City+of+Mati,+Davao+Oriental&t=&z=14&ie=UTF8&iwloc=&output=embed";

    const [formData, setFormData] = useState({
        fullName: userName || '',
        emailAddress: userEmail || '',
        subject: SUBJECT_OPTIONS[0].value, // тнР MODIFIED: Set initial subject to the first option (empty)
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // тнР NEW: Validation for subject selection
        if (formData.subject === '') {
            setSubmitMessage({ type: 'error', text: 'Please select a subject from the list.' });
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/contact-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId, 
                    fullName: formData.fullName,
                    emailAddress: formData.emailAddress,
                    subject: formData.subject, // Value is sent to server
                    message: formData.message,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitMessage({ type: 'success', text: data.message || 'Thank you for your message! We will get back to you soon.' });
                // Clear the subject and message fields upon successful submission
                setFormData(prev => ({ ...prev, subject: SUBJECT_OPTIONS[0].value, message: '' }));
            } else {
                setSubmitMessage({ type: 'error', text: data.message || 'Failed to send message. Please try again.' });
            }
        } catch (error) {
            console.error('Submission Error:', error);
            setSubmitMessage({ type: 'error', text: 'Network error. Please check your connection or try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Let's Connect</h1>
                <p style={styles.subtitle}>
                    We value your feedback and inquiries. Reach out to the Mawii team, and we'll get back to you promptly.
                </p>
            </header>

            <div style={styles.contentGrid}>
                {/* Contact Information Cards */}
                <div style={styles.infoCards}>
                    {/* Email Card */}
                    <div style={styles.card}>
                        <Mail size={24} style={styles.cardIcon} />
                        <h3 style={styles.cardTitle}>General Inquiries</h3>
                        <p style={styles.cardText}>For partnership or general questions.</p>
                        <a href="mailto:support@mawi.com" style={styles.cardLink}>
                            support@mawi.com
                        </a>
                    </div>

                    {/* Phone Card */}
                    <div style={styles.card}>
                        <Phone size={24} style={styles.cardIcon} />
                        <h3 style={styles.cardTitle}>Support Hotline</h3>
                        <p style={styles.cardText}>Available for urgent assistance.</p>
                        <a href="tel:+1234567890" style={styles.cardLink}>
                            +1 (234) 567-890
                        </a>
                    </div>

                    {/* Working Hours Card */}
                    <div style={styles.card}>
                        <Clock size={24} style={styles.cardIcon} />
                        <h3 style={styles.cardTitle}>Operating Hours</h3>
                        <p style={styles.cardText}>Our support team is available:</p>
                        <span style={styles.cardTextBold}>
                            Mon - Fri: 9:00 AM - 5:00 PM (PST)
                        </span>
                    </div>
                </div>

                {/* Contact Form */}
                <div style={styles.formContainer}>
                    <h2 style={styles.formTitle}>Send a Direct Message</h2>
                    {submitMessage && (
                        <div style={submitMessage.type === 'success' ? styles.successAlert : styles.errorAlert}>
                            {submitMessage.text}
                        </div>
                    )}
                    <form style={styles.form} onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label htmlFor="fullName" style={styles.label}>Full Name</label>
                            <input 
                                type="text" 
                                id="fullName" 
                                name="fullName" 
                                value={formData.fullName} 
                                onChange={handleChange}
                                style={styles.input} 
                                required 
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="emailAddress" style={styles.label}>Email Address</label>
                            <input 
                                type="email" 
                                id="emailAddress" 
                                name="emailAddress" 
                                value={formData.emailAddress} 
                                onChange={handleChange}
                                style={styles.input} 
                                required 
                            />
                        </div>

                        {/* тнР MODIFIED: SUBJECT FIELD (Input changed to Select) */}
                        <div style={styles.formGroup}>
                            <label htmlFor="subject" style={styles.label}>Subject</label>
                            <select 
                                id="subject" 
                                name="subject" 
                                value={formData.subject} 
                                onChange={handleChange}
                                style={styles.select} // Use the new select style
                                required 
                            >
                                {SUBJECT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value} disabled={option.value === ''}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* тнР END MODIFIED SUBJECT FIELD */}

                        <div style={styles.formGroup}>
                            <label htmlFor="message" style={styles.label}>Your Message</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                rows="5" 
                                value={formData.message} 
                                onChange={handleChange}
                                style={styles.textarea} 
                                required
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            style={styles.submitButton}
                            disabled={isSubmitting} 
                        >
                            <MessageCircle size={20} style={{ marginRight: '8px' }} />
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Map/Location Section */}
            <div style={styles.locationSection}>
                <MapPin size={24} style={{ color: styles.locationTitle.color }} />
                <h3 style={styles.locationTitle}>Our Headquarters Location</h3>
                <p style={styles.locationText}>
                    Our office is located in Matiao, City of Mati, Davao Oriental, Philippines.
                </p>
                
                <div style={styles.mapContainer}>
                    <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={styles.iframe}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Matiao, Mati City Map"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

const styles = {
    // --- Layout and Structure ---
    container: {
        padding: '30px',
        maxWidth: '1300px', 
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '50px',
        padding: '30px',
        borderRadius: '15px',
        backgroundColor: '#f8fafd', 
    },
    title: {
        fontSize: '40px',
        fontWeight: 800,
        color: '#1e40af', 
        marginBottom: '10px',
    },
    subtitle: {
        fontSize: '18px',
        color: '#6b7280',
        maxWidth: '700px',
        margin: '0 auto',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 2fr', 
        gap: '40px',
        marginBottom: '50px',
    },

    // --- Info Cards ---
    infoCards: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        border: '1px solid #e5e7eb', 
        transition: 'box-shadow 0.3s',
        ':hover': {
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
        },
    },
    cardIcon: {
        color: '#1e40af', 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#eff6ff', 
        borderRadius: '50%',
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#1f2937',
        margin: '0 0 5px 0',
    },
    cardText: {
        fontSize: '15px',
        color: '#6b7280',
        margin: '0 0 5px 0',
    },
    cardTextBold: {
        fontSize: '15px',
        color: '#1e40af',
        fontWeight: 600,
        margin: '0 0 5px 0',
    },
    cardLink: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#1e40af',
        textDecoration: 'none',
        marginTop: '10px',
        transition: 'color 0.2s',
        ':hover': {
            color: '#102f8f',
        }
    },

    // --- Contact Form ---
    formContainer: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
    },
    formTitle: {
        fontSize: '30px',
        fontWeight: 700,
        color: '#1f2937',
        marginBottom: '25px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '8px',
        fontWeight: 600,
        color: '#374151',
        fontSize: '15px',
    },
    input: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ':focus': {
            borderColor: '#1e40af',
            boxShadow: '0 0 0 1px #1e40af',
            outline: 'none',
        }
    },
    // тнР NEW: Style for the select dropdown
    select: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        // Optional: Custom arrow styling can be complex in plain CSS-in-JS but often handled by browser
        ':focus': {
            borderColor: '#1e40af',
            boxShadow: '0 0 0 1px #1e40af',
            outline: 'none',
        }
    },
    textarea: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        resize: 'vertical',
        minHeight: '120px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ':focus': {
            borderColor: '#1e40af',
            boxShadow: '0 0 0 1px #1e40af',
            outline: 'none',
        }
    },
    submitButton: {
        padding: '14px 30px',
        backgroundColor: '#1e40af',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '17px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'background-color 0.2s, transform 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '15px',
        ':hover': {
            backgroundColor: '#102f8f',
        },
        ':active': {
            transform: 'scale(0.99)',
        },
        // For disabled state
        ':disabled': {
            backgroundColor: '#9ca3af',
            cursor: 'not-allowed',
        }
    },

    // Alert Styles
    successAlert: {
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#d1e7dd', 
        color: '#0f5132', 
        border: '1px solid #badbcc',
        borderRadius: '8px',
        fontWeight: 600,
        textAlign: 'center',
    },
    errorAlert: {
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8d7da', 
        color: '#842029', 
        border: '1px solid #f5c2c7',
        borderRadius: '8px',
        fontWeight: 600,
        textAlign: 'center',
    },

    // --- Location Section ---
    locationSection: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
    },
    locationTitle: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#1e40af',
        marginTop: '10px',
        marginBottom: '5px',
    },
    locationText: {
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '20px',
    },
    mapContainer: {
        height: '350px', 
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #d1d5db',
    },
    iframe: {
        border: '0',
    }
};

export default ContactPage;