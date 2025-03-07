import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import companyLogo from '../assets/images/company-logo.png';
import overviewIcon from '../assets/icons/category-2.png'; 
import tasksIcon from '../assets/icons/book.png'; 
import exitIcon from '../assets/icons/exit-icon.png';

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
          width: '120px', 
          height: 'auto',
          marginBottom: '40px',
          alignSelf: 'center',
          paddingTop: '10px', 
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
          <span style={{ 
            color: '#333', 
            textDecoration: 'none',
            fontSize: activeView === 'overview' ? '18px' : '14px', 
          }}>
            Overview
          </span>
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
          <span style={{ 
            color: '#333', 
            textDecoration: 'none',
            fontSize: activeView === 'tasks' ? '18px' : '14px', 
          }}>
            Tasks
          </span>
        </li>
      </ul>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
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
        }}
      >
        <img 
          src={exitIcon} 
          alt="Exit" 
          style={{ 
            width: '16px', 
            height: '16px' 
          }} 
        />
        Logout
      </button>
    </div>
  );
}

export default Sidebar;