import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Share2,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import { HospitalAPI } from '../services/api';
import { translations } from '../translations';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
  onReportProcessed?: (reportSummary: string) => void;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  language,
  onReportProcessed,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [reportType, setReportType] = useState('Lipid Profile & Serum Cholesterol');
  const [reportText, setReportText] = useState(
    'Total Cholesterol: 245 mg/dL (High)\nHDL Cholesterol: 38 mg/dL (Low)\nLDL Cholesterol: 165 mg/dL (High)\nTriglycerides: 210 mg/dL (High)\nPatient on Atorvastatin 10mg daily for past 6 months.'
  );
  const [patientName, setPatientName] = useState('আলী হোসেন');
  const [patientAge, setPatientAge] = useState(62);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const sampleReports = [
    {
      title: isBn ? 'লিপিড প্রোফাইল (রক্তের চর্বি)' : 'Lipid Profile (Cholesterol)',
      type: 'Lipid Profile',
      text: 'Total Cholesterol: 245 mg/dL (High, Ref < 200)\nHDL Cholesterol: 38 mg/dL (Low, Ref > 40)\nLDL Cholesterol: 165 mg/dL (High, Ref < 100)\nTriglycerides: 210 mg/dL (High, Ref < 150)\nPrevious Stent placed 2 years ago.',
    },
    {
      title: isBn ? 'সিবিসি রক্তের পরীক্ষা (CBC)' : 'Complete Blood Count (CBC)',
      type: 'CBC Blood Test',
      text: 'Hemoglobin: 13.8 g/dL (Normal)\nTotal WBC Count: 7,200 /cumm (Normal)\nPlatelet Count: 280,000 /cumm (Normal)\nESR: 12 mm/1st hr (Normal)\nPost-dengue 14 days recovery follow-up.',
    },
    {
      title: isBn ? 'ডায়াবেটিস গ্লুকোজ (HbA1c)' : 'Blood Glucose & HbA1c',
      type: 'Diabetes Panel',
      text: 'Fasting Blood Sugar: 7.2 mmol/L (Elevated)\n2-Hours Post-Meal: 11.4 mmol/L (High)\nHbA1c: 8.2% (Uncontrolled, Target < 7.0%)\nCurrently on Metformin 500mg.',
    },
  ];

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const result = await HospitalAPI.analyzeReport({
        reportText,
        reportType,
        patientInfo: {
          name: patientName,
          age: patientAge,
          gender: 'Male',
          phone: '01711-001122',
        },
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      alert(isBn ? 'রিপোর্ট বিশ্লেষণে সমস্যা হয়েছে।' : 'Failed to analyze report.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
              <FileText className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isBn ? 'রিপোর্ট ও ফলো-আপ ভার্চুয়াল পরামর্শ' : 'Virtual Report Review & Follow-up'}
              </h3>
              <p className="text-xs text-blue-200">
                {isBn
                  ? 'দূর-দূরান্ত থেকে কষ্ট করে চেম্বারে না এসে ঘরে বসেই টেস্ট রিপোর্ট প্রদর্শন করুন'
                  : 'Avoid hours of travel for simple report consultations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {!analysisResult ? (
            <form onSubmit={handleRunAnalysis} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  {isBn ? 'নমুনা টেস্ট রিপোর্ট নির্বাচন করুন:' : 'Sample Lab Reports for Quick Test:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sampleReports.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReportType(sample.type);
                        setReportText(sample.text);
                      }}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all text-xs"
                    >
                      <span className="font-bold text-slate-800 block truncate">{sample.title}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{sample.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isBn ? 'রোগীর নাম' : 'Patient Name'}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isBn ? 'বয়স' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Report Text Content */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBn ? 'রিপোর্টের টেস্ট ফলাফল ও মানসমূহ (ল্যাব ফাইন্ডিংস)' : 'Report Findings & Lab Values'}
                </label>
                <textarea
                  rows={5}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder={isBn ? 'রিপোর্টের টেস্টের নাম ও রিডিং লিখুন...' : 'Enter test parameters, readings, and reference units...'}
                  className="w-full text-xs p-3 font-mono border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isAnalyzing
                      ? (isBn ? 'রিপোর্ট বিশ্লেষণ চলছে...' : 'Analyzing Report...')
                      : (isBn ? 'এআই রিপোর্ট বিশ্লেষণ করুন' : 'Analyze Lab Report')}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* Analysis Results View */
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-blue-950">
                    {analysisResult.reportTitle || reportType}
                  </h4>
                  <span className="text-[11px] font-mono text-blue-800 font-semibold bg-white px-2 py-0.5 rounded border border-blue-200">
                    {analysisResult.testDate || 'Today'}
                  </span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  {analysisResult.overallImpression}
                </p>
              </div>

              {/* Abnormal vs Normal Findings Table */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {isBn ? 'টেস্টের সূচক ও ক্লিনিক্যাল বিশ্লেষণ:' : 'Observed Markers & Significance:'}
                </h5>

                <div className="space-y-2">
                  {(analysisResult.abnormalFindings || []).map((finding: any, i: number) => {
                    const isHigh = finding.status === 'HIGH';
                    const isLow = finding.status === 'LOW';
                    return (
                      <div
                        key={i}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{finding.testName}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {finding.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {finding.clinicalSignificance}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm block">
                            {finding.observedValue}
                          </span>
                          <span className="text-[10px] text-slate-600 block">
                            Ref: {finding.referenceRange}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Recommendation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      {isBn ? 'ডাক্তারের ফলো-আপ পরামর্শ:' : 'Clinical Follow-up Recommendation:'}
                    </h5>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {analysisResult.doctorRecommendation}
                    </p>
                    <div className="mt-2 text-xs font-semibold text-teal-800">
                      {analysisResult.requiresChamberVisit
                        ? (isBn ? '⚠️ চেম্বারে সরাসরি ফিজিক্যাল ভিজিট প্রয়োজন।' : '⚠️ In-person chamber visit recommended.')
                        : (isBn ? '✅ শারীরিক চেম্বারে আসার প্রয়োজন নেই, ভার্চুয়াল প্রেসক্রিপশন যথেষ্ট।' : '✅ In-person travel not required; virtual management is safe.')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="text-xs text-blue-700 font-semibold hover:underline"
                >
                  {isBn ? '← অন্য রিপোর্ট পরীক্ষা করুন' : '← Check Another Report'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onReportProcessed) {
                      onReportProcessed(analysisResult.overallImpression);
                    }
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {isBn ? 'ডাক্তার ডেস্কে জমা দিন ও সম্পন্ন করুন' : 'Submit to Doctor Desk & Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
