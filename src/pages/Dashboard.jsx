import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskModal from '../components/TaskModal';
import { gsap } from 'gsap';
import { PencilIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

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

  const animateOverview = useCallback(() => {
    if (activeView !== 'overview') return;

    // Guard against null or empty refs
    if (!cardRefs.current || cardRefs.current.some(ref => !ref)) return;

    gsap.fromTo(
      cardRefs.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );

    // Guard against null or empty progress refs
    if (!progressRefs.current || progressRefs.current.some(ref => !ref)) return;

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

  const animateTasks = useCallback(() => {
    if (activeView !== 'tasks' || tasks.length === 0) return;

    // Guard against null or empty refs
    if (!taskCardRefs.current || taskCardRefs.current.some(ref => !ref)) return;

    gsap.fromTo(
      taskCardRefs.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );
  }, [activeView, tasks]);

  useEffect(() => {
    animateOverview();
  }, [animateOverview]);

  useEffect(() => {
    animateTasks();
  }, [animateTasks]);

  // Auth and data subscription
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setTasks([]);
        setSubtasks([]);
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) setUserData(userDoc.data());

      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid));
      const subtasksQuery = query(collection(db, 'subtasks'), where('userId', '==', currentUser.uid));

      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      const unsubscribeSubtasks = onSnapshot(subtasksQuery, (snapshot) => setSubtasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

      const addSampleTasks = async () => {
        const existingTasks = await getDocs(tasksQuery);
        if (!existingTasks.empty) return;

        const sampleTasks = [
          { title: 'Mezzek Website Revamp', dueDate: '2025-03-10', status: 'todo', subtasks: [{ text: 'Design UI', completed: false }, { text: 'Develop Frontend', completed: false }] },
          { title: 'Mezzek Website Revamp', dueDate: '2025-03-10', status: 'inprogress', subtasks: [{ text: 'Design UI', completed: true }, { text: 'Develop Frontend', completed: false }] },
          { title: 'Mezzek Website Revamp', dueDate: '2025-03-10', status: 'completed', subtasks: [{ text: 'Design UI', completed: true }, { text: 'Develop Frontend', completed: true }] },
        ];

        for (const task of sampleTasks) await addTask(task);
      };

      addSampleTasks();

      return () => {
        unsubscribeTasks();
        unsubscribeSubtasks();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const addTask = async (taskData) => {
    if (!user) return alert('Please log in to add tasks!');

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
        const existingSubtasks = subtasks.filter(s => s.taskId === taskData.id);
        await Promise.all(existingSubtasks.map(s => deleteDoc(doc(db, 'subtasks', s.id))));
        await Promise.all(
          taskWithUser.subtasks.map(subtask =>
            addDoc(collection(db, 'subtasks'), {
              title: subtask.text,
              taskId: taskData.id,
              userId: user.uid,
              completed: subtask.completed || false,
            })
          )
        );
      } else {
        const taskRef = await addDoc(collection(db, 'tasks'), taskWithUser);
        await Promise.all(
          taskWithUser.subtasks.map(subtask =>
            addDoc(collection(db, 'subtasks'), {
              title: subtask.text,
              taskId: taskRef.id,
              userId: user.uid,
              completed: subtask.completed || false,
            })
          )
        );
      }
    } catch (error) {
      console.error('Error adding/updating task:', error);
      alert(`Failed to add/update task: ${error.message}`);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSubtasks = subtasks.filter(s => s.taskId === taskId);

      if (newStatus === 'completed' && taskSubtasks.some(s => !s.completed)) {
        console.log('Cannot move to completed: not all subtasks are checked');
        return;
      }

      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(`Failed to update task status: ${error.message}`);
    }
  };

  const toggleSubtaskCompletion = async (subtaskId, currentStatus) => {
    try {
      const subtaskRef = doc(db, 'subtasks', subtaskId);
      const subtask = subtasks.find(s => s.id === subtaskId);
      if (!subtask) return;

      const task = tasks.find(t => t.id === subtask.taskId);
      if (!task) return;

      const taskSubtasks = subtasks.filter(s => s.taskId === subtask.taskId);

      await updateDoc(subtaskRef, { completed: !currentStatus });

      const allSubtasksCompleted = taskSubtasks.every(s => s.id === subtaskId ? !currentStatus : s.completed);
      const anySubtaskCompleted = taskSubtasks.some(s => s.id === subtaskId ? !currentStatus : s.completed);

      if (task.status === 'todo' && !currentStatus && anySubtaskCompleted) {
        await updateTaskStatus(task.id, 'inprogress');
      } else if (task.status === 'inprogress' && allSubtasksCompleted) {
        await updateTaskStatus(task.id, 'completed');
      } else if (task.status === 'completed' && !allSubtasksCompleted) {
        await updateTaskStatus(task.id, 'inprogress');
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
      alert(`Failed to toggle subtask: ${error.message}`);
    }
  };

  const getCompletionPercentage = useCallback((taskId) => {
    const taskSubtasks = subtasks.filter(subtask => subtask.taskId === taskId);
    if (!taskSubtasks.length) return 0;
    const completed = taskSubtasks.filter(s => s.completed).length;
    return Math.round((completed / taskSubtasks.length) * 100);
  }, [subtasks]);

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
                        <option value="completed" disabled={subtasks.filter(s => s.taskId === task.id).some(s => !s.completed)}>Done</option>
                      </select>
                      <ChevronDownIcon className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {subtasks.filter(s => s.taskId === task.id).map(subtask => (
                      <li key={subtask.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                          className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded-sm focus:ring-blue-500"
                        />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>{subtask.title}</span>
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 md:ml-[250px] box-border">
        <Header firstName={userData.firstName} lastName={userData.lastName} activeView={activeView} onAddTask={handleAddTask} />
        <main className="p-4 sm:p-6 lg:p-8" style={{ paddingTop: activeView === 'tasks' ? '140px' : '100px' }}>
          {activeView === 'overview' ? renderOverview() : renderTasks()}
        </main>
        {isModalOpen && <TaskModal task={editingTask} onSave={addTask} onClose={handleModalClose} />}
      </div>
    </div>
  );
}

export default Dashboard;