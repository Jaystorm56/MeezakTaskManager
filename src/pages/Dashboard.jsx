import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskModal from '../components/TaskModal';
import { gsap } from 'gsap';
import { PencilIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import magnifyingGlassIcon from '../assets/icons/search-normal.png'; 
import './Dashboard.css';

function Dashboard() {
  // State management for user authentication, tasks, and UI interactions
  const [user, setUser] = useState(null); // Current authenticated user
  const [userData, setUserData] = useState({ firstName: '', lastName: '', role: 'employee' }); // User's profile data
  const [tasks, setTasks] = useState([]); // Tasks for the current user
  const [employees, setEmployees] = useState([]); // List of employees (for admins)
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering employees
  const [activeView, setActiveView] = useState('overview'); // Current view (overview, tasks, employees)
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls task modal visibility
  const [editingTask, setEditingTask] = useState(null); // Task being edited in the modal
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // Selected employee for admin view
  const [selectedEmployeeTasks, setSelectedEmployeeTasks] = useState([]); // Tasks of the selected employee
  const [isLoading, setIsLoading] = useState(true); // Loading state for data fetching
  const navigate = useNavigate(); // Navigation hook from react-router-dom

  // Refs for animation elements
  const cardRefs = useRef([]); // Refs for overview cards
  const progressRefs = useRef([]); // Refs for progress circles in overview
  const taskCardRefs = useRef([]); // Refs for task cards

  // Animation for the overview section using GSAP
  const animateOverview = useCallback(() => {
    if (activeView !== 'overview') return; // Only animate if in overview view
    if (!cardRefs.current || cardRefs.current.some(ref => !ref)) return; // Ensure refs are valid

    // Animate overview cards with fade-in and slide-up effect
    gsap.fromTo(
      cardRefs.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );

    if (!progressRefs.current || progressRefs.current.some(ref => !ref)) return; // Ensure progress refs are valid

    // Animate progress circles based on task status percentages
    progressRefs.current.forEach((progress, index) => {
      const totalTasks = tasks.length;
      const percentages = [
        totalTasks ? Math.round((tasks.filter(t => t.status === 'todo').length / totalTasks) * 100) : 0,
        totalTasks ? Math.round((tasks.filter(t => t.status === 'inprogress').length / totalTasks) * 100) : 0,
        totalTasks ? Math.round((tasks.filter(t => t.status === 'completed').length / totalTasks) * 100) : 0,
      ];
      gsap.fromTo(
        progress,
        { strokeDasharray: '0, 188' },
        { strokeDasharray: `${percentages[index] * 1.88}, 188`, duration: 1.5, delay: 0.5 + index * 0.2, ease: 'power3.out' }
      );
    });
  }, [activeView, tasks]);

  // Animation for the tasks section using GSAP
  const animateTasks = useCallback(() => {
    if (activeView !== 'tasks' || tasks.length === 0) return; // Only animate if in tasks view with tasks
    if (!taskCardRefs.current || taskCardRefs.current.some(ref => !ref)) return; // Ensure refs are valid

    // Animate task cards with fade-in and slide-up effect
    gsap.fromTo(
      taskCardRefs.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );
  }, [activeView, tasks]);

  // Trigger animations when dependencies change
  useEffect(() => {
    animateOverview();
  }, [animateOverview]);

  useEffect(() => {
    animateTasks();
  }, [animateTasks]);

  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true); // Start loading
      setUser(currentUser);
      if (!currentUser) {
        // If no user is logged in, reset state and redirect to sign-in
        setTasks([]);
        setEmployees([]);
        setUserData({ firstName: '', lastName: '', role: 'employee' });
        navigate('/signin');
        setIsLoading(false);
        return;
      }

      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.error('User document not found');
        setIsLoading(false);
        return;
      }
      setIsLoading(false); // End loading
    });

    return () => unsubscribeAuth(); // Cleanup subscription
  }, [navigate]);

  // Fetch tasks and employees based on user role
  useEffect(() => {
    if (!user || !userData.role) return; // Wait for user and role to be set

    // Fetch tasks for the current user (both admin and employee)
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched tasks for current user:', fetchedTasks);
      setTasks(fetchedTasks);
    }, (error) => {
      console.error('Error fetching tasks for current user:', error);
    });

    let unsubscribeEmployees;
    if (userData.role === 'admin') {
      // Fetch all employees for admin users
      const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
      unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
        const fetchedEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched employees:', fetchedEmployees);
        setEmployees(fetchedEmployees);
        if (activeView === 'employees' && fetchedEmployees.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(fetchedEmployees[0].id); // Default to first employee
        }

        // Add sample tasks for employees with no tasks (for demo purposes)
        const addSampleTasksForEmployees = async () => {
          for (const employee of fetchedEmployees) {
            const employeeTasksQuery = query(collection(db, 'tasks'), where('userId', '==', employee.id));
            const employeeTasksSnapshot = await getDocs(employeeTasksQuery);
            if (employeeTasksSnapshot.empty) {
              console.log(`Adding sample tasks for employee: ${employee.id}`);
              const sampleTasks = [
                { title: 'Grocery Shopping', description: 'Buy groceries', dueDate: '2025-03-20', status: 'todo', subtasks: [{ text: 'Buy vegies', completed: false }, { text: 'Buy water melon', completed: false }], userId: employee.id },
                { title: 'Project Meeting', description: 'Attend meeting', dueDate: '2025-03-21', status: 'inprogress', subtasks: [{ text: 'Prepare slides', completed: true }, { text: 'Book room', completed: false }], userId: employee.id },
                { title: 'Submit Report', description: 'Submit weekly report', dueDate: '2025-03-22', status: 'completed', subtasks: [{ text: 'Write report', completed: true }, { text: 'Review report', completed: true }], userId: employee.id },
              ];
              for (const task of sampleTasks) {
                await addDoc(collection(db, 'tasks'), task);
              }
            }
          }
        };
        addSampleTasksForEmployees();
      }, (error) => {
        console.error('Error fetching employees:', error);
      });
    }

    // Cleanup subscriptions
    return () => {
      unsubscribeTasks();
      if (unsubscribeEmployees) unsubscribeEmployees();
    };
  }, [user, userData.role, activeView, selectedEmployeeId]);

  // Fetch tasks for the selected employee (admin view)
  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedEmployeeTasks([]);
      return;
    }

    console.log('Fetching tasks for employee with ID:', selectedEmployeeId);
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', selectedEmployeeId));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched tasks for selected employee:', fetchedTasks);
      if (fetchedTasks.length === 0) {
        console.log('No tasks found for employee with ID:', selectedEmployeeId);
      }
      setSelectedEmployeeTasks(fetchedTasks);
    }, (error) => {
      console.error('Error fetching tasks for selected employee:', error);
    });

    return () => unsubscribeTasks(); // Cleanup subscription
  }, [selectedEmployeeId]);

  // Add or update a task in Firestore
  const addTask = async (taskData) => {
    if (!user) return alert('Please log in to add tasks!');

    try {
      const taskWithUser = {
        ...taskData,
        userId: user.uid,
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0], // Default to today if no due date
        status: taskData.status || 'todo', // Default to 'todo' if no status
        subtasks: taskData.subtasks || [], // Ensure subtasks is an array
      };

      console.log('Adding task with data:', taskWithUser);
      if (taskData.id) {
        // Update existing task
        const taskRef = doc(db, 'tasks', taskData.id);
        await updateDoc(taskRef, taskWithUser);
      } else {
        // Add new task
        await addDoc(collection(db, 'tasks'), taskWithUser);
      }
    } catch (error) {
      console.error('Error adding/updating task:', error);
      alert(`Failed to add/update task: ${error.message}`);
    }
  };

  // Update task status in Firestore
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
      if (!task) return;

      // Prevent moving to 'completed' if subtasks are incomplete
      if (newStatus === 'completed' && (task.subtasks || []).some(s => !s.completed)) {
        console.log('Cannot move to completed: not all subtasks are checked');
        return;
      }

      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Failed to update task status: ${error.message}`);
    }
  };

  // Toggle subtask completion and update task status if needed
  const toggleSubtaskCompletion = async (taskId, subtaskIndex) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
      if (!task || !task.subtasks || !task.subtasks[subtaskIndex]) return;

      // Update subtask completion status
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        completed: !updatedSubtasks[subtaskIndex].completed,
      };

      await updateDoc(taskRef, { subtasks: updatedSubtasks });

      // Automatically update task status based on subtask completion
      const allSubtasksCompleted = updatedSubtasks.every(s => s.completed);
      const anySubtaskCompleted = updatedSubtasks.some(s => s.completed);

      if (task.status === 'todo' && anySubtaskCompleted) {
        await updateTaskStatus(taskId, 'inprogress');
      } else if (task.status === 'inprogress' && allSubtasksCompleted) {
        await updateTaskStatus(taskId, 'completed');
      } else if (task.status === 'completed' && !allSubtasksCompleted) {
        await updateTaskStatus(taskId, 'inprogress');
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
      alert(`Failed to toggle subtask: ${error.message}`);
    }
  };

  // Calculate completion percentage for a task based on subtasks
  const getCompletionPercentage = useCallback((taskId) => {
    const task = (selectedEmployeeId ? selectedEmployeeTasks : tasks).find(t => t.id === taskId);
    if (!task || !task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }, [tasks, selectedEmployeeTasks, selectedEmployeeId]);

  // Open the modal for editing a task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Close the modal and reset editing task
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Open the modal for adding a new task
  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Render the overview section with task statistics
  const renderOverview = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {['To-Do', 'In Progress', 'Completed'].map((title, index) => {
          const counts = [tasks.filter(t => t.status === 'todo').length, tasks.filter(t => t.status === 'inprogress').length, tasks.filter(t => t.status === 'completed').length];
          return (
            <div key={title} ref={el => cardRefs.current[index] = el} className="bg-gray-900 text-white p-6 rounded-lg shadow-md relative min-h-[200px]">
              <h3 className="text-lg font-semibold mb-4">{title}</h3>
              <p className="text-4xl font-bold mb-4">{counts[index]}</p>
              <div className="absolute top-6 right-6">
                <svg className="w-16 h-16 sm:w-20 sm:h-20">
                  <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40" strokeDasharray="188" />
                  <circle ref={el => progressRefs.current[index] = el} className="text-blue-500" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40" transform="rotate(-90 40 40)" strokeLinecap="round" />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm">{tasks.length > 0 ? Math.round((counts[index] / tasks.length) * 100) : 0}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render the tasks section with Kanban-style columns
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
                    <button onClick={() => handleEditTask(task)} className="text-gray-500 hover:text-gray-700">
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

  // Render the employee list sidebar for admins
  const renderEmployeeList = () => {
    if (isLoading) {
      return (
        <div className='Siide' style={{
          position: 'fixed',
          top: '86px',
          right: 0,
          width: '338px',
          height: 'calc(100vh - 86px)', 
          backgroundColor: '#FFFFFF',
          padding: '20px',
          marginRight: '20px',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          overflowY: 'auto', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Loading employees...</p>
        </div>
      );
    }

    // Filter employees based on search term
    const filteredEmployees = employees.filter(employee => 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className='Siide w-[250px] sm:w-[280px] lg:w-[300px]' style={{
        position: 'fixed',
        top: '86px',
        right: '0px',
        height: 'calc(100vh - 86px)', 
        backgroundColor: '#FFFFFF',
        padding: '20px',
        marginRight: '10px',
        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        zIndex: 10,
      }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              color: '#333',
              outline: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            }}
          />
          <img
            src={magnifyingGlassIcon}
            alt="Search"
            style={{
              position: 'absolute',
              right: '35px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              pointerEvents: 'none',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                fontSize: '14px',
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
        <div className='employee-list' style={{ maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
          {filteredEmployees.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>
              {searchTerm ? 'No employees match your search.' : 'No employees found.'}
            </p>
          ) : (
            filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => setSelectedEmployeeId(employee.id)}
                style={{
                  display: 'flex',
                  position: 'relative',
                  alignItems: 'center',
                  width: '100%',
                  height: '68px',
                  backgroundColor: selectedEmployeeId === employee.id ? '#e0e0e0' : '#FFFFFF',
                  borderBottom: '1px solid #ddd',
                  padding: '10px 20px',
                  marginBottom: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#333333',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginRight: '12px',
                }}>
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

  // Render details and tasks for the selected employee (admin view)
  const renderSelectedEmployeeDetails = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we fetch the employee details.</p>
        </div>
      );
    }

    if (!selectedEmployeeId) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Employee Selected</h2>
          <p className="text-gray-500">Please select an employee from the list to view their tasks and profile.</p>
        </div>
      );
    }

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!selectedEmployee) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Employee Not Found</h2>
          <p className="text-gray-500">The selected employee could not be found.</p>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 bg-white" style={{ paddingTop: '10px' }}>
        <div className="mb-4">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            border: 'none',
            borderRadius: '0',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#333333',
              color: '#fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              marginRight: '16px',
            }}>
              {selectedEmployee.firstName.charAt(0).toUpperCase()}{selectedEmployee.lastName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#141522' }}>
                {selectedEmployee.firstName.charAt(0).toUpperCase() + selectedEmployee.firstName.slice(1).toLowerCase()}{' '}
                {selectedEmployee.lastName.charAt(0).toUpperCase() + selectedEmployee.lastName.slice(1).toLowerCase()}
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 400, color: '#141522' }}>{selectedEmployee.email}</p>
            </div>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: '#E0E0E0',
            borderBottom: '1px solid #E0E0E0',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
            marginTop: '12px',
          }} />
        </div>
        {selectedEmployeeTasks.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 180px)',
            textAlign: 'center',
          }}>
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
                  {selectedEmployeeTasks.filter(t => t.status === column.status).map((task, index) => (
                    <div key={task.id} className={`${column.color} p-3 sm:p-4 rounded-lg shadow-sm mb-4 min-h-[200px] relative`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 pr-6">{task.title}</h3>
                        <button onClick={() => handleEditTask(task)} className="text-gray-500 hover:text-gray-700">
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

  // Main render function combining all components
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar activeView={activeView} setActiveView={setActiveView} userRole={userData.role} />
      <div className={`flex-1 md:ml-[250px] box-border ${activeView === 'employees' && userData.role === 'admin' ? 'md:mr-[250px] sm:mr-[280px] lg:mr-[300px]' : ''}`}>
        <Header firstName={userData.firstName} lastName={userData.lastName} activeView={activeView} onAddTask={handleAddTask} />
        <main className="p-4 sm:p-6 lg:p-8" style={{ paddingTop: activeView === 'tasks' ? '140px' : activeView === 'employees' ? '120px' : '100px' }}>
          {activeView === 'overview' && renderOverview()}
          {activeView === 'tasks' && renderTasks()}
          {activeView === 'employees' && userData.role === 'admin' && renderSelectedEmployeeDetails()}
        </main>
        {isModalOpen && <TaskModal task={editingTask} onSave={addTask} onClose={handleModalClose} />}
      </div>
      {activeView === 'employees' && userData.role === 'admin' && renderEmployeeList()}
    </div>
  );
}

export default Dashboard;