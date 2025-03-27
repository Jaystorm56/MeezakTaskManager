import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TaskModal({ task: initialTask, onSave, onClose }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setShowSubtasks(!!initialTask.subtasks?.length);
      setSubtasks(
        initialTask.subtasks?.map((sub) => ({
          text: sub.text || '',
          completed: sub.completed || false,
        })) || []
      );
    } else {
      setTitle('');
      setDescription('');
      setShowSubtasks(false);
      setSubtasks([]);
    }
  }, [initialTask]);

  const addSubtask = () => {
    setSubtasks([...subtasks, { text: '', completed: false }]);
  };

  const updateSubtask = (index, field, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = { ...newSubtasks[index], [field]: value };
    setSubtasks(newSubtasks);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter a task title!');
      return;
    }

    const taskData = {
      ...(initialTask || {}),
      title,
      description: description || 'No description',
      status: initialTask?.status || 'todo',
      dueDate: initialTask?.dueDate || new Date().toISOString().split('T')[0],
      subtasks: subtasks.filter((subtask) => subtask.text.trim()).map((subtask) => ({
        text: subtask.text,
        completed: subtask.completed,
      })),
    };

    if (typeof onSave !== 'function') {
      console.error('onSave is not a function:', onSave);
      alert('Error: Cannot save task. onSave is not a function.');
      return;
    }

    onSave(taskData);

    setTitle('');
    setDescription('');
    setShowSubtasks(false);
    setSubtasks([]);
    onClose();
    navigate('/dashboard');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-md w-96 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 text-xl hover:text-gray-700 transition-colors"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {initialTask ? 'Edit Task' : 'Add Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              placeholder="Task title..."
              required
            />
          </div>
          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 resize-none"
              rows="4"
              placeholder="Input description..."
            />
          </div>
          {/* Subtasks Section */}
          <div>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showSubtasks}
                onChange={() => {
                  setShowSubtasks(!showSubtasks);
                  if (!showSubtasks && subtasks.length === 0) addSubtask();
                }}
                className="mr-2 h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              Add Subtasks
            </label>
            {showSubtasks && (
              <div className="mt-2 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) =>
                        updateSubtask(index, 'completed', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={subtask.text}
                      onChange={(e) =>
                        updateSubtask(index, 'text', e.target.value)
                      }
                      className="flex-1 py-1 border-b border-gray-300 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                      placeholder="Enter subtask"
                      onFocus={() => {
                        if (index === subtasks.length - 1) addSubtask();
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Save/Update Button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            {initialTask ? 'Update' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;