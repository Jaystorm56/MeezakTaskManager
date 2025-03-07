import searchIcon from '../assets/icons/search-normal.png'; // Adjust path/filename as needed

function Header({ firstName, lastName, activeView, onAddTask }) {
  // Get initials from first and last name
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
    : '';

  return (
    <div style={{
      width: 'calc(100% - 250px)',
      height: activeView === 'tasks' ? '150px' : '80px', // Increase height for Tasks view
      backgroundColor: '#fff',
      color: '#141522',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column', // Stack content vertically
      justifyContent: 'center',
      boxShadow: '0 2px 1.5px rgba(0,0,0,0.2)',
      position: 'fixed',
      top: 0,
      left: '250px',
      zIndex: 10,
      boxSizing: 'border-box',
    }}>
      {/* Top Div: Consistent across views */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px', // Fixed height for top section
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          {activeView === 'overview' ? 'Dashboard' : 'Explore Tasks'}
        </h1>
        {firstName && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: '8px', textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                Hi, {firstName}!
              </span>
              <p style={{ fontSize: '12px', marginTop: '-3px', color: '#54577A' }}>
                Let's finish your tasks today
              </p>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#141522',
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

      {/* Bottom Div: Only for Tasks view */}
      {activeView === 'tasks' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '40px', // Fixed height for bottom section
          marginTop: '5px', // Small gap between top and bottom
        }}>
          {/* Search Box */}
          <div style={{ 
            position: 'relative', 
            flexGrow: 1, 
            maxWidth: '300px' 
          }}>
            <img 
              src={searchIcon} 
              alt="Search" 
              style={{ 
                position: 'absolute', 
                left: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                width: '20px', 
                height: '20px' 
              }} 
            />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              style={{ 
                width: '100%', 
                padding: '8px 8px 8px 40px', // Space for icon
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                fontSize: '14px' 
              }} 
            />
          </div>
          {/* Add Task Button */}
          <button 
            onClick={onAddTask}
            style={{
              padding: '8px 16px',
              backgroundColor: '#141522',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: '20px', // Space from search box
            }}
          >
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;