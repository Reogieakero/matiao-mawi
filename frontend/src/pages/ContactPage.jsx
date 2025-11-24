import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';

const ContactPage = ({ userName, userEmail, profilePictureUrl }) => {
    // The Map URL points to the location we found: Matiao, Mati City.
    // For embedding, we use the standard Google Maps link format.
    const mapEmbedUrl = "https://maps.google.com/maps?q=Matiao,+City+of+Mati,+Davao+Oriental&t=&z=14&ie=UTF8&iwloc=&output=embed";

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Let's Connect</h1>
                <p style={styles.subtitle}>
                    We value your feedback and inquiries. Reach out to the Mawii team, and we'll get back to you promptly.
                </p>
            </header>

            <div style={styles.contentGrid}>
                {/* Contact Information Cards - CLEANED UP DESIGN */}
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
                    <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
                        <div style={styles.formGroup}>
                            <label htmlFor="name" style={styles.label}>Full Name</label>
                            <input type="text" id="name" name="name" style={styles.input} required />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="email" style={styles.label}>Email Address</label>
                            <input type="email" id="email" name="email" style={styles.input} required />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="subject" style={styles.label}>Subject</label>
                            <input type="text" id="subject" name="subject" style={styles.input} required />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="message" style={styles.label}>Your Message</label>
                            <textarea id="message" name="message" rows="5" style={styles.textarea} required></textarea>
                        </div>

                        <button type="submit" style={styles.submitButton}>
                            <MessageCircle size={20} style={{ marginRight: '8px' }} />
                            Send Message
                        </button>
                    </form>
                </div>
            </div>

            {/* Map/Location Section - UPDATED WITH EMBEDDED MAP */}
            <div style={styles.locationSection}>
                <MapPin size={24} style={{ color: styles.locationTitle.color }} />
                <h3 style={styles.locationTitle}>Our Headquarters Location</h3>
                <p style={styles.locationText}>
                    Our office is located in Matiao, City of Mati, Davao Oriental, Philippines.
                </p>
                
                {/* Actual Map Embed */}
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
        maxWidth: '1300px', // Slightly wider for a grander feel
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '50px',
        padding: '30px',
        borderRadius: '15px',
        backgroundColor: '#f8fafd', // Very light background
    },
    title: {
        fontSize: '40px',
        fontWeight: 800,
        color: '#1e40af', // Primary blue
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
        gridTemplateColumns: '1.2fr 2fr', // Info section slightly narrower
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
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)', // Softer, deeper shadow
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        border: '1px solid #e5e7eb', // Subtle border
        transition: 'box-shadow 0.3s',
        ':hover': {
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
        },
    },
    cardIcon: {
        color: '#1e40af', // Primary blue icon
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#eff6ff', // Light blue circle background
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
        height: '350px', // Increased height for better map visibility
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #d1d5db',
    },
    iframe: {
        border: '0',
    }
};

export default ContactPage;