'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const SCRIPT_URL = 'https://script.google.com/home/projects/create';

// Genera el código de Apps Script con el enlace (webhook) del negocio ya puesto.
function buildScript(webhook) {
  return `const WEBHOOK = '${webhook}';
const ETIQUETA = 'PegazoEnviado';

// CORRE ESTO UNA SOLA VEZ: marca los correos actuales como ya enviados
// (para que NO se repitan avisos viejos).
function marcarTodoComoEnviado() {
  const label = GmailApp.getUserLabelByName(ETIQUETA) || GmailApp.createLabel(ETIQUETA);
  const q = 'newer_than:3d -label:' + ETIQUETA +
    ' (from:bancolombia OR from:notificacionesbancolombia OR from:nequi OR from:daviplata OR subject:recibiste OR subject:pago OR subject:movimientos)';
  const threads = GmailApp.search(q, 0, 100);
  threads.forEach(t => t.addLabel(label));
  Logger.log('Etiquetados sin reenviar: ' + threads.length);
}

// ESTA corre sola cada minuto (el activador la usa).
function revisarBanco() {
  const label = GmailApp.getUserLabelByName(ETIQUETA) || GmailApp.createLabel(ETIQUETA);
  const q = 'newer_than:1d -label:' + ETIQUETA +
    ' (from:bancolombia OR from:notificacionesbancolombia OR from:nequi OR from:daviplata OR subject:recibiste OR subject:pago OR subject:movimientos)';
  const threads = GmailApp.search(q, 0, 30);
  for (const th of threads) {
    for (const msg of th.getMessages()) {
      try {
        UrlFetchApp.fetch(WEBHOOK, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ text: msg.getPlainBody() }),
          muteHttpExceptions: true,
        });
      } catch (e) {}
    }
    th.addLabel(label);
  }
}`;
}

function CopyBtn({ text, label = 'Copiar' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      {done ? (
        <>
          <CheckIcon className="h-4 w-4 text-emerald-600" /> ¡Copiado!
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
}

function LinkBtn({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
    >
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      {children}
    </a>
  );
}

// Modal-asistente: guía paso a paso para conectar el correo del banco a Pegazo.
export default function BankSetupModal({ webhook, correo, onClose }) {
  const [step, setStep] = useState(0);
  const script = buildScript(webhook || '');
  const inbox = correo || 'tu correo del banco';

  const steps = [
    {
      title: 'Abre Google Apps Script',
      body: (
        <>
          <p>
            Vamos a crear un pequeño “ayudante” que vigila tu correo y le avisa a
            Pegazo cuando entra una consignación. Es gratis y se hace una sola
            vez.
          </p>
          <p className="mt-2">
            Abre esta página <b>iniciando sesión con el correo</b>{' '}
            <b className="text-gray-800">{inbox}</b> (el mismo donde te llegan los
            avisos del banco):
          </p>
          <div className="mt-3">
            <LinkBtn href={SCRIPT_URL}>Abrir Google Apps Script</LinkBtn>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Se abre un editor con un archivo llamado <b>Código.gs</b> y un texto
            que dice <code>function myFunction() {'{}'}</code>.
          </p>
        </>
      ),
    },
    {
      title: 'Borra lo que haya y pega este código',
      body: (
        <>
          <p>
            Dentro de <b>Código.gs</b>, selecciona todo lo que haya y bórralo.
            Luego pega este código (ya trae tu enlace, no cambies nada):
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Código para pegar</span>
            <CopyBtn text={script} label="Copiar código" />
          </div>
          <pre className="mt-1 max-h-52 overflow-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
            {script}
          </pre>
        </>
      ),
    },
    {
      title: 'Guarda',
      body: (
        <>
          <p>
            Guarda el proyecto: clic en el ícono del <b>disquete</b> 💾 (o teclea{' '}
            <b>Ctrl + S</b>). Si te pide nombre, ponle cualquiera, por ejemplo
            “Pegazo Banco”.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Cuando quede guardado, el aviso de “cambios sin guardar” desaparece.
          </p>
        </>
      ),
    },
    {
      title: 'Marca los correos actuales (una vez)',
      body: (
        <>
          <p>
            Arriba hay un selector de función (junto al botón{' '}
            <b>▶ Ejecutar</b>). Elige{' '}
            <b className="text-gray-800">marcarTodoComoEnviado</b> y dale{' '}
            <b>▶ Ejecutar</b>.
          </p>
          <p className="mt-2">
            Esto evita que se repitan avisos viejos. La <b>primera vez</b> Google
            te pedirá permiso:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
            <li>Elige tu cuenta de Gmail.</li>
            <li>
              Si sale “Google no ha verificado esta aplicación” →{' '}
              <b>Configuración avanzada</b> → <b>Ir al proyecto (no seguro)</b>.
            </li>
            <li>
              Dale <b>Permitir</b>. (Es tu propio correo; por eso el aviso.)
            </li>
          </ol>
        </>
      ),
    },
    {
      title: 'Programa que corra solo cada minuto',
      body: (
        <>
          <p>
            En la barra de la izquierda, clic en el ícono del <b>reloj</b> ⏰
            (Activadores). Abajo a la derecha: <b>Añadir activador</b>.
          </p>
          <p className="mt-2">Configúralo así y dale Guardar:</p>
          <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <li>
              Función: <b>revisarBanco</b>
            </li>
            <li>
              Origen del evento: <b>Basado en tiempo</b>
            </li>
            <li>
              Tipo: <b>Temporizador por minutos</b> → <b>Cada minuto</b>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: '¡Listo! 🎉',
      body: (
        <>
          <p>
            Ya quedó conectado. Cada vez que entre una transferencia a tu cuenta,
            en menos de 2 minutos <b>aparecerá aquí y sonará la voz</b> con el
            valor y el nombre de quien consignó.
          </p>
          <p className="mt-2">
            Para comprobarlo, haz una <b>transferencia de prueba pequeña</b> a tu
            llave. También puedes usar el botón{' '}
            <b>“Probar voz y aviso”</b> de esta pantalla para oír cómo suena.
          </p>
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
            Recuerda dar un clic en la página al menos una vez para que el
            navegador permita la voz.
          </p>
        </>
      ),
    },
  ];

  const last = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
              Paso {step + 1} de {steps.length}
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-gray-800">
              {current.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progreso */}
        <div className="flex gap-1 px-5 pt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-auto px-5 py-4 text-sm text-gray-700">
          {current.body}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Anterior
          </button>
          {last ? (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <CheckIcon className="h-4 w-4" /> Finalizar
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Siguiente <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
