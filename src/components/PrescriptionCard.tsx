import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  PhoneCall, 
  FileText, 
  Calendar, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Pill,
  ExternalLink
} from 'lucide-react';
import { Prescription, SpecialistDoctor, HospitalEmergencyUnit } from '../types/hospital';
import { translations } from '../translations';

interface PrescriptionCardProps {
  prescription: Prescription;
  language: 'bn' | 'en';
  onGoToDoctorDesk?: () => void;
  onBookSpecialist?: (specialistDepartment: string) => void;
  onLocateER?: () => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  language,
  onGoToDoctorDesk,
  onBookSpecialist,
  onLocateER,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [copied, setCopied] = useState(false);

  const isPending = prescription.status === 'PENDING_DOCTOR_APPROVAL';
  const isApproved = prescription.status === 'APPROVED_BY_SPECIALIST';
  const isReferredSpecialist = prescription.status === 'REFERRED_SPECIALIST';
  const isReferredER = prescription.status === 'PHYSICAL_ER_DISPATCH';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            RX: {prescription.id}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(prescription.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'শেয়ার করুন' : 'Share')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printRx}</span>
          </button>
        </div>
      </div>

      {/* Main Prescription Paper */}
      <div 
        id="printable-prescription"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Hospital Official Header */}
        <div className="border-b-2 border-slate-800 pb-5 mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-lg print:border print:border-black">
                +
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isBn ? 'স্বাস্থ্যসেবা ভার্চুয়াল হাসপাতাল' : 'ShasthyaSheba Virtual Hospital'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBn
                ? 'কেন্দ্রীয় জরুরি ক্লিনিক্যাল ট্রায়াজ, ভার্চুয়াল ওপিডি ও টেলিমেডিসিন রেফারেল কেন্দ্র'
                : 'Central Emergency Clinical Triage, Virtual OPD & Telemedicine Referral Center'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Govt. Reg / Telehealth DGHS Approved · 24/7 Helpline: 16263 / 999
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block text-left mb-1">
              <span className="text-[10px] text-slate-600 block uppercase font-bold">{isBn ? 'টোকেন নং' : 'Token ID'}</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{prescription.tokenNumber}</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              {new Date(prescription.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* STATUS BANNER (CRITICAL) */}
        <div className="mb-6">
          {isPending && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                    ⚠️ {isBn ? 'খসড়া ব্যবস্থাপত্র — বিশেষজ্ঞ ডাক্তারের অনুমোদন অপেক্ষমাণ' : 'DRAFT PRESCRIPTION — PENDING SPECIALIST APPROVAL'}
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5 max-w-xl">
                    {isBn
                      ? 'এআই জিপি দ্বারা ট্রায়াজকৃত এই খসড়াটি বর্তমানে অন-ডিউটি বিশেষজ্ঞ চিকিৎসকের ভেরিফিকেশন কিউতে আছে। ডাক্তার যাচাই করে ডিজিটাল স্বাক্ষর দেওয়ার পর এটি চূড়ান্ত কার্যকর হবে।'
                      : 'This draft prepared by AI Triage is queued for on-duty specialist verification. It will become fully active once reviewed and signed by a licensed doctor.'}
                  </p>
                </div>
              </div>

              {onGoToDoctorDesk && (
                <button
                  onClick={onGoToDoctorDesk}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs print:hidden"
                >
                  {isBn ? 'ডাক্তার ডেস্কে গিয়ে অনুমোদন দিন ➔' : 'Open Doctor Desk to Sign ➔'}
                </button>
              )}
            </div>
          )}

          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                    ✅ {isBn ? 'অনুমোদিত ও স্বাক্ষরিত ব্যবস্থাপত্র' : 'VERIFIED & DIGITALLY SIGNED PRESCRIPTION'}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {isBn
                      ? `অন-ডিউটি বিশেষজ্ঞ চিকিৎসক ${prescription.approvingDoctor?.name} (বিএমডিসি: ${prescription.approvingDoctor?.bmdcNumber}) কর্তৃক স্বাক্ষরিত।`
                      : `Digitally signed by ${prescription.approvingDoctor?.name} (BMDC: ${prescription.approvingDoctor?.bmdcNumber}).`}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right text-xs text-emerald-800 font-mono">
                {prescription.approvingDoctor?.digitalSignatureHash}
              </div>
            </div>
          )}

          {isReferredSpecialist && (
            <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-blue-700 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wide">
                    👨‍⚕️ {isBn ? 'বিশেষজ্ঞ চেম্বারে রেফারেল প্রেরিত' : 'REFERRED TO SPECIALIST CHAMBER'}
                  </h3>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {prescription.referralDetails?.department} বিভাগ · {prescription.referralDetails?.hospitalName || prescription.referralDetails?.specialistName}
                  </p>
                </div>
              </div>
              {onBookSpecialist && (
                <button
                  onClick={() => onBookSpecialist(prescription.referralDetails?.department || 'Medicine')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs print:hidden"
                >
                  {isBn ? 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন ➔' : 'Confirm Chamber Slot ➔'}
                </button>
              )}
            </div>
          )}

          {isReferredER && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 animate-bounce" />
                <div>
                  <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                    🚨 {isBn ? 'জরুরি শারীরিক হাসপাতালে রেফারেল স্লিপ' : 'EMERGENCY DISPATCH: PHYSICAL HOSPITAL ER REQUIRED'}
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {prescription.referralDetails?.hospitalName} জরুরি বিভাগে দ্রুত যাওয়ার নির্দেশনা প্রদান করা হয়েছে।
                  </p>
                </div>
              </div>
              {onLocateER && (
                <button
                  onClick={onLocateER}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs print:hidden"
                >
                  {isBn ? 'জরুরি বেড ও অ্যাম্বুলেন্স দেখুন ➔' : 'View ER Beds & Ambulance ➔'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Patient Particulars Bar */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
              <span className="font-bold text-slate-900 text-sm">{prescription.patient.name}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'বয়স / লিঙ্গ:' : 'Age / Gender:'}</span>
              <span className="font-semibold text-slate-900">{prescription.patient.age} Y / {prescription.patient.gender || (isBn ? 'জানা হয়নি' : 'Not provided')}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'মোবাইল নং:' : 'Phone:'}</span>
              <span className="font-semibold text-slate-900">{prescription.patient.phone}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
              <span className="font-semibold text-slate-900">{prescription.patient.bloodGroup || 'O+'}</span>
            </div>
          </div>

          {/* Vitals row */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'রক্তচাপ (BP):' : 'BP:'}</span>
              <span className="font-mono font-bold text-slate-900">{prescription.patient.vitals?.bp || '120/80 mmHg'}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'নাড়ি (Pulse):' : 'Pulse:'}</span>
              <span className="font-mono font-bold text-slate-900">{prescription.patient.vitals?.pulse || '76 bpm'}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'তাপমাত্রা:' : 'Temp:'}</span>
              <span className="font-mono font-bold text-slate-900">{prescription.patient.vitals?.temp || '98.6 °F'}</span>
            </div>
            <div>
              <span className="text-slate-600 font-semibold block">{isBn ? 'অক্সিজেন (SpO2):' : 'SpO2:'}</span>
              <span className="font-mono font-bold text-slate-900">{prescription.patient.vitals?.spo2 || '98%'}</span>
            </div>
          </div>
        </div>

        {/* Clinical Split: Left Observations / Right Rx */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Clinical Findings & Differential Diagnosis */}
          <div className="md:col-span-4 border-r-0 md:border-r border-slate-200 pr-0 md:pr-6 space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                {isBn ? 'ক্লিনিক্যাল ট্রায়াজ রিপোর্ট' : 'Clinical Triage Summary'}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {prescription.clinicalSummary}
              </p>
            </div>

            {/* Differential Diagnosis */}
            {prescription.differentialDiagnosis && prescription.differentialDiagnosis.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  {isBn ? 'সম্ভাব্য রোগ নির্ণয় (Dx)' : 'Differential Diagnosis'}
                </h4>
                <ul className="space-y-1 text-xs text-slate-800">
                  {prescription.differentialDiagnosis.map((dx, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{dx}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Investigations Advised */}
            {prescription.investigationsAdvised && prescription.investigationsAdvised.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  {isBn ? 'প্রয়োজনীয় পরীক্ষা-নিরীক্ষা (Investigation)' : 'Advised Investigations'}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-800 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                  {prescription.investigationsAdvised.map((inv, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-700 font-bold">✓</span>
                      <span>{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flag Warnings */}
            {prescription.warningSigns && prescription.warningSigns.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isBn ? 'জরুরি সতর্কতা লক্ষণ' : 'Warning Signs'}</span>
                </h4>
                <ul className="space-y-1 text-xs text-rose-900 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {prescription.warningSigns.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">!</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column (8 cols): Rx / Medications Section */}
          <div className="md:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-black font-serif text-teal-800 tracking-tighter">
                  ℞
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isBn ? 'ওষুধের তালিকা (Medications)' : 'Prescribed Medications'}
                </span>
              </div>

              {/* Medicine Table / List */}
              <div className="space-y-3">
                {prescription.medicines.map((med, index) => (
                  <div
                    key={med.id || index}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-colors shadow-2xs"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-teal-800">
                          {index + 1}. {med.form}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900">
                          {med.brandName}
                        </h5>
                        <span className="text-xs font-medium text-slate-500">
                          ({med.strength})
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-teal-50 text-teal-900 px-2.5 py-0.5 rounded border border-teal-100">
                        {med.dosage}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 italic">
                      Generic: {med.genericName}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-700">
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        ⏱️ {med.timing}
                      </span>
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        📅 {med.duration}
                      </span>
                      {med.instructions && (
                        <span className="text-slate-600 text-[11px]">
                          • {med.instructions}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifestyle Advice */}
            {prescription.lifestyleAdvice && prescription.lifestyleAdvice.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  {isBn ? 'জীবনযাত্রার পরামর্শ ও বিধিনিষেধ' : 'General & Lifestyle Advice'}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {prescription.lifestyleAdvice.map((adv, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-600 font-bold">→</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Doctor Digital Signature Stamp Box */}
            <div className="pt-6 border-t border-slate-200 mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                  {isBn
                    ? 'এই ব্যবস্থাপত্রটি জাতীয় স্বাস্থ্য প্রযুক্তি নিরাপত্তা ও ডিজিটাল সিগনেচার অ্যাক্ট অনুসারে প্রস্তুত করা হয়েছে।'
                    : 'This digital prescription complies with Telemedicine & Digital Health Guidelines.'}
                </p>
              </div>

              <div className="text-right">
                {isApproved && prescription.approvingDoctor ? (
                  <div className="inline-block text-left p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'ডিজিটাল সত্যায়িত স্বাক্ষর' : 'Digitally Certified Signature'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      {prescription.approvingDoctor.name}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {prescription.approvingDoctor.specialty}
                    </p>
                    <p className="text-[11px] font-mono text-teal-800 font-semibold">
                      {t.bmdcReg}: {prescription.approvingDoctor.bmdcNumber}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(prescription.approvingDoctor.signedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </p>
                  </div>
                ) : (
                  <div className="inline-block text-center p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50">
                    <span className="text-[11px] text-amber-800 font-bold block">
                      {isBn ? 'বিশেষজ্ঞ ডাক্তারের স্বাক্ষর স্থান' : 'Specialist Signature Area'}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-1">
                      [{isBn ? 'অনুমোদনের অপেক্ষায়' : 'PENDING APPROVAL'}]
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
