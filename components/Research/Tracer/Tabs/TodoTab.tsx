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
  Zap,
  Loader2
} from 'lucide-react';
import { showXeenapsToast } from '../../../../utils/toastUtils';
import { showXeenapsDeleteConfirm } from '../../../../utils/confirmUtils';
import TodoFormModal from '../Modals/TodoFormModal';
import TodoCompletionModal from '../Modals/TodoCompletionModal';

interface TodoTabProps {
  projectId: string;
}

// Fix: Correct component definition to ensure it returns ReactNode properly
const TodoTab: React.FC<TodoTabProps> = ({ projectId }) => {
  const [todos, setTodos] = useState<TracerTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [viewAnchorDate, setViewAnchorDate] = useState(new Date());
  const [formModal, setFormModal] = useState<{ open: boolean; todo?: TracerTodo; mode: 'view' | 'edit' }>({ open: false, mode: 'view' });
  const [completionModal, setCompletionModal] = useState<{ open: boolean; todo?: TracerTodo }>({ open: false });

  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTodos = async () => {
    setIsLoading(true);
    const data = await fetchTracerTodos(projectId);
    setTodos(data);
    setIsLoading(false);
  };

  useEffect(() => { loadTodos(); }, [projectId]);

  // --- GANTT ENGINE: ADAPTIVE 14/7 DAYS ---
  const numDays = isMobile ? 7 : 14;
  const todayOffset = isMobile ? 3 : 6;

  const timelineDays = useMemo(() => {
    const days = [];
    const start = new Date(viewAnchorDate);
    start.setDate(start.getDate() - todayOffset);
    
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewAnchorDate, numDays, todayOffset]);

  const shiftWeek = (direction: number) => {
    const next = new Date(viewAnchorDate);
    next.setDate(next.getDate() + (direction * (isMobile ? 3 : 7)));
    setViewAnchorDate(next);
  };

  const getPriorityColor = (todo: TracerTodo) => {
    if (todo.isDone || (todo as any).optimisticDone) return 'bg-green-500';
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(todo.deadline);
    
    if (today > deadline) return 'bg-red-500';
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return 'bg-yellow-400';
    return 'bg-[#004A74]';
  };

  const isDateInTaskRange = (date: Date, todo: TracerTodo) => {
    const dStr = date.toISOString().split('T')[0];
    return dStr >= todo.startDate && dStr <= todo.deadline;
  };

  // --- OPTIMISTIC CRUD HANDLERS ---
  const handleSaveTodo = async (data: TracerTodo) => {
    // Optimistic Update
    const isEdit = todos.some(t => t.id === data.id);
    const prevTodos = [...todos];
    
    if (isEdit) {
      setTodos(prev => prev.map(t => t.id === data.id ? data : t));
    } else {
      setTodos(prev => [data, ...prev]);
    }
    setFormModal({ open: false, mode: 'view' });

    if (await saveTracerTodo(data)) {
      showXeenapsToast('success', 'Task Synchronized');
      loadTodos(); // Refresh for server truth
    } else {
      setTodos(prevTodos);
      showXeenapsToast('error', 'Sync Failed');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (await showXeenapsDeleteConfirm(1)) {
      const prevTodos = [...todos];
      setTodos(prev => prev.filter(t => t.id !== id));
      
      if (await deleteTracerTodo(id)) {
        showXeenapsToast('success', 'Task Purged');
      } else {
        setTodos(prevTodos);
        showXeenapsToast('error', 'Purge Failed');
      }
    }
  };

  const handleFinalizeCompletion = async (completedDate: string, remarks: string) => {
    if (!completionModal.todo) return;
    const targetId = completionModal.todo.id;
    const prevTodos = [...todos];

    // Fix: Corrected syntax error in object mapping for optimistic update
    setTodos(prev => prev.map(t => t.id === targetId ? ({ ...t, isDone: true, optimisticDone: true } as any) : t));
    setCompletionModal({ open: false });

    // Fix: Shorthand properties are now correctly scoped within handleFinalizeCompletion
    const updated: TracerTodo = { 
      ...completionModal.todo, 
      isDone: true, 
      completedDate, 
      completionRemarks: remarks,
      updatedAt: new Date().toISOString()
    };
    
    if (await saveTracerTodo(updated)) {
      showXeenapsToast('success', 'Task Completed');
      loadTodos();
    } else {
      // Fix: prevTodos is now correctly recognized as in-scope
      setTodos(prevTodos);
      showXeenapsToast('error', 'Completion Sync Failed');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-2">
         <div className="space-y-1">
            <h3 className="text-[9px] md:text-[11px] font-black text-[#004A74] uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={isMobile ? 12 : 16} className="text-[#FED400] fill-[#FED400]" /> {numDays}-Day Strategic Pulse
            </h3>
            <p className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest">Gantt-Matrix Intelligence Mode</p>
         </div>

         <div className="flex items-center gap-2 bg-gray-100 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-gray-200">
            <div className="flex gap-1 mr-1 md:mr-2 border-r border-gray-200 pr-1 md:pr-2">
               <button onClick={() => shiftWeek(-1)} className="p-1.5 md:p-2 bg-white hover:bg-[#004A74] hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm active:scale-90"><ChevronLeft size={14} /></button>
               <button onClick={() => shiftWeek(1)} className="p-1.5 md:p-2 bg-white hover:bg-[#004A74] hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm active:scale-90"><ChevronRight size={14} /></button>
            </div>
            <button 
              onClick={() => setFormModal({ open: true, mode: 'edit' })}
              className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-[#004A74] text-[#FED400] rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={isMobile ? 12 : 16} /> Add Task
            </button>
         </div>
      </div>

      {/* GANTT MATRIX CONTAINER */}
      <section className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar-h">
          <div className={`${isMobile ? 'min-w-[600px]' : 'min-w-[1400px]'}`}>
            {/* GRID HEADER */}
            <div className={`grid ${isMobile ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[200px_repeat(14,1fr)]'} border-b border-gray-100 bg-gray-50/50`}>
               <div className="sticky left-0 z-30 bg-white border-r border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-gray-400">Pipeline</span>
               </div>
               
               {timelineDays.map((day, idx) => {
                 const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                 const dayNames = ['S','M','T','W','T','F','S'];
                 const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                 
                 return (
                   <div key={idx} className={`flex flex-col items-center justify-center py-2 md:py-3 border-r border-gray-50 transition-all ${isToday ? 'bg-[#FED400]/10' : ''}`}>
                      <span className={`text-[7px] md:text-[8px] font-black uppercase mb-0.5 ${isToday ? 'text-[#004A74]' : 'text-gray-300'}`}>{dayNames[day.getDay()]}</span>
                      <span className={`text-[9px] md:text-[11px] font-black ${isToday ? 'text-[#004A74] bg-[#FED400] w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg shadow-sm' : 'text-gray-400'}`}>
                        {day.getDate()}
                      </span>
                      <span className="text-[6px] md:text-[7px] font-bold text-gray-300 uppercase mt-0.5">{monthNames[day.getMonth()]} '{day.getFullYear().toString().slice(-2)}</span>
                   </div>
                 );
               })}
            </div>

            {/* GRID BODY: TASK ROWS */}
            <div className="divide-y divide-gray-50">
               {isLoading ? (
                 [...Array(5)].map((_, i) => (
                    <div key={i} className={`grid ${isMobile ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[200px_repeat(14,1fr)]'} h-12 md:h-16`}>
                       <div className="bg-gray-50 border-r border-gray-100 p-4"><div className="w-full h-2 skeleton rounded-full" /></div>
                       {[...Array(numDays)].map((_, j) => <div key={j} className="bg-white border-r border-gray-50 p-2"><div className="w-full h-full skeleton rounded-md opacity-20" /></div>)}
                    </div>
                 ))
               ) : todos.length === 0 ? (
                 <div className="py-20 text-center opacity-20">
                    <CheckCircle2 size={48} className="mx-auto mb-2 text-[#004A74]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Pipeline Clear</p>
                 </div>
               ) : todos.map(todo => (
                 <div key={todo.id} className={`grid ${isMobile ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[200px_repeat(14,1fr)]'} hover:bg-blue-50/20 transition-all group`}>
                    <div 
                      onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                      className="sticky left-0 z-20 bg-white border-r border-gray-200 px-3 md:px-6 py-2 md:py-4 flex items-center gap-2 md:gap-3 cursor-pointer group-hover:bg-[#fcfcfc] shadow-[4px_0_15px_rgba(0,0,0,0.02)]"
                    >
                       <div className={`shrink-0 w-1.5 md:w-2 h-6 md:h-8 rounded-full ${getPriorityColor(todo)}`} />
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[9px] md:text-[11px] font-black text-[#004A74] uppercase truncate group-hover:underline transition-all">{todo.title}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                             <Clock size={8} className="text-gray-300" />
                             <span className="text-[6px] md:text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Due: {todo.deadline}</span>
                          </div>
                       </div>
                    </div>

                    {timelineDays.map((day, idx) => {
                      const isActive = isDateInTaskRange(day, todo);
                      const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                      const colorClass = isActive ? getPriorityColor(todo) : 'bg-transparent';
                      
                      return (
                        <div key={idx} className={`border-r border-gray-50 flex items-center justify-center p-1 md:p-1.5 min-h-[48px] md:min-h-[64px] ${isToday ? 'bg-[#FED400]/5' : ''}`}>
                           {isActive && (
                             <div 
                               onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                               className={`w-full h-full rounded-sm md:rounded-md shadow-sm transition-all hover:scale-105 cursor-pointer ${colorClass}`}
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
      <div className="flex flex-wrap items-center gap-4 md:gap-6 px-4 md:px-6 py-3 md:py-4 bg-white/50 rounded-2xl md:rounded-3xl border border-gray-100 backdrop-blur-sm">
         <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-gray-400">Index:</span>
         <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-500" />
            <span className="text-[7px] md:text-[8px] font-bold text-gray-500 uppercase">Done</span>
         </div>
         <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-500" />
            <span className="text-[7px] md:text-[8px] font-bold text-gray-500 uppercase">Alert</span>
         </div>
         <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#004A74]" />
            <span className="text-[7px] md:text-[8px] font-bold text-gray-500 uppercase">Active</span>
         </div>
      </div>

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
        .custom-scrollbar-h::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TodoTab;