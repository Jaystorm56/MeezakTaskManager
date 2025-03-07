import searchIcon from '../assets/icons/search-normal.png'; 
import plusIcon from '../assets/icons/Vector.png';
import headerGif from '../assets/icons/burning.gif';

function Header({ firstName, lastName, activeView, onAddTask }) {
  // Get initials from first and last name
  const initials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
    : '';

  return (
    <div style={{
      width: 'calc(100% - 250px)',
      height: activeView === 'tasks' ? '140px' : '90px', 
      backgroundColor: '#fff',
      color: '#141522',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column', 
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
        height: '80px', 
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px', 
        }}>
          <img 
            src={headerGif} 
            alt="Header GIF" 
            style={{ 
              width: '24px', 
              height: '24px',
            }} 
          />
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            {activeView === 'overview' ? 'Dashboard' : 'Explore Tasks'}
          </h1>
        </div>
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
          height: '40px', 
          marginTop: '5px', 
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
                right: '19px', 
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
                padding: '8px 8px 8px 20px', 
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
              padding: '10px 15px',
              backgroundColor: '#141522',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '20px',
              display: 'flex', 
              alignItems: 'center',
              gap: '8px', 
            }}
          >
            <img 
              src={plusIcon} 
              alt="Add" 
              style={{ 
                width: '10px', 
                height: '10px' 
              }} 
            />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;