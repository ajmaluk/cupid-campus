import React from 'react';
import { Input } from '../../components/ui/Input';
import { Calendar } from 'lucide-react';
import type { SignupFormData } from '../../hooks/useSignup';

interface PersonalDetailsProps {
  formData: SignupFormData;
  updateForm: <K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => void;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({ formData, updateForm }) => {
  return (
    <div className="space-y-4">
      <Input 
        placeholder="Full Name" 
        value={formData.name}
        onChange={e => updateForm('name', e.target.value)}
        className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg"
      />
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
        <div className="relative">
          <Input 
            type="date" 
            value={formData.dob}
            onChange={e => updateForm('dob', e.target.value)}
            className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg appearance-none"
          />
          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">I am a...</label>
        <div className="grid grid-cols-2 gap-3">
          {(['Male', 'Female', 'Non-binary', 'Other'] as const).map(g => (
            <button
              key={g}
              className={`p-4 rounded-2xl border text-sm font-bold transition-all touch-manipulation ${
                formData.gender === g 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 active:scale-95'
              }`}
              onClick={() => updateForm('gender', g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Interested in</label>
        <div className="grid grid-cols-3 gap-3">
          {(['Male', 'Female', 'Everyone'] as const).map(g => (
            <button
              key={g}
              className={`p-4 rounded-2xl border text-sm font-bold transition-all touch-manipulation ${
                formData.interested_in === g 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 active:scale-95'
              }`}
              onClick={() => updateForm('interested_in', g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
