function Header({ userEmail }) {
    return (
      <div style={{
        width: '100%',
        height: '60px',
        backgroundColor: '#333',
        color: 'white',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10,
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Task Manager</h1>
        {userEmail && (
          <span>Welcome, {userEmail}!</span>
        )}
      </div>
    );
  }
  
  export default Header;