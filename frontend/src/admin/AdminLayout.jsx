import React from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ children, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout(); 
        navigate('/admin'); // Redirect to admin login page
    };

    return (
        <>
            {/* PASSING handleLogout to AdminHeader */}
            <AdminHeader adminName="Administrator" onLogout={handleLogout} /> 
            <AdminSidebar onLogout={handleLogout} />
            
            <div style={adminAppStyles.contentArea}>
                {children}
            </div>
        </>
    );
};

const adminAppStyles = {
    contentArea: { 
        paddingTop: '90px', // Adjusted for the new 70px header + 20px margin
        marginLeft: '290px', 
        paddingRight: '30px', 
        paddingLeft: '30px', 
        paddingBottom: '30px',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC', 
    }
};

export default AdminLayout;