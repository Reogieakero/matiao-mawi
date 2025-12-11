import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { 
    UserCircle, ClipboardList, Briefcase, MessageCircle, Send,
    Rss, Megaphone, Layers, UserCheck, Headset 
} from 'lucide-react';

const styles = {
    pageContainer: {
        backgroundColor: '#F9FAFB',
        minHeight: '100vh',
        padding: '20px', 
        height: '100%', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
    },
    pageTitle: {
        color: '#1F2937', 
        marginBottom: '5px',
    },
    subtitle: {
        color: '#6B7280', 
        fontSize: '14px', 
        marginBottom: '30px', 
        paddingBottom: '10px',
        borderBottom: '1px solid #E5E7EB'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
        flexShrink: 0, 
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', 
        transition: 'all 0.3s ease', 
        cursor: 'pointer',
    },
    statCardHover: {
        transform: 'translateY(-5px)', 
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    },
    statHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    statLabel: {
        fontSize: '14px',
        color: '#6B7280',
        fontWeight: '500',
        margin: 0,
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1F2937',
        margin: '0 0 10px 0',
    },
    statFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chartContainer: {
        flexGrow: 1,
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        minHeight: '300px',
    },
    message: {
        padding: '20px',
        textAlign: 'center',
        color: '#EF4444',
    }
};

const StatCard = ({ icon: Icon, title, value, color, to }) => { 
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate(); 
    
    const hoverStyle = isHovered ? styles.statCardHover : {};

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <div 
            style={{ ...styles.statCard, ...hoverStyle }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick} 
        >
            <div style={styles.statHeader}>
                <p style={styles.statLabel}>{title}</p>
                <Icon size={24} color={color} /> 
            </div>
            <h2 style={styles.statNumber}>{value.toLocaleString()}</h2> 
            
            <div style={styles.statFooter}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>View {title}</span>
                <span style={{ fontSize: '12px', color: color, fontWeight: '600' }}>→</span>
            </div>
        </div>
    );
};


const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPosts: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalContacts: 0,
        totalNews: 0,
        totalAnnouncements: 0,
        totalServices: 0,
        totalOfficials: 0,
        totalHotlines: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseStatsPromise = axios.get('http://localhost:5000/api/admin/dashboard-stats');

            const contentStatsPromise = axios.get('http://localhost:5000/api/admin/dashboard-stats-content');

            const [baseStatsResponse, contentStatsResponse] = await Promise.all([
                baseStatsPromise,
                contentStatsPromise
            ]);

            const baseStats = baseStatsResponse.data || { totalUsers: 0, totalPosts: 0, totalJobs: 0, totalApplications: 0, totalContacts: 0 };
            const contentStats = contentStatsResponse.data;

            setStats(prevStats => ({
                ...prevStats,
                ...baseStats,
                ...contentStats,
            }));

        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
            setError('Failed to load dashboard statistics. Check if the server is running and API endpoints are correct.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    if (loading) {
        return <div style={{ ...styles.pageContainer, justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ color: '#6B7280' }}>Loading Dashboard Data...</p>
        </div>;
    }

    if (error) {
        return (
            <div style={styles.pageContainer}>
                <h1 style={styles.pageTitle}>Admin Dashboard</h1>
                <p style={styles.subtitle}>Welcome to the management control panel.</p>
                <p style={styles.message}>Error: {error}</p>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.pageTitle}>Admin Dashboard</h1>
            <p style={styles.subtitle}>Welcome to the management control panel.</p>

            <div style={styles.statsGrid}>
                <StatCard icon={UserCircle} title="Total Users" value={stats.totalUsers} color="#10B981" to="/admin/users" />
                <StatCard icon={MessageCircle} title="Community Posts" value={stats.totalPosts} color="#6366F1" to="/admin/community" />
                <StatCard icon={Briefcase} title="Job Listings" value={stats.totalJobs} color="#F59E0B" to="/admin/jobs" />
                <StatCard icon={ClipboardList} title="Doc. Applications" value={stats.totalApplications} color="#F97316" to="/admin/documents" />
                <StatCard icon={Send} title="Contact Messages" value={stats.totalContacts} color="#06B6D4" to="/admin/messages" />

                <StatCard icon={Rss} title="Active News" value={stats.totalNews} color="#EF4444" to="/admin/news" />
                <StatCard icon={Megaphone} title="Active Announcements" value={stats.totalAnnouncements} color="#A855F7" to="/admin/announcements" />
                <StatCard icon={Layers} title="Active Services" value={stats.totalServices} color="#10B981" to="/admin/services" />
                <StatCard icon={UserCheck} title="Active Officials" value={stats.totalOfficials} color="#F59E0B" to="/admin/officials" />
                <StatCard icon={Headset} title="Active Hotlines" value={stats.totalHotlines} color="#6366F1" to="/admin/hotlines" />
            </div>

            
        </div>
    );
};

export default AdminDashboardPage;