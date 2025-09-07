"use client";

import { useState, useEffect } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

import Thead from "./segments/thead";
import InputFilters from "./segments/InputsFilters";
import Modal from "./segments/modalAdvisor";
import Pagination from "./segments/pagination";
import Actions from "./segments/actions";
import ConfirmDeleteModal from "./segments/confirmDeleteModal";
import ChangeAdvisorModal from "../modals/changeAdvisorModal";
import { getRole } from "@/custom/roles";
import { getWiew } from "@/custom/views";

const Table = ({ info = [], view, setSelected, rol, delivered = false }) => {
  const [filtered, setFiltered] = useState(info);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalChangeAdvisor, setShowModalChangeAdvisor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    advisor: "",
    state: "",
  });

  useEffect(() => {
    let result = info.filter(
      (a) =>
        a.name?.toLowerCase().includes(filters.name.toLowerCase()) &&
        a.email?.toLowerCase().includes(filters.email.toLowerCase()) &&
        a.phone?.toLowerCase().includes(filters.phone.toLowerCase()) &&
        (a.advisor?.toLowerCase() || "").includes(
          filters.advisor.toLowerCase()
        ) &&
        (a.state?.toLowerCase() || "").includes(filters.state.toLowerCase())
    );

    if (delivered) {
      result = result.filter((a) => a.delivered?.toUpperCase() === "ENTREGADO");
    } else {
      result = result.filter((a) => a.delivered?.toUpperCase() !== "ENTREGADO");
    }

    if (rol === getRole("ADVISOR") && view === getWiew("CUSTOMERS")) {
      result = result.filter(
        (a) => a.advisor?.toLowerCase() === "maria manrrique"
      );
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [filters, info, view, delivered]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (id, type = "asesor/cliente") => {
    setDeleteTarget({ id, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      console.log(`Eliminado ${deleteTarget.type} con ID:`, deleteTarget.id);
      // Aquí va tu lógica real de eliminación
    }
  };

  const toggleCheckbox = (info) => {
    setSelectedIds((prev) =>
      prev.includes(info.id)
        ? prev.filter((id) => id !== info.id)
        : [...prev, info.id]
    );
  };

  const assignAdvisor = () => {
    console.log("Assigning advisor:", selectedAdvisor, selectedIds);
    setShowModal(false);
    setSelectedAdvisor("");
    setSelectedIds([]);
  };

  const getCustomerLockState = (index, customer) => {
    if (rol !== "Asesor" || view !== "customers") return false;
    if (customer.comments?.length > 0) return false;

    for (let i = 0; i < index; i++) {
      const prevCustomer = paginatedData[i];
      if (!prevCustomer.comments || prevCustomer.comments.length === 0) {
        return true;
      }
    }
    return false;
  };

  return (
    <div>
      {rol === getRole("ADMIN") &&
        view === getWiew("CUSTOMERS") &&
        selectedIds.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Asignar asesor{" "}
            <span className="font-semibold">{selectedIds.length}</span>
          </button>
        )}

      <table className="min-w-full text-sm text-left text-gray-700">
        <Thead rol={rol} view={view} delivered={delivered} />

        <tbody>
          <InputFilters
            rol={rol}
            view={view}
            filters={filters}
            handleFilterChange={handleFilterChange}
            delivered={delivered}
          />

          {paginatedData.map((info, index) => {
            const isLocked = getCustomerLockState(index, info);
            return (
              <tr
                key={info.id}
                className={`border-b ${
                  isLocked
                    ? "bg-gray-100 opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                {rol === getRole("ADMIN") &&
                  view === getWiew("CUSTOMERS") &&
                  !delivered && (
                    <td className="px-4 py-3 text-center">
                      {info.advisor !== "Sin Asignar" ? (
                        <CheckIcon className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(info.id)}
                          onChange={() => toggleCheckbox(info)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      )}
                    </td>
                  )}

                {rol === getRole("ADMIN") && view === getWiew("CUSTOMERS") && (
                  <td className="px-4 py-3">{info.advisor}</td>
                )}
                <td className="px-4 py-3">{info.name}</td>
                <td className="px-4 py-3">{info.email}</td>
                <td className="px-4 py-3">
                  {view === getWiew("CUSTOMERS") ? (
                    <a
                      href={
                        isLocked ? undefined : `https://wa.me/${info.phone}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 ${
                        isLocked
                          ? "text-gray-400 cursor-not-allowed pointer-events-none"
                          : "text-green-600 hover:underline"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                      >
                        <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0a11.94 11.94 0 0 0-10.18 18L0 24l6.29-1.64A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.2-3.48-8.52ZM12 22a9.93 9.93 0 0 1-5.07-1.38l-.36-.21-3.73.97.99-3.63-.24-.37A9.94 9.94 0 1 1 12 22Zm5.29-7.71c-.29-.14-1.7-.84-1.96-.94s-.46-.14-.66.15c-.19.29-.76.93-.93 1.12s-.34.21-.63.07a8.08 8.08 0 0 1-2.38-1.46 8.8 8.8 0 0 1-1.63-2.03c-.17-.29 0-.44.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51s-.66-1.58-.91-2.17c-.24-.58-.48-.5-.66-.51l-.56-.01a1.08 1.08 0 0 0-.77.36c-.26.29-1.01.99-1.01 2.41 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.94 4.35.69.3 1.23.47 1.65.6.7.22 1.34.19 1.85.12.57-.08 1.7-.7 1.94-1.38.24-.68.24-1.27.17-1.38-.08-.11-.26-.18-.55-.32Z" />
                      </svg>
                      {info.phone}
                    </a>
                  ) : (
                    info.phone
                  )}
                </td>
                {view === getWiew("CUSTOMERS") && (
                  <td className="px-4 py-3">{info.state}</td>
                )}

                <td className="px-4 py-3 text-center">
                  <Actions
                    isLocked={isLocked}
                    rol={rol}
                    info={info}
                    view={view}
                    setSelected={setSelected}
                    delivered={delivered}
                    handleDelete={() =>
                      handleDeleteClick(
                        info.id,
                        view === getWiew("CUSTOMERS") ? "cliente" : "asesor"
                      )
                    }
                    setShowModalChangeAdvisor={(e) =>
                      setShowModalChangeAdvisor(e)
                    }
                  />

                  {showDeleteModal && (
                    <ConfirmDeleteModal
                      show={showDeleteModal}
                      setShow={setShowDeleteModal}
                      type={deleteTarget?.type}
                      name={info.name}
                      onConfirm={confirmDelete}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination
        filtered={filtered}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        setRowsPerPage={setRowsPerPage}
        setCurrentPage={setCurrentPage}
      />

      {showModal && (
        <ModalAdvisor
          selectedAdvisor={selectedAdvisor}
          setShowModal={setShowModal}
          setSelectedAdvisor={setSelectedAdvisor}
          assignAdvisor={assignAdvisor}
        />
      )}

      {showModalChangeAdvisor && (
        <ChangeAdvisorModal
          isOpen={!!showModalChangeAdvisor}
          onClose={() => setShowModalChangeAdvisor(null)}
          onSave={(newAdvisorId) => {
            console.log("Cliente:", showModalChangeAdvisor.id);
            console.log("Nuevo asesor asignado:", newAdvisorId);
            setShowModalChangeAdvisor(null);
          }}
          currentAdvisor={showModalChangeAdvisor.advisor || "No asignado"}
          advisors={[
            { id: "1", name: "María López" },
            { id: "2", name: "Carlos Gómez" },
            { id: "3", name: "Ana Torres" },
          ]}
        />
      )}
    </div>
  );
};

export default Table;
