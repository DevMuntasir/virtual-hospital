import { PatientInfo, Prescription, PatientToken, SpecialistDoctor, HospitalEmergencyUnit } from '../types/hospital';

let speechCooldownUntil = 0;
let speechAccountLimitReached = false;

type SpeechResult = { audioBase64: string | null; issue?: 'rate' | 'account' | 'unavailable' };

export const HospitalAPI = {
  // 1. Send live triage message
  async sendTriageMessage(conversation: any[], patientInfo: PatientInfo, language: 'bn' | 'en') {
    const res = await fetch('/api/triage/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation, patientInfo, language }),
    });
    if (!res.ok) throw new Error('Failed to get triage response');
    return res.json();
  },

  // 2. Finalize triage and generate draft prescription
  async finalizeTriage(conversation: any[], patientInfo: PatientInfo, tokenId: string, language: 'bn' | 'en'): Promise<Prescription> {
    const res = await fetch('/api/triage/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation, patientInfo, tokenId, language }),
    });
    if (!res.ok) throw new Error('Failed to generate draft prescription');
    return res.json();
  },

  // 3. Analyze follow-up / lab report
  async analyzeReport(data: { reportText?: string; reportType?: string; patientInfo?: PatientInfo; imageBase64?: string }) {
    const res = await fetch('/api/triage/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to analyze medical report');
    return res.json();
  },

  // 4. TTS audio generator
  async getTTSAudio(text: string, language: 'bn' | 'en'): Promise<SpeechResult> {
    if (speechAccountLimitReached) return { audioBase64: null, issue: 'account' };
    if (Date.now() < speechCooldownUntil) return { audioBase64: null, issue: 'rate' };
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        if (res.status === 429) {
          if (/credit_balance_exhausted|spend_limit_exceeded|usage_limit_exceeded|insufficient_quota/.test(details.code || '')) {
            speechAccountLimitReached = true;
            return { audioBase64: null, issue: 'account' };
          }
          const retrySeconds = Number(details.retryAfter || res.headers.get('Retry-After'));
          speechCooldownUntil = Date.now() + (Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : 30) * 1000;
          return { audioBase64: null, issue: 'rate' };
        }
        return { audioBase64: null, issue: 'unavailable' };
      }
      const data = await res.json();
      return { audioBase64: data.audioBase64 || null };
    } catch {
      return { audioBase64: null, issue: 'unavailable' };
    }
  },

  // 5. Get all tokens
  async getTokens(): Promise<PatientToken[]> {
    const res = await fetch('/api/tokens');
    if (!res.ok) throw new Error('Failed to fetch tokens');
    return res.json();
  },

  // 6. Create instant emergency token
  async createToken(payload: { patient: PatientInfo; chiefComplaint: string; paymentMethod: string; fee?: number }): Promise<PatientToken> {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to issue token');
    return res.json();
  },

  // 7. Get prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    const res = await fetch('/api/prescriptions');
    if (!res.ok) throw new Error('Failed to fetch prescriptions');
    return res.json();
  },

  // 8. Doctor approve & sign prescription
  async approvePrescription(payload: {
    prescriptionId: string;
    approvingDoctor?: any;
    modifiedMedicines?: any[];
    doctorNotes?: string;
  }): Promise<Prescription> {
    const res = await fetch('/api/prescriptions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to approve prescription');
    return res.json();
  },

  // 9. Refer prescription to specialist or physical ER
  async referPrescription(payload: {
    prescriptionId: string;
    referralDetails: any;
    status?: string;
  }): Promise<Prescription> {
    const res = await fetch('/api/prescriptions/refer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update referral');
    return res.json();
  },

  // 10. Specialists and ER units
  async getSpecialists(): Promise<SpecialistDoctor[]> {
    const res = await fetch('/api/specialists');
    if (!res.ok) throw new Error('Failed to fetch specialists');
    return res.json();
  },

  async getEmergencyUnits(): Promise<HospitalEmergencyUnit[]> {
    const res = await fetch('/api/emergency-units');
    if (!res.ok) throw new Error('Failed to fetch emergency units');
    return res.json();
  },
};
