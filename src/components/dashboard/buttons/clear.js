'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function BtnClean({ handleReset }) {
  return (
    <Button
      type="button"
      variant="clear"
      icon={ArrowPathIcon}
      onClick={handleReset}
    >
      Limpiar
    </Button>
  );
}
