import React, { useState, useEffect, useMemo } from 'react';
import { TracerTodo } from '../../../../types';
import { saveTracerTodo, deleteTracerTodo } from '../../../../services/TracerService';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Zap
} from 'lucide-react';
import { showXeenapsDeleteConfirm } from '../../../../utils/confirmUtils';
import TodoFormModal from '../Modals/TodoFormModal';
import TodoCompletionModal from '../Modals/TodoCompletionModal';

interface TodoTabProps {
  projectId: string;
  todos: TracerTodo[];
  onRefresh: () => Promise<void>;
}

const TodoTab: React.FC<TodoTabProps> = ({ projectId, todos, onRefresh }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [viewAnchorDate, setViewAnchorDate] = useState(new Date());
  const [formModal, setFormModal] = useState<{ open: boolean; todo?: TracerTodo; mode: 'view' | 'edit' }>({ open: false, mode: 'view' });
  const [completionModal, setCompletionModal] = useState<{ open: boolean; todo?: TracerTodo }>({ open: false });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Robust status check (String/Boolean safe)
    const isDone = todo.isDone === true || String(todo.isDone).toUpperCase() === 'TRUE';
    if (isDone) return 'bg-green-500';
    
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

  const handleSaveTodo = async (data: TracerTodo) => {
    setFormModal({ open: false, mode: 'view' });
    if (await saveTracerTodo(data)) await onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (await showXeenapsDeleteConfirm(1)) {
      if (await deleteTracerTodo(id)) await onRefresh();
    }
  };

  const handleFinalizeCompletion = async (completedDate: string, remarks: string) => {
    if (!completionModal.todo) return;
    setCompletionModal({ open: false });
    const updated: TracerTodo = { 
      ...completionModal.todo, 
      isDone: true, 
      completedDate, 
      completionRemarks: remarks,
      updatedAt: new Date().toISOString()
    };
    if (await saveTracerTodo(updated)) await onRefresh();
  };

  const handleCompleteRequest = (e: React.MouseEvent, todo: TracerTodo) => {
    e.stopPropagation();
    setCompletionModal({ open: true, todo });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 md:px-2">
         <div className="space-y-1">
            <h3 className="text-[9px] md:text-[11px] font-black text-[#004A74] uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={isMobile ? 12 : 16} className="text-[#FED400] fill-[#FED400]" /> {numDays}-Day Strategic Pulse
            </h3>
            <p className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest">Gantt-Matrix Mode</p>
         </div>

         <div className="flex items-center gap-2 bg-gray-100 p-1 md:p-1.5 rounded-xl border border-gray-200">
            <div className="flex gap-1 mr-1 md:mr-2 border-r border-gray-200 pr-1 md:pr-2">
               <button onClick={() => shiftWeek(-1)} className="p-1.5 bg-white hover:bg-[#004A74] hover:text-white rounded-lg transition-all active:scale-90"><ChevronLeft size={14} /></button>
               <button onClick={() => shiftWeek(1)} className="p-1.5 bg-white hover:bg-[#004A74] hover:text-white rounded-lg transition-all active:scale-90"><ChevronRight size={14} /></button>
            </div>
            <button 
              onClick={() => setFormModal({ open: true, mode: 'edit' })}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004A74] text-[#FED400] rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all"
            >
              <Plus size={12} /> Add Task
            </button>
         </div>
      </div>

      {/* GANTT MATRIX CONTAINER */}
      <section className="bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar-h">
          <div className="w-full min-w-0">
            {/* GRID HEADER: Column narrowed for visibility */}
            <div className={`grid ${isMobile ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[140px_repeat(14,1fr)]'} border-b border-gray-100 bg-gray-50/50`}>
               <div className="sticky left-0 z-30 bg-white border-r border-gray-200 px-4 py-3 flex items-center shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                  <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-gray-400">Execution</span>
               </div>
               
               {timelineDays.map((day, idx) => {
                 const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                 const dayNames = ['S','M','T','W','T','F','S'];
                 const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                 
                 return (
                   <div key={idx} className={`flex flex-col items-center justify-center py-2 border-r border-gray-50 transition-all ${isToday ? 'bg-[#FED400]/10' : ''}`}>
                      <span className={`text-[7px] md:text-[8px] font-black uppercase mb-0.5 ${isToday ? 'text-[#004A74]' : 'text-gray-300'}`}>{dayNames[day.getDay()]}</span>
                      <span className={`text-[9px] md:text-[10px] font-black ${isToday ? 'text-[#004A74] bg-[#FED400] w-5 h-5 flex items-center justify-center rounded-lg' : 'text-gray-400'}`}>
                        {day.getDate()}
                      </span>
                      <span className="text-[6px] font-bold text-gray-300 uppercase mt-0.5">{monthNames[day.getMonth()]}</span>
                   </div>
                 );
               })}
            </div>

            {/* GRID BODY: TASK ROWS */}
            <div className="divide-y divide-gray-50">
               {todos.length === 0 ? (
                 <div className="py-20 text-center opacity-20">
                    <CheckCircle2 size={48} className="mx-auto mb-2 text-[#004A74]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Pipeline Clear</p>
                 </div>
               ) : todos.map(todo => {
                 const isDone = todo.isDone === true || String(todo.isDone).toUpperCase() === 'TRUE';
                 return (
                 <div key={todo.id} className={`grid ${isMobile ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[140px_repeat(14,1fr)]'} hover:bg-blue-50/20 transition-all group`}>
                    <div 
                      onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                      className="sticky left-0 z-20 bg-white border-r border-gray-200 px-3 py-3 flex items-center gap-2 cursor-pointer group-hover:bg-[#fcfcfc] shadow-[2px_0_10px_rgba(0,0,0,0.02)]"
                    >
                       <div className={`shrink-0 w-1 h-6 rounded-full ${getPriorityColor(todo)}`} />
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[9px] md:text-[10px] font-black text-[#004A74] uppercase truncate leading-tight">{todo.title}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                             <Clock size={8} className="text-gray-300" />
                             <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter">Due: {todo.deadline}</span>
                          </div>
                       </div>
                       {/* RESTORED ACTION BUTTONS */}
                       <div className="flex gap-1 ml-1">
                          {!isDone && (
                            <button onClick={(e) => handleCompleteRequest(e, todo)} className="p-1 text-green-500 hover:bg-green-50 rounded transition-all"><Check size={12} strokeWidth={3}/></button>
                          )}
                          <button onClick={(e) => handleDelete(e, todo.id)} className="p-1 text-red-200 hover:text-red-500 rounded transition-all"><Trash2 size={12} /></button>
                       </div>
                    </div>

                    {timelineDays.map((day, idx) => {
                      const isActive = isDateInTaskRange(day, todo);
                      const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                      const colorClass = isActive ? getPriorityColor(todo) : 'bg-transparent';
                      return (
                        <div key={idx} className={`border-r border-gray-50 flex items-center justify-center p-1 min-h-[48px] ${isToday ? 'bg-[#FED400]/5' : ''}`}>
                           {isActive && (
                             <div 
                               onClick={() => setFormModal({ open: true, todo, mode: 'view' })}
                               className={`w-full h-full rounded-sm shadow-sm transition-all hover:scale-105 cursor-pointer ${colorClass}`}
                             />
                           )}
                        </div>
                      );
                    })}
                 </div>
               );})}
            </div>
          </div>
        </div>
      </section>

      {/* COMPACTED LEGEND */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-3 bg-white/50 rounded-2xl border border-gray-100 backdrop-blur-sm">
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[7px] font-black text-gray-500 uppercase">Done</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[7px] font-black text-gray-500 uppercase">Alert</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[7px] font-black text-gray-500 uppercase">Critical</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#004A74]" /><span className="text-[7px] font-black text-gray-500 uppercase">Active</span></div>
      </div>

      {formModal.open && <TodoFormModal projectId={projectId} todo={formModal.todo} mode={formModal.mode} onClose={() => setFormModal({ open: false, mode: 'view' })} onSave={handleSaveTodo} />}
      {completionModal.open && <TodoCompletionModal todo={completionModal.todo!} onClose={() => setCompletionModal({ open: false })} onConfirm={handleFinalizeCompletion} />}

      <style>{`.custom-scrollbar-h::-webkit-scrollbar { height: 4px; } .custom-scrollbar-h::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(0, 74, 116, 0.1); border-radius: 10px; }`}</style>
    </div>
  );
};

export default TodoTab;