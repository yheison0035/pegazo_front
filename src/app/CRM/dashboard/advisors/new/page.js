'use client';

import useUsers from '@/lib/api/hooks/useUsers';
import AdvisorForm from '@/components/dashboard/form/advisorForm';
import { getEmptyAdvisor } from '@/lib/api/utils/getEmptyAdvisor';

export default function NewAdvisor() {
  const { createUser, loading } = useUsers();

  return (
    <AdvisorForm
      mode="create"
      loading={loading}
      initialData={getEmptyAdvisor()}
      onSubmit={(data) => createUser(data)}
    />
  );
}
