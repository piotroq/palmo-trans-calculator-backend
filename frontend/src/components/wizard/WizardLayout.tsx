/**
 * WizardLayout FINAL — 6 kroków + booking callback
 */

import { useCalculatorStoreV2 } from '../../store/calculatorStoreV2';
import { WIZARD_STEPS } from '../../types/calculator';
import { StepPreis } from './steps/StepPreis';
import { StepSendung } from './steps/StepSendung';
import { StepAbholung } from './steps/StepAbholung';
import { StepZustellung } from './steps/StepZustellung';
import { StepRechnung } from './steps/StepRechnung';
import { StepZahlung, PaymentPanel } from './steps/StepZahlung';
import { WizardSidebar } from './WizardSidebar';
import type { BookingConfirmation } from '../../services/bookingService';

interface WizardLayoutProps {
  onBookingSuccess: (data: BookingConfirmation) => void;
}

export const WizardLayout = ({ onBookingSuccess }: WizardLayoutProps) => {
  const { currentStep, completedSteps, setStep, canNavigateTo } = useCalculatorStoreV2();

  const showSidebar = currentStep >= 2;

  return (
    <div className="min-h-screen text-white py-6 px-4" style={{ backgroundColor: '#1A1A1A' }}>
      <div className={`mx-auto ${showSidebar ? 'max-w-5xl' : 'max-w-3xl'}`}>

        {/* ── Step Indicator ── */}
        <div className="mb-8">
          <div className="hidden md:flex items-center justify-between mb-2 px-1">
            {WIZARD_STEPS.map(({ step, labelDE }) => {
              const s = step as 1|2|3|4|5|6;
              const isActive = currentStep === s;
              const isDone = completedSteps.has(s);
              const canClick = canNavigateTo(s);
              return (
                <button
                  key={step}
                  onClick={() => canClick && setStep(s)}
                  disabled={!canClick}
                  className={`
                    text-xs font-semibold transition-colors
                    ${isActive ? 'text-yellow-400'
                      : isDone ? 'text-green-400 cursor-pointer hover:text-green-300'
                      : canClick ? 'text-gray-500 cursor-pointer hover:text-gray-300'
                      : 'text-gray-700 cursor-not-allowed'}
                  `}
                >
                  {step}. {labelDE}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            {WIZARD_STEPS.map(({ step }) => {
              const s = step as 1|2|3|4|5|6;
              return (
                <div key={step} className={`
                  flex-1 h-1.5 rounded-full transition-all duration-300
                  ${currentStep === s ? 'bg-yellow-400' : completedSteps.has(s) ? 'bg-green-500' : 'bg-gray-700'}
                `} />
              );
            })}
          </div>

          <p className="md:hidden text-center text-xs text-gray-500 mt-2">
            Schritt {currentStep} von 6:{' '}
            <span className="text-yellow-400 font-semibold">{WIZARD_STEPS[currentStep - 1].labelDE}</span>
          </p>
        </div>

        {/* ── Content Area ── */}
        {showSidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-6">
            <div className="bg-gray-900/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-800">
              <StepContent step={currentStep} onBookingSuccess={onBookingSuccess} />
            </div>
            <div className="hidden lg:block">
              {currentStep === 6
                ? <PaymentPanel onBookingSuccess={onBookingSuccess} />
                : <WizardSidebar />
              }
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-800">
            <StepContent step={currentStep} onBookingSuccess={onBookingSuccess} />
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
          <p>PALMO-TRANS GmbH | Express & Sondertransporte</p>
          <p>* 0% USt. für Kunden außerhalb von Deutschland (Reverse Charge), nur für gewerbliche Kunden (USt.-ID notwendig)</p>
        </div>
      </div>
    </div>
  );
};

const StepContent = ({ step, onBookingSuccess }: { step: number; onBookingSuccess: (data: BookingConfirmation) => void }) => {
  switch (step) {
    case 1: return <StepPreis />;
    case 2: return <StepSendung />;
    case 3: return <StepAbholung />;
    case 4: return <StepZustellung />;
    case 5: return <StepRechnung />;
    case 6: return <StepZahlung onBookingSuccess={onBookingSuccess} />;
    default: return null;
  }
};
