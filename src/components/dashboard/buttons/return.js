'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function BtnReturn({ disabled, route }) {
  return (
    <Button
      href={route}
      variant="secondary"
      icon={ArrowLeftIcon}
      disabled={disabled}
    >
      Volver
    </Button>
  );
}
