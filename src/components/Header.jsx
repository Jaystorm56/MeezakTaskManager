import React, { useMemo, memo, useState } from 'react';
import searchIcon from '../assets/icons/search-normal.png';
import plusIcon from '../assets/icons/Vector.png';
import headerGif from '../assets/icons/burning.gif';

// Styles as a constant object for maintainability
const styles = {
  header: (activeView) => ({
    backgroundColor: '#fff',
    color: '#1F1F3B',
    position: 'fixed',
    top: 0,
    left: '250px',
    width: 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    boxSizing: 'border-box',
    zIndex: 10,
    height: activeView === 'tasks' ? '140px' : '90px',
    padding: '0 20px',
    transition: 'height 0.2s ease', // Smooth height transition
  }),
  topSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '80px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  gif: {
    width: '24px',
    height: '24px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'rgba(47, 47, 59, 1)',
  },
  userContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  userText: {
    marginRight: '8px',
    textAlign: 'right',
  },
  greeting: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'rgba(20, 21, 34, 1)',
  },
  subtext: {
    fontSize: '12px',
    fontWeight: 400,
    marginTop: '-3px',
    color: 'rgba(84, 87, 122, 1)',
  },
  avatar: {
    width: '52px',
    height: '52px',
    backgroundColor: 'rgba(51, 51, 51, 1)',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
  },
  bottomSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '40px',
    marginTop: '4px',
  },
  searchContainer: {
    position: 'relative',
    flexGrow: 1,
    maxWidth: '300px',
  },
  searchIcon: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 40px 8px 20px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  addButton: {
    marginLeft: '20px',
    padding: '8px 16px',
    backgroundColor: '#1F1F3B',
    color: '#fff',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  plusIcon: {
    width: '10px',
    height: '10px',
  },
};

const Header = ({ firstName, lastName, activeView, onAddTask }) => {
  // Memoized initials calculation
  const initials = useMemo(() =>
    firstName && lastName
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : '',
    [firstName, lastName]
  );

  // Memoized header title
  const headerTitle = useMemo(() => {
    const titles = {
      overview: 'Dashboard',
      tasks: 'Explore Tasks',
      employees: 'Employees',
    };
    return titles[activeView] || 'Dashboard';
  }, [activeView]);

  // Handle search input focus styles (optional enhancement)
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div style={styles.header(activeView)}>
      {/* Top Section */}
      <div style={styles.topSection}>
        <div style={styles.titleContainer}>
          <img src={headerGif} alt="Header Animation" style={styles.gif} />
          <h1 style={styles.title}>{headerTitle}</h1>
        </div>
        {firstName && (
          <div style={styles.userContainer}>
            <div style={styles.userText}>
              <span style={styles.greeting}>Hi, {firstName}!</span>
              <p style={styles.subtext}>Let's finish your tasks today</p>
            </div>
            <div style={styles.avatar} aria-label={`User initials: ${initials}`}>
              {initials}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section (Tasks View Only) */}
      {activeView === 'tasks' && (
        <div style={styles.bottomSection}>
          <div style={styles.searchContainer}>
            <img src={searchIcon} alt="Search" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search tasks..."
              style={{
                ...styles.searchInput,
                borderColor: isSearchFocused ? '#3b82f6' : '#d1d5db',
                boxShadow: isSearchFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search tasks"
            />
          </div>
          <button
            onClick={onAddTask}
            style={styles.addButton}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2d2d4a')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1F1F3B')}
            aria-label="Add new task"
          >
            <img src={plusIcon} alt="Add" style={styles.plusIcon} />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
};

// Export as memoized component
export default memo(Header, (prevProps, nextProps) =>
  prevProps.firstName === nextProps.firstName &&
  prevProps.lastName === nextProps.lastName &&
  prevProps.activeView === nextProps.activeView &&
  prevProps.onAddTask === nextProps.onAddTask
);