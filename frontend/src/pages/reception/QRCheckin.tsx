import { useState, useEffect } from 'react';
import { qrApi, queueApi, departmentApi } from '../../api/client';
import { Department } from '../../types';
import { QrCode, CheckCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { QRScanner } from '../../components/QRScanner/QRScanner';

export const QRCheckinPage = () => {
  const [step, setStep] = useState<'scan' | 'verify' | 'done'>('scan');
  const [qrToken, setQrToken] = useState('');
  const [verifyData, setVerifyData] = useState<any>(null);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentApi
      .getAll()
      .then((r) => setDepartments(r.data.data))
      .catch((err) => console.error('Failed to load departments:', err));
  }, []);

  const handleVerifyToken = async (token: string) => {
    if (!token || !token.trim()) return;
    const cleanToken = token.trim();
    setQrToken(cleanToken);
    setError('');
    setLoading(true);
    try {
      const { data } = await qrApi.verify(cleanToken);
      setVerifyData(data.data);
      if (data.data.qrToken) {
        setQrToken(data.data.qrToken);
      }
      if (data.data.appointment) {
        setSelectedDept(data.data.appointment.department.id);
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await queueApi.checkin({
        qrToken: qrToken.trim(),
        departmentId: selectedDept || undefined,
      });
      setCheckinResult(data.data);
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('scan');
    setQrToken('');
    setVerifyData(null);
    setCheckinResult(null);
    setSelectedDept('');
    setError('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <QrCode size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            QR Check-in
          </h1>
          <p>Scan patient QR code via live camera, image upload, or token entry</p>
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        {/* Step 1: Scan / Enter QR */}
        {step === 'scan' && (
          <div className="glass-card animate-in" style={{ padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Scan Patient QR Code</h2>
              <p className="text-sm text-muted">
                Point the camera at the appointment or patient QR code to check in
              </p>
            </div>

            {error && (
              <div className="login-error" style={{ marginBottom: 16, justifyContent: 'center' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* QR Scanner Component */}
            <QRScanner
              onScanSuccess={handleVerifyToken}
              onScanError={(msg) => setError(msg)}
              isLoading={loading}
            />

            {loading && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <span className="spinner" />
                <span className="text-sm text-muted" style={{ marginLeft: 10 }}>
                  Verifying patient details...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Verify Patient Info */}
        {step === 'verify' && verifyData && (
          <div className="glass-card animate-in" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <CheckCircle size={48} color="var(--accent-success)" />
              <h2 style={{ marginTop: 12, fontSize: '1.25rem' }}>Patient Verified</h2>
              <p className="text-sm text-muted">Review details and confirm check-in</p>
            </div>

            {error && (
              <div className="login-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 20,
                border: '1px solid var(--border-primary)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <span className="text-xs text-muted">Patient Name</span>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {verifyData.patient.firstName} {verifyData.patient.lastName}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted">Patient ID</span>
                  <div>
                    <span className="token-badge">{verifyData.patient.patientId}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted">Phone Number</span>
                  <div style={{ fontWeight: 500 }}>{verifyData.patient.phone}</div>
                </div>
                <div>
                  <span className="text-xs text-muted">Gender / Age</span>
                  <div style={{ fontWeight: 500 }}>
                    {verifyData.patient.gender || '—'} / {verifyData.patient.age ? `${verifyData.patient.age} yrs` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {verifyData.appointment ? (
              <div
                style={{
                  background: 'rgba(20,184,166,0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginBottom: 20,
                  border: '1px solid rgba(20,184,166,0.25)',
                }}
              >
                <div
                  className="text-xs"
                  style={{
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    letterSpacing: '0.05em',
                  }}
                >
                  Appointment Confirmed
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {verifyData.appointment.department.name}
                </div>
                {verifyData.appointment.doctor && (
                  <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
                    Doctor: Dr. {verifyData.appointment.doctor.user.firstName}{' '}
                    {verifyData.appointment.doctor.user.lastName}
                  </div>
                )}
                <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                  Time Slot: {verifyData.appointment.timeSlot}
                </div>
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: 20 }}>
                <label>Select Department (Walk-in Patient) *</label>
                <select
                  className="input select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-sm">
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={reset}
                disabled={loading}
              >
                <RotateCcw size={16} /> Scan Another
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleCheckin}
                disabled={loading || (!verifyData.appointment && !selectedDept)}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Confirm Check-In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && checkinResult && (
          <div className="glass-card animate-in" style={{ padding: 32, textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <CheckCircle size={44} color="var(--accent-success)" />
            </div>
            <h2 style={{ marginBottom: 8, fontSize: '1.35rem' }}>Check-in Successful!</h2>
            <p className="text-sm text-muted" style={{ marginBottom: 24 }}>
              <strong>{checkinResult.patient.name}</strong> has been assigned a queue token
            </p>

            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                marginBottom: 24,
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="text-xs text-muted" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>
                QUEUE TOKEN NUMBER
              </div>
              <div className="token-display">{checkinResult.entry.tokenNumber}</div>
              <div className="text-sm font-semibold" style={{ marginTop: 8, color: 'var(--accent-primary)' }}>
                {checkinResult.entry.department}
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-primary)',
                }}
              >
                <div>
                  <span className="text-xs text-muted">Queue Position</span>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    #{checkinResult.queuePosition}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted">Est. Wait Time</span>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-warning)' }}>
                    ~{checkinResult.estimatedWait.estimatedMinutes} min
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-lg w-full" onClick={reset}>
              <RotateCcw size={18} /> Check-in Next Patient
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
