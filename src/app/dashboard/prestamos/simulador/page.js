'use client';

import { useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import LoanGuard from '@/components/prestamos/LoanGuard';
import LoanSimulator from '@/components/prestamos/LoanSimulator';
import NewLoanModal from '@/components/prestamos/NewLoanModal';
import { useAuth } from '@/context/authContext';

const CAN_CREATE = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'CAJA'];

export default function SimuladorPage() {
  const { usuario } = useAuth();
  const [prefill, setPrefill] = useState(null);
  const canCreate = CAN_CREATE.includes(usuario?.role);
  return (
    <LoanGuard>
      <div className="w-full p-4">
        <div className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
            <CalculatorIcon className="h-7 w-7 text-orange-500" /> Simulador de crédito
          </h1>
          <p className="text-sm text-gray-500">Calcula la cuota, los intereses y el plan de pagos antes de prestar. No guarda nada.</p>
        </div>
        <LoanSimulator onUse={canCreate ? (data) => setPrefill(data) : null} />
      </div>
      <NewLoanModal open={!!prefill} initial={prefill || {}} onClose={() => setPrefill(null)} />
    </LoanGuard>
  );
}
