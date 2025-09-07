"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/authContext";

const users = [
  {
    email: "europeatvstore@gmail.com",
    name: "Yeison Suarez",
    contrasena: "12345",
    rol: "Administrador",
  },
  {
    email: "asesor@gmail.com",
    name: "Alexandra Bermeo",
    contrasena: "12345",
    rol: "Asesor",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    const usuario = users.find(
      (u) => u.email === email && u.contrasena === contrasena
    );

    if (usuario) {
      login(usuario);
      router.push("/CRM/dashboard/customers");
    } else {
      setError("Credenciales incorrectas");
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg pb-9 mx-4 sm:mx-auto">
        <div className="bg-gray-900 w-full rounded-t-2xl flex justify-center py-6">
          <img
            src="/images/logo.png"
            alt="Logo Europeatvstore"
            className="h-[100px] w-auto"
          />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 text-center py-4">
          CRM - Europeatvstore
        </h1>

        <form
          onSubmit={handleSubmit}
          autoComplete="on"
          className="space-y-4 pl-6 pr-6 sm:pl-8 sm:pr8"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-700 font-semibold py-2"
            >
              Correo Electronico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese su email"
              required
              className="w-full px-4 py-2 border text-gray-600 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-transparent placeholder-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-600 font-semibold py-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={mostrarContrasena ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
                className="w-full px-4 py-2 pr-10 border text-gray-600 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-transparent placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-700 hover:text-gray-800 cursor-pointer"
                tabIndex={-1}
              >
                {mostrarContrasena ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <button
            type="submit"
            className="block w-full bg-orange-600 text-white font-semibold text-center py-2 mt-6 rounded-lg hover:bg-orange-700 transition duration-200 cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
