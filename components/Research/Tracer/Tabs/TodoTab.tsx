import React, { useState, useEffect, useMemo } from 'react';
import { TracerTodo } from '../../../../types';
import { fetchTracerTodos, saveTracerTodo, deleteTracerTodo } from '../../../../services/TracerService';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Link as LinkIcon, 
  Check, 
  Calendar, 
  Eye, 
  Target,
  // Added missing Zap icon import
  Zap
} from 'lucide-react';
import { showXeenapsToast } from '../../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../../utils/confirmUtils';
import TodoFormModal from '../Modals/TodoFormModal';
import TodoCompletionModal from '../Modals/TodoCompletionModal';

interface TodoTabProps {
  projectId: string;
}

const TodoTab: React.FC<TodoTabProps> = ({ projectId }) => {
  const [todos, setTodos] = useState<TracerTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // viewAnchorDate diletakkan pada Today agar navigasi geser minggu tetap konsisten
  const [viewAnchorDate, setViewAnchorDate] = useState(new Date());
  
  // Modals state
  const [formModal, setFormModal] = useState<{ open: boolean; todo?: TracerTodo; mode: 'view' | 'edit' }>({ open: false, mode: 'view' });
  const [completionModal, setCompletionModal] = useState<{ open: boolean; todo?: TracerTodo }>({ open: false });

  const loadTodos = async () => {
    setIsLoading(true);
    const data = await fetchTracerTodos(projectId);
    setTodos(data);
    setIsLoading(false);
  };

  useEffect(() => { loadTodos(); }, [projectId]);

  // --- GANTT ENGINE: CALCULATE 28 DAYS (TODAY AT INDEX 7) ---
  const timelineDays = useMemo(() => {
    const days = [];
    // Anchor logic: Geser ke belakang 6 hari agar Today ada di urutan ke-7
    const start = new Date(viewAnchorDate);
    start.setDate(start.getDate() - 6);
    
    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewAnchorDate]);

  const shiftWeek = (direction: number) => {
    const next = new Date(viewAnchorDate);
    next.setDate(next.getDate() + (direction * 7));
    setViewAnchorDate(next);
  };

  const getPriorityColor = (todo: TracerTodo) => {
    if (todo.isDone) return 'bg-green-500';
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(todo.deadline);
    
    if (today > deadline) return 'bg-red-500';
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return 'bg-yellow-400';
    return 'bg-[#004A74]'; // Primary Blue
  };

  const isDateInTaskRange = (date: Date, todo: TracerTodo) => {
    const dStr = date.toISOString().split('T')[0];
    return dStr >= todo.startDate && dStr <= todo.deadline;
  };

  // --- CRUD HANDLERS ---
  const handleSaveTodo = async (data: TracerTodo) => {
    if (await saveTracerTodo(data)) {
      showXeenapsToast('success', 'Task Architecture Synced');
      loadTodos();
      setFormModal({ open: false, mode: 'view' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (await showXeenapsDeleteConfirm(1)) {
      if (await deleteTracerTodo(id)) {
        showXeenapsToast('success', 'Task Purged');
        loadTodos();
      }
    }
  };

  const handleCompleteRequest = (e: React.MouseEvent, todo: TracerTodo) => {
    e.stopPropagation();
    setCompletionModal({ open: true, todo });
  };

  const handleFinalizeCompletion = async (completedDate: string, remarks: string) => {
    if (!completionModal.todo) return;
    const updated = { 
      ...completionModal.todo, 
      isDone: true, 
      completedDate, 
      completionRemarks: remarks,
      updatedAt: new Date().toISOString()
    };
    if (await saveTracerTodo(updated)) {
      showXeenapsToast('success', 'Task Completed');
      loadTodos();
      setCompletionModal({ open: false });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
         <div className="space-y-1">
            <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={16} className="text-[#FED400] fill-[#FED400]" /> 28-Day Strategic Pulse
            </h3>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Gantt-Matrix Intelligence Mode</p>
         </div>

         <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <div className="flex gap-1 mr-2 border-r border-gray-200 pr-2">
               <button onClick={() => shiftWeek(-1)} className="p-2 bg-white hover:bg-[#004A74] hover:text-white rounded-xl transition-all shadow-sm active:scale-90" title="Previous Week"><ChevronLeft size={16} /></button>
               <button onClick={() => shiftWeek(1)} className="p-2 bg-white hover:bg-[#004A74] hover:text-white rounded-xl transition-all shadow-sm active:scale-90" title="Next Week"><ChevronRight size={16} /></button>
            </div>
            <button 
              onClick={() => setFormModal({ open: true, mode: 'edit' })}
              className="flex items-center gap-2 px-6 py-2 bg-[#004A74] text-[#FED400] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={16} /> Add Task
            </button>
         </div>
      </div>

      {/* GANTT MATRIX CONTAINER */}
      <section className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar-h">
          <div className="min-w-[1400px]">
            {/* GRID HEADER: 29 COLUMNS */}
            <div className="grid grid-cols-[300px_repeat(28,1fr)] border-b border-gray-100 bg-gray-50/50">
               {/* Col 1: Task Label */}
               <div className="sticky left-0 z-30 bg-white border-r border-gray-200 px-6 py-4 flex items-center shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Execution Pipeline</span>
               </div>
               
               {/* Col 2-29: Timeline Headers */}
               {timelineDays.map((day, idx) => {
                 const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                 const dayNames = ['S','M','T','W','T','F','S'];
                 
                 return (
                   <div key={idx} className={`flex flex-col items-center justify-center py-3 border-r border-gray-50 transition-all ${isToday ? 'bg-[#FED400]/10' : ''}`}>
                      <span className={`text-[8px] font-black uppercase mb-0.5 ${isToday ? 'text-[#004A74]' : 'text-gray-300'}`}>{dayNames[day.getDay()]}</span>
                      <span className={`text-[10px] font-black ${isToday ? 'text-[#004A74] bg-[#FED400] w-6 h-6 flex items-center justify-center rounded-lg shadow-sm' : 'text-gray-400'}`}>
                        {day.getDate()}
                      </span>
                   </div>
                 );
               })}
            </div>

            {/* GRID BODY: TASK ROWS */}
            <div className="divide-y divide-gray-50">
               {isLoading ? (
                 [...Array(3)].map((_, i) => (
                    <div key={i} className="grid grid-cols-[300px_repeat(28,1fr)] h-16 animate-pulse">
                       <div className="bg-gray-50 border-r border-gray-100" />
                       {[...Array(28)].map((_, j) => <div key={j} className="bg-white border-r border-gray-50" />)}
                    </div>
                 ))
               ) : todos.length === 0 ? (
                 <div className="py-20 text-center opacity-20">
                    <CheckCircle2 size={48} className="mx-auto mb-2 text-[#004A74]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Pipeline Clear • No Tasks Detected</p>
                 </div>
               ) : todos.map(todo => (
                 <div key={todo.id} className="grid grid-cols-[300px_repeat(28,1fr)] hover:bg-blue-50/20 transition-all group">
                    {/* Sticky Task Identity */}
                    <div 
                      onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                      className="sticky left-0 z-20 bg-white border-r border-gray-200 px-6 py-4 flex items-center gap-3 cursor-pointer group-hover:bg-[#fcfcfc] shadow-[4px_0_15px_rgba(0,0,0,0.02)]"
                    >
                       <div className={`shrink-0 w-2 h-8 rounded-full ${getPriorityColor(todo)}`} />
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black text-[#004A74] uppercase truncate group-hover:underline transition-all">{todo.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                             <Clock size={10} className="text-gray-300" />
                             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Deadline: {todo.deadline}</span>
                          </div>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                          {!todo.isDone && (
                            <button onClick={(e) => handleCompleteRequest(e, todo)} className="p-1.5 bg-green-50 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"><Check size={12} strokeWidth={3}/></button>
                          )}
                          <button onClick={(e) => handleDelete(e, todo.id)} className="p-1.5 text-red-200 hover:text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                       </div>
                    </div>

                    {/* Timeline Blocks */}
                    {timelineDays.map((day, idx) => {
                      const isActive = isDateInTaskRange(day, todo);
                      const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                      const colorClass = isActive ? getPriorityColor(todo) : 'bg-transparent';
                      
                      return (
                        <div 
                          key={idx} 
                          className={`border-r border-gray-50 flex items-center justify-center p-1.5 min-h-[64px] ${isToday ? 'bg-[#FED400]/5' : ''}`}
                        >
                           {isActive && (
                             <div 
                               onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                               className={`w-full h-full rounded-md shadow-sm transition-all hover:scale-105 cursor-pointer ${colorClass}`}
                               title={`${todo.title} (${day.toLocaleDateString()})`}
                             />
                           )}
                        </div>
                      );
                    })}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER LEGEND */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 bg-white/50 rounded-3xl border border-gray-100 backdrop-blur-sm">
         <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Color Index:</span>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
            <span className="text-[8px] font-bold text-gray-500 uppercase">Completed</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <span className="text-[8px] font-bold text-gray-500 uppercase">Overdue</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
            <span className="text-[8px] font-bold text-gray-500 uppercase">Critical (≤ 3d)</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#004A74] shadow-sm" />
            <span className="text-[8px] font-bold text-gray-500 uppercase">Scheduled</span>
         </div>
         <div className="ml-auto flex items-center gap-2 opacity-30">
            <Target size={12} className="text-[#004A74]" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#004A74]">Xeenaps Tracer Protocol</span>
         </div>
      </div>

      {/* MODALS */}
      {formModal.open && (
        <TodoFormModal 
          projectId={projectId}
          todo={formModal.todo}
          mode={formModal.mode}
          onClose={() => setFormModal({ open: false, mode: 'view' })}
          onSave={handleSaveTodo}
        />
      )}

      {completionModal.open && (
        <TodoCompletionModal 
          todo={completionModal.todo!}
          onClose={() => setCompletionModal({ open: false })}
          onConfirm={handleFinalizeCompletion}
        />
      )}

      <style>{`
        .custom-scrollbar-h::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: rgba(0, 74, 116, 0.2); }
      `}</style>
    </div>
  );
};

export default TodoTab;