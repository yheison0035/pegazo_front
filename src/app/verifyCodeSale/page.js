import { Suspense } from 'react';
import VerifyCodeSaleClient from '@/components/verifyCodeSale/verifyCodeSaleClient';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyCodeSaleClient />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Cargando verificación...</p>
    </div>
  );
}
