import React, { memo } from 'react';
import { INTERESTS_LIST } from '../../types';

interface InterestsProps {
  interests: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateForm: (key: any, value: any) => void;
}

export const Interests: React.FC<InterestsProps> = memo(({ interests, updateForm }) => {
  return (
    <div className="space-y-6">
      {Object.entries(INTERESTS_LIST).map(([category, categoryInterests]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {categoryInterests.map(interest => {
              const selected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
                    const newInterests = selected 
                      ? interests.filter(i => i !== interest)
                      : [...interests, interest];
                    updateForm('interests', newInterests);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-95 touch-manipulation ${
                    selected
                      ? 'bg-white text-black border-white shadow-lg scale-105'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

Interests.displayName = 'Interests';
