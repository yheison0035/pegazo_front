'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function BtnReturn({ route }) {
  return (
    <Link href={route} passHref>
      <span className="inline-flex items-center gap-2 px-4 py-2 mr-2 border border-transparent bg-orange-600 text-white font-medium rounded-lg hover:bg-white hover:text-orange-600 hover:border-orange-600 transition-colors duration-200 cursor-pointer">
        <ArrowLeftIcon className="w-5 h-5" />
        Volver
      </span>
    </Link>
  );
}
