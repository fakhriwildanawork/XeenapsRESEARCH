import React, { useState } from 'react';
import { UserProfile, EducationEntry, CareerEntry } from '../../types';
import { saveUserProfile, saveEducationEntry, saveCareerEntry } from '../../services/ProfileService';
import { X, Save, User, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { FormField, FormDropdown } from '../Common/FormComponents';
import { showXeenapsToast } from '../../utils/toastUtils';

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * EDIT PROFILE MODAL
 */
export const EditProfileModal: React.FC<ModalProps & { profile: UserProfile }> = ({ profile, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (await saveUserProfile(formData)) {
      showXeenapsToast('success', 'Profile identity updated');
      onSuccess();
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg"><User size={24} /></div>
            <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">Identity Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          <FormField label="Full Name"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></FormField>
          <FormField label="Personal Email"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Photo URL"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} /></FormField>
             <FormField label="Phone"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></FormField>
          </div>
          <FormField label="Personal Biography"><textarea className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></FormField>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
             <FormField label="SINTA ID"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs" value={formData.sintaId} onChange={e => setFormData({...formData, sintaId: e.target.value})} /></FormField>
             <FormField label="Scopus ID"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs" value={formData.scopusId} onChange={e => setFormData({...formData, scopusId: e.target.value})} /></FormField>
             <FormField label="WoS ID"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs" value={formData.wosId} onChange={e => setFormData({...formData, wosId: e.target.value})} /></FormField>
             <FormField label="Scholar ID"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs" value={formData.googleScholarId} onChange={e => setFormData({...formData, googleScholarId: e.target.value})} /></FormField>
          </div>
          
          <div className="pt-6"><button type="submit" disabled={isSaving} className="w-full py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Save Profile</button></div>
        </form>
      </div>
    </div>
  );
};

/**
 * EDUCATION MODAL
 */
export const EducationModal: React.FC<ModalProps & { entry?: EducationEntry }> = ({ entry, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<EducationEntry>(entry || {
    id: crypto.randomUUID(), level: 'Bachelor', institution: '', major: '', degree: '', startYear: '', endYear: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const levels = ['Elementary School', 'Junior High School', 'Senior High School', 'Bachelor', 'Master', 'Doctoral', 'Professional'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (await saveEducationEntry(formData)) {
      showXeenapsToast('success', 'Education history synchronized');
      onSuccess();
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg"><GraduationCap size={24} /></div>
            <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">{entry ? 'Edit' : 'Add'} Education</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          <FormField label="Institution / School Name"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Level"><FormDropdown value={formData.level} options={levels} onChange={v => setFormData({...formData, level: v})} placeholder="Select level" /></FormField>
             <FormField label="Major / Study Program"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} /></FormField>
          </div>
          <FormField label="Degree Awarded"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="e.g. S.Ars, M.T." value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Year"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="YYYY" value={formData.startYear} onChange={e => setFormData({...formData, startYear: e.target.value})} /></FormField>
             <FormField label="End Year"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="YYYY or Present" value={formData.endYear} onChange={e => setFormData({...formData, endYear: e.target.value})} /></FormField>
          </div>
          <div className="pt-6"><button type="submit" disabled={isSaving} className="w-full py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Sync Record</button></div>
        </form>
      </div>
    </div>
  );
};

/**
 * CAREER MODAL
 */
export const CareerModal: React.FC<ModalProps & { entry?: CareerEntry }> = ({ entry, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CareerEntry>(entry || {
    id: crypto.randomUUID(), company: '', position: '', type: 'Full-time', startDate: '', endDate: '', location: '', description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const types = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Project'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (await saveCareerEntry(formData)) {
      showXeenapsToast('success', 'Career trajectory updated');
      onSuccess();
      onClose();
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#004A74] text-[#FED400] rounded-2xl flex items-center justify-center shadow-lg"><Briefcase size={24} /></div>
            <h2 className="text-xl font-black text-[#004A74] uppercase tracking-tight">{entry ? 'Edit' : 'Add'} Career</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          <FormField label="Company / Institution"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Job Position"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} /></FormField>
             <FormField label="Work Type"><FormDropdown value={formData.type} options={types} onChange={v => setFormData({...formData, type: v})} placeholder="Type" /></FormField>
          </div>
          <FormField label="Location (City, Country)"><input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Date"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="MMM YYYY" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></FormField>
             <FormField label="End Date"><input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="MMM YYYY or Present" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></FormField>
          </div>
          <FormField label="Description / Achievements"><textarea className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></FormField>
          <div className="pt-6"><button type="submit" disabled={isSaving} className="w-full py-4 bg-[#004A74] text-[#FED400] rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Sync Career</button></div>
        </form>
      </div>
    </div>
  );
};