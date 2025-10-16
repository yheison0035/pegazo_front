'use client';

import useUsers from '@/lib/api/hooks/useUsers';
import { getEmptyUser } from '@/lib/api/utils/getEmptyUser';
import UsersForm from '@/components/dashboard/form/usersForm';

export default function NewUser() {
  const { createUser, loading } = useUsers();

  return (
    <UsersForm
      mode="create"
      loading={loading}
      initialData={getEmptyUser()}
      onSubmit={(data) => createUser(data)}
    />
  );
}
