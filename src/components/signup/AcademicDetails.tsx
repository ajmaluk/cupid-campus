import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEPARTMENTS, MAJORS, YEARS } from '../../types';
import type { SignupFormData } from '../../hooks/useSignup';

interface AcademicDetailsProps {
  formData: SignupFormData;
  updateForm: <K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => void;
}

export const AcademicDetails: React.FC<AcademicDetailsProps> = ({ formData, updateForm }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Academic Info</label>
        <div className="relative group">
           <select 
             className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
             value={formData.department}
             onChange={(e) => updateForm('department', e.target.value)}
           >
             <option value="">Select Department</option>
             {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
           </select>
           <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
        </div>
        
        <AnimatePresence>
          {formData.department && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative group overflow-hidden">
              <select 
                className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
                value={formData.major}
                onChange={(e) => updateForm('major', e.target.value)}
              >
                <option value="">Select Major</option>
                {MAJORS[formData.department]?.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          <select 
            className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
            value={formData.year}
            onChange={(e) => updateForm('year', e.target.value)}
          >
            <option value="">Select Year</option>
            {YEARS.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
        </div>
      </div>
    </div>
  );
};
