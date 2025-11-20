import React from 'react';
// Import Material Design Icons for a more "pro" look
import { MdOutlineMedicalServices, MdOutlineFamilyRestroom, MdOutlineElderly, 
         MdOutlineWheelchairPickup, MdOutlineSportsHandball, MdOutlineDelete, 
         MdOutlineWbSunny, MdOutlineConstruction, MdOutlineGroups, 
         MdOutlineAnnouncement, MdOutlineFastfood, MdOutlinePublic, 
         MdOutlineLocalHospital, MdOutlineCrisisAlert, MdOutlineVerifiedUser,
         MdOutlineVaccines, MdOutlineBook, MdOutlinePeople } from 'react-icons/md';
import RightPanel from '../components/RightPanel';

// Sample data for Barangay Services (UPDATED LIST with new icons)
const barangayServices = [
    {
        id: 1,
        title: "Health Consultations",
        description: "General health consultations and check-ups provided by the Barangay Health Center staff.",
        icon: MdOutlineLocalHospital, // Health/Clinic icon
        requirements: ["Barangay ID/Residency Proof"],
        turnaround: "Available during clinic hours",
        contact: "Barangay Health Center"
    },
    {
        id: 2,
        title: "Prenatal Care & Maternal/Child Health",
        description: "Services focusing on the health of pregnant mothers and children, including check-ups and nutritional guidance.",
        icon: MdOutlineFamilyRestroom, // Family icon
        requirements: ["Maternal Health Card/Child's Birth Certificate"],
        turnaround: "Schedule-dependent",
        contact: "Barangay Health Center"
    },
    {
        id: 3,
        title: "Immunization Programs",
        description: "Provision of routine and scheduled vaccinations in coordination with the Department of Health (DOH).",
        icon: MdOutlineVaccines, // Vaccine icon
        requirements: ["Child's Vaccination Card"],
        turnaround: "Scheduled dates",
        contact: "Barangay Health Center"
    },
    {
        id: 4,
        title: "Nutrition Programs",
        description: "Includes supplemental feeding for malnourished children and regular weighing/monitoring.",
        icon: MdOutlineFastfood, // Nutrition/Food icon
        requirements: ["Residency Proof", "Child's Weighing Card"],
        turnaround: "Periodic schedule",
        contact: "Barangay Health Worker"
    },
    {
        id: 5,
        title: "Family Planning Assistance",
        description: "Counseling and provision of various family planning methods.",
        icon: MdOutlineGroups, // Group/Family icon
        requirements: ["Valid ID", "Counseling Session"],
        turnaround: "Available during clinic hours",
        contact: "Barangay Health Center"
    },
    {
        id: 6,
        title: "Free Medicines (If Available)",
        description: "Distribution of basic and maintenance medications based on available stock.",
        icon: MdOutlineMedicalServices, // Pharmacy/Medication icon
        requirements: ["Prescription (for certain medicines)", "Barangay ID"],
        turnaround: "Same day (if in stock)",
        contact: "Barangay Health Center/Secretary"
    },
    {
        id: 7,
        title: "Assistance in Crises",
        description: "Financial, medical, or burial assistance provided during urgent crisis situations.",
        icon: MdOutlineCrisisAlert, // Crisis Alert icon
        requirements: ["Barangay Clearance/Indigency Certificate", "Proof of Crisis (e.g., Hospital Bill)"],
        turnaround: "Case-by-case evaluation",
        contact: "Barangay Treasurer/Secretary"
    },
    {
        id: 8,
        title: "Assistance to Senior Citizens/PWDs",
        description: "Support programs for the elderly (OSCA) and persons with disabilities (PWD), including ID validation and specific benefits.",
        icon: MdOutlineElderly, // Elderly icon
        requirements: ["OSCA/PWD ID", "Residency Proof"],
        turnaround: "Varies",
        contact: "Secretary's Office"
    },
    {
        id: 9,
        title: "Assistance to Indigent Families",
        description: "Targeted support and services for financially incapable families, often requiring a Certificate of Indigency.",
        icon: MdOutlinePeople, // People icon
        requirements: ["Certificate of Indigency", "Proof of Residency"],
        turnaround: "Varies",
        contact: "Secretary's Office"
    },
    {
        id: 10,
        title: "Youth Welfare and Sports Programs",
        description: "Programs and activities organized by the Sangguniang Kabataan (SK) for the development and engagement of the youth.",
        icon: MdOutlineSportsHandball, // Sports/Handball icon
        requirements: ["Proof of Age/Residency (for specific events)"],
        turnaround: "Program schedule-dependent",
        contact: "SK Council"
    },
    {
        id: 11,
        title: "Garbage Collection & Waste Segregation",
        description: "Scheduled collection of segregated waste and promotion of proper waste management practices.",
        icon: MdOutlineDelete, // Trash/Delete icon
        requirements: ["Properly segregated waste"],
        turnaround: "Follow collection schedule",
        contact: "Barangay Tanod/Environmental Committee"
    },
    {
        id: 12,
        title: "Clean-up Drives & Maintenance",
        description: "Community-wide clean-up drives, including drainage and canal maintenance, to ensure sanitation and prevent flooding.",
        icon: MdOutlineWbSunny, // Environment/Clean icon
        requirements: ["Community Participation"],
        turnaround: "Scheduled dates",
        contact: "Barangay Tanod/Environmental Committee"
    },
    {
        id: 13,
        title: "Disaster Risk Reduction (DRR) Programs",
        description: "Management of the evacuation center, relief distribution, emergency response, and awareness programs during calamities.",
        icon: MdOutlineVerifiedUser, // Security/Verified icon
        requirements: ["General vigilance"],
        turnaround: "Ongoing/As needed",
        contact: "Barangay DRR Council"
    },
    {
        id: 14,
        title: "Livelihood Training Programs",
        description: "Training and workshops aimed at providing residents with skills for potential income-generating opportunities.",
        icon: MdOutlineBook, // Training/Book icon
        requirements: ["Registration/Sign-up"],
        turnaround: "Program schedule-dependent",
        contact: "Barangay Council"
    },
    {
        id: 15,
        title: "Public Works Maintenance",
        description: "Maintenance and minor repairs of barangay roads, streetlights, and other community infrastructure.",
        icon: MdOutlineConstruction, // Construction/Maintenance icon
        requirements: ["Community Report (for issues)"],
        turnaround: "As needed/Work schedule",
        contact: "Barangay Engineer/Tanod"
    },
    {
        id: 16,
        title: "Community Meetings (Barangay Assemblies)",
        description: "Regular meetings for residents to discuss community issues, plans, and transparency reports.",
        icon: MdOutlinePublic, // Public/Community icon
        requirements: ["Resident attendance"],
        turnaround: "Scheduled dates (e.g., twice a year)",
        contact: "Secretary's Office"
    },
    {
        id: 17,
        title: "Information Dissemination",
        description: "Sharing important announcements, government advisories, and barangay notices through various channels.",
        icon: MdOutlineAnnouncement, // Announcement icon
        requirements: ["N/A"],
        turnaround: "As needed",
        contact: "Secretary's Office"
    },
];


export default function ServicesPage({ userName, userEmail, profilePictureUrl }) {
    
    // The firstName is used for the greeting in the title
    const firstName = userName ? userName.split(' ')[0] : 'User';

    // Helper component to render service requirement chips
    const RequirementChip = ({ text }) => (
        <span style={styles.requirementChip}>{text}</span>
    );

    // Component to render a single service card
    const ServiceCard = ({ service }) => {
        const Icon = service.icon; 
        return (
            <div style={styles.serviceCard}>
                <div style={styles.cardHeader}>
                    <Icon size={24} color="#1e40af" style={{ flexShrink: 0 }} />
                    <h3 style={styles.cardTitle}>{service.title}</h3>
                </div>
                <p style={styles.cardDescription}>{service.description}</p>
                <div style={styles.cardInfoGrid}>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Turnaround:</span>
                        <span style={styles.infoValue}>{service.turnaround}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>Contact:</span>
                        <span style={styles.infoValue}>{service.contact}</span>
                    </div>
                </div>
                <div style={styles.cardRequirements}>
                    <span style={styles.infoLabel}>Key Requirements:</span>
                    <div style={styles.requirementsContainer}>
                        {service.requirements.map((req, index) => (
                            <RequirementChip key={index} text={req} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Main Content */}
                <div style={styles.mainContent}>
                    <h2 style={styles.sectionTitle}>
                        Hello, {firstName}! Available Barangay Services
                    </h2>
                    
                    <div style={styles.servicesGrid}>
                        {barangayServices.map(service => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                        {barangayServices.length % 2 !== 0 && (
                            // Add an empty div to ensure the last item is left-aligned 
                            <div style={{ flex: 1, minWidth: '400px', margin: '10px' }} />
                        )}
                    </div>
                    
                    {barangayServices.length === 0 && (
                        <p style={styles.loadingText}>No services listed at the moment.</p>
                    )}
                </div>

                {/* Right Panel */}
                <RightPanel 
                    userName={userName} 
                    userEmail={userEmail} 
                    profilePictureUrl={profilePictureUrl}
                />
            </div>
        </div>
    );
}

// --- Styles (ServicesPage) ---
const styles = {
    page: {
        minHeight: '100vh',
        padding: '10px'
    },
    container: {
        display: 'flex',
        gap: '30px',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingRight: '340px', // Space for the fixed RightPanel
        boxSizing: 'border-box'
    },
    mainContent: {
        flex: 1,
        minWidth: '600px'
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: '20px',
        paddingBottom: '5px',
        borderBottom: '2px solid #bfdbfe',
    },
    loadingText: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#9ca3af',
    },
    
    // --- Services Grid/Card Styles ---
    servicesGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'flex-start',
    },
    serviceCard: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        minWidth: '400px', // Maintain a good minimum width
        flex: 1, // Allow cards to grow
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: '1px solid #f3f4f6',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e40af',
        margin: 0,
    },
    cardDescription: {
        fontSize: '15px',
        color: '#4b5563',
        marginBottom: '15px',
        lineHeight: '1.4',
    },
    cardInfoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '15px',
        padding: '10px 0',
        borderTop: '1px solid #f3f4f6',
        borderBottom: '1px solid #f3f4f6',
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    infoLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#1f2937',
    },
    cardRequirements: {
        marginTop: '10px',
    },
    requirementsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '8px',
    },
    requirementChip: {
        padding: '5px 10px',
        borderRadius: '15px',
        backgroundColor: '#ecfdf5',
        color: '#047857',
        fontSize: '13px',
        fontWeight: '500',
        border: '1px solid #a7f3d0',
    }
    // --- End: Services Grid/Card Styles ---
};