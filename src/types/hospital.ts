export type UrgencyCode = 'GREEN' | 'AMBER' | 'RED';

export type TokenStatus = 
  | 'WAITING' 
  | 'IN_TRIAGE' 
  | 'PENDING_DOCTOR_APPROVAL' 
  | 'APPROVED' 
  | 'REFERRED_SPECIALIST'
  | 'REFERRED_HOSPITAL_ER';

export interface PatientVitals {
  bp?: string;          // e.g. 120/80 mmHg
  pulse?: string;       // e.g. 78 bpm
  temp?: string;        // e.g. 99.2 °F
  spo2?: string;        // e.g. 98%
  weight?: string;      // e.g. 65 kg
}

export interface PatientInfo {
  name: string;
  age: number;
  gender?: 'Male' | 'Female' | 'Other';
  phone: string;
  bloodGroup?: string;
  address?: string;
  allergies?: string;
  chronicDiseases?: string[]; // e.g. ['Diabetes', 'Hypertension']
  vitals?: PatientVitals;
}

export interface PatientToken {
  id: string;
  tokenNumber: string; // e.g. "EMG-4102"
  patient: PatientInfo;
  chiefComplaint: string;
  fee: number; // e.g. 100 BDT
  paymentMethod: 'bKash' | 'Nagad' | 'Card' | 'Hospital_Counter';
  paymentStatus: 'PAID' | 'WAIVED_EMERGENCY';
  urgencyCode: UrgencyCode;
  createdAt: string;
  status: TokenStatus;
  prescriptionId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'patient';
  text: string;
  timestamp: string;
  audioBase64?: string;
  isQuestion?: boolean;
  isRedFlagWarning?: boolean;
  quickReplies?: string[];
  attachedReport?: {
    name: string;
    type: string;
    url?: string;
  };
}

export interface DraftMedication {
  id: string;
  brandName: string;
  genericName: string;
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Drops' | 'Suspension' | 'ORS Sachet' | 'Inhaler' | 'Ointment';
  strength: string; // e.g. "500mg"
  dosage: string; // e.g. "1 + 0 + 1"
  timing: 'After meal (ভরা পেটে)' | 'Before meal (খাবার আগে)' | 'At bedtime (ঘুমানোর আগে)' | 'As needed (প্রয়োজনে)';
  duration: string; // e.g. "5 days"
  instructions: string; // e.g. "প্রচুর পানি খাবেন"
}

export interface ReferralDetails {
  department: string;
  specialistName?: string;
  hospitalName?: string;
  reason: string;
  priority: 'Immediate (জরুরি)' | 'Within 24 Hours' | 'Routine (সাধারণ)';
  facilityType: 'Physical ER Hospital' | 'Specialist Chamber' | 'Virtual Video Consult';
}

export interface Prescription {
  id: string;
  tokenId: string;
  tokenNumber: string;
  patient: PatientInfo;
  createdAt: string;
  triageCode: UrgencyCode;
  urgencyLabel: string;
  clinicalSummary: string;
  differentialDiagnosis: string[];
  redFlagWarnings: string[];
  medicines: DraftMedication[];
  investigationsAdvised: string[];
  lifestyleAdvice: string[];
  warningSigns: string[];
  status: 'PENDING_DOCTOR_APPROVAL' | 'APPROVED_BY_SPECIALIST' | 'REFERRED_SPECIALIST' | 'PHYSICAL_ER_DISPATCH';
  doctorNotes?: string;
  approvingDoctor?: {
    id: string;
    name: string;
    specialty: string;
    qualification: string;
    bmdcNumber: string;
    hospital: string;
    signedAt: string;
    digitalSignatureHash: string;
  };
  referralDetails?: ReferralDetails;
}

export interface SpecialistDoctor {
  id: string;
  name: string;
  specialty: string;
  specialtyBn: string;
  department: string;
  qualification: string;
  bmdcNumber: string;
  hospital: string;
  chamberAddress: string;
  availableDays: string;
  availableTime: string;
  visitFee: number;
  avatarUrl: string;
  rating: number;
  isOnline: boolean;
  totalConsultations: number;
}

export interface HospitalEmergencyUnit {
  id: string;
  name: string;
  nameBn: string;
  location: string;
  distanceKm: string;
  emergencyPhone: string;
  erBedsAvailable: number;
  icuBedsAvailable: number;
  ambulanceAvailable: boolean;
  type: 'Govt Medical College' | 'Specialized Institute' | 'Tertiary Care Private';
}
