import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ firstName: '', lastName: '' });
  const [title, setTitle] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [activeView, setActiveView] = useState('overview'); // Default to overview
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeTasks = null;
    let unsubscribeSubtasks = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
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
          setTasks(taskList);
        });

        const subtasksRef = collection(db, 'subtasks');
        const userSubtasksQuery = query(subtasksRef, where('userId', '==', currentUser.uid));
        unsubscribeSubtasks = onSnapshot(userSubtasksQuery, (snapshot) => {
          const subtaskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSubtasks(subtaskList);
        });
      } else {
        setTasks([]);
        setSubtasks([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeSubtasks) unsubscribeSubtasks();
    };
  }, []);

  const addTask = async (e) => {
    if (e) e.preventDefault(); // Handle form submission
    if (!user) {
      alert('Please log in to add tasks!');
      return;
    }
    try {
      await addDoc(collection(db, 'tasks'), {
        title: title || 'New Task', // Use input value or default
        description: 'New task',
        dueDate: '2025-03-10',
        status: 'todo',
        userId: user.uid,
      });
      setTitle(''); // Clear input after adding
    } catch (error) {
      console.error('Error adding task:', error.message);
      alert('Failed to add task: ' + error.message);
    }
  };

  const addSubtask = async (taskId, e) => {
    e.preventDefault();
    if (!user || !subtaskTitle) {
      alert('Please enter a subtask title!');
      return;
    }
    try {
      await addDoc(collection(db, 'subtasks'), {
        title: subtaskTitle,
        taskId: taskId,
        userId: user.uid,
        completed: false,
      });
      setSubtaskTitle('');
    } catch (error) {
      console.error('Error adding subtask:', error.message);
      alert('Failed to add subtask: ' + error.message);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error.message);
      alert('Failed to update task: ' + error.message);
    }
  };

  const toggleSubtaskCompletion = async (subtaskId, currentStatus) => {
    try {
      const subtaskRef = doc(db, 'subtasks', subtaskId);
      await updateDoc(subtaskRef, { completed: !currentStatus });
    } catch (error) {
      console.error('Error toggling subtask:', error.message);
      alert('Failed to toggle subtask: ' + error.message);
    }
  };

  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'inprogress');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  if (!user) return <div>Loading...</div>;

  const renderOverview = () => (
    <div style={{ padding: '20px' }}>
      <h2>Overview</h2>
      <p>Welcome to your dashboard! Here's a quick summary:</p>
      <ul>
        <li>Total Tasks: {tasks.length}</li>
        <li>To Do: {todoTasks.length}</li>
        <li>In Progress: {inProgressTasks.length}</li>
        <li>Completed: {completedTasks.length}</li>
      </ul>
    </div>
  );

  const renderTasks = () => (
    <div style={{ padding: '20px' }}>
      <form onSubmit={addTask} style={{ margin: '20px 0' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
        <button type="submit">Add Task</button>
      </form>
      <div>
        <h2>To Do</h2>
        <ul>
          {todoTasks.map((task) => (
            <li key={task.id}>
              {task.title} - {task.description}
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                style={{ marginLeft: '10px' }}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <form onSubmit={(e) => addSubtask(task.id, e)} style={{ marginTop: '5px' }}>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add subtask"
                />
                <button type="submit">Add</button>
              </form>
              <ul>
                {subtasks
                  .filter((subtask) => subtask.taskId === task.id)
                  .map((subtask) => (
                    <li key={subtask.id}>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                      />
                      {subtask.title}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
        <h2>In Progress</h2>
        <ul>
          {inProgressTasks.map((task) => (
            <li key={task.id}>
              {task.title} - {task.description}
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                style={{ marginLeft: '10px' }}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <form onSubmit={(e) => addSubtask(task.id, e)} style={{ marginTop: '5px' }}>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add subtask"
                />
                <button type="submit">Add</button>
              </form>
              <ul>
                {subtasks
                  .filter((subtask) => subtask.taskId === task.id)
                  .map((subtask) => (
                    <li key={subtask.id}>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                      />
                      {subtask.title}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
        <h2>Completed</h2>
        <ul>
          {completedTasks.map((task) => (
            <li key={task.id}>
              {task.title} - {task.description}
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                style={{ marginLeft: '10px' }}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <form onSubmit={(e) => addSubtask(task.id, e)} style={{ marginTop: '5px' }}>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add subtask"
                />
                <button type="submit">Add</button>
              </form>
              <ul>
                {subtasks
                  .filter((subtask) => subtask.taskId === task.id)
                  .map((subtask) => (
                    <li key={subtask.id}>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtaskCompletion(subtask.id, subtask.completed)}
                      />
                      {subtask.title}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div style={{ 
        marginLeft: '250px', 
        width: 'calc(100% - 250px)', 
        boxSizing: 'border-box',
      }}>
        <Header 
          firstName={userData.firstName} 
          lastName={userData.lastName} 
          activeView={activeView} 
          onAddTask={addTask} 
        />
        <div style={{ 
          padding: activeView === 'tasks' ? '140px 20px 20px' : '100px 20px 20px' // Adjust for taller header
        }}>
          {activeView === 'overview' ? renderOverview() : renderTasks()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;