'use client';

import useUsers from '@/lib/api/hooks/useUsers';
import UsersForm from '@/components/dashboard/form/usersForm';
import { getEmptyUser } from '@/lib/api/utils/users.config';

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
