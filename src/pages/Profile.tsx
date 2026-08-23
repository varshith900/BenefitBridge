import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { getUserDocuments } from '../services/documentService';
import type { UserProfile } from '../types/user';
import type { DocumentMetadata } from '../types/document';
import { 
  Loader2, User, Save, MapPin, GraduationCap, 
  IndianRupee, Calendar, FileText, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';


// Helper to calculate profile completeness
function calculateCompleteness(profile: UserProfile | null) {
  if (!profile) return { score: 0, missing: [], present: [] };
  
  const requiredFields = [
    { key: 'displayName', label: 'Full Name' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'educationLevel', label: 'Education Level' },
    { key: 'annualIncome', label: 'Annual Income' },
    { key: 'employmentStatus', label: 'Employment Status' },
    { key: 'category', label: 'Social Category' },
  ];

  const present = requiredFields.filter(f => !!(profile as any)[f.key]);
  const missing = requiredFields.filter(f => !(profile as any)[f.key]);
  const score = Math.round((present.length / requiredFields.length) * 100);

  return { score, missing, present };
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    education: false,
    financial: false,
    location: false,
    social: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    async function loadData() {
      if (user) {
        const [profileData, docsData] = await Promise.all([
          getUserProfile(user.uid),
          getUserDocuments(user.uid)
        ]);
        setProfile(profileData);
        setDocuments(docsData);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setMessage('');
    try {
      await updateUserProfile(user.uid, profile);
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </Layout>
    );
  }

  const { score, missing, present } = calculateCompleteness(profile);

  const docCounts = {
    identity: documents.filter(d => ['AADHAAR', 'PAN', 'VOTER_ID'].includes(d.type)).length,
    income: documents.filter(d => ['INCOME_CERTIFICATE', 'ITR', 'SALARY_SLIP'].includes(d.type)).length,
    education: documents.filter(d => ['MARKSHEET_10', 'MARKSHEET_12', 'DEGREE_CERTIFICATE'].includes(d.type)).length,
    certificates: documents.filter(d => ['CASTE_CERTIFICATE', 'DOMICILE_CERTIFICATE', 'DISABILITY_CERTIFICATE'].includes(d.type)).length,
  };

  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Main Form Container */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
               <div className="absolute inset-0 bg-mesh mix-blend-overlay opacity-30" />
            </div>
            
            <div className="px-8 pb-8 relative">
              <div className="flex justify-between items-end -mt-12 mb-8">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-1 flex items-center justify-center border border-slate-100 dark:border-slate-800/50 relative z-10">
                   <div className="w-full h-full bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-3xl font-black">
                     {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                   </div>
                </div>
                <Button onClick={handleSave} isLoading={saving} className="shadow-md dark:shadow-none rounded-xl">
                   <Save className="w-4 h-4 mr-2" /> Save Profile</Button>
              </div>
              
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-heading">{profile?.displayName || 'Your Profile'}</h1>
                <p className="text-slate-500 dark:text-slate-400">{profile?.email}</p>
              </div>
              
              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl mb-8 font-medium text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                  >
                    {message.includes('success') ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSave} className="space-y-4">
                
                {/* PERSONAL INFORMATION */}
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button type="button" onClick={() => toggleSection('personal')} className="w-full p-5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" /> Personal Information
                    </h3>
                    {openSections.personal ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {openSections.personal && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <Input label="Full Name" name="displayName" value={profile?.displayName || ''} onChange={handleChange} />
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Date of Birth</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-slate-400" /></div>
                              <input type="date" name="dateOfBirth" value={profile?.dateOfBirth || ''} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white shadow-sm dark:shadow-none" />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Gender</label>
                            <select name="gender" value={profile?.gender || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-emerald-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white">
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                            </select>
                          </div>

                          <Input label="Contact Number" name="contactNumber" value={profile?.contactNumber || ''} onChange={handleChange} placeholder="+91" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* EDUCATION */}
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button type="button" onClick={() => toggleSection('education')} className="w-full p-5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Education
                    </h3>
                    {openSections.education ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {openSections.education && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Education Level</label>
                            <select name="educationLevel" value={profile?.educationLevel || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white">
                              <option value="">Select Level</option>
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
                          <Input label="Institution Name" name="institution" value={profile?.institution || ''} onChange={handleChange} placeholder="e.g. Delhi University" />
                          <Input label="Course / Stream" name="course" value={profile?.course || ''} onChange={handleChange} placeholder="e.g. B.Tech Computer Science" />
                          <Input label="Academic Performance" name="academicPerformance" value={profile?.academicPerformance || ''} onChange={handleChange} placeholder="e.g. 85% or 8.5 CGPA" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* FAMILY & FINANCIAL */}
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button type="button" onClick={() => toggleSection('financial')} className="w-full p-5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-emerald-500" /> Family & Financial
                    </h3>
                    {openSections.financial ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {openSections.financial && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Annual Family Income</label>
                            <select name="annualIncome" value={profile?.annualIncome || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white">
                              <option value="">Select Income Bracket</option>
                              <option value="0-250000">₹0 - ₹2,50,000</option>
                              <option value="250001-500000">₹2,50,001 - ₹5,00,000</option>
                              <option value="500001-800000">₹5,00,001 - ₹8,00,000</option>
                              <option value="800001+">Above ₹8,00,000</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Employment Status</label>
                            <select name="employmentStatus" value={profile?.employmentStatus || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white">
                              <option value="">Select Status</option>
                              <option value="Student">Student</option><option value="Unemployed">Unemployed</option><option value="Employed">Employed</option><option value="Self-Employed">Self-Employed</option>
                            </select>
                          </div>
                          <Input label="Income Source" name="incomeSource" value={profile?.incomeSource || ''} onChange={handleChange} placeholder="e.g. Agriculture, Salary" />
                          <Input label="Parent/Guardian Occupation" name="parentGuardianOccupation" value={profile?.parentGuardianOccupation || ''} onChange={handleChange} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* LOCATION & SOCIAL */}
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button type="button" onClick={() => toggleSection('location')} className="w-full p-5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" /> Location & Social Category
                    </h3>
                    {openSections.location ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {openSections.location && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">State</label>
                            <select name="state" value={profile?.state || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white">
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
                          <Input label="District" name="district" value={profile?.district || ''} onChange={handleChange} />
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Social Category</label>
                            <select name="category" value={profile?.category || ''} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white">
                              <option value="">Select Category</option>
                              <option value="General">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option>
                            </select>
                          </div>
                          <Input label="Disability Status" name="disabilityStatus" value={profile?.disabilityStatus || ''} onChange={handleChange} placeholder="Optional" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </form>
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="w-full md:w-80 flex flex-col gap-6">
            
            {/* Completeness Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                Profile Completeness
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{score}%</span>
              </h3>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-6 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-emerald-500 h-2.5 rounded-full"
                ></motion.div>
              </div>

              <div className="space-y-3">
                {present.slice(0, 4).map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{f.label}</span>
                  </div>
                ))}
                {missing.slice(0, 4).map(f => (
                  <div key={f.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">Missing {f.label}</span>
                  </div>
                ))}
              </div>
              
              {missing.length > 0 && (
                <Button variant="outline" className="w-full mt-6 rounded-xl" onClick={() => {
                  const firstMissing = missing[0];
                  // Open relevant section based on missing key
                  if (['displayName', 'dateOfBirth', 'gender', 'contactNumber'].includes(firstMissing.key)) setOpenSections(p => ({ ...p, personal: true }));
                  if (['educationLevel', 'institution', 'academicPerformance'].includes(firstMissing.key)) setOpenSections(p => ({ ...p, education: true }));
                  if (['annualIncome', 'employmentStatus'].includes(firstMissing.key)) setOpenSections(p => ({ ...p, financial: true }));
                  if (['state', 'district', 'category'].includes(firstMissing.key)) setOpenSections(p => ({ ...p, location: true }));
                }}>
                  Complete Profile
                </Button>
              )}
            </div>

            {/* Document Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Document Profile
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Identity Documents</span>
                  <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{docCounts.identity} available</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Income Documents</span>
                  <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{docCounts.income} available</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Education Documents</span>
                  <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{docCounts.education} available</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Certificates</span>
                  <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{docCounts.certificates} available</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
