// Generate a unique patient ID: P-2026-000124
export const generatePatientId = (sequenceNum: number): string => {
  const year = new Date().getFullYear();
  const padded = String(sequenceNum).padStart(6, '0');
  return `P-${year}-${padded}`;
};

// Generate token number: C-001
export const generateTokenNumber = (prefix: string, number: number): string => {
  return `${prefix}-${String(number).padStart(3, '0')}`;
};

// Calculate estimated wait time
export const calculateEstimatedWait = (
  patientsAhead: number,
  avgServiceDuration: number,
  availableCounters: number
): { estimatedMinutes: number; lowerBound: number; upperBound: number; confidence: string } => {
  if (availableCounters <= 0) availableCounters = 1;
  const base = (patientsAhead * avgServiceDuration) / availableCounters;
  const lowerBound = Math.max(0, Math.round(base * 0.7));
  const upperBound = Math.round(base * 1.4);
  const estimatedMinutes = Math.round(base);
  
  let confidence = 'high';
  if (patientsAhead > 20) confidence = 'low';
  else if (patientsAhead > 10) confidence = 'moderate';
  
  return { estimatedMinutes, lowerBound, upperBound, confidence };
};
