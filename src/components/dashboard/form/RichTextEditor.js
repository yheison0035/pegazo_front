'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

/**
 * Editor de texto enriquecido, liviano y sin dependencias (contentEditable +
 * execCommand). Permite negrita, cursiva, subrayado, listas, alineación y
 * enlaces. Devuelve HTML por onChange. El HTML se sanea al mostrarse en la
 * tienda.
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escribe aquí…',
  minHeight = 120,
}) {
  const ref = useRef(null);
  const [active, setActive] = useState({});

  // Carga inicial / cambios externos (sin pisar lo que el usuario escribe).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== (value || '')) el.innerHTML = value || '';
  }, [value]);

  const emit = () => {
    if (!ref.current || !onChange) return;
    const html = ref.current.innerHTML;
    // Vacío real cuando solo queda un <br> o espacios.
    const clean = html === '<br>' ? '' : html;
    onChange(clean);
  };

  const refreshActive = () => {
    try {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
    } catch {
      /* queryCommandState puede fallar en algunos navegadores */
    }
  };

  const exec = (command, arg) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
    refreshActive();
  };

  const addLink = () => {
    const url = window.prompt('Pega el enlace (https://…):', 'https://');
    if (!url) return;
    // Si no hay texto seleccionado, inserta el propio enlace como texto.
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      exec('createLink', url);
    } else {
      exec(
        'insertHTML',
        `<a href="${url.replace(/"/g, '')}">${url.replace(/</g, '')}</a>`,
      );
    }
  };

  const Btn = ({ onClick, isActive, title, children }) => (
    <button
      type="button"
      title={title}
      // mousedown preventDefault para no perder la selección del texto.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition ${
        isActive
          ? 'bg-orange-100 text-orange-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-500">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
        <Btn onClick={() => exec('bold')} isActive={active.bold} title="Negrita">
          <span className="font-bold">B</span>
        </Btn>
        <Btn
          onClick={() => exec('italic')}
          isActive={active.italic}
          title="Cursiva"
        >
          <span className="italic">I</span>
        </Btn>
        <Btn
          onClick={() => exec('underline')}
          isActive={active.underline}
          title="Subrayado"
        >
          <span className="underline">U</span>
        </Btn>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <Btn
          onClick={() => exec('insertUnorderedList')}
          isActive={active.insertUnorderedList}
          title="Lista con viñetas"
        >
          <ListBulletIcon className="h-5 w-5" />
        </Btn>
        <Btn
          onClick={() => exec('insertOrderedList')}
          isActive={active.insertOrderedList}
          title="Lista numerada"
        >
          <NumberedListIcon className="h-5 w-5" />
        </Btn>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <Btn
          onClick={() => exec('justifyLeft')}
          isActive={active.justifyLeft}
          title="Alinear a la izquierda"
        >
          <Bars3BottomLeftIcon className="h-5 w-5" />
        </Btn>
        <Btn
          onClick={() => exec('justifyCenter')}
          isActive={active.justifyCenter}
          title="Centrar"
        >
          <Bars3Icon className="h-5 w-5" />
        </Btn>
        <Btn
          onClick={() => exec('justifyRight')}
          isActive={active.justifyRight}
          title="Alinear a la derecha"
        >
          <Bars3BottomRightIcon className="h-5 w-5" />
        </Btn>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <Btn onClick={addLink} title="Insertar enlace">
          <LinkIcon className="h-5 w-5" />
        </Btn>
        <Btn
          onClick={() => exec('removeFormat')}
          title="Quitar formato"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </Btn>
      </div>

      {/* Área editable */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="rte-content prose-sm max-w-none px-4 py-3 text-sm text-gray-800 outline-none"
      />

      <style>{`
        .rte-content:empty:before { content: attr(data-placeholder); color: #9ca3af; }
        .rte-content a { color: #ea580c; text-decoration: underline; }
        .rte-content ul { list-style: disc; padding-left: 1.25rem; }
        .rte-content ol { list-style: decimal; padding-left: 1.25rem; }
        .rte-content b, .rte-content strong { font-weight: 700; }
      `}</style>
    </div>
  );
}
