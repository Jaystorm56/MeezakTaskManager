
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskModal from '../components/TaskModal';
import { gsap } from 'gsap';
import { PencilIcon } from '@heroicons/react/24/outline';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: '', lastName: '' });
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const navigate = useNavigate();

  const cardRefs = useRef([]);
  const progressRefs = useRef([]);
  const taskCardRefs = useRef([]);

  useEffect(() => {
    if (activeView === 'overview') {
      gsap.fromTo(
        cardRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );

      progressRefs.current.forEach((progress, index) => {
        const totalTasks = tasks.length;
        const percentages = [
          totalTasks ? Math.round((tasks.filter((t) => t.status === 'todo').length / totalTasks) * 100) : 0,
          totalTasks ? Math.round((tasks.filter((t) => t.status === 'inprogress').length / totalTasks) * 100) : 0,
          totalTasks ? Math.round((tasks.filter((t) => t.status === 'completed').length / totalTasks) * 100) : 0,
        ];
        const percentage = percentages[index];
        gsap.fromTo(
          progress,
          { strokeDasharray: '0, 188' },
          {
            strokeDasharray: `${percentage * 1.88}, 188`,
            duration: 1.5,
            delay: 0.5 + index * 0.2,
            ease: 'power3.out',
          }
        );
      });
    }
  }, [activeView, tasks]);

  useEffect(() => {
    if (activeView === 'tasks' && tasks.length > 0) {
      gsap.fromTo(
        taskCardRefs.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );
    }
  }, [activeView, tasks]);

  useEffect(() => {
    let unsubscribeTasks = null;
    let unsubscribeSubtasks = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed, currentUser:', currentUser);
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        const tasksRef = collection(db, 'tasks');
        const userTasksQuery = query(tasksRef, where('userId', '==', currentUser.uid));
        unsubscribeTasks = onSnapshot(userTasksQuery, (snapshot) => {
          const taskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log('Tasks fetched:', taskList);
          setTasks(taskList);
        });

        const subtasksRef = collection(db, 'subtasks');
        const userSubtasksQuery = query(subtasksRef, where('userId', '==', currentUser.uid));
        unsubscribeSubtasks = onSnapshot(userSubtasksQuery, (snapshot) => {
          const subtaskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log('Subtasks fetched:', subtaskList);
          setSubtasks(subtaskList);
        });

        const addSampleTasks = async () => {
          const existingTasks = await getDocs(userTasksQuery);
          if (existingTasks.empty) {
            const sampleTasks = [
              {
                title: 'Mezzek Website Revamp',
                description: '',
                dueDate: '2025-03-10',
                status: 'todo',
                subtasks: [
                  { text: 'Design UI', completed: false },
                  { text: 'Develop Frontend', completed: false },
                ],
              },
              {
                title: 'Mezzek Website Revamp',
                description: '',
                dueDate: '2025-03-10',
                status: 'inprogress',
                subtasks: [
                  { text: 'Design UI', completed: true },
                  { text: 'Develop Frontend', completed: false },
                ],
              },
              {
                title: 'Mezzek Website Revamp',
                description: '',
                dueDate: '2025-03-10',
                status: 'completed',
                subtasks: [
                  { text: 'Design UI', completed: true },
                  { text: 'Develop Frontend', completed: true },
                ],
              },
            ];
            for (const task of sampleTasks) {
              try {
                await addTask(task);
                console.log(`Added task: ${task.title}`);
              } catch (error) {
                console.error(`Failed to add task ${task.title}:`, error.message);
              }
            }
            console.log('Sample tasks addition completed');
          }
        };
        addSampleTasks();
      } else {
        setTasks([]);
        setSubtasks([]);
        console.log('No user, setting tasks and subtasks to empty');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeSubtasks) unsubscribeSubtasks();
    };
  }, []);

  const addTask = async (taskData) => {
    if (!user) {
      alert('Please log in to add tasks!');
      return;
    }
    try {
      const taskWithUser = {
        ...taskData,
        userId: user.uid,
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        status: taskData.status || 'todo',
      };
      if (taskData.id) {
        const taskRef = doc(db, 'tasks', taskData.id);
        await updateDoc(taskRef, taskWithUser);
        const existingSubtasks = subtasks.filter((s) => s.taskId === taskData.id);
        const newSubtaskTitles = new Set(taskWithUser.subtasks.map((s) => s.text));
        for (const subtask of existingSubtasks) {
          if (!newSubtaskTitles.has(subtask.title)) {
            await deleteDoc(doc(db, 'subtasks', subtask.id));
          }
        }
        await Promise.all(
          taskWithUser.subtasks.map((subtask) =>
            addDoc(collection(db, 'subtasks'), {
              title: subtask.text,
              taskId: taskData.id,
              userId: user.uid,
              completed: subtask.completed,
            })
          )
        );
      } else {
        const taskRef = await addDoc(collection(db, 'tasks'), taskWithUser);
        const subtaskPromises = taskWithUser.subtasks.map((subtask) =>
          addDoc(collection(db, 'subtasks'), {
            title: subtask.text,
            taskId: taskRef.id,
            userId: user.uid,
            completed: subtask.completed,
          })
        );
        await Promise.all(subtaskPromises);
      }
      console.log('Task and subtasks added/updated successfully!');
    } catch (error) {
      console.error('Error adding/updating task:', error.message);
      alert(`Failed to add/update task: ${error.message}`);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = tasks.find((t) => t.id === taskId);
      const taskSubtasks = subtasks.filter((s) => s.taskId === taskId);

      // Check if the status change is valid based on subtask completion
      if (newStatus === 'completed' && taskSubtasks.some((s) => !s.completed)) {
        alert('Cannot move to Completed until all subtasks are checked!');
        return;
      }

      await updateDoc(taskRef, { status: newStatus });
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error.message);
      alert('Failed to update task: ' + error.message);
    }
  };

  const toggleSubtaskCompletion = async (subtaskId, currentStatus) => {
    try {
      const subtaskRef = doc(db, 'subtasks', subtaskId);
      const subtask = subtasks.find((s) => s.id === subtaskId);
      const task = tasks.find((t) => t.id === subtask.taskId);
      const taskSubtasks = subtasks.filter((s) => s.taskId === subtask.taskId);

      // Toggle the subtask completion
      await updateDoc(subtaskRef, { completed: !currentStatus });

      // Update task status based on subtask completion
      if (task.status === 'todo' && !currentStatus) {
        // Move to In Progress if any subtask is checked
        await updateTaskStatus(task.id, 'inprogress');
      } else if (task.status === 'inprogress') {
        // Move to Completed if all subtasks are checked
        if (taskSubtasks.every((s) => s.completed)) {
          await updateTaskStatus(task.id, 'completed');
        }
      }
    } catch (error) {
      console.error('Error toggling subtask:', error.message);
      alert('Failed to toggle subtask: ' + error.message);
    }
  };

  const getCompletionPercentage = (taskId) => {
    const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === taskId);
    if (taskSubtasks.length === 0) return 0;
    const completedSubtasks = taskSubtasks.filter((subtask) => subtask.completed).length;
    return Math.round((completedSubtasks / taskSubtasks.length) * 100);
  };

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

  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'inprogress');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  const renderOverview = () => {
    return (
      <div className="p-5">
        <div className="flex justify-between gap-6">
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="flex-1 bg-gray-900 text-white p-8 rounded-lg shadow-md relative min-h-[200px]"
          >
            <h3 className="text-lg font-semibold mb-4">To-Do</h3>
            <p className="text-4xl font-bold mb-4">{todoTasks.length}</p>
            <div className="absolute top-8 right-8">
              <svg className="w-20 h-20">
                <circle
                  className="text-gray-700"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  strokeDasharray="188"
                />
                <circle
                  ref={(el) => (progressRefs.current[0] = el)}
                  className="text-blue-500"
                  strokeWidth="5"
                  strokeDasharray="0, 188"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  transform="rotate(-90 40 40)"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm">
                {tasks.length > 0 ? Math.round((todoTasks.length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>

          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="flex-1 bg-gray-900 text-white p-8 rounded-lg shadow-md relative min-h-[200px]"
          >
            <h2 className="text-lg font-semibold mb-4">In Progress</h2>
            <p className="text-4xl font-bold mb-4">{inProgressTasks.length}</p>
            <div className="absolute top-8 right-8">
              <svg className="w-20 h-20">
                <circle
                  className="text-gray-700"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  strokeDasharray="188"
                />
                <circle
                  ref={(el) => (progressRefs.current[1] = el)}
                  className="text-blue-500"
                  strokeWidth="5"
                  strokeDasharray="0, 188"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  transform="rotate(-90 40 40)"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm">
                {tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>

          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="flex-1 bg-gray-900 text-white p-8 rounded-lg shadow-md relative min-h-[200px]"
          >
            <h2 className="text-lg font-semibold mb-4">Completed</h2>
            <p className="text-4xl font-bold mb-4">{completedTasks.length}</p>
            <div className="absolute top-8 right-8">
              <svg className="w-20 h-20">
                <circle
                  className="text-gray-700"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  strokeDasharray="188"
                />
                <circle
                  ref={(el) => (progressRefs.current[2] = el)}
                  className="text-blue-500"
                  strokeWidth="5"
                  strokeDasharray="0, 188"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="40"
                  cy="40"
                  transform="rotate(-90 40 40)"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTasks = () => {
    console.log('Rendering tasks, tasks.length:', tasks.length);
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-5 text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Task Yet?</h2>
          <p className="text-gray-500">Add task to the system to perform well</p>
        </div>
      );
    }

    return (
      <div className="p-5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Not Started Column */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-4 h-4 bg-red-400 rounded-full mr-2"></span>
              Not Started
            </h2>
            {todoTasks.map((task, index) => (
              <div
                key={task.id}
                ref={(el) => (taskCardRefs.current[index] = el)}
                className="bg-gray-100 p-4 rounded-lg shadow-sm mb-4 relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500">{task.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">
                      {getCompletionPercentage(task.id)}%
                    </span>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-2 mb-2">
                  {subtasks
                    .filter((subtask) => subtask.taskId === task.id)
                    .map((subtask) => (
                      <li key={subtask.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                          className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span
                          className={`text-sm ${
                            subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                </ul>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="w-full py-1 px-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">Not Started</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed" disabled={subtasks.filter((s) => s.taskId === task.id).some((s) => !s.completed)}>
                    Done
                  </option>
                </select>
              </div>
            ))}
          </div>

          {/* In Progress Column */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-4 h-4 bg-blue-400 rounded-full mr-2"></span>
              In Progress
            </h2>
            {inProgressTasks.map((task, index) => (
              <div
                key={task.id}
                ref={(el) => (taskCardRefs.current[index + todoTasks.length] = el)}
                className="bg-blue-100 p-4 rounded-lg shadow-sm mb-4 relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500">{task.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">
                      {getCompletionPercentage(task.id)}%
                    </span>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-2 mb-2">
                  {subtasks
                    .filter((subtask) => subtask.taskId === task.id)
                    .map((subtask) => (
                      <li key={subtask.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                          className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span
                          className={`text-sm ${
                            subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                </ul>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="w-full py-1 px-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">Not Started</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed" disabled={subtasks.filter((s) => s.taskId === task.id).some((s) => !s.completed)}>
                    Done
                  </option>
                </select>
              </div>
            ))}
          </div>

          {/* Done Column */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-4 h-4 bg-green-400 rounded-full mr-2"></span>
              Done
            </h2>
            {completedTasks.map((task, index) => (
              <div
                key={task.id}
                ref={(el) => (taskCardRefs.current[index + todoTasks.length + inProgressTasks.length] = el)}
                className="bg-green-50 p-4 rounded-lg shadow-sm mb-4 relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500">{task.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">
                      {getCompletionPercentage(task.id)}%
                    </span>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-2 mb-2">
                  {subtasks
                    .filter((subtask) => subtask.taskId === task.id)
                    .map((subtask) => (
                      <li key={subtask.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                          className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span
                          className={`text-sm ${
                            subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                </ul>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="w-full py-1 px-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">Not Started</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Done</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="ml-[250px] w-[calc(100%-250px)] box-border">
        <Header
          firstName={userData.firstName}
          lastName={userData.lastName}
          activeView={activeView}
          onAddTask={handleAddTask}
        />
        <div
          className="p-5"
          style={{
            paddingTop: activeView === 'tasks' ? '140px' : '100px',
          }}
        >
          {activeView === 'overview' ? renderOverview() : renderTasks()}
        </div>
        {isModalOpen && (
          <TaskModal
            task={editingTask}
            onSave={addTask}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;