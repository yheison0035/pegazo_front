'use client';

import { useState } from 'react';

export default function useColumnFilters(initial = {}) {
  const [filters, setFilters] = useState(initial);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => setFilters(initial);

  return {
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
  };
}
