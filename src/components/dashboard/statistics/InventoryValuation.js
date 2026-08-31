'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getInventoryValuation } from '@/lib/api/routes/statistics';
import { ChartCard, formatMoney } from './statsUI';
import FilterableTable from './FilterableTable';
import { exportCSV, csvNum } from './exportUtils';

function Card({ label, value, color = 'text-gray-900', sub }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function InventoryValuation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryValuation({});
      if (res?.success) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const items = data?.items || [];

  const handleExport = () => {
    const rows = [
      ['Inventario valorizado'],
      [],
      ['Producto', 'Categoría', 'Stock', 'Costo unit', 'Valor a costo', 'Valor a venta', 'Utilidad potencial'],
      ...items.map((i) => [
        i.name,
        i.category,
        i.units,
        csvNum(i.costUnit),
        csvNum(i.valueCost),
        csvNum(i.valueSale),
        csvNum(i.margin),
      ]),
      [],
      ['TOTAL', '', t?.units || 0, '', csvNum(t?.valueCost), csvNum(t?.valueSale), csvNum(t?.margin)],
    ];
    exportCSV('Pegazo-inventario-valorizado', rows);
  };

  return (
    <div className="relative space-y-6">
      {loading && <LoadingOverlay />}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Cuánto vale tu inventario hoy, a costo y a precio de venta.
        </p>
        <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={handleExport}>
          Excel
        </Button>
      </div>

      {t && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card
            label="Valor a costo"
            value={formatMoney(t.valueCost)}
            color="text-orange-600"
            sub="Lo que te costó el stock"
          />
          <Card
            label="Valor a venta"
            value={formatMoney(t.valueSale)}
            color="text-emerald-600"
            sub="Si lo vendes todo"
          />
          <Card
            label="Utilidad potencial"
            value={formatMoney(t.margin)}
            color="text-blue-600"
            sub="Venta − costo"
          />
          <Card
            label="Stock bajo"
            value={data.lowStockCount}
            color={data.lowStockCount ? 'text-red-600' : 'text-gray-700'}
            sub={`${data.products} productos · ${t.units} uds.`}
          />
        </div>
      )}

      <ChartCard
        title="Inventario valorizado"
        subtitle="Filtra y ordena por cualquier columna"
      >
        {items.length ? (
          <FilterableTable
            rows={items}
            initialSort={{ key: 'valueCost', dir: 'desc' }}
            columns={[
              {
                key: 'name',
                label: 'Producto',
                filter: 'text',
                value: (r) => r.name,
                render: (r) => (
                  <span className="flex items-center gap-1.5 font-medium text-gray-800">
                    {r.low && (
                      <ExclamationTriangleIcon
                        className="h-4 w-4 text-red-500"
                        title="Stock bajo"
                      />
                    )}
                    {r.name}
                  </span>
                ),
              },
              {
                key: 'category',
                label: 'Categoría',
                filter: 'select',
                value: (r) => r.category,
              },
              {
                key: 'units',
                label: 'Stock',
                align: 'right',
                value: (r) => r.units,
                render: (r) => (
                  <span className={r.low ? 'font-bold text-red-600' : ''}>
                    {r.units}
                  </span>
                ),
              },
              {
                key: 'costUnit',
                label: 'Costo unit',
                align: 'right',
                isMoney: true,
                value: (r) => r.costUnit,
              },
              {
                key: 'valueCost',
                label: 'Valor a costo',
                align: 'right',
                isMoney: true,
                total: true,
                value: (r) => r.valueCost,
              },
              {
                key: 'valueSale',
                label: 'Valor a venta',
                align: 'right',
                isMoney: true,
                total: true,
                value: (r) => r.valueSale,
              },
              {
                key: 'margin',
                label: 'Utilidad',
                align: 'right',
                isMoney: true,
                total: true,
                value: (r) => r.margin,
              },
            ]}
          />
        ) : (
          <p className="py-10 text-center text-sm text-gray-400">
            No hay productos con control de stock.
          </p>
        )}
      </ChartCard>
    </div>
  );
}
