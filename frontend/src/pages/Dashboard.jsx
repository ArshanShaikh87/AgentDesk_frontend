import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Play, CheckCircle2, Clock, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [responseInput, setResponseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return;
      }
      const data = await res.json();
      setTasks(data);
      if (selectedTask) {
        const updated = data.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3001');
    if (token) {
      socket.emit('authenticate', token);
    }
    
    socket.on('task_update', () => {
      fetchTasks();
    });

    return () => socket.disconnect();
  }, [selectedTask]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ description: newTaskDesc })
      });
      setNewTaskDesc('');
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  const handleRespond = async (taskId) => {
    if (!responseInput.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/tasks/${taskId}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseInput })
      });
      setResponseInput('');
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-text-secondary" />;
      case 'working': return <RefreshCw className="w-4 h-4 text-accent animate-spin" />;
      case 'needs_input': return <AlertCircle className="w-4 h-4 text-alert" />;
      case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-surface flex items-center px-6">
        <h1 className="font-display font-semibold text-xl text-text-primary">NeverDesk Dashboard</h1>
        <div className="ml-auto flex gap-4">
          <button onClick={() => navigate('/settings')} className="text-sm font-medium text-text-secondary hover:text-text-primary">Settings</button>
          <button onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }} className="text-sm font-medium text-alert hover:opacity-80">Logout</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar / Task List */}
        <div className="w-1/3 border-r border-border bg-surface flex flex-col gap-4 p-4 overflow-y-auto">
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Build a login page..." 
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono"
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-accent text-white px-3 py-2 rounded-md hover:opacity-90 flex items-center gap-1 text-sm font-medium transition-opacity"
            >
              <Play className="w-4 h-4" /> Start
            </button>
          </form>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-2">
            {tasks.map(task => (
              <button 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`flex flex-col gap-2 p-3 text-left border rounded-lg transition-colors ${selectedTask?.id === task.id ? 'border-accent bg-accent-light bg-opacity-50' : 'border-border bg-surface hover:bg-bg'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-secondary">Task #{task.id}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-text-primary truncate">{task.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 bg-bg flex flex-col p-6">
          {selectedTask ? (
            <div className="bg-surface border border-border rounded-xl flex-1 flex flex-col shadow-sm overflow-hidden">
              <div className="border-b border-border p-4 flex items-center gap-3 bg-bg">
                {getStatusIcon(selectedTask.status)}
                <h2 className="text-lg font-display font-medium text-text-primary">Task #{selectedTask.id}</h2>
                <span className="ml-auto px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-black/5 text-text-secondary">
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Objective</h3>
                  <p className="font-mono text-sm bg-bg p-3 rounded-md border border-border whitespace-pre-wrap">{selectedTask.description}</p>
                </div>

                {selectedTask.status === 'needs_input' && (
                  <div className="bg-alert-light border rounded-lg border-alert p-4 flex flex-col gap-3">
                    <div className="flex gap-2 text-alert">
                      <MessageSquare className="w-5 h-5 flex-shrink-0" />
                      <h4 className="font-medium">Agent Needs Input</h4>
                    </div>
                    <p className="font-mono text-sm text-text-primary bg-white/70 p-3 rounded">{selectedTask.pending_question}</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type your response..."
                        value={responseInput}
                        onChange={(e) => setResponseInput(e.target.value)}
                        className="flex-1 border border-alert/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-alert focus:ring-1 focus:ring-alert bg-white"
                      />
                      <button 
                        onClick={() => handleRespond(selectedTask.id)}
                        className="bg-alert text-white px-4 py-2 rounded font-medium text-sm hover:opacity-90 transition-opacity"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedTask.status === 'working' && (
                  <div className="border border-border/50 rounded-lg p-6 flex flex-col items-center justify-center flex-1 bg-bg/50">
                    <RefreshCw className="w-8 h-8 text-accent animate-spin mb-3 opacity-50" />
                    <p className="text-text-secondary text-sm font-medium font-mono">Agent is processing task...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
              <div className="text-center">
                <div className="bg-bg w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Play className="w-5 h-5 text-text-secondary opacity-50" />
                </div>
                <h3 className="text-text-primary font-medium">No task selected</h3>
                <p className="text-text-secondary text-sm">Select a task from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
