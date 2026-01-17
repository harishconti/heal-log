import { Patient } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1001',
    name: 'Eleanor Rigby',
    age: 72,
    gender: 'Female',
    lastVisit: '2023-10-24',
    condition: 'Hypertension',
    status: 'Stable',
    notes: 'Patient reports mild dizziness upon standing. BP 145/90. Current medication: Lisinopril 10mg. Adherence is good. No chest pain or shortness of breath. Recommending salt reduction diet.'
  },
  {
    id: 'P-1002',
    name: 'Jude Harrison',
    age: 45,
    gender: 'Male',
    lastVisit: '2023-10-26',
    condition: 'Type 2 Diabetes',
    status: 'Recovering',
    notes: 'A1C levels improved to 6.8%. Patient has lost 5kg since last visit. Reports occasional numbness in toes (neuropathy). Foot exam shows no ulcers. Prescribed Metformin 500mg bid.'
  },
  {
    id: 'P-1003',
    name: 'Desmond Jones',
    age: 28,
    gender: 'Male',
    lastVisit: '2023-10-27',
    condition: 'Acute Bronchitis',
    status: 'Recovering',
    notes: 'Persistent cough for 2 weeks, productive with clear sputum. Wheezing on expiration. No fever currently. History of childhood asthma. Albuterol inhaler provided relief.'
  },
  {
    id: 'P-1004',
    name: 'Martha MyDear',
    age: 60,
    gender: 'Female',
    lastVisit: '2023-10-22',
    condition: 'Arrhythmia',
    status: 'Critical',
    notes: 'Patient presented with palpitations and fatigue. ECG shows Atrial Fibrillation. Heart rate variable 110-130 bpm. Started on anticoagulant therapy. Requires cardiology referral immediately.'
  },
  {
    id: 'P-1005',
    name: 'Robert Raccoon',
    age: 34,
    gender: 'Male',
    lastVisit: '2023-10-28',
    condition: 'Post-op ACL',
    status: 'Stable',
    notes: '2 weeks post-ACL reconstruction. Range of motion 0-90 degrees. Minimal swelling. Pain managed with NSAIDs. PT sessions attending 3x/week. Wound healing well, sutures removed.'
  }
];
