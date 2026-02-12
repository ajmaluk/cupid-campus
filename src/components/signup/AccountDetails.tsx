import React from 'react';
import { Input } from '../../components/ui/Input';
import { Lock, Loader2 } from 'lucide-react';
import type { SignupFormData } from '../../hooks/useSignup';

interface AccountDetailsProps {
  formData: SignupFormData;
  updateForm: <K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => void;
  error: string;
  isCheckingUsername: boolean;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({ formData, updateForm, error, isCheckingUsername }) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input 
          placeholder="Username" 
          value={formData.username}
          onChange={e => updateForm('username', e.target.value)}
          className={`bg-black/20 border-white/10 h-14 rounded-2xl text-lg ${error === 'Username already taken' ? 'border-red-500' : ''}`}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {isCheckingUsername && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        )}
      </div>
      <Input 
        type="email"
        placeholder="College Email (@cet.ac.in)" 
        value={formData.email}
        onChange={e => updateForm('email', e.target.value)}
        className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg"
        inputMode="email"
        autoCapitalize="none"
      />
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="password"
          placeholder="Password" 
          className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all text-lg placeholder:text-gray-500"
          value={formData.password}
          onChange={e => updateForm('password', e.target.value)}
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="password"
          placeholder="Confirm Password" 
          className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all text-lg placeholder:text-gray-500"
          value={formData.confirmPassword}
          onChange={e => updateForm('confirmPassword', e.target.value)}
        />
      </div>
    </div>
  );
};
