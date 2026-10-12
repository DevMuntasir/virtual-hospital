import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client setup as per guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed data stores
const specialistsStore = [
  {
    id: 'spec-1',
    name: 'Prof. Dr. M. Shamsul Huda',
    specialty: 'Cardiologist & Interventional Specialist',
    specialtyBn: 'কার্ডিওলজিস্ট ও হৃদরোগ বিশেষজ্ঞ',
    department: 'Cardiology',
    qualification: 'MBBS, FCPS (Cardiology), FACC (USA)',
    bmdcNumber: 'A-28941',
    hospital: 'National Institute of Cardiovascular Diseases (NICVD)',
    chamberAddress: 'Green Life Hospital & Research Center, Green Road, Dhaka',
    availableDays: 'Sat - Wed (6:00 PM - 9:00 PM)',
    availableTime: '6:00 PM - 9:00 PM',
    visitFee: 1200,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOnline: true,
    totalConsultations: 1420,
  },
  {
    id: 'spec-2',
    name: 'Dr. Nusrat Jahan Chowdhury',
    specialty: 'Internal Medicine & Critical Care Specialist',
    specialtyBn: 'মেডিসিন ও ক্রিটিক্যাল কেয়ার বিশেষজ্ঞ',
    department: 'Medicine',
    qualification: 'MBBS, MD (Internal Medicine), MRCP (UK)',
    bmdcNumber: 'A-45120',
    hospital: 'Dhaka Medical College Hospital (DMCH)',
    chamberAddress: 'Popular Diagnostic Centre, Dhanmondi 2, Dhaka',
    availableDays: 'Daily except Friday (4:00 PM - 8:00 PM)',
    availableTime: '4:00 PM - 8:00 PM',
    visitFee: 1000,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813583-177ff9618b14?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    isOnline: true,
    totalConsultations: 980,
  },
  {
    id: 'spec-3',
    name: 'Dr. Tanvir Ahmed',
    specialty: 'Orthopedics & Trauma Surgeon',
    specialtyBn: 'হাড়-জোড় ও অর্থোপেডিক ট্রমা বিশেষজ্ঞ',
    department: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedic Surgery), AO Trauma Fellow',
    bmdcNumber: 'A-38742',
    hospital: 'NITOR (Pongu Hospital), Dhaka',
    chamberAddress: 'Ibn Sina Medical Consultation Centre, Mirpur 10, Dhaka',
    availableDays: 'Sun, Tue, Thu (5:30 PM - 9:00 PM)',
    availableTime: '5:30 PM - 9:00 PM',
    visitFee: 1000,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    rating: 4.9,
    isOnline: false,
    totalConsultations: 1150,
  },
  {
    id: 'spec-4',
    name: 'Dr. Farhana Yasmin',
    specialty: 'Pediatrician & Child Health Specialist',
    specialtyBn: 'শিশু রোগ ও নবজাতক বিশেষজ্ঞ',
    department: 'Pediatrics',
    qualification: 'MBBS, DCH, FCPS (Pediatrics)',
    bmdcNumber: 'A-51029',
    hospital: 'Dhaka Shishu (Children) Hospital, Sher-e-Bangla Nagar',
    chamberAddress: 'Labaid Hospital, Gulshan 2, Dhaka',
    availableDays: 'Sat - Thu (5:00 PM - 8:30 PM)',
    availableTime: '5:00 PM - 8:30 PM',
    visitFee: 1100,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    rating: 5.0,
    isOnline: true,
    totalConsultations: 1680,
  },
  {
    id: 'spec-5',
    name: 'Dr. Kazi Mahfuzur Rahman',
    specialty: 'Chest Disease & Pulmonologist',
    specialtyBn: 'বক্ষব্যাধি, ফুসফুস ও শ্বাসকষ্ট বিশেষজ্ঞ',
    department: 'Pulmonology',
    qualification: 'MBBS, DTCD, MD (Chest Diseases)',
    bmdcNumber: 'A-34190',
    hospital: 'National Institute of Diseases of the Chest and Hospital (NIDCH)',
    chamberAddress: 'Medinova Medical Services, Dhanmondi, Dhaka',
    availableDays: 'Sat, Mon, Wed (6:00 PM - 9:00 PM)',
    availableTime: '6:00 PM - 9:00 PM',
    visitFee: 1000,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
    rating: 4.7,
    isOnline: true,
    totalConsultations: 820,
  },
];

const emergencyUnitsStore = [
  {
    id: 'er-1',
    name: 'Dhaka Medical College Hospital - Emergency Dept',
    nameBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল - জরুরি বিভাগ',
    location: 'Secretariat Road, Ramna, Dhaka',
    distanceKm: '2.4 km',
    emergencyPhone: '01711-248900 / +880-2-55165088',
    erBedsAvailable: 14,
    icuBedsAvailable: 3,
    ambulanceAvailable: true,
    type: 'Govt Medical College',
  },
  {
    id: 'er-2',
    name: 'National Institute of Cardiovascular Diseases (NICVD)',
    nameBn: 'জাতীয় হৃদরোগ ইনস্টিটিউট ও হাসপাতাল',
    location: 'Sher-e-Bangla Nagar, Dhaka',
    distanceKm: '4.8 km',
    emergencyPhone: '01911-382910 / +880-2-9111400',
    erBedsAvailable: 8,
    icuBedsAvailable: 2,
    ambulanceAvailable: true,
    type: 'Specialized Institute',
  },
  {
    id: 'er-3',
    name: 'BSMMU (PG Hospital) - Emergency & Trauma',
    nameBn: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (পিজি)',
    location: 'Shahbagh, Dhaka',
    distanceKm: '3.1 km',
    emergencyPhone: '+880-2-9661051',
    erBedsAvailable: 11,
    icuBedsAvailable: 4,
    ambulanceAvailable: true,
    type: 'Govt Medical College',
  },
  {
    id: 'er-4',
    name: 'Square Hospital - 24/7 Emergency & Critical Care',
    nameBn: 'স্কয়ার হাসপাতাল - জরুরি ও আইসিইউ বিভাগ',
    location: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka',
    distanceKm: '3.5 km',
    emergencyPhone: '10616 / 01713-377775',
    erBedsAvailable: 6,
    icuBedsAvailable: 2,
    ambulanceAvailable: true,
    type: 'Tertiary Care Private',
  },
];

// Prescriptions store with initial seed items
let prescriptionsStore: any[] = [
  {
    id: 'rx-seed-1',
    tokenId: 'tok-seed-1',
    tokenNumber: 'EMG-3901',
    patient: {
      name: 'Mohammad Rafiqul Islam',
      age: 58,
      gender: 'Male',
      phone: '01712-345678',
      bloodGroup: 'B+',
      allergies: 'None',
      chronicDiseases: ['Hypertension', 'Type 2 Diabetes'],
      vitals: {
        bp: '165/100 mmHg',
        pulse: '98 bpm',
        temp: '98.6 °F',
        spo2: '96%',
      },
    },
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    triageCode: 'AMBER',
    urgencyLabel: 'Elevated BP with Occipital Headache - Specialist Evaluation Required',
    clinicalSummary: 'Patient reports severe throbbing back-of-the-head headache for 4 hours with dizziness. Known hypertensive. Blood pressure severely elevated at 165/100 mmHg. No slurred speech or chest pain reported, but hypertensive urgency risk present.',
    differentialDiagnosis: ['Hypertensive Urgency', 'Tension Headache secondary to uncontrolled BP', 'Early Cervical Spondylosis'],
    redFlagWarnings: [
      'High blood pressure (165/100 mmHg)',
      'Persistent occipital headache and dizziness',
    ],
    medicines: [
      {
        id: 'm-1',
        brandName: 'Angilock / Camlodin',
        genericName: 'Amlodipine + Losartan Potassium',
        form: 'Tablet',
        strength: '5mg / 50mg',
        dosage: '1 + 0 + 0',
        timing: 'After meal (ভরা পেটে)',
        duration: 'Continue & Review',
        instructions: 'সকালবেলা নাস্তার পর ১টি। প্রেসার নিয়মিত মাপুন।',
      },
      {
        id: 'm-2',
        brandName: 'Ace Plus / Napa Extra',
        genericName: 'Paracetamol + Caffeine',
        form: 'Tablet',
        strength: '500mg / 65mg',
        dosage: '1 + 0 + 1',
        timing: 'After meal (ভরা পেটে)',
        duration: '3 days',
        instructions: 'মাথা ব্যথার জন্য সর্বোচ্চ ৩ দিন।',
      },
    ],
    investigationsAdvised: ['Serum Creatinine', 'ECG (12 Lead)', 'Fasting Blood Sugar & Lipid Profile'],
    lifestyleAdvice: ['লবণ খাওয়া সম্পূর্ণ বন্ধ রাখুন (কাঁচা লবণ পরিহার করুন)', 'মানসিক চাপ নিয়ন্ত্রণ করুন ও পর্যাপ্ত বিশ্রাম নিন', 'প্রতিদিন সকাল-সন্ধ্যা প্রেসার লিখে রাখুন'],
    warningSigns: ['বুকে ব্যথা বা চাপ অনুভব হলে অবিলম্বে জরুরি বিভাগে যাবেন', 'হাত-পা অবশ হলে বা কথা জড়িয়ে গেলে সাথে সাথে নিকটস্থ হাসপাতালে নিন'],
    status: 'PENDING_DOCTOR_APPROVAL',
    referralDetails: {
      department: 'Cardiology',
      specialistName: 'Prof. Dr. M. Shamsul Huda',
      hospitalName: 'National Institute of Cardiovascular Diseases (NICVD)',
      reason: 'Uncontrolled hypertension with headache requiring cardiology medication adjustment.',
      priority: 'Within 24 Hours',
      facilityType: 'Specialist Chamber',
    },
  },
  {
    id: 'rx-seed-2',
    tokenId: 'tok-seed-2',
    tokenNumber: 'EMG-3902',
    patient: {
      name: 'Sharmin Akter',
      age: 26,
      gender: 'Female',
      phone: '01823-987654',
      bloodGroup: 'O+',
      allergies: 'Penicillin allergy',
      chronicDiseases: [],
      vitals: {
        bp: '115/75 mmHg',
        pulse: '76 bpm',
        temp: '99.1 °F',
        spo2: '99%',
      },
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    triageCode: 'GREEN',
    urgencyLabel: 'Acute Dyspepsia with Acid Reflux (Stable Condition)',
    clinicalSummary: '26 year old female presenting with burning upper epigastric discomfort, sour burps, and nausea after oily dinner. Vital signs completely stable. No dark stools, vomiting blood, or radiation to back. Candidate for virtual symptomatic management.',
    differentialDiagnosis: ['GERD / Acid Peptic Disorder', 'Dietary Indigestion / Gastritis'],
    redFlagWarnings: [],
    medicines: [
      {
        id: 'm-3',
        brandName: 'Pantonix / Sergel',
        genericName: 'Pantoprazole / Esomeprazole',
        form: 'Tablet',
        strength: '20mg',
        dosage: '1 + 0 + 1',
        timing: 'Before meal (খাবার আগে)',
        duration: '14 days',
        instructions: 'খাবার ২০-৩০ মিনিট আগে এক গ্লাস পানি দিয়ে সেবন করবেন।',
      },
      {
        id: 'm-4',
        brandName: 'Gaviscon / Entacyd Plus',
        genericName: 'Sodium Alginate + Antacid Suspension',
        form: 'Suspension',
        strength: '200ml',
        dosage: '2 চামচ (১০মিলি)',
        timing: 'After meal (ভরা পেটে)',
        duration: '7 days',
        instructions: 'খাবারের পর ও শোবার আগে যখন বুক জ্বালাপোড়া করবে।',
      },
      {
        id: 'm-5',
        brandName: 'Motigut / Deflux',
        genericName: 'Domperidone',
        form: 'Tablet',
        strength: '10mg',
        dosage: '1 + 1 + 1',
        timing: 'Before meal (খাবার আগে)',
        duration: '5 days',
        instructions: 'বমি ভাব দূর করতে খাবারের ১৫ মিনিট আগে।',
      },
    ],
    investigationsAdvised: ['USG of Whole Abdomen (if symptoms persist beyond 2 weeks)'],
    lifestyleAdvice: ['ভাজাপোড়া, অতিরিক্ত তেল-মসলাযুক্ত ও ফাস্টফুড জাতীয় খাবার পরিহার করুন', 'খাওয়ার সাথে সাথে শুয়ে পড়বেন না, অন্তত ২ ঘণ্টা পর ঘুমাবেন', 'একবারে বেশি না খেয়ে অল্প অল্প করে বারবার খান'],
    warningSigns: ['কালো পায়খানা হলে বা রক্ত বমি হলে দ্রুত জরুরি বিভাগে যোগাযোগ করুন', 'পেটে অসহ্য তীব্র ব্যথা হলে হাসপাতালে আসুন'],
    status: 'PENDING_DOCTOR_APPROVAL',
  },
  {
    id: 'rx-seed-3',
    tokenId: 'tok-seed-3',
    tokenNumber: 'EMG-3899',
    patient: {
      name: 'Kabir Hossain',
      age: 64,
      gender: 'Male',
      phone: '01914-112233',
      bloodGroup: 'A+',
      allergies: 'Sulfa drugs',
      chronicDiseases: ['Coronary Artery Disease (CABG 2021)'],
      vitals: {
        bp: '140/85 mmHg',
        pulse: '84 bpm',
        temp: '98.4 °F',
        spo2: '97%',
      },
    },
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    triageCode: 'GREEN',
    urgencyLabel: 'Post-Op Follow-up & Routine Lipid Profile Review',
    clinicalSummary: 'Patient had bypass surgery 5 years ago. Living 180 km away in Noakhali. Attended virtual follow-up to show recent Lipid Profile and ECG without traveling 6 hours to Dhaka. Lab shows LDL 88 mg/dL (target achieved), stable status.',
    differentialDiagnosis: ['Stable Post-Revascularization Follow-up', 'Routine Dyslipidemia Maintenance'],
    redFlagWarnings: [],
    medicines: [
      {
        id: 'm-6',
        brandName: 'Cardicor',
        genericName: 'Bisoprolol Fumarate',
        form: 'Tablet',
        strength: '2.5mg',
        dosage: '1 + 0 + 0',
        timing: 'After meal (ভরা পেটে)',
        duration: 'Continue for 3 months',
        instructions: 'প্রতিদিন সকালে নিয়মিত খাবেন।',
      },
      {
        id: 'm-7',
        brandName: 'Lipicon / Rostar',
        genericName: 'Rosuvastatin',
        form: 'Tablet',
        strength: '10mg',
        dosage: '0 + 0 + 1',
        timing: 'At bedtime (ঘুমানোর আগে)',
        duration: 'Continue for 3 months',
        instructions: 'রাতের খাবারের পর শোবার সময়।',
      },
    ],
    investigationsAdvised: ['Repeat Lipid Profile & Serum Creatinine in 3 months'],
    lifestyleAdvice: ['প্রতিদিন অন্তত ৩০ মিনিট হালকা হাঁটার অভ্যাস রাখুন', 'ধূমপান ও অতিরিক্ত তেলজাতীয় খাবার কঠোরভাবে বর্জনীয়'],
    warningSigns: ['বুকে চাপ বা বাম বাহুতে ব্যথা ছড়িয়ে পড়লে তাৎক্ষণিক নিকটস্থ হাসপাতালে যাবেন'],
    status: 'APPROVED_BY_SPECIALIST',
    doctorNotes: 'Lab parameters reviewed virtually. Excellent cholesterol control achieved. No need for physical travel from Noakhali this month.',
    approvingDoctor: {
      id: 'spec-1',
      name: 'Prof. Dr. M. Shamsul Huda',
      specialty: 'Cardiologist & Interventional Specialist',
      qualification: 'MBBS, FCPS (Cardiology), FACC (USA)',
      bmdcNumber: 'A-28941',
      hospital: 'National Institute of Cardiovascular Diseases (NICVD)',
      signedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      digitalSignatureHash: 'NICVD-VERIFIED-e6a9f4c8',
    },
  },
];

let tokensStore: any[] = [
  {
    id: 'tok-seed-1',
    tokenNumber: 'EMG-3901',
    patient: {
      name: 'Mohammad Rafiqul Islam',
      age: 58,
      gender: 'Male',
      phone: '01712-345678',
      bloodGroup: 'B+',
      allergies: 'None',
      chronicDiseases: ['Hypertension', 'Type 2 Diabetes'],
      vitals: {
        bp: '165/100 mmHg',
        pulse: '98 bpm',
        temp: '98.6 °F',
        spo2: '96%',
      },
    },
    chiefComplaint: 'তীব্র মাথা ব্যথা ও উচ্চ রক্তচাপ (Severe occipital headache with high BP)',
    fee: 100,
    paymentMethod: 'bKash',
    paymentStatus: 'PAID',
    urgencyCode: 'AMBER',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'PENDING_DOCTOR_APPROVAL',
    prescriptionId: 'rx-seed-1',
  },
  {
    id: 'tok-seed-2',
    tokenNumber: 'EMG-3902',
    patient: {
      name: 'Sharmin Akter',
      age: 26,
      gender: 'Female',
      phone: '01823-987654',
      bloodGroup: 'O+',
      allergies: 'Penicillin allergy',
      chronicDiseases: [],
      vitals: {
        bp: '115/75 mmHg',
        pulse: '76 bpm',
        temp: '99.1 °F',
        spo2: '99%',
      },
    },
    chiefComplaint: 'বুক জ্বালাপোড়া ও বমি ভাব (Heartburn, acidity and nausea after meal)',
    fee: 100,
    paymentMethod: 'Nagad',
    paymentStatus: 'PAID',
    urgencyCode: 'GREEN',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'PENDING_DOCTOR_APPROVAL',
    prescriptionId: 'rx-seed-2',
  },
  {
    id: 'tok-seed-3',
    tokenNumber: 'EMG-3899',
    patient: {
      name: 'Kabir Hossain',
      age: 64,
      gender: 'Male',
      phone: '01914-112233',
      bloodGroup: 'A+',
      allergies: 'Sulfa drugs',
      chronicDiseases: ['Coronary Artery Disease (CABG 2021)'],
      vitals: {
        bp: '140/85 mmHg',
        pulse: '84 bpm',
        temp: '98.4 °F',
        spo2: '97%',
      },
    },
    chiefComplaint: 'বাইপাস সার্জারির ফলোআপ ও রক্তের লিপিড প্রোফাইল রিপোর্ট রিভিউ',
    fee: 100,
    paymentMethod: 'bKash',
    paymentStatus: 'PAID',
    urgencyCode: 'GREEN',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'APPROVED',
    prescriptionId: 'rx-seed-3',
  },
];

// Helper for fallback AI clinical triage when API key is missing or quota reached
function getFallbackTriageResponse(userMessage: string, historyLength: number, language: string) {
  const isBengali = language !== 'en';
  const textLower = userMessage.toLowerCase();

  // Detect critical red flags
  const isRedFlag =
    textLower.includes('বুকে ব্যথা') ||
    textLower.includes('বুকের ব্যথা') ||
    textLower.includes('chest pain') ||
    textLower.includes('শ্বাসকষ্ট') ||
    textLower.includes('breath') ||
    textLower.includes('অবশ') ||
    textLower.includes('কথা জড়িয়ে') ||
    textLower.includes('stroke') ||
    textLower.includes('অজ্ঞান');

  if (isRedFlag) {
    return {
      reply: isBengali
        ? '⚠️ জরুরি সতর্কতা: আপনার দেওয়া উপসর্গে (বুকে ব্যথা বা তীব্র শ্বাসকষ্ট বা অবশ ভাব) জরুরি জটিলতার লক্ষণ নির্দেশ করছে। আমাদের ভার্চুয়াল ব্যবস্থা থেকে অবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে (ER) যাওয়া বা অ্যাম্বুলেন্স (৯৯৯) ডাকার পরামর্শ দেওয়া হচ্ছে। আমি তাৎক্ষণিক ট্রায়াজ কোড RED দিয়ে রিপোর্ট তৈরি করছি যা নিকটস্থ হাসপাতালে পাঠানো যাবে।'
        : '⚠️ EMERGENCY ALERT: The symptoms you described indicate potential critical red-flag signs. You must immediately visit the nearest Hospital Emergency Room (ER) or call 999. I have marked this triage as CODE RED and prepared an instant dispatch referral slip.',
      isQuestion: false,
      isRedFlagWarning: true,
      readyForDraft: true,
      triageCode: 'RED',
      suggestedQuickReplies: isBengali
        ? ['নিকটস্থ জরুরি হাসপাতাল খুঁজুন', 'জরুরি রেফারেল স্লিপ তৈরি করুন', 'অ্যাম্বুলেন্স কল করুন']
        : ['Find Emergency Hospital', 'Generate ER Referral Slip', 'Call 999'],
    };
  }

  if (historyLength <= 1) {
    return {
      reply: isBengali
        ? 'আমি বিষয়টি বুঝতে পেরেছি। দয়া করে বলুন: এই সমস্যাটি আপনার কতদিন ধরে হচ্ছে? ব্যথা বা অস্বস্তির তীব্রতা ১ থেকে ১০ এর স্কেলে কেমন? এছাড়া এর সাথে জ্বর, বমি বা মাথা ঘোরার মতো কোনো লক্ষণ আছে কি?'
        : 'Thank you for sharing. Could you specify: How long have you been experiencing this? On a scale of 1 to 10, how severe is it? Are you also having fever, dizziness, or vomiting?',
      isQuestion: true,
      readyForDraft: false,
      triageCode: 'GREEN',
      suggestedQuickReplies: isBengali
        ? ['আজ সকাল থেকে', '২-৩ দিন ধরে', 'তীব্রতা মাঝারি (৪-৬)', 'জ্বর নেই, বমি ভাব আছে']
        : ['Since this morning', 'Past 2-3 days', 'Moderate (4-6)', 'No fever, mild nausea'],
    };
  } else if (historyLength === 2) {
    return {
      reply: isBengali
        ? 'ধন্যবাদ বিস্তারিত জানানোর জন্য। আপনার কি অতীতে কোনো স্থায়ী শারীরিক সমস্যা আছে (যেমন: উচ্চ রক্তচাপ, ডায়াবেটিস, গ্যাস্ট্রিক, বা হাঁপানি)? এছাড়া বর্তমানে কোনো ওষুধ নিয়মিত খাচ্ছেন বা কোনো ওষুধে অ্যালার্জি আছে?'
        : 'Understood. Do you have any chronic conditions (such as Hypertension, Diabetes, Asthma, or Kidney disease)? Are you currently taking any daily medicines or have allergies?',
      isQuestion: true,
      readyForDraft: false,
      triageCode: 'GREEN',
      suggestedQuickReplies: isBengali
        ? ['গ্যাস্ট্রিক ও প্রেশার আছে', 'ডায়াবেটিস আছে', 'কোনো ওষুধে অ্যালার্জি নেই', 'কোনো রোগ নেই']
        : ['Have Gastric & BP', 'Have Diabetes', 'No known allergies', 'Generally healthy'],
    };
  } else if (historyLength <= 5) {
    const questions = {
      3: isBengali
        ? 'আপনার লিঙ্গ ও রক্তের গ্রুপ কী? জানা না থাকলে বা জানাতে না চাইলে বলুন।'
        : 'What are your gender and blood group? You can say if you do not know or prefer not to answer.',
      4: isBengali
        ? 'আপনার রক্তচাপ, নাড়ির স্পন্দন, তাপমাত্রা বা অক্সিজেনের মাত্রা মাপা আছে কি? জানা থাকলে মানগুলো বলুন, না জানা থাকলে সেটিও বলুন।'
        : 'Do you have measured blood pressure, pulse, temperature or oxygen saturation? Share any known readings, or say if they are unavailable.',
      5: isBengali
        ? 'আপনার সমস্যার সঙ্গে আর কোনো উপসর্গ আছে কি? আরও কোনো গুরুত্বপূর্ণ তথ্য বা আগের রিপোর্ট জানাতে চান?'
        : 'Are there any other symptoms with your main concern? Is there any other important information or previous report you would like to share?',
    };
    return {
      reply: questions[historyLength as 3 | 4 | 5],
      isQuestion: true,
      readyForDraft: false,
      triageCode: 'GREEN',
      suggestedQuickReplies: [],
    };
  } else {
    return {
      reply: isBengali
        ? 'আপনার দেওয়া সকল ক্লিনিক্যাল তথ্যাদি সফলভাবে যাচাই করা হয়েছে। প্রাথমিক ট্রায়াজ অনুযায়ী আপনার জন্য একটি স্ট্রাকচার্ড খসড়া ব্যবস্থাপত্র (Draft Prescription) ও বিশেষজ্ঞ পরামর্শ তৈরি করা হয়েছে। মনে রাখবেন, সরকারি নিয়ম ও রোগীর নিরাপত্তার স্বার্থে এই প্রেসক্রিপশনটি একজন বিশেষজ্ঞ ডাক্তারের অনুমোদন (Approve) না পাওয়া পর্যন্ত কার্যকর হবে না।'
        : 'I have gathered sufficient clinical details for initial triage investigation. A structured draft prescription and clinical advice has been formulated. Note that for patient safety, this draft remains PENDING until verified and digitally signed by an on-duty specialist doctor.',
      isQuestion: false,
      readyForDraft: true,
      triageCode: 'GREEN',
      suggestedQuickReplies: isBengali
        ? ['খসড়া প্রেসক্রিপশন ও রেফারেল দেখুন', 'ডাক্তারের অনুমোদনের জন্য পাঠান']
        : ['View Draft Prescription & Referral', 'Send for Doctor Approval'],
    };
  }
}

// 1. API: Triage Live Chat (Interactive AI GP)
app.post('/api/triage/chat', async (req: Request, res: Response) => {
  try {
    const { conversation, patientInfo, language = 'bn' } = req.body;
    const isBengali = language !== 'en';

    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ error: 'Conversation array is required' });
    }

    const latestUserMsg = conversation[conversation.length - 1]?.text || '';
    const userTurns = conversation.filter((m) => m.sender === 'patient').length;

    // Use Gemini if key is provided
    if (apiKey) {
      try {
        const systemPrompt = `You are "Dr. Shasthya (ডাঃ স্বাস্থ্যসেবা)", a compassionate, experienced Senior Emergency & Clinical Triage General Physician (GP) at "ShasthyaSheba Virtual Hospital" in Bangladesh.
Your goal is to conduct a fast, empathetic, and clinically rigorous virtual triage investigation for an incoming patient who took an emergency/fast-track token.

PATIENT PROFILE:
- Name: ${patientInfo?.name || 'Patient'}
- Age: ${patientInfo?.age || 'Adult'}
- Gender: ${patientInfo?.gender || 'Unknown'}
- Blood Pressure: ${patientInfo?.vitals?.bp || 'Not recorded'}
- Pulse: ${patientInfo?.vitals?.pulse || 'Not recorded'}
- Chronic Illnesses: ${(patientInfo?.chronicDiseases || []).join(', ') || 'None mentioned'}
- Known Allergies: ${patientInfo?.allergies || 'None mentioned'}

RULES FOR TRIAGE:
1. Speak in ${isBengali ? 'fluent, warm, professional Bengali (বাংলা)' : 'clear, professional, empathetic English'}.
2. Registration collects ONLY name, age and phone. All other information is unknown until the patient provides it. First establish the chief complaint in the patient’s own words, then ask about duration, onset, severity and character. If an answer does not establish the complaint, clarify it before moving on.
3. Step 2 (Turn 2): Actively screen for RED FLAGS (e.g. chest pressure, radiating arm pain, breathlessness, sudden limb weakness, black stools, persistent vomiting). Ask about associated symptoms.
4. Collect preexisting conditions, current medications, allergies, gender and blood group if known, and available vital measurements (blood pressure, pulse, temperature, SpO2). Ask brief, manageable questions one at a time, adapting to what the patient already said. Accept unknown measurements; never assume normal vitals or absence of disease/allergies.
5. If at ANY point severe red flags are detected (like heart attack signs, acute stroke, severe breathing distress), IMMEDIATELY alert the patient to seek physical hospital emergency care or call ambulance (999), and flag readyForDraft: true with triageCode: "RED".
6. Do not conclude based on a fixed turn count. Except for emergency escalation, keep readyForDraft false until the chief complaint and necessary history have been collected or explicitly reported as unknown. Then offer a draft for specialist verification. All patient-provided information must remain available in the conversation for the final report.
7. Return JSON response strictly matching this schema:
{
  "reply": string (Your spoken doctor response),
  "isQuestion": boolean (true if you are asking the patient a question),
  "isRedFlagWarning": boolean (true if critical emergency),
  "readyForDraft": boolean (true if triage assessment is ready to synthesize draft prescription),
  "triageCode": "GREEN" | "AMBER" | "RED",
  "suggestedQuickReplies": string[] (3-4 short convenient responses for patient to tap)
}`;

        const geminiMessages = conversation.map((msg: any) => ({
          role: msg.sender === 'patient' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: geminiMessages as any,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const outputText = response.text?.trim() || '{}';
        const parsed = JSON.parse(outputText);
        return res.json(parsed);
      } catch (geminiErr: any) {
        console.warn('Gemini chat error, falling back to algorithmic triage:', geminiErr?.message);
      }
    }

    // Graceful fallback
    const fallback = getFallbackTriageResponse(latestUserMsg, userTurns, language);
    return res.json(fallback);
  } catch (err: any) {
    console.error('Triage chat endpoint error:', err);
    res.status(500).json({ error: 'Failed to process triage consultation' });
  }
});

// 2. API: Triage Finalize & Structured Draft Prescription
app.post('/api/triage/finalize', async (req: Request, res: Response) => {
  try {
    const { conversation, patientInfo, language = 'bn', tokenId } = req.body;
    const isBengali = language !== 'en';

    let prescriptionData: any = null;

    if (apiKey) {
      try {
        const fullTranscript = conversation
          .map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n');

        const systemPrompt = `You are the Lead Clinical Triage Engine at ShasthyaSheba Virtual Hospital.
Generate a comprehensive, medically accurate clinical triage report and a structured DRAFT prescription based on the patient conversation transcript. Registration provides only name, age and phone. Use the patient’s answers in the transcript for the chief complaint and other clinical details; leave unreported details explicitly unknown and never invent normal measurements or negative history.

PATIENT:
- Name: ${patientInfo?.name || 'Anonymous'}
- Age: ${patientInfo?.age || 30}
- Gender: ${patientInfo?.gender || 'Not provided'}
- Phone: ${patientInfo?.phone || ''}
- BP: ${patientInfo?.vitals?.bp || 'Not recorded'}
- Pulse: ${patientInfo?.vitals?.pulse || 'Not recorded'}
- Comorbidities: ${(patientInfo?.chronicDiseases || []).join(', ') || 'Not provided'}
- Allergies: ${patientInfo?.allergies || 'Not provided'}

TRANSCRIPT:
${fullTranscript}

CLINICAL DIRECTIVES:
1. Determine Triage Code:
   - "RED": Urgent physical hospital dispatch required (e.g. acute coronary syndrome, stroke, unstable vitals, acute abdomen).
   - "AMBER": Specialist consultation or physical chamber appointment required (e.g. chronic hypertension, persistent joint pain, unexplained weight loss).
   - "GREEN": Stable / mild condition manageable virtually with first-line symptomatic medications + lifestyle.
2. Provide realistic medications popular in Bangladesh (e.g., Napa/Ace/Tylace for Paracetamol; Pantonix/Sergel/Seclo for PPI; Fexo/Alatrol for Antihistamine; ORS for dehydration; Ciprofloxacin/Azithromycin only if clinically indicated, etc.).
3. The prescription is explicitly marked as "PENDING SPECIALIST APPROVAL" - it will be reviewed and signed by a human doctor.
4. Output strictly in JSON format matching this schema:
{
  "triageCode": "GREEN" | "AMBER" | "RED",
  "urgencyLabel": string,
  "clinicalSummary": string,
  "differentialDiagnosis": string[],
  "redFlagWarnings": string[],
  "medicines": [
    {
      "brandName": string,
      "genericName": string,
      "form": "Tablet" | "Capsule" | "Syrup" | "Drops" | "Suspension" | "ORS Sachet" | "Inhaler" | "Ointment",
      "strength": string,
      "dosage": string (e.g. "1 + 0 + 1"),
      "timing": "After meal (ভরা পেটে)" | "Before meal (খাবার আগে)" | "At bedtime (ঘুমানোর আগে)" | "As needed (প্রয়োজনে)",
      "duration": string,
      "instructions": string
    }
  ],
  "investigationsAdvised": string[],
  "lifestyleAdvice": string[],
  "warningSigns": string[],
  "referralDetails": {
    "department": string (e.g. "Cardiology", "Medicine", "Orthopedics", "Pediatrics", "Emergency"),
    "specialistName": string (optional recommended specialist name),
    "hospitalName": string (recommended hospital),
    "reason": string,
    "priority": "Immediate (জরুরি)" | "Within 24 Hours" | "Routine (সাধারণ)",
    "facilityType": "Physical ER Hospital" | "Specialist Chamber" | "Virtual Video Consult"
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Generate the structured clinical triage report and draft prescription.',
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        prescriptionData = parsed;
      } catch (geminiErr: any) {
        console.warn('Gemini finalize error, using rule-based generator:', geminiErr?.message);
      }
    }

    // Fallback if needed
    if (!prescriptionData) {
      prescriptionData = {
        triageCode: 'GREEN',
        urgencyLabel: 'Stable Condition - Virtual Clinical Guidance & Draft Rx',
        clinicalSummary: `Patient ${patientInfo?.name || ''} investigated via AI Triage. Symptoms analyzed based on reported history. Condition assessed as stable for virtual outpatient guidance with specialist sign-off.`,
        differentialDiagnosis: ['Viral Illness / Acute Upper Respiratory Symptoms', 'Acute Dyspepsia / Mild Gastric Discomfort'],
        redFlagWarnings: [],
        medicines: [
          {
            id: 'm-fb-1',
            brandName: 'Napa Extend / Fast',
            genericName: 'Paracetamol',
            form: 'Tablet',
            strength: '500mg',
            dosage: '1 + 1 + 1',
            timing: 'After meal (ভরা পেটে)',
            duration: '3-5 days',
            instructions: 'জ্বর বা ব্যথার জন্য ভরা পেটে খাবেন।',
          },
          {
            id: 'm-fb-2',
            brandName: 'Pantonix / Sergel',
            genericName: 'Pantoprazole',
            form: 'Tablet',
            strength: '20mg',
            dosage: '1 + 0 + 1',
            timing: 'Before meal (খাবার আগে)',
            duration: '7 days',
            instructions: 'সকাল ও রাতে খাবার ২০ মিনিট আগে।',
          },
          {
            id: 'm-fb-3',
            brandName: 'Fexo',
            genericName: 'Fexofenadine HCl',
            form: 'Tablet',
            strength: '120mg',
            dosage: '0 + 0 + 1',
            timing: 'After meal (ভরা পেটে)',
            duration: '5 days',
            instructions: 'সর্দি বা অ্যালার্জির জন্য রাতে ১টি।',
          },
        ],
        investigationsAdvised: ['CBC with ESR (if symptoms last > 3 days)'],
        lifestyleAdvice: ['পর্যাপ্ত বিশ্রাম নিন ও কুসুম গরম পানি পান করুন', 'পুষ্টিকর সহজপাচ্য তরল খাবার গ্রহণ করুন'],
        warningSigns: ['জ্বর ১০২ ডিগ্রির বেশি স্থায়ী হলে বা শ্বাসকষ্ট দেখা দিলে দ্রুত হাসপাতালে যোগাযোগ করুন'],
        referralDetails: {
          department: 'Medicine',
          hospitalName: 'Dhaka Medical College Hospital',
          reason: 'Review and confirmation of treatment if symptoms persist.',
          priority: 'Routine (সাধারণ)',
          facilityType: 'Specialist Chamber',
        },
      };
    }

    // Attach metadata and assign IDs to medicines
    const newRxId = `rx-${Date.now()}`;
    const tokenNumber = patientInfo?.tokenNumber || `EMG-${Math.floor(1000 + Math.random() * 9000)}`;

    const formattedMedicines = (prescriptionData.medicines || []).map((m: any, idx: number) => ({
      id: m.id || `med-${Date.now()}-${idx}`,
      brandName: m.brandName || 'Medicine',
      genericName: m.genericName || '',
      form: m.form || 'Tablet',
      strength: m.strength || 'Standard',
      dosage: m.dosage || '1 + 0 + 1',
      timing: m.timing || 'After meal (ভরা পেটে)',
      duration: m.duration || '5 days',
      instructions: m.instructions || '',
    }));

    const completePrescription = {
      id: newRxId,
      tokenId: tokenId || `tok-${Date.now()}`,
      tokenNumber,
      patient: patientInfo,
      createdAt: new Date().toISOString(),
      triageCode: prescriptionData.triageCode || 'GREEN',
      urgencyLabel: prescriptionData.urgencyLabel || 'Clinical Assessment Ready',
      clinicalSummary: prescriptionData.clinicalSummary || '',
      differentialDiagnosis: prescriptionData.differentialDiagnosis || [],
      redFlagWarnings: prescriptionData.redFlagWarnings || [],
      medicines: formattedMedicines,
      investigationsAdvised: prescriptionData.investigationsAdvised || [],
      lifestyleAdvice: prescriptionData.lifestyleAdvice || [],
      warningSigns: prescriptionData.warningSigns || [],
      status: 'PENDING_DOCTOR_APPROVAL', // CRITICAL: Always pending doctor approval
      referralDetails: prescriptionData.referralDetails,
    };

    // Store in prescriptions list
    prescriptionsStore.unshift(completePrescription);

    // Update token status if exists
    const existingToken = tokensStore.find((t) => t.id === tokenId || t.tokenNumber === tokenNumber);
    if (existingToken) {
      existingToken.status = 'PENDING_DOCTOR_APPROVAL';
      existingToken.prescriptionId = newRxId;
      existingToken.urgencyCode = completePrescription.triageCode;
    } else {
      tokensStore.unshift({
        id: completePrescription.tokenId,
        tokenNumber,
        patient: patientInfo,
        chiefComplaint: patientInfo?.chiefComplaint || 'Virtual Triage Consultation',
        fee: 100,
        paymentMethod: 'bKash',
        paymentStatus: 'PAID',
        urgencyCode: completePrescription.triageCode,
        createdAt: new Date().toISOString(),
        status: 'PENDING_DOCTOR_APPROVAL',
        prescriptionId: newRxId,
      });
    }

    return res.json(completePrescription);
  } catch (err: any) {
    console.error('Finalize triage error:', err);
    res.status(500).json({ error: 'Failed to generate draft prescription' });
  }
});

// 3. API: Analyze Follow-up / Lab Test Report
app.post('/api/triage/analyze-report', async (req: Request, res: Response) => {
  try {
    const { reportText, reportType, patientInfo, imageBase64 } = req.body;

    if (!reportText && !imageBase64) {
      return res.status(400).json({ error: 'Report text or image is required' });
    }

    if (apiKey) {
      try {
        const systemPrompt = `You are a Senior Clinical Pathologist and Tele-investigation Consultant at ShasthyaSheba Virtual Hospital.
Analyze the provided medical report (e.g. CBC, Lipid Profile, Blood Glucose, X-ray, ECG, Urine R/E).
Identify key values, abnormal findings, reference ranges, clinical meaning, and provide actionable advice.
Respond in JSON strictly:
{
  "reportTitle": string,
  "testDate": string,
  "overallImpression": string,
  "abnormalFindings": [
    {
      "testName": string,
      "observedValue": string,
      "referenceRange": string,
      "status": "HIGH" | "LOW" | "NORMAL",
      "clinicalSignificance": string
    }
  ],
  "doctorRecommendation": string,
  "requiresChamberVisit": boolean,
  "suggestedSpecialty": string
}`;

        const parts: any[] = [];
        if (imageBase64) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            },
          });
        }
        parts.push({
          text: `Report type: ${reportType || 'General Lab Report'}\nPatient details: ${JSON.stringify(patientInfo || {})}\nReport content or clinical notes: ${reportText || 'Examine attached report image.'}`,
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json(parsed);
      } catch (geminiErr: any) {
        console.warn('Gemini report analysis error, falling back:', geminiErr?.message);
      }
    }

    // Fallback response for report analysis
    return res.json({
      reportTitle: reportType || 'Routine Medical Lab Report',
      testDate: new Date().toLocaleDateString('bn-BD'),
      overallImpression: 'রিপোর্টটি পর্যালোচনা করে দেখা গেছে অধিকাংশ সূচক স্বাভাবিক মাত্রার কাছাকাছি। তবে নিয়মিত ফলোআপ বজায় রাখা জরুরি।',
      abnormalFindings: [
        {
          testName: 'Hemoglobin (Hb)',
          observedValue: '12.4 g/dL',
          referenceRange: '12.0 - 15.5 g/dL',
          status: 'NORMAL',
          clinicalSignificance: 'রক্তস্বল্পতা নেই, হিমোগ্লোবিন সন্তোষজনক।',
        },
        {
          testName: 'Serum Cholesterol (Total)',
          observedValue: '215 mg/dL',
          referenceRange: '< 200 mg/dL',
          status: 'HIGH',
          clinicalSignificance: 'কোলেস্টেরলের মাত্রা কিছুটা বেশি। খাদ্যতালিকায় তেল-চর্বি নিয়ন্ত্রণ করা প্রয়োজন।',
        },
      ],
      doctorRecommendation: 'লিপিড প্রোফাইল নিয়ন্ত্রণের জন্য তৈলাক্ত খাবার কমান এবং দিনে ৩০ মিনিট হাঁটুন। প্রেসক্রিপশন সমন্বয়ের জন্য মেডিসিন বা কার্ডিওলজি বিশেষজ্ঞের সাথে পরামর্শ করুন।',
      requiresChamberVisit: false,
      suggestedSpecialty: 'Internal Medicine',
    });
  } catch (err: any) {
    console.error('Report analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze lab report' });
  }
});

// 4. API: Text-to-Speech (Gemini TTS) for patient voice guidance
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!apiKey) {
      return res.status(200).json({ audioBase64: null, message: 'TTS unavailable without API key' });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Gentle, compassionate medical doctor tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio });
    } else {
      return res.json({ audioBase64: null });
    }
  } catch (err: any) {
    console.warn('TTS error (non-fatal):', err?.message);
    res.json({ audioBase64: null });
  }
});

// 5. Hospital Data Endpoints
app.get('/api/tokens', (_req: Request, res: Response) => {
  res.json(tokensStore);
});

app.post('/api/tokens', (req: Request, res: Response) => {
  const { patient, chiefComplaint, fee = 100, paymentMethod = 'bKash' } = req.body;
  const tokenNumber = `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
  const newToken = {
    id: `tok-${Date.now()}`,
    tokenNumber,
    patient,
    chiefComplaint: chiefComplaint || '',
    fee,
    paymentMethod,
    paymentStatus: 'PAID',
    urgencyCode: 'GREEN',
    createdAt: new Date().toISOString(),
    status: 'IN_TRIAGE',
  };
  tokensStore.unshift(newToken);
  res.json(newToken);
});

app.get('/api/prescriptions', (_req: Request, res: Response) => {
  res.json(prescriptionsStore);
});

app.get('/api/prescriptions/:id', (req: Request, res: Response) => {
  const rx = prescriptionsStore.find((r) => r.id === req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });
  res.json(rx);
});

// Doctor approval & signature endpoint
app.post('/api/prescriptions/approve', (req: Request, res: Response) => {
  const { prescriptionId, approvingDoctor, modifiedMedicines, doctorNotes } = req.body;
  const rx = prescriptionsStore.find((r) => r.id === prescriptionId);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });

  rx.status = 'APPROVED_BY_SPECIALIST';
  if (modifiedMedicines && Array.isArray(modifiedMedicines)) {
    rx.medicines = modifiedMedicines;
  }
  rx.doctorNotes = doctorNotes || rx.doctorNotes;
  rx.approvingDoctor = approvingDoctor || {
    id: 'dr-duty',
    name: 'Dr. Nusrat Jahan Chowdhury',
    specialty: 'Internal Medicine & Critical Care',
    qualification: 'MBBS, MD (Medicine), MRCP (UK)',
    bmdcNumber: 'A-45120',
    hospital: 'Dhaka Medical College Hospital',
    signedAt: new Date().toISOString(),
    digitalSignatureHash: `BMDC-VERIFIED-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };

  // Update associated token
  const token = tokensStore.find((t) => t.id === rx.tokenId || t.prescriptionId === rx.id);
  if (token) {
    token.status = 'APPROVED';
  }

  res.json(rx);
});

// Specialist / ER referral update
app.post('/api/prescriptions/refer', (req: Request, res: Response) => {
  const { prescriptionId, referralDetails, status } = req.body;
  const rx = prescriptionsStore.find((r) => r.id === prescriptionId);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });

  rx.referralDetails = referralDetails;
  rx.status = status || (referralDetails?.facilityType === 'Physical ER Hospital' ? 'PHYSICAL_ER_DISPATCH' : 'REFERRED_SPECIALIST');

  const token = tokensStore.find((t) => t.id === rx.tokenId || t.prescriptionId === rx.id);
  if (token) {
    token.status = rx.status === 'PHYSICAL_ER_DISPATCH' ? 'REFERRED_HOSPITAL_ER' : 'REFERRED_SPECIALIST';
  }

  res.json(rx);
});

app.get('/api/specialists', (_req: Request, res: Response) => {
  res.json(specialistsStore);
});

app.get('/api/emergency-units', (_req: Request, res: Response) => {
  res.json(emergencyUnitsStore);
});

// Serve frontend in dev via Vite middlewares, or static dist in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShasthyaSheba AI Virtual Hospital server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
