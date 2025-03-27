import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap/dist/gsap';
import { db, auth } from '../../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
const TaskModal = lazy(() => import('../components/TaskModal'));
import { PencilIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import magnifyingGlassIcon from '../assets/icons/search-normal.png';
import './Dashboard.css';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function Dashboard() {
  // State management
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: '', lastName: '', role: 'employee' });
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeView, setActiveView] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Refs for animations
  const cardRefs = useRef([]);
  const progressRefs = useRef([]);
  const taskCardRefs = useRef([]);

  // Memoized task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      percentages: [
        total ? Math.round((tasks.filter(t => t.status === 'todo').length / total) * 100) : 0,
        total ? Math.round((tasks.filter(t => t.status === 'inprogress').length / total) * 100) : 0,
        total ? Math.round((tasks.filter(t => t.status === 'completed').length / total) * 100) : 0,
      ],
    };
  }, [tasks]);

  // Memoized filtered employees
  const filteredEmployees = useMemo(() =>
    employees.filter(employee =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [employees, debouncedSearchTerm]);

  // Animation functions
  const animateOverview = useCallback(() => {
    if (activeView !== 'overview' || !cardRefs.current.every(ref => ref) || !progressRefs.current.every(ref => ref)) return;
    gsap.fromTo(cardRefs.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' });
    progressRefs.current.forEach((progress, index) => {
      gsap.fromTo(
        progress,
        { strokeDasharray: '0, 188' },
        { strokeDasharray: `${taskStats.percentages[index] * 1.88}, 188`, duration: 1.5, delay: 0.5 + index * 0.2, ease: 'power3.out' }
      );
    });
  }, [activeView, taskStats]);

  const animateTasks = useCallback(() => {
    if (activeView !== 'tasks' || tasks.length === 0 || !taskCardRefs.current.every(ref => ref)) return;
    gsap.fromTo(taskCardRefs.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' });
  }, [activeView, tasks]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      cardRefs.current = [];
      progressRefs.current = [];
      taskCardRefs.current = [];
    };
  }, []);

  // Trigger animations
  useEffect(() => animateOverview(), [animateOverview]);
  useEffect(() => animateTasks(), [animateTasks]);

  // Authentication handling
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      try {
        setUser(currentUser);
        if (!currentUser) {
          setTasks([]);
          setEmployees([]);
          setUserData({ firstName: '', lastName: '', role: 'employee' });
          navigate('/signin');
          return;
        }
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          throw new Error('User document not found');
        }
      } catch (error) {
        console.error('Auth error:', error);
        alert('Failed to load dashboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // Fetch tasks and employees (sample tasks removed)
  useEffect(() => {
    if (!user || !userData.role) return;
    let unsubscribeTasks, unsubscribeEmployees;

    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error('Tasks fetch error:', error));

    if (userData.role === 'admin') {
      const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
      unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
        const fetchedEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(fetchedEmployees);
        if (activeView === 'employees' && fetchedEmployees.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(fetchedEmployees[0].id);
        }
      }, (error) => console.error('Employees fetch error:', error));
    }

    return () => {
      unsubscribeTasks?.();
      unsubscribeEmployees?.();
    };
  }, [user, userData.role, activeView, selectedEmployeeId]);

  // Fetch selected employee tasks
  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedEmployeeTasks([]);
      return;
    }
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', selectedEmployeeId));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setSelectedEmployeeTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error('Selected employee tasks error:', error));
    return () => unsubscribeTasks();
  }, [selectedEmployeeId]);

  // Task management functions
  const addTask = async (taskData) => {
    if (!user) return alert('Please log in to add tasks!');
    try {
      const taskWithUser = {
        ...taskData,
        userId: user.uid,
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        status: taskData.status || 'todo',
        subtasks: taskData.subtasks || [],
      };
      if (taskData.id) {
        await updateDoc(doc(db, 'tasks', taskData.id), taskWithUser);
      } else {
        await addDoc(collection(db, 'tasks'), taskWithUser);
      }
    } catch (error) {
      console.error('Task add/update error:', error);
      alert(`Failed to add/update task: ${error.message}`);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
      if (!task || (newStatus === 'completed' && task.subtasks?.some(s => !s.completed))) return;
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Task status update error:', error);
      alert(`Failed to update task status: ${error.message}`);
    }
  };

  const toggleSubtaskCompletion = async (taskId, subtaskIndex) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
      if (!task || !task.subtasks?.[subtaskIndex]) return;
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIndex] = { ...updatedSubtasks[subtaskIndex], completed: !updatedSubtasks[subtaskIndex].completed };
      await updateDoc(taskRef, { subtasks: updatedSubtasks });

      const allCompleted = updatedSubtasks.every(s => s.completed);
      const anyCompleted = updatedSubtasks.some(s => s.completed);
      if (task.status === 'todo' && anyCompleted) await updateTaskStatus(taskId, 'inprogress');
      else if (task.status === 'inprogress' && allCompleted) await updateTaskStatus(taskId, 'completed');
      else if (task.status === 'completed' && !allCompleted) await updateTaskStatus(taskId, 'inprogress');
    } catch (error) {
      console.error('Subtask toggle error:', error);
      alert(`Failed to toggle subtask: ${error.message}`);
    }
  };

  const getCompletionPercentage = useCallback((taskId) => {
    const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
    if (!task || !task.subtasks?.length) return 0;
    return Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100);
  }, [tasks, selectedEmployeeTasks, selectedEmployeeId]);

  // UI handlers
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Render functions
  const renderOverview = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {['To-Do', 'In Progress', 'Completed'].map((title, index) => (
          <div key={title} ref={el => cardRefs.current[index] = el} className="bg-gray-900 text-white p-6 rounded-lg shadow-md relative min-h-[200px]">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <p className="text-4xl font-bold mb-4">{taskStats[title.toLowerCase().replace(' ', '')]}</p>
            <div className="absolute top-6 right-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20">
                <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40" strokeDasharray="188" />
                <circle ref={el => progressRefs.current[index] = el} className="text-blue-500" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40" transform="rotate(-90 40 40)" strokeLinecap="round" />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm">{taskStats.percentages[index]}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => {
    if (!tasks.length) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Task Yet?</h2>
          <p className="text-gray-500">Add task to the system to perform well</p>
        </div>
      );
    }
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Not Started', status: 'todo', color: 'bg-gray-100', dot: 'bg-red-400' },
            { title: 'In Progress', status: 'inprogress', color: 'bg-blue-100', dot: 'bg-blue-400' },
            { title: 'Done', status: 'completed', color: 'bg-green-50', dot: 'bg-green-400' }
          ].map((column, colIndex) => (
            <div key={column.title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className={`w-4 h-4 ${column.dot} rounded-full mr-2`}></span>
                {column.title}
              </h2>
              {tasks.filter(t => t.status === column.status).map((task, index) => (
                <div key={task.id} ref={el => taskCardRefs.current[colIndex * tasks.length + index] = el} className={`${column.color} p-6 rounded-lg shadow-sm mb-4 min-h-[250px] relative`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">{task.title}</h3>
                    <button onClick={() => handleEditTask(task)} aria-label={`Edit ${task.title}`} className="text-gray-500 hover:text-gray-700">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{task.dueDate}</p>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{getCompletionPercentage(task.id).toFixed(2)}%</span>
                    <div className="relative inline-block">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="appearance-none bg-transparent border-b border-gray-300 text-gray-500 text-sm focus:outline-none cursor-pointer pr-6 pl-2 py-1 hover:border-gray-500"
                      >
                        <option value="todo">Not Started</option>
                        <option value="inprogress">In Progress</option>
                        <option value="completed" disabled={(task.subtasks || []).some(s => !s.completed)}>Done</option>
                      </select>
                      <ChevronDownIcon className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(task.subtasks || []).map((subtask, subtaskIndex) => (
                      <li key={subtaskIndex} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(task.id, subtaskIndex)}
                          className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>{subtask.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmployeeList = () => {
    if (isLoading) return <div className="Siide" style={{ /* existing styles */ }}><LoadingSpinner /></div>;
    return (
      <div className="Siide w-[250px] sm:w-[280px] lg:w-[300px]" style={{ /* existing styles */ }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ /* existing styles */ }}
          />
          <img src={magnifyingGlassIcon} alt="Search" style={{ /* existing styles */ }} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ /* existing styles */ }}>✕</button>
          )}
        </div>
        <div className="employee-list" style={{ maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
          {filteredEmployees.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>{searchTerm ? 'No employees match your search.' : 'No employees found.'}</p>
          ) : (
            filteredEmployees.map((employee) => (
              <div key={employee.id} onClick={() => setSelectedEmployeeId(employee.id)} style={{ /* existing styles */ }}>
                <div style={{ /* existing styles */ }}>
                  {employee.firstName.charAt(0).toUpperCase()}{employee.lastName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#141522' }}>
                    {employee.firstName.charAt(0).toUpperCase() + employee.firstName.slice(1).toLowerCase()}{' '}
                    {employee.lastName.charAt(0).toUpperCase() + employee.lastName.slice(1).toLowerCase()}
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 400, color: '#141522' }}>{employee.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSelectedEmployeeDetails = () => {
    if (isLoading) return <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center"><LoadingSpinner /></div>;
    if (!selectedEmployeeId) return <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center"><h2>No Employee Selected</h2><p>Please select an employee.</p></div>;
    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) return <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center"><h2>Employee Not Found</h2></div>;

    return (
      <div className="p-4 sm:p-6 bg-white" style={{ paddingTop: '10px' }}>
        <div className="mb-4">
          <div style={{ /* existing styles */ }}>
            <div style={{ /* existing styles */ }}>{selectedEmployee.firstName.charAt(0).toUpperCase()}{selectedEmployee.lastName.charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#141522' }}>
                {selectedEmployee.firstName.charAt(0).toUpperCase() + selectedEmployee.firstName.slice(1).toLowerCase()}{' '}
                {selectedEmployee.lastName.charAt(0).toUpperCase() + selectedEmployee.lastName.slice(1).toLowerCase()}
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 400, color: '#141522' }}>{selectedEmployee.email}</p>
            </div>
          </div>
          <div style={{ /* existing styles */ }} />
        </div>
        {selectedEmployeeTasks.length === 0 ? (
          <div style={{ /* existing styles */ }}>
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">No Tasks Yet</h2>
            <p className="text-gray-500">This employee has no tasks assigned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-nowrap gap-4">
              {[
                { title: 'Not Started', status: 'todo', color: 'bg-gray-100', dot: 'bg-red-400' },
                { title: 'In Progress', status: 'inprogress', color: 'bg-blue-100', dot: 'bg-blue-400' },
                { title: 'Done', status: 'completed', color: 'bg-green-50', dot: 'bg-green-400' }
              ].map((column, colIndex) => (
                <div key={column.title} className="min-w-[200px] max-w-[250px] flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className={`w-4 h-4 ${column.dot} rounded-full mr-2`}></span>
                    {column.title}
                  </h2>
                  {selectedEmployeeTasks.filter(t => t.status === column.status).map((task) => (
                    <div key={task.id} className={`${column.color} p-3 sm:p-4 rounded-lg shadow-sm mb-4 min-h-[200px] relative`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 pr-6">{task.title}</h3>
                        <button onClick={() => handleEditTask(task)} aria-label={`Edit ${task.title}`} className="text-gray-500 hover:text-gray-700">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{task.dueDate}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-base sm:text-lg font-bold text-gray-900">{getCompletionPercentage(task.id).toFixed(2)}%</span>
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className="appearance-none bg-transparent border-b border-gray-300 text-gray-500 text-xs focus:outline-none cursor-pointer pr-5 pl-1 py-1 hover:border-gray-500"
                          >
                            <option value="todo">Not Started</option>
                            <option value="inprogress">In Progress</option>
                            <option value="completed" disabled={(task.subtasks || []).some(s => !s.completed)}>Done</option>
                          </select>
                          <ChevronDownIcon className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {(task.subtasks || []).map((subtask, subtaskIndex) => (
                          <li key={subtaskIndex} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(task.id, subtaskIndex)}
                              className="mr-2 h-3 w-3 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                            />
                            <span className={`text-xs ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>{subtask.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar activeView={activeView} setActiveView={setActiveView} userRole={userData.role} />
      <div className={`flex-1 md:ml-[250px] box-border ${activeView === 'employees' && userData.role === 'admin' ? 'md:mr-[250px] sm:mr-[280px] lg:mr-[300px]' : ''}`}>
        <Header firstName={userData.firstName} lastName={userData.lastName} activeView={activeView} onAddTask={handleAddTask} />
        <main className="p-4 sm:p-6 lg:p-8" style={{ paddingTop: activeView === 'tasks' ? '140px' : activeView === 'employees' ? '120px' : '100px' }}>
          {isLoading ? <LoadingSpinner /> : (
            <>
              {activeView === 'overview' && renderOverview()}
              {activeView === 'tasks' && renderTasks()}
              {activeView === 'employees' && userData.role === 'admin' && renderSelectedEmployeeDetails()}
            </>
          )}
        </main>
        {isModalOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <TaskModal task={editingTask} onSave={addTask} onClose={handleModalClose} />
          </Suspense>
        )}
      </div>
      {activeView === 'employees' && userData.role === 'admin' && renderEmployeeList()}
    </div>
  );
}

export default React.memo(Dashboard);