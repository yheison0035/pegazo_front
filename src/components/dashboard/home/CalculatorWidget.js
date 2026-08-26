'use client';

import { useState } from 'react';

// Calculadora simple para el panel: sumar, restar, multiplicar, dividir y %.
export default function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null); // { value, op }
  const [fresh, setFresh] = useState(true); // el próximo dígito reinicia

  const num = (n) => Number(String(n).replace(/,/g, '')) || 0;
  const fmt = (n) => {
    if (!Number.isFinite(n)) return '0';
    const r = Math.round(n * 1e6) / 1e6;
    return r.toLocaleString('es-CO', { maximumFractionDigits: 6 });
  };

  const inputDigit = (dg) => {
    setDisplay((d) => {
      if (fresh || d === '0') return dg;
      if (d.replace(/[^\d]/g, '').length >= 12) return d;
      return d + dg;
    });
    setFresh(false);
  };

  const inputDot = () => {
    setDisplay((d) => (fresh ? '0.' : d.includes('.') ? d : d + '.'));
    setFresh(false);
  };

  const compute = (a, b, op) => {
    switch (op) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const chooseOp = (op) => {
    const current = num(display);
    if (prev && !fresh) {
      const res = compute(prev.value, current, prev.op);
      setDisplay(fmt(res));
      setPrev({ value: res, op });
    } else {
      setPrev({ value: current, op });
    }
    setFresh(true);
  };

  const equals = () => {
    if (!prev) return;
    const res = compute(prev.value, num(display), prev.op);
    setDisplay(fmt(res));
    setPrev(null);
    setFresh(true);
  };

  const clearAll = () => {
    setDisplay('0');
    setPrev(null);
    setFresh(true);
  };

  const percent = () => {
    setDisplay((d) => fmt(num(d) / 100));
    setFresh(true);
  };

  const toggleSign = () => setDisplay((d) => fmt(num(d) * -1));

  const Btn = ({ children, onClick, variant = 'num', wide }) => {
    const styles = {
      num: 'bg-gray-50 text-gray-800 hover:bg-gray-100',
      fn: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      op: 'bg-orange-500 text-white hover:bg-orange-600',
    };
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
          styles[variant]
        } ${wide ? 'col-span-2' : ''}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Calculadora
      </p>
      <div className="mb-3 rounded-xl bg-gray-900 px-4 py-3 text-right text-2xl font-bold text-white">
        <span className="block truncate">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Btn variant="fn" onClick={clearAll}>
          C
        </Btn>
        <Btn variant="fn" onClick={toggleSign}>
          ±
        </Btn>
        <Btn variant="fn" onClick={percent}>
          %
        </Btn>
        <Btn variant="op" onClick={() => chooseOp('÷')}>
          ÷
        </Btn>

        <Btn onClick={() => inputDigit('7')}>7</Btn>
        <Btn onClick={() => inputDigit('8')}>8</Btn>
        <Btn onClick={() => inputDigit('9')}>9</Btn>
        <Btn variant="op" onClick={() => chooseOp('×')}>
          ×
        </Btn>

        <Btn onClick={() => inputDigit('4')}>4</Btn>
        <Btn onClick={() => inputDigit('5')}>5</Btn>
        <Btn onClick={() => inputDigit('6')}>6</Btn>
        <Btn variant="op" onClick={() => chooseOp('−')}>
          −
        </Btn>

        <Btn onClick={() => inputDigit('1')}>1</Btn>
        <Btn onClick={() => inputDigit('2')}>2</Btn>
        <Btn onClick={() => inputDigit('3')}>3</Btn>
        <Btn variant="op" onClick={() => chooseOp('+')}>
          +
        </Btn>

        <Btn wide onClick={() => inputDigit('0')}>
          0
        </Btn>
        <Btn onClick={inputDot}>.</Btn>
        <Btn variant="op" onClick={equals}>
          =
        </Btn>
      </div>
    </div>
  );
}
