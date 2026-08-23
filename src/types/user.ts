export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  
  // PERSONAL INFORMATION
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  state?: string;
  district?: string;
  cityTownVillage?: string;
  pinCode?: string;
  contactNumber?: string;

  // EDUCATION
  educationLevel?: string;
  course?: string;
  branchStream?: string;
  institution?: string;
  institutionType?: string;
  academicYear?: string;
  yearOfStudy?: string;
  admissionYear?: string;
  expectedGraduationYear?: string;
  previousQualification?: string;
  academicPerformance?: string; // Percentage/CGPA

  // FAMILY & FINANCIAL
  annualIncome?: string; // String to handle ranges or exact values easily for MVP
  incomeSource?: string;
  numberOfFamilyMembers?: number;
  numberOfEarningMembers?: number;
  parentGuardianOccupation?: string;
  employmentStatus?: string;
  financialCategory?: string;

  // LOCATION & RESIDENCY
  ruralUrban?: string;
  residencyStatus?: string;
  domicileState?: string;

  // SOCIAL / ELIGIBILITY INFORMATION
  category?: string; // e.g. General, OBC, SC, ST
  disabilityStatus?: string;
  minorityStatus?: string;
  specialEligibilityCategories?: string[]; // e.g. Farmer, Ex-Serviceman
  studentStatus?: string;

  createdAt: number;
  updatedAt: number;
}
