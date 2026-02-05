
import React from 'react';
import { Drug } from './types';

export const SYSTEM_CATEGORIES = [
  "Gastro-intestinal system",
  "Cardiovascular system",
  "Respiratory system",
  "Central nervous system",
  "Infections",
  "Endocrine system",
  "Obstetrics, gynaecology, and urinary-tract disorders",
  "Malignant disease and immunosuppression",
  "Nutrition and blood",
  "Musculoskeletal and joint disease",
  "Eye",
  "Ear, nose, and oropharynx",
  "Skin",
  "Immunological products and vaccines",
  "Anaesthesia"
];

export const SYSTEM_SHORT_NAMES: Record<string, string> = {
  "Gastro-intestinal system": "GI System",
  "Cardiovascular system": "Cardio",
  "Respiratory system": "Respiratory",
  "Central nervous system": "CNS / Neuro",
  "Infections": "Infections",
  "Endocrine system": "Endocrine",
  "Obstetrics, gynaecology, and urinary-tract disorders": "ObGyn / GU",
  "Malignant disease and immunosuppression": "Oncology",
  "Nutrition and blood": "Nutrition / Blood",
  "Musculoskeletal and joint disease": "MSK / Bone",
  "Eye": "Eye",
  "Ear, nose, and oropharynx": "ENT",
  "Skin": "Skin",
  "Immunological products and vaccines": "Immune / Vax",
  "Anaesthesia": "Anaesthesia"
};

export const SYSTEM_ICONS: Record<string, string> = {
  "Gastro-intestinal": "🍔",
  "Cardiovascular": "🫀",
  "Respiratory": "🫁",
  "Central nervous": "🧠",
  "Infections": "🦠",
  "Endocrine": "🦋",
  "Obstetrics": "🤰",
  "Malignant": "🎗️",
  "Nutrition": "🍎",
  "Musculoskeletal": "🦴",
  "Eye": "👁️",
  "Ear": "👂",
  "Skin": "🧴",
  "Immunological": "🛡️",
  "Anaesthesia": "💉"
};

export const DEFAULT_DRUGS: Drug[] = [
  {
    name: "Metformin",
    class: "Biguanide",
    system: "Endocrine system",
    indication: "Type 2 Diabetes Mellitus",
    SideEffects: "GI upset, lactic acidosis (rare), metallic taste",
    nursing: "Monitor renal function. Give with meals. Hold before IV contrast studies."
  },
  {
    name: "Atorvastatin",
    class: "HMG-CoA Reductase Inhibitor",
    system: "Cardiovascular system",
    indication: "Hypercholesterolemia",
    SideEffects: "Myalgia, liver enzyme elevation, rhabdomyolysis",
    nursing: "Monitor LFTs. Report muscle pain. Avoid grapefruit juice."
  },
  {
    name: "Lisinopril",
    class: "ACE Inhibitor",
    system: "Cardiovascular system",
    indication: "Hypertension, Heart Failure",
    SideEffects: "Dry cough, hyperkalemia, angioedema",
    nursing: "Monitor BP and potassium. Caution with first-dose hypotension."
  },
  {
    name: "Amlodipine",
    class: "Calcium Channel Blocker",
    system: "Cardiovascular system",
    indication: "Hypertension, Angina",
    SideEffects: "Peripheral edema, headache, flushing",
    nursing: "Monitor for swelling in extremities. Teach position changes."
  },
  {
    name: "Amoxicillin",
    class: "Penicillin Antibiotic",
    system: "Infections",
    indication: "Bacterial infections (ENT, Skin, UTI)",
    SideEffects: "Diarrhea, rash, hypersensitivity",
    nursing: "Assess for allergy. Complete full course. Monitor for superinfection."
  },
  {
    name: "Salbutamol",
    class: "Short-acting Beta-2 Agonist",
    system: "Respiratory system",
    indication: "Asthma, COPD (Rescue)",
    SideEffects: "Tachycardia, tremors, anxiety",
    nursing: "Monitor heart rate. Rinse mouth after use. Teach proper inhaler technique."
  },
  {
    name: "Paracetamol",
    class: "Analgesic, Antipyretic",
    system: "Central nervous system",
    indication: "Pain, Fever",
    SideEffects: "Hepatotoxicity (overdose)",
    nursing: "Check max daily dose (4g). Monitor liver function in long term use."
  }
];
