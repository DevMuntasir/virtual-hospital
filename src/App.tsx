import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { PatientHome } from './components/PatientHome';
import { Navbar } from './components/Navbar';
import { TokenModal } from './components/TokenModal';
import { TriageRoom } from './components/TriageRoom';
import { PrescriptionCard } from './components/PrescriptionCard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { ReportReviewModal } from './components/ReportReviewModal';
import { SpecialistDirectory } from './components/SpecialistDirectory';
import { EmergencyERBoard } from './components/EmergencyERBoard';
import { PatientToken, Prescription, SpecialistDoctor, HospitalEmergencyUnit, PatientInfo } from './types/hospital';
import { HospitalAPI } from './services/api';

export default function App() {
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const isBn = language === 'bn';

  // Navigation state: 'patient' | 'doctor' | 'hospital' | 'triage_room' | 'prescription_view' | 'specialist_directory'
  const [currentView, setCurrentView] = useState<'patient' | 'doctor' | 'hospital' | 'triage_room' | 'prescription_view' | 'specialist_directory'>('patient');

  // Modal states
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active items
  const [activeToken, setActiveToken] = useState<PatientToken | null>(null);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);

  // Data collections
  const [tokens, setTokens] = useState<PatientToken[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDoctor[]>([]);
  const [emergencyUnits, setEmergencyUnits] = useState<HospitalEmergencyUnit[]>([]);
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [currentView]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [toks, rxs, specs, ers] = await Promise.all([
          HospitalAPI.getTokens(),
          HospitalAPI.getPrescriptions(),
          HospitalAPI.getSpecialists(),
          HospitalAPI.getEmergencyUnits(),
        ]);
        setTokens(toks);
        setPrescriptions(rxs);
        setSpecialists(specs);
        setEmergencyUnits(ers);
      } catch (err) {
        setLoadError(true);
        console.error('Failed to load initial hospital data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Pending count for navbar indicator
  const pendingApprovalsCount = prescriptions.filter(
    (p) => p.status === 'PENDING_DOCTOR_APPROVAL'
  ).length;

  // Handle new token creation from modal
  const handleTokenCreated = async (data: { patient: PatientInfo; chiefComplaint: string; paymentMethod: string }) => {
    try {
      const newToken = await HospitalAPI.createToken({
        patient: data.patient,
        chiefComplaint: data.chiefComplaint,
        paymentMethod: data.paymentMethod,
        fee: 100,
      });
      setTokens((prev) => [newToken, ...prev]);
      setActiveToken(newToken);
      setIsTokenModalOpen(false);
      setCurrentView('triage_room');
    } catch (err) {
      console.error(err);
      alert('Failed to generate token');
    }
  };

  // Handle finalized draft prescription from TriageRoom
  const handlePrescriptionGenerated = (rx: Prescription) => {
    setPrescriptions((prev) => [rx, ...prev.filter((p) => p.id !== rx.id)]);
    setActivePrescription(rx);
    setCurrentView('prescription_view');
  };

  // Handle doctor approval from DoctorDashboard
  const handlePrescriptionUpdated = (updated: Prescription) => {
    setPrescriptions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (activePrescription?.id === updated.id) {
      setActivePrescription(updated);
    }
  };

  // View prescription from list or doctor hub
  const handleViewPrescription = (rx: Prescription) => {
    setActivePrescription(rx);
    setCurrentView('prescription_view');
  };

  return (
    <div className={`min-h-screen bg-[#fafbf8] flex flex-col font-sans ${currentView === 'triage_room' ? 'consultation-app' : ''}`}>
      {/* Navbar */}
      <Navbar
        currentView={currentView === 'triage_room' || currentView === 'prescription_view' || currentView === 'specialist_directory' ? 'patient' : currentView}
        setCurrentView={(view) => {
          if (view === 'patient') {
            setCurrentView('patient');
          } else {
            setCurrentView(view);
          }
        }}
        language={language}
        setLanguage={setLanguage}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        pendingDoctorApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {/* 1. Triage Room View */}
        {currentView === 'triage_room' && activeToken && (
          <TriageRoom
            token={activeToken}
            language={language}
            onLanguageChange={setLanguage}
            onBack={() => setCurrentView('patient')}
            onPrescriptionGenerated={handlePrescriptionGenerated}
          />
        )}

        {/* 2. Prescription Card View */}
        {currentView === 'prescription_view' && activePrescription && (
          <div>
            <div className="max-w-4xl mx-auto px-4 pt-4 print:hidden">
              <button
                onClick={() => setCurrentView('patient')}
                className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
              >
                ← {isBn ? 'রোগীর হোমপেজে ফিরুন' : 'Back to Patient Portal'}
              </button>
            </div>
            <PrescriptionCard
              prescription={activePrescription}
              language={language}
              onGoToDoctorDesk={() => setCurrentView('doctor')}
              onBookSpecialist={(dept) => {
                setSelectedSpecialtyFilter(dept);
                setCurrentView('specialist_directory');
              }}
              onLocateER={() => setCurrentView('hospital')}
            />
          </div>
        )}

        {/* 3. Doctor Dashboard View */}
        {currentView === 'doctor' && (
          <DoctorDashboard
            prescriptions={prescriptions}
            onPrescriptionUpdated={handlePrescriptionUpdated}
            language={language}
            onViewPrescription={handleViewPrescription}
          />
        )}

        {/* 4. Specialist Directory View */}
        {currentView === 'specialist_directory' && (
          <div>
            <div className="max-w-7xl mx-auto px-4 pt-4">
              <button
                onClick={() => setCurrentView('patient')}
                className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
              >
                ← {isBn ? 'রোগীর হোমপেজে ফিরুন' : 'Back to Patient Portal'}
              </button>
            </div>
            <SpecialistDirectory
              specialists={specialists}
              language={language}
              filterDepartment={selectedSpecialtyFilter}
              onBookAppointment={(doc) => {
                // Book slot feedback
              }}
            />
          </div>
        )}

        {/* 5. Hospital Emergency & Bed Board View */}
        {currentView === 'hospital' && (
          <EmergencyERBoard
            emergencyUnits={emergencyUnits}
            prescriptions={prescriptions}
            language={language}
          />
        )}

        {/* 6. Patient Portal Home (Default) */}
        {currentView === 'patient' && (
          <PatientHome
            language={language}
            prescriptions={prescriptions}
            loading={loading}
            loadError={loadError}
            onStart={() => setIsTokenModalOpen(true)}
            onReport={() => setIsReportModalOpen(true)}
            onSpecialist={(department) => {
              setSelectedSpecialtyFilter(department);
              setCurrentView('specialist_directory');
            }}
            onEmergency={() => setCurrentView('hospital')}
            onPrescription={handleViewPrescription}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800">
              {isBn ? 'স্বাস্থ্যসেবা ভার্চুয়াল হাসপাতাল' : 'ShasthyaSheba AI Virtual Hospital'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{isBn ? 'বাংলাদেশ টেলিমেডিসিন ও ক্লিনিক্যাল ট্রায়াজ ব্যবস্থা' : 'Clinical Triage & Telemedicine Platform'}</span>
          </div>
          <div>
            <span>{isBn ? 'জরুরি সেবা: ৯৯৯ · স্বাস্থ্য বাতায়ন: ১৬২৬৩' : 'Emergency: 999 · Healthline: 16263'}</span>
          </div>
        </div>
      </footer>

      {/* Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSubmit={handleTokenCreated}
        language={language}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        language={language}
        onReportProcessed={(summary) => {
          // Open token or show feedback
        }}
      />
    </div>
  );
}
