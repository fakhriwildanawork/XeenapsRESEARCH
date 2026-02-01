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
  AlertCircle,
  Calendar,
  Eye
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

  // --- HEATMAP ENGINE (28 DAYS) ---
  const heatmapDays = useMemo(() => {
    const days = [];
    const start = new Date(viewAnchorDate);
    // Align to start of week (Sunday)
    start.setDate(start.getDate() - start.getDay());
    
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
    return 'bg-[#004A74]'; // Primary
  };

  const getDayStatus = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    const activeTodos = todos.filter(t => t.startDate <= dayStr && t.deadline >= dayStr);
    
    if (activeTodos.length === 0) return null;

    // Prioritas Warna: Merah > Kuning > Biru > Hijau
    if (activeTodos.some(t => !t.isDone && new Date() > new Date(t.deadline))) return 'bg-red-500';
    if (activeTodos.some(t => !t.isDone && (new Date(t.deadline).getTime() - new Date().getTime()) <= (3 * 86400000))) return 'bg-yellow-400';
    if (activeTodos.some(t => !t.isDone)) return 'bg-[#004A74]';
    return 'bg-green-500';
  };

  // --- CRUD HANDLERS ---
  const handleSaveTodo = async (data: TracerTodo) => {
    if (await saveTracerTodo(data)) {
      showXeenapsToast('success', 'To Do Synced');
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 28-DAY HEATMAP SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
             <Calendar size={16} className="text-[#FED400]" /> 28-Day Strategic Pulse
           </h3>
           <div className="flex gap-2">
              <button onClick={() => shiftWeek(-1)} className="p-2 bg-gray-50 hover:bg-[#004A74] hover:text-white rounded-xl transition-all shadow-sm"><ChevronLeft size={16} /></button>
              <button onClick={() => shiftWeek(1)} className="p-2 bg-gray-50 hover:bg-[#004A74] hover:text-white rounded-xl transition-all shadow-sm"><ChevronRight size={16} /></button>
           </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 lg:grid-cols-28 gap-1.5 overflow-x-auto pb-4 custom-scrollbar">
           {heatmapDays.map((day, i) => {
             const colorClass = getDayStatus(day);
             const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
             
             return (
               <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div 
                    title={day.toLocaleDateString()}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg transition-all hover:scale-110 shadow-inner ${colorClass || 'bg-gray-50'} ${isToday ? 'ring-2 ring-[#FED400] ring-offset-2' : ''}`} 
                    style={{ border: colorClass ? 'none' : '1px solid #eee' }}
                  />
                  <span className={`text-[7px] font-black uppercase ${isToday ? 'text-[#004A74]' : 'text-gray-300'}`}>{day.getDate()}</span>
               </div>
             );
           })}
        </div>
      </section>

      {/* TASK LIST SECTION */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h3 className="text-[11px] font-black text-[#004A74] uppercase tracking-widest flex items-center gap-2">
             <CheckCircle2 size={18} /> Active Intel Pipeline
           </h3>
           <button 
             onClick={() => setFormModal({ open: true, mode: 'edit' })}
             className="flex items-center gap-2 px-6 py-2.5 bg-[#004A74] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
           >
             <Plus size={16} /> New Task
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-[2rem]" />)
          ) : todos.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-20"><CheckCircle2 size={48} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Pipeline clear</p></div>
          ) : todos.map(todo => (
            <div 
              key={todo.id} 
              onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
              className={`group relative bg-white p-6 rounded-[2.5rem] border border-gray-100 flex flex-col hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-l-[6px] ${getPriorityColor(todo).replace('bg-', 'border-')}`}
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <div className={`p-1.5 rounded-lg text-white ${getPriorityColor(todo)} shadow-sm`}>
                      <Clock size={14} />
                   </div>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Target: {todo.deadline}</span>
                 </div>
                 <div className="flex gap-1">
                    {!todo.isDone && (
                      <button 
                        onClick={(e) => handleCompleteRequest(e, todo)}
                        className="p-2 bg-green-50 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Mark as Done"
                      >
                         <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                    <button onClick={(e) => handleDelete(e, todo.id)} className="p-2 text-red-200 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><Trash2 size={14} /></button>
                 </div>
              </div>

              <h4 className="text-sm font-black text-[#004A74] uppercase leading-tight line-clamp-2 mb-4 flex-1">{todo.title}</h4>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-3">
                    {todo.linkUrl && <LinkIcon size={12} className="text-blue-500" />}
                    <span className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[150px]">{todo.linkLabel || 'No Reference'}</span>
                 </div>
                 <div className="flex items-center gap-1 text-[#004A74] opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[8px] font-black uppercase">Detail</span>
                    <ChevronRight size={14} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TodoTab;