import React, { useEffect } from 'react'; 
import {
    Activity, 
    FileText, 
    Briefcase, 
    MessageSquare, 
    Rocket, 
    Users, 
    Mail, 
} from 'lucide-react'; 


const AboutPage = ({ userName, profilePictureUrl }) => {

    useEffect(() => {
        document.title = "About Matiao"; 
    }, []);
    const missionSection = [
        {
            icon: Users,
            text: "The Matiao Community Hub is a centralized digital platform dedicated to fostering transparency, communication, and engagement within the Barangay Matiao community. Our mission is to empower every resident with easy access to vital information, local services, and opportunities for employment and participation.",
        },
        {
            icon: Rocket,
            text: "We strive to bridge the gap between the local government and the citizens, making essential resources available 24/7.",
        }
    ];

    const findSections = [
        {
            icon: Activity,
            title: "Announcements & News",
            description: "Stay updated with official barangay notices, local events, and important advisories.",
        },
        {
            icon: FileText,
            title: "Documents & Services",
            description: "Access forms, permits, and guides for barangay services, streamlining local transactions.",
        },
        {
            icon: Briefcase,
            title: "Find Jobs",
            description: "A dedicated section connecting residents with local job vacancies, including full-time, part-time, contract, and internship opportunities.",
        },
        {
            icon: MessageSquare,
            title: "Community Threads (Home)",
            description: "Engage in discussions, share information, and connect with neighbors on a dedicated feed.",
        },
    ];

    

    return (
        <div style={styles.content}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.mainTitle}>About the Matiao Community Hub</h1>
                    <p style={styles.tagline}>Connecting Matiao, One Click at a Time.</p>
                </div>
                
                <hr style={styles.divider} />

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        <Users size={24} style={styles.titleIcon} />
                        Our Mission
                    </h2>
                    {missionSection.map((item, index) => (
                        <p key={index} style={styles.paragraph}>
                            {item.text}
                        </p>
                    ))}
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>What You Can Find Here</h2>
                    <div style={styles.cardGrid}>
                        {findSections.map((item, index) => (
                            <div key={index} style={styles.card}>
                                <item.icon size={30} style={styles.cardIcon} />
                                <h3 style={styles.cardTitle}>{item.title}</h3>
                                <p style={styles.cardDescription}>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        <Rocket size={24} style={styles.titleIcon} />
                        Our Vision for Matiao
                    </h2>
                    <p style={styles.paragraph}>
                        We envision a Matiao where information is accessible, participation is high, and every resident feels connected and informed.
                        This platform is a testament to the community's commitment to digital transformation and inclusive governance.
                    </p>
                </div>

                <div style={styles.contactFooter}>
                    <p>
                        <Mail size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        For inquiries, please visit the <a href="/contact" style={styles.contactLink}>Contact Page</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

const colors = {
    primary: '#1e40af', 
    accent: '#3b82f6', 
    background: '#f8fafc', 
    text: '#374151',
    lightText: '#6b7280',
    cardBackground: '#ffffff',
    shadow: 'rgba(0,0,0,0.08)',
};

const styles = {
    content: {
        padding: '30px 40px', 
        minHeight: 'calc(100vh - 60px)', 
    },
    container: {
        maxWidth: '1000px', 
        margin: '0 auto',
        padding: '40px',
        backgroundColor: colors.cardBackground,
        borderRadius: '12px',
        boxShadow: `0 4px 20px ${colors.shadow}`,
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px',
    },
    mainTitle: {
        fontSize: '38px',
        fontWeight: '900',
        color: colors.primary,
        marginBottom: '10px',
    },
    tagline: {
        fontSize: '18px',
        color: colors.lightText,
        fontWeight: '400',
    },
    divider: {
        height: '1px',
        backgroundColor: '#e5e7eb',
        border: 'none',
        margin: '20px 0 40px 0',
    },
    section: {
        marginBottom: '40px',
    },
    sectionTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: colors.accent,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
    },
    titleIcon: {
        marginRight: '10px',
        color: colors.primary,
    },
    paragraph: {
        fontSize: '17px',
        lineHeight: '1.7',
        color: colors.text,
        marginBottom: '15px',
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginTop: '20px',
    },
    card: {
        padding: '25px',
        backgroundColor: '#f1f5f9', 
        borderRadius: '8px',
        border: `1px solid #e2e8f0`,
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    cardIcon: {
        color: colors.primary,
        marginBottom: '15px',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: colors.primary,
        marginBottom: '8px',
    },
    cardDescription: {
        fontSize: '15px',
        color: colors.text,
        lineHeight: '1.5',
    },
    contactFooter: {
        marginTop: '50px',
        paddingTop: '25px',
        textAlign: 'center',
        borderTop: `2px solid ${colors.background}`,
        color: colors.lightText,
        fontSize: '16px',
    },
    contactLink: {
        color: colors.primary,
        textDecoration: 'none',
        fontWeight: '600',
        transition: 'color 0.2s',
        ':hover': {
            color: colors.accent,
        }
    }
};

export default AboutPage