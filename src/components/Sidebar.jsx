import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import companyLogo from '../assets/images/company-logo.png'; // Adjust path/filename
import overviewIcon from '../assets/icons/category-2.png'; // Adjust path/filename
import tasksIcon from '../assets/icons/book.png'; // Adjust path/filename

function Sidebar({ activeView, setActiveView }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#fff',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Company Logo aligned with header */}
      <img 
        src={companyLogo} 
        alt="Company Logo" 
        style={{ 
          width: '150px', // Adjust size as needed
          height: 'auto',
          marginBottom: '20px',
          alignSelf: 'center', // Center horizontally
          paddingTop: '20px', // Align vertically with header text
        }} 
      />
      
      {/* Navigation Items */}
      <ul style={{ listStyle: 'none', padding: 0, flexGrow: 1 }}>
        <li 
          style={{ 
            margin: '10px 0', 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            backgroundColor: activeView === 'overview' ? '#f0f0f0' : 'transparent',
            padding: '10px',
            borderRadius: '5px',
          }}
          onClick={() => setActiveView('overview')}
        >
          <img 
            src={overviewIcon} 
            alt="Overview Icon" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          <span style={{ color: '#333', textDecoration: 'none' }}>Overview</span>
        </li>
        <li 
          style={{ 
            margin: '10px 0', 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            backgroundColor: activeView === 'tasks' ? '#f0f0f0' : 'transparent',
            padding: '10px',
            borderRadius: '5px',
          }}
          onClick={() => setActiveView('tasks')}
        >
          <img 
            src={tasksIcon} 
            alt="Tasks Icon" 
            style={{ width: '20px', height: '20px', marginRight: '10px' }} 
          />
          <span style={{ color: '#333', textDecoration: 'none' }}>Tasks</span>
        </li>
      </ul>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: 'calc(100% - 40px)',
          padding: '10px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          alignSelf: 'center', // Center horizontally
          marginBottom: '20px',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Sidebar;