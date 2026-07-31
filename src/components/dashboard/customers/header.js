import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Header({ typeUrl, type }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Link
        href={`/dashboard/${typeUrl}/new`}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Agregar {type}</span>
      </Link>
    </div>
  );
}
