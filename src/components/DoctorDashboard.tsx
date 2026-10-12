import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  UserCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Building2, 
  Share2, 
  ShieldCheck,
  Check,
  Eye,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Prescription, DraftMedication, SpecialistDoctor } from '../types/hospital';
import { HospitalAPI } from '../services/api';
import { translations } from '../translations';

interface DoctorDashboardProps {
  prescriptions: Prescription[];
  onPrescriptionUpdated: (updated: Prescription) => void;
  language: 'bn' | 'en';
  onViewPrescription: (prescription: Prescription) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  prescriptions,
  onPrescriptionUpdated,
  language,
  onViewPrescription,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  // Available on-duty doctor profiles to switch active doctor persona
  const onDutyDoctors = [
    {
      id: 'dr-1',
      name: 'Dr. Nusrat Jahan Chowdhury',
      specialty: 'Internal Medicine & Critical Care',
      bmdcNumber: 'A-45120',
      hospital: 'Dhaka Medical College Hospital',
    },
    {
      id: 'dr-2',
      name: 'Prof. Dr. M. Shamsul Huda',
      specialty: 'Cardiology & Interventional Specialist',
      bmdcNumber: 'A-28941',
      hospital: 'National Institute of Cardiovascular Diseases (NICVD)',
    },
    {
      id: 'dr-3',
      name: 'Dr. Farhana Yasmin',
      specialty: 'Pediatrics & Neonatal Medicine',
      bmdcNumber: 'A-51029',
      hospital: 'Dhaka Shishu (Children) Hospital',
    },
  ];

  const [activeDoctor, setActiveDoctor] = useState(onDutyDoctors[0]);
  const [filterCode, setFilterCode] = useState<'ALL' | 'PENDING' | 'RED' | 'AMBER' | 'GREEN' | 'APPROVED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRxForReview, setSelectedRxForReview] = useState<Prescription | null>(null);

  // States inside Review Modal
  const [editingMedicines, setEditingMedicines] = useState<DraftMedication[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [referralChoice, setReferralChoice] = useState<'RELEASE' | 'CHAMBER' | 'EMERGENCY_HOSPITAL'>('RELEASE');
  const [targetSpecialty, setTargetSpecialty] = useState('Cardiology');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Open review modal
  const handleOpenReview = (rx: Prescription) => {
    setSelectedRxForReview(rx);
    setEditingMedicines([...rx.medicines]);
    setDoctorNotes(rx.doctorNotes || '');
    if (rx.referralDetails?.facilityType === 'Physical ER Hospital') {
      setReferralChoice('EMERGENCY_HOSPITAL');
    } else if (rx.referralDetails?.facilityType === 'Specialist Chamber') {
      setReferralChoice('CHAMBER');
    } else {
      setReferralChoice('RELEASE');
    }
  };

  // Add new medicine in review
  const handleAddMedicine = () => {
    const newMed: DraftMedication = {
      id: `med-custom-${Date.now()}`,
      brandName: isBn ? 'নতুন ওষুধ' : 'New Medicine',
      genericName: '',
      form: 'Tablet',
      strength: '500mg',
      dosage: '1 + 0 + 1',
      timing: 'After meal (ভরা পেটে)',
      duration: '5 days',
      instructions: '',
    };
    setEditingMedicines([...editingMedicines, newMed]);
  };

  // Remove medicine
  const handleRemoveMedicine = (index: number) => {
    setEditingMedicines(editingMedicines.filter((_, i) => i !== index));
  };

  // Update specific medicine field
  const handleUpdateMedicineField = (index: number, field: keyof DraftMedication, val: any) => {
    const updated = [...editingMedicines];
    updated[index] = { ...updated[index], [field]: val };
    setEditingMedicines(updated);
  };

  // Submit Approval
  const handleApprovePrescription = async () => {
    if (!selectedRxForReview) return;
    setIsSubmittingApproval(true);

    try {
      let updatedRx: Prescription;

      if (referralChoice === 'EMERGENCY_HOSPITAL') {
        updatedRx = await HospitalAPI.referPrescription({
          prescriptionId: selectedRxForReview.id,
          status: 'PHYSICAL_ER_DISPATCH',
          referralDetails: {
            department: 'Emergency & Trauma Care',
            hospitalName: 'Dhaka Medical College Hospital - Emergency Dept',
            reason: doctorNotes || 'Immediate physical emergency dispatch approved by specialist.',
            priority: 'Immediate (জরুরি)',
            facilityType: 'Physical ER Hospital',
          },
        });
      } else if (referralChoice === 'CHAMBER') {
        updatedRx = await HospitalAPI.referPrescription({
          prescriptionId: selectedRxForReview.id,
          status: 'REFERRED_SPECIALIST',
          referralDetails: {
            department: targetSpecialty,
            hospitalName: `${targetSpecialty} Specialist Chamber`,
            reason: doctorNotes || 'Referred for specialist evaluation and physical exam.',
            priority: 'Within 24 Hours',
            facilityType: 'Specialist Chamber',
          },
        });
      } else {
        // Direct release with approved medicines
        updatedRx = await HospitalAPI.approvePrescription({
          prescriptionId: selectedRxForReview.id,
          approvingDoctor: {
            id: activeDoctor.id,
            name: activeDoctor.name,
            specialty: activeDoctor.specialty,
            qualification: 'MBBS, MD, FCPS',
            bmdcNumber: activeDoctor.bmdcNumber,
            hospital: activeDoctor.hospital,
            signedAt: new Date().toISOString(),
            digitalSignatureHash: `BMDC-SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          },
          modifiedMedicines: editingMedicines,
          doctorNotes,
        });
      }

      onPrescriptionUpdated(updatedRx);
      setSelectedRxForReview(null);
    } catch (err) {
      console.error(err);
      alert(isBn ? 'প্রেসক্রিপশন অনুমোদনে ত্রুটি হয়েছে।' : 'Failed to approve prescription.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Filter list
  const filteredList = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.clinicalSummary.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCode === 'PENDING') return rx.status === 'PENDING_DOCTOR_APPROVAL';
    if (filterCode === 'APPROVED') return rx.status === 'APPROVED_BY_SPECIALIST';
    if (filterCode === 'RED') return rx.triageCode === 'RED';
    if (filterCode === 'AMBER') return rx.triageCode === 'AMBER';
    if (filterCode === 'GREEN') return rx.triageCode === 'GREEN';
    return true;
  });

  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING_DOCTOR_APPROVAL').length;
  const redCount = prescriptions.filter((p) => p.triageCode === 'RED').length;
  const approvedCount = prescriptions.filter((p) => p.status === 'APPROVED_BY_SPECIALIST').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Doctor Hub Header & Active Doctor Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isBn ? 'ডাক্তার ও বিশেষজ্ঞ ভেরিফিকেশন ডেস্ক' : 'Doctor & Specialist Verification Hub'}
              </h2>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                BMDC Authenticated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? 'এআই ট্রায়াজকৃত খসড়া ব্যবস্থাপত্র পর্যালোচনা, ডোজ সমন্বয়, রেফারেল ও ডিজিটাল স্বাক্ষর পোর্টাল'
                : 'Review AI-generated draft prescriptions, calibrate dosages, sign and route referrals'}
            </p>
          </div>
        </div>

        {/* Doctor Persona Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">
            {isBn ? 'লগইনকৃত ডাক্তার:' : 'Active Doctor:'}
          </span>
          <select
            value={activeDoctor.id}
            onChange={(e) => {
              const doc = onDutyDoctors.find((d) => d.id === e.target.value);
              if (doc) setActiveDoctor(doc);
            }}
            className="font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {onDutyDoctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty.split('&')[0]}) - BMDC: {doc.bmdcNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-amber-800 block">
            {isBn ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'Pending Doctor Approvals'}
          </span>
          <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">
            {isBn ? 'বিশেষজ্ঞ যাচাই প্রয়োজন' : 'Awaiting medical review'}
          </span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-rose-800 block">
            {isBn ? 'কোড রেড জরুরি ট্রায়াজ' : 'Code Red Emergencies'}
          </span>
          <span className="text-2xl font-black text-rose-950 font-mono mt-1 block">
            {redCount}
          </span>
          <span className="text-[11px] text-rose-700 mt-0.5 block">
            {isBn ? 'তাৎক্ষণিক ইআর রেফারেল' : 'Direct ER dispatch'}
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-emerald-800 block">
            {isBn ? 'আজকের স্বাক্ষরিত প্রেসক্রিপশন' : 'Approved & Signed'}
          </span>
          <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            {isBn ? 'ডিজিটাল সিলযুক্ত' : 'Digitally certified'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-600 block">
            {isBn ? 'মোট রোগী ইনটেক' : 'Total Intake'}
          </span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {prescriptions.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {isBn ? 'ভার্চুয়াল ইনভেস্টিগেশন' : 'Virtual investigations'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'PENDING', label: isBn ? 'অনুমোদনের অপেক্ষায়' : 'Pending', count: pendingCount },
              { id: 'ALL', label: isBn ? 'সকল কেস' : 'All Cases' },
              { id: 'RED', label: 'Code Red' },
              { id: 'AMBER', label: 'Code Amber' },
              { id: 'GREEN', label: 'Code Green' },
              { id: 'APPROVED', label: isBn ? 'অনুমোদিত' : 'Approved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCode(tab.id as any)}
                className={`text-xs px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  filterCode === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'রোগী, টোকেন বা উপসর্গ খুঁজুন...' : 'Search patient, token, symptoms...'}
              className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Triage Cases Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">{isBn ? 'টোকেন নং ও সময়' : 'Token & Time'}</th>
                <th className="py-3.5 px-4">{isBn ? 'রোগীর বিবরণ' : 'Patient Info'}</th>
                <th className="py-3.5 px-4">{isBn ? 'ট্রায়াজ স্কোর' : 'Triage Score'}</th>
                <th className="py-3.5 px-4">{isBn ? 'ক্লিনিক্যাল সংক্ষিপ্তসার ও উপসর্গ' : 'Clinical Summary & Complaint'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'ডাক্তারের পদক্ষেপ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((rx) => {
                const isItemPending = rx.status === 'PENDING_DOCTOR_APPROVAL';
                return (
                  <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Token & Time */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {rx.tokenNumber}
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {rx.patient.name}
                      </span>
                      <span className="text-slate-600 text-[11px]">
                        {rx.patient.age}y · {rx.patient.gender || (isBn ? 'জানা হয়নি' : 'Not provided')} · {rx.patient.phone}
                      </span>
                    </td>

                    {/* Triage Score */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[11px] ${
                          rx.triageCode === 'RED'
                            ? 'bg-rose-100 text-rose-800'
                            : rx.triageCode === 'AMBER'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        ● {rx.triageCode}
                      </span>
                      <span className="text-[10px] text-slate-600 block mt-0.5">
                        BP: {rx.patient.vitals?.bp || '120/80'}
                      </span>
                    </td>

                    {/* Clinical Summary */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate">
                        {rx.urgencyLabel}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate mt-0.5">
                        {rx.clinicalSummary}
                      </p>
                      {rx.referralDetails && (
                        <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                          Ref: {rx.referralDetails.department}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isItemPending ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{isBn ? 'অনুমোদন বাকি' : 'Pending'}</span>
                        </span>
                      ) : rx.status === 'APPROVED_BY_SPECIALIST' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isBn ? 'স্বাক্ষরিত' : 'Signed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          <Share2 className="w-3 h-3" />
                          <span>{isBn ? 'রেফারেল প্রেরিত' : 'Referred'}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isItemPending ? (
                          <button
                            onClick={() => handleOpenReview(rx)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isBn ? 'যাচাই ও স্বাক্ষর' : 'Review & Sign'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onViewPrescription(rx)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isBn ? 'প্রেসক্রিপশন দেখুন' : 'View Rx'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600 text-xs">
                    {isBn ? 'কোনো ট্রায়াজ কেস পাওয়া যায়নি' : 'No triage cases found under this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Clinical Review & Approval Modal */}
      {selectedRxForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded">
                      {selectedRxForReview.tokenNumber}
                    </span>
                    <h3 className="text-base font-bold">
                      {selectedRxForReview.patient.name} ({selectedRxForReview.patient.age}y / {selectedRxForReview.patient.gender || (isBn ? 'জানা হয়নি' : 'Not provided')})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isBn ? 'এআই জিপি দ্বারা প্রণীত খসড়া ব্যবস্থাপত্র ও ট্রায়াজ যাচাই' : 'AI GP Formulated Draft Triage & Prescription Review'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRxForReview(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Triage Summary & Vitals */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isBn ? 'ক্লিনিক্যাল ফাইন্ডিংস ও ট্রায়াজ কোড:' : 'Clinical Findings & Triage:'}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedRxForReview.triageCode === 'RED'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedRxForReview.triageCode === 'AMBER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    CODE {selectedRxForReview.triageCode}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {selectedRxForReview.clinicalSummary}
                </p>

                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-600 block text-[10px]">BP:</span>
                    <span className="font-bold text-slate-900">{selectedRxForReview.patient.vitals?.bp || '120/80'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">Pulse:</span>
                    <span className="font-bold text-slate-900">{selectedRxForReview.patient.vitals?.pulse || '76'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">Temp:</span>
                    <span className="font-bold text-slate-900">{selectedRxForReview.patient.vitals?.temp || '98.6 °F'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">SpO2:</span>
                    <span className="font-bold text-slate-900">{selectedRxForReview.patient.vitals?.spo2 || '98%'}</span>
                  </div>
                </div>
              </div>

              {/* Editable Medications List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span>℞ {isBn ? 'প্রস্তাবিত ওষুধের তালিকা (ডোজ পরিবর্তন বা সংযোজন করুন):' : 'Proposed Medications (Edit/Calibrate Dosages):'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs text-blue-700 font-bold hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? '+ ওষুধ যোগ করুন' : '+ Add Drug'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editingMedicines.map((med, idx) => (
                    <div
                      key={med.id || idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            {isBn ? 'ওষুধের নাম (Brand Name)' : 'Brand Name'}
                          </label>
                          <input
                            type="text"
                            value={med.brandName}
                            onChange={(e) => handleUpdateMedicineField(idx, 'brandName', e.target.value)}
                            className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            {isBn ? 'মাত্রা (Strength)' : 'Strength'}
                          </label>
                          <input
                            type="text"
                            value={med.strength}
                            onChange={(e) => handleUpdateMedicineField(idx, 'strength', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            {isBn ? 'ডোজ (Dosage)' : 'Dosage'}
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicineField(idx, 'dosage', e.target.value)}
                            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-teal-800"
                            placeholder="1 + 0 + 1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            {isBn ? 'নিয়ম (Timing)' : 'Timing'}
                          </label>
                          <select
                            value={med.timing}
                            onChange={(e) => handleUpdateMedicineField(idx, 'timing', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="After meal (ভরা পেটে)">After meal (ভরা পেটে)</option>
                            <option value="Before meal (খাবার আগে)">Before meal (খাবার আগে)</option>
                            <option value="At bedtime (ঘুমানোর আগে)">At bedtime (ঘুমানোর আগে)</option>
                            <option value="As needed (প্রয়োজনে)">As needed (প্রয়োজনে)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            {isBn ? 'মেয়াদ (Duration)' : 'Duration'}
                          </label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicineField(idx, 'duration', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="5 days"
                          />
                        </div>

                        <div className="flex justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 flex items-center gap-1 transition-colors"
                            title="Remove drug"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isBn ? 'মুছুন' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Decision Action */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  {isBn ? 'ক্লিনিক্যাল সিদ্ধান্ত ও রেফারেল দিকনির্দেশনা:' : 'Clinical Decision & Referral Routing:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReferralChoice('RELEASE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      referralChoice === 'RELEASE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-sm mb-1">
                      🟢 {isBn ? 'ভার্চুয়াল অনুমোদন ও রিলিজ' : 'Approve Virtual Rx'}
                    </span>
                    <span className="text-[11px] text-slate-600 font-normal">
                      {isBn ? 'রোগী স্থিতিশীল, ডিজিটাল প্রেসক্রিপশন প্রদান' : 'Stable patient, release with digital Rx'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralChoice('CHAMBER')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      referralChoice === 'CHAMBER'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-1 ring-blue-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-sm mb-1">
                      🟡 {isBn ? 'বিশেষজ্ঞ চেম্বারে রেফারেল' : 'Specialist Chamber'}
                    </span>
                    <span className="text-[11px] text-slate-600 font-normal">
                      {isBn ? 'ফিজিক্যাল এক্সাম ও চেম্বার স্লট নির্ধারণ' : 'Route to specialist chamber queue'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReferralChoice('EMERGENCY_HOSPITAL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      referralChoice === 'EMERGENCY_HOSPITAL'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-sm mb-1">
                      🔴 {isBn ? 'জরুরি হাসপাতাল ইআর ডিসপ্যাচ' : 'Hospital ER Dispatch'}
                    </span>
                    <span className="text-[11px] text-slate-600 font-normal">
                      {isBn ? 'তাত্ক্ষণিক হাসপাতালে ভর্তির নির্দেশ' : 'Urgent transfer to physical hospital'}
                    </span>
                  </button>
                </div>

                {referralChoice === 'CHAMBER' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {isBn ? 'রেফারকৃত বিশেষজ্ঞ বিভাগ নির্বাচন করুন:' : 'Target Specialist Department:'}
                    </label>
                    <select
                      value={targetSpecialty}
                      onChange={(e) => setTargetSpecialty(e.target.value)}
                      className="text-xs p-2 border border-slate-300 rounded-lg bg-white w-full sm:w-1/2"
                    >
                      <option value="Cardiology">Cardiology (কার্ডিওলজি ও হৃদরোগ)</option>
                      <option value="Internal Medicine">Internal Medicine (মেডিসিন)</option>
                      <option value="Orthopedics">Orthopedics (অর্থোপেডিকস ও হাড়-জোড়)</option>
                      <option value="Pediatrics">Pediatrics (শিশু রোগ)</option>
                      <option value="Pulmonology">Pulmonology (বক্ষব্যাধি ও ফুসফুস)</option>
                      <option value="Gastroenterology">Gastroenterology (পরিপাকতন্ত্র ও লিভার)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  {isBn ? 'ডাক্তারের নিজস্ব ক্লিনিক্যাল মন্তব্য / রোগীর প্রতি নির্দেশনা:' : 'Doctor Clinical Remarks & Direct Instructions:'}
                </label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: রক্তচাপ স্থিতিশীল হওয়া পর্যন্ত বিশ্রাম নিন। ২ সপ্তাহ পর ফলোআপ করুন...' : 'Add clinical advice or follow-up duration...'}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer / Signature Stamp & Approve */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs">
                <span className="text-slate-600 block">{isBn ? 'স্বাক্ষরকারী চিকিৎসক:' : 'Attending Signatory:'}</span>
                <span className="font-bold text-slate-900">{activeDoctor.name}</span>
                <span className="font-mono text-blue-700 ml-1 font-semibold">({activeDoctor.bmdcNumber})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRxForReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleApprovePrescription}
                  disabled={isSubmittingApproval}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] ring-2 ring-blue-200 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isSubmittingApproval
                      ? (isBn ? 'স্বাক্ষর যাচাই হচ্ছে...' : 'Certifying...')
                      : (isBn ? 'ডিজিটাল স্বাক্ষর ও অনুমোদন প্রদান করুন' : 'Digitally Sign & Approve')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
