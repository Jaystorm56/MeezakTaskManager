function Header({ firstName, lastName }) {
    // Get initials from first and last name
    const initials = firstName && lastName 
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
      : '';
  
    return (
      <div style={{
        width: '100%',
        height: '80px', // Increased height to accommodate text and circle
        backgroundColor: '#fff',
        color: 'black',
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
        {firstName && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: '15px', textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Hi, {firstName}!</span>
              <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#666' }}>
                Let's finish your tasks today
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              {initials}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  export default Header;