import { getRole } from "@/custom/roles";
import { getWiew } from "@/custom/views";

export default function Thead({ rol, view, delivered }) {
  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        {rol === getRole("ADMIN") &&
          view === getWiew("CUSTOMERS") &&
          !delivered && (
            <>
              <th className="px-4 py-3 text-center">Asignar</th>
              <th className="px-4 py-3">Asesor</th>
            </>
          )}
        {delivered && rol !== "Asesor" && (
          <>
            <th className="px-4 py-3">Asesor</th>
          </>
        )}
        <th className="px-4 py-3">Nombre</th>
        <th className="px-4 py-3">Correo</th>
        <th className="px-4 py-3">Teléfono</th>
        {view === getWiew("CUSTOMERS") && (
          <th className="px-4 py-3">Estado Actual</th>
        )}
        <th className="px-4 py-3 text-center">Acciones</th>
      </tr>
    </thead>
  );
}
