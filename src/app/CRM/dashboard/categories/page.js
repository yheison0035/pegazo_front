'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ViewModal from '../../viewModal';
import Table from '@/components/dashboard/tables/table';
import Link from 'next/link';
import RoleGuard from '@/auth/roleGuard';
import { useAuth } from '@/context/authContext';
import { Roles } from '@/config/roles';
import useCategories from '@/lib/api/hooks/useCategories';
import { getHeaderTableCategories } from '@/lib/api/utils/categories.config';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(null);
  const { usuario } = useAuth();

  const { getCategories, loading, error } = useCategories();

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, [getCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <RoleGuard allowedRoles={Object.values(Roles)}>
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Listado de Categorías
          </h1>

          <div className="flex gap-2">
            <Link
              href="/CRM/dashboard/categories/new"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar categoría
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table
            header={getHeaderTableCategories()}
            info={categories}
            view="categories"
            setSelected={setSelectedCategories}
            rol={usuario?.role}
            fetchData={fetchCategories}
            loading={loading}
            error={error}
          />
          {selectedCategories && (
            <ViewModal
              data={selectedCategories}
              type="categories"
              onClose={() => setSelectedCategories(null)}
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
