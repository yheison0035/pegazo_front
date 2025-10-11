import usePermissions from '@/hooks/usePermissions';
import {
  DocumentArrowDownIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Header({
  archivo,
  handleFileChange,
  handleRemoveFile,
  handleUpload,
}) {
  const { canImport, canCreate } = usePermissions();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {canCreate && (
        <Link
          href="/CRM/dashboard/customers/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Agregar cliente</span>
        </Link>
      )}

      {canImport && (
        <>
          {!archivo ? (
            <label className="flex items-center gap-2 cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition">
              <DocumentArrowDownIcon className="w-4 h-4" />
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center bg-green-100 border border-green-400 px-4 py-2 rounded-lg">
              <span className="text-green-800 text-sm font-medium truncate max-w-[200px]">
                {archivo.name}
              </span>
              <button
                onClick={handleRemoveFile}
                className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                title="Eliminar archivo"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleUpload}
                className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm cursor-pointer"
              >
                Subir
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
