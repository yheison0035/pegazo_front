import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function Header({ typeUrl, type }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Button variant="add" icon={PlusIcon} href={`/dashboard/${typeUrl}/new`}>
        Agregar {type}
      </Button>
    </div>
  );
}
