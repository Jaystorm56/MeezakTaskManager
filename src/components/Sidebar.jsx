import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

function Sidebar() {
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
      backgroundColor: '#f4f4f4',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    }}>
      <h2>Menu</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ margin: '10px 0' }}>
          <a href="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</a>
        </li>
        {/* Add more menu items here as needed */}
      </ul>
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          bottom: '20px',
          width: 'calc(100% - 40px)',
          padding: '10px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Sidebar;