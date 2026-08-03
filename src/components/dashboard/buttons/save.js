'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function BtnSave({ module = 'save', disabled = false }) {
  const isSale = module === 'sales';

  return (
    <Button
      type="submit"
      variant={isSale ? 'add' : 'primary'}
      icon={CheckIcon}
      loading={disabled}
    >
      {isSale ? 'Vender' : 'Guardar'}
    </Button>
  );
}
