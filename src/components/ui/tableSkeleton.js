'use client';

export default function TableSkeleton({ rows = 8, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
