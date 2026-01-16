import { Suspense } from 'react';
import VerifyCodeSaleClient from '@/components/verifyCodeSale/verifyCodeSaleClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
          Cargando verificación...
        </div>
      }
    >
      <VerifyCodeSaleClient />
    </Suspense>
  );
}
