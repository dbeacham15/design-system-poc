'use client'
import { useState } from 'react'
import { PatientStep } from './steps/PatientStep'
import { CompanionStep } from './steps/CompanionStep'
import { MemoryStep } from './steps/MemoryStep'
import { SafetyStep } from './steps/SafetyStep'
import { useRouter } from 'next/navigation'

const STEPS = ['Patient', 'Companion', 'Memory', 'Safety']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [patientId, setPatientId] = useState<string | null>(null)
  const router = useRouter()

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8">
      {/* Progress indicator */}
      <div className="flex gap-3 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${i <= step ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-700'}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-amber-900 font-medium' : 'text-amber-600'}`}>{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && <PatientStep onComplete={(id) => { setPatientId(id); next() }} />}
      {step === 1 && patientId && <CompanionStep patientId={patientId} onComplete={next} />}
      {step === 2 && patientId && <MemoryStep patientId={patientId} onComplete={next} />}
      {step === 3 && patientId && <SafetyStep caregiverId="me" onComplete={next} />}
    </div>
  )
}
