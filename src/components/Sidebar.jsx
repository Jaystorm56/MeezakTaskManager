import React, { memo, useCallback, useMemo } from 'react'; // Added useCallback and useMemo
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import companyLogo from '../assets/images/company-logo.png';
import overviewIcon from '../assets/icons/category-2.png';
import tasksIcon from '../assets/icons/task.png';
import employeesIcon from '../assets/icons/employee.png';
import exitIcon from '../assets/icons/exit-icon.png';

// Styles as a constant object for better maintainability and reusability
const styles = {
  sidebar: {
    width: '252px',
    height: '100vh',
    backgroundColor: '#fff',
    padding: '20px',
    position: 'fixed',
    top: 0,
    left: 0,
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    width: '120px',
    height: 'auto',
    marginBottom: '40px',
    alignSelf: 'center',
    paddingTop: '10px',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    flexGrow: 1,
  },
  navItem: (isActive) => ({
    margin: '10px 0',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: isActive ? 'rgba(7, 24, 86, 0.1)' : 'transparent',
    padding: '10px',
    borderRadius: '5px',
    transition: 'background-color 0.2s ease', // Smooth transition
  }),
  icon: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
  },
  navText: (isActive) => ({
    color: 'rgba(7, 24, 86, 0.6)',
    textDecoration: 'none',
    fontSize: isActive ? '14px' : '12px',
  }),
  logoutButton: {
    width: 'calc(100% - 40px)',
    padding: '10px 15px',
    backgroundColor: 'rgba(255, 68, 81, 0.2)',
    color: '#FF4451',
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'center',
    marginBottom: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease', // Smooth hover effect
  },
  exitIcon: {
    width: '16px',
    height: '16px',
  },
};

// Navigation items as a data structure for easier management
const navItems = [
  { view: 'overview', label: 'Overview', icon: overviewIcon },
  { view: 'tasks', label: 'Tasks', icon: tasksIcon },
  { view: 'employees', label: 'Employees', icon: employeesIcon, adminOnly: true },
];

const Sidebar = ({ activeView, setActiveView, userRole }) => {
  const navigate = useNavigate();

  // Memoized logout handler to prevent re-creation
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error.message);
      alert('Failed to logout. Please try again.');
    }
  }, [navigate]);

  // Memoized nav item rendering to avoid unnecessary re-renders
  const renderNavItems = useMemo(() => {
    return navItems
      .filter(item => !item.adminOnly || userRole === 'admin')
      .map(item => (
        <li
          key={item.view}
          style={styles.navItem(activeView === item.view)}
          onClick={() => setActiveView(item.view)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && setActiveView(item.view)} // Accessibility
          aria-label={`Navigate to ${item.label}`}
        >
          <img src={item.icon} alt={`${item.label} Icon`} style={styles.icon} />
          <span style={styles.navText(activeView === item.view)}>{item.label}</span>
        </li>
      ));
  }, [activeView, setActiveView, userRole]);

  return (
    <div style={styles.sidebar}>
      <img src={companyLogo} alt="Company Logo" style={styles.logo} />
      <ul style={styles.navList}>{renderNavItems}</ul>
      <button
        onClick={handleLogout}
        style={styles.logoutButton}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 68, 81, 0.3)')} // Hover effect
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 68, 81, 0.2)')}
        role="button"
        aria-label="Logout"
      >
        <img src={exitIcon} alt="Exit" style={styles.exitIcon} />
        Logout
      </button>
    </div>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(Sidebar, (prevProps, nextProps) =>
  prevProps.activeView === nextProps.activeView &&
  prevProps.userRole === nextProps.userRole &&
  prevProps.setActiveView === nextProps.setActiveView
);