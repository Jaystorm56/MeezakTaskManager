import { useState } from 'react';
import searchIcon from '../assets/icons/search-normal.png';
import plusIcon from '../assets/icons/Vector.png';
import headerGif from '../assets/icons/burning.gif';

function Header({ firstName, lastName, activeView, onAddTask }) {
  // Get initials from first and last name
  const initials = firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : '';

  return (
    <div
      className="bg-white text-gray-900 fixed top-0 left-[250px] w-[calc(100%-250px)] flex flex-col justify-center shadow-md box-border z-10"
      style={{
        height: activeView === 'tasks' ? '140px' : '90px',
        padding: '0 20px',
      }}
    >
      {/* Top Div: Consistent across views */}
      <div className="flex items-center justify-between h-[80px]">
        <div className="flex items-center gap-1">
          <img
            src={headerGif}
            alt="Header GIF"
            className="w-6 h-6"
          />
          <h1 className="m-0 text-2xl font-bold">
            {activeView === 'overview' ? 'Dashboard' : 'Explore Tasks'}
          </h1>
        </div>
        {firstName && (
          <div className="flex items-center">
            <div className="mr-2 text-right">
              <span className="text-lg font-bold">
                Hi, {firstName}!
              </span>
              <p className="text-xs mt-[-3px] text-gray-500">
                Let's finish your tasks today
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-base font-bold">
              {initials}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Div: Only for Tasks view */}
      {activeView === 'tasks' && (
        <div className="flex items-center justify-between h-[40px] mt-1">
          {/* Search Box */}
          <div className="relative flex-grow max-w-xs">
            <img
              src={searchIcon}
              alt="Search"
              className="absolute right-5 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full py-2 pl-5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Add Task Button */}
          <button
            onClick={onAddTask}
            className="ml-5 px-4 py-2 bg-gray-900 text-white rounded-md flex items-center gap-2 text-sm hover:bg-gray-800"
          >
            <img
              src={plusIcon}
              alt="Add"
              className="w-2.5 h-2.5"
            />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}

export default Header;