import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { updateUserProfile } from '../services/userService';
import { Bot, MapPin, IndianRupee, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Onboarding() {
    

  
const { user, isOnboarded } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: '',
    state: '',
    annualIncome: '',
    educationLevel: '',
    employmentStatus: ''
  });

  useEffect(() => {
    if (isOnboarded) {
      navigate('/dashboard');
    }
  }, [isOnboarded, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        state: formData.state,
        annualIncome: formData.annualIncome,
        educationLevel: formData.educationLevel,
        employmentStatus: formData.employmentStatus,
      });
      // Force reload to update context
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-mesh opacity-30" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10"
      >
        <div className="bg-white dark:bg-slate-900 py-10 px-6 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 sm:px-12">
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg dark:shadow-none shadow-emerald-500/20 mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight">Complete your profile</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
              Your agent uses this data to deterministically calculate your eligibility for government schemes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
                {error}
              </div>
            )}
            
            <Input 
              label="Full Name" 
              name="displayName" 
              required 
              placeholder="e.g. Ramesh Kumar"
              value={formData.displayName} 
              onChange={handleChange} 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">State</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <select 
                    name="state" 
                    required 
                    value={formData.state} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm dark:shadow-none appearance-none transition-colors"
                  >
                    <option value="">Select State / UT</option>
                    <optgroup label="States">
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                    </optgroup>
                    <optgroup label="Union Territories">
                      <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                      <option value="Ladakh">Ladakh</option>
                      <option value="Lakshadweep">Lakshadweep</option>
                      <option value="Puducherry">Puducherry</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Annual Income</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                  </div>
                  <select 
                    name="annualIncome" 
                    required 
                    value={formData.annualIncome} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm dark:shadow-none appearance-none transition-colors"
                  >
                    <option value="">Select Income Range</option>
                    <option value="0-250000">₹0 - ₹2,50,000</option>
                    <option value="250001-500000">₹2,50,001 - ₹5,00,000</option>
                    <option value="500001-800000">₹5,00,001 - ₹8,00,000</option>
                    <option value="800001+">Above ₹8,00,000</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Education Level</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                  </div>
                  <select 
                    name="educationLevel" 
                    required 
                    value={formData.educationLevel} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm dark:shadow-none appearance-none transition-colors"
                  >
                    <option value="">Select Education</option>
                    <option value="Illiterate">Illiterate (Not Studied)</option>
                    <option value="Primary">Primary Education (1st - 5th)</option>
                    <option value="Middle">Middle School (6th - 8th)</option>
                    <option value="10th">10th Pass (High School)</option>
                    <option value="12th">12th Pass (Intermediate)</option>
                    <option value="Undergraduate">Undergraduate Student</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Postgraduate">Postgraduate / Above</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Employment Status</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                  </div>
                  <select 
                    name="employmentStatus" 
                    required 
                    value={formData.employmentStatus} 
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm dark:shadow-none appearance-none transition-colors"
                  >
                    <option value="">Select Status</option>
                    <option value="Student">Student</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Employed">Employed</option>
                    <option value="Self-Employed">Self-Employed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full py-6 text-base rounded-xl shadow-lg dark:shadow-none shadow-emerald-500/20 group" isLoading={loading}>
                Complete Setup<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-xs text-center text-slate-400 mt-4">
                You can change these details later or use Magic Autofill with your documents.</p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}


