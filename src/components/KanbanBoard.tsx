import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../context/AuthContext';

// Initialise Supabase client for database interactions
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Define the structure of a task
interface Task {
  id: string;
  content: string;
  status: string;
}

// Define strcutre of a column
interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// Initial columns for the Kanban Board
const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: []
  },
  {
    id: 'inProgress',
    title: 'In Progress',
    tasks: []
  },
  {
    id: 'done',
    title: 'Done',
    tasks: []
  }
];

const KanbanBoard = () => {
  const { user } = useAuth(); // Get the authenticated user
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [newTask, setNewTask] = useState(''); // State to track new task input
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Fetch tasks from the database when user changes 
  useEffect(() => {
    if (user) {
      fetchTasks();
    } 
    else {
      // Reset to initial state if no user is logged in
      setColumns(initialColumns);
      setIsLoading(false);
    }
  }, [user]);

  // Fetch tasks from Supabase for the logged-in user 
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Organise fetched tasks into their respective column
      const newColumns = initialColumns.map(column => ({
        ...column,
        tasks: (tasks || [])
          .filter(task => task.status === column.id)
          .map(task => ({
            id: task.id,
            content: task.content,
            status: task.status
          }))
      }));

      setColumns(newColumns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag-and-drop event to update task positions
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !user) {
      return;
    }

    // Don't do anything if dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Find the source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    // Create updated columns with the moved task
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        const newTasks = Array.from(col.tasks);
        const [movedTask] = newTasks.splice(source.index, 1);
        return { ...col, tasks: newTasks };
      }
      if (col.id === destination.droppableId) {
        const newTasks = Array.from(col.tasks);
        const movedTask = {
          ...sourceColumn.tasks[source.index],
          status: destination.droppableId
        };
        newTasks.splice(destination.index, 0, movedTask);
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    // Optimistically update the UI
    setColumns(newColumns);

    // Update the database with new task status
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', draggableId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert to the previous state if there's an error
      fetchTasks();
    }
  };

  // Add a new task to a column
  const handleAddTask = async (columnId: string) => {
    if (!newTask.trim() || !user) return;

    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert([
          {
            content: newTask,
            status: columnId,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (task) {
        setColumns(prevColumns => 
          prevColumns.map(column => {
            if (column.id === columnId) {
              return {
                ...column,
                tasks: [
                  ...column.tasks,
                  {
                    id: task.id,
                    content: task.content,
                    status: task.status
                  }
                ]
              };
            }
            return column;
          })
        );
        setNewTask('');
        setAddingToColumn(null);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Delete a task from a column
  const handleDeleteTask = async (columnId: string, taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove task from state
      setColumns(prevColumns =>
        prevColumns.map(column => {
          if (column.id === columnId) {
            return {
              ...column,
              tasks: column.tasks.filter(task => task.id !== taskId)
            };
          }
          return column;
        })
      );
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Display loading spinner while fetching tasks
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Task Management</h2>
      
      {/* Board with drag-and-drop functionality */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => (
            <div key={column.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">{column.title}</h3>
              
              {/* Droppable area for each column */}
              <Droppable droppableId={column.id} key={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] rounded-md transition-colors ${
                      snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                    }`}
                  >

                    {/* Render tasks within the column  */}
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group bg-white border p-3 rounded mb-2 flex items-center justify-between ${
                              snapshot.isDragging
                                ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50'
                                : 'shadow-sm hover:shadow'
                            }`}
                          >
                            <div 
                              className="flex items-center flex-1 cursor-grab"
                              {...provided.dragHandleProps}
                            >
                              <GripVertical className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{task.content}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(column.id, task.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Task UI */}
              {addingToColumn === column.id ? (
                <div className="mt-4">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mb-2"
                    placeholder="Enter task..."
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddTask(column.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingToColumn(null)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="mt-4 flex items-center text-gray-600 hover:text-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </button>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;