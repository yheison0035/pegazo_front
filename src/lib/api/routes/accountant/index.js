import apiFetch from '../../auth/client';

// Registro/login del contador (identidad independiente).
export async function accountantRegister(payload) {
  return apiFetch('/accountant/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  });
}
export async function accountantLogin(email, password) {
  return apiFetch('/accountant/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}
export async function getAccountantMe() {
  return apiFetch('/accountant/me');
}

// ---- Empresa (dueño): enlazar / ver / quitar su contador ----
export async function linkAccountant(key) {
  return apiFetch('/accountant/link', {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}
export async function getLinkedAccountants() {
  return apiFetch('/accountant/link');
}
export async function unlinkAccountant(accountantId) {
  return apiFetch(`/accountant/link/${accountantId}`, { method: 'DELETE' });
}

// ---- Contador: su portafolio de empresas ----
export async function getAccountantPortfolio() {
  return apiFetch('/accountant/portfolio');
}
// El contador crea una empresa "solo contabilidad".
export async function createAccountantCompany(payload) {
  return apiFetch('/accountant/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function qs(params = {}) {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return s ? `?${s}` : '';
}

// ---- Contador: contabilidad de una empresa enlazada ----
export async function getAccCompanyFinancials(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/financials${qs(params)}`);
}
export async function getAccCompanyJournal(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/journal${qs(params)}`);
}
export async function getAccCompanyLedger(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/ledger${qs(params)}`);
}
export async function getAccCompanyAuxiliary(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/auxiliary${qs(params)}`);
}
export async function getAccCompanyLedgerAccounts(companyId) {
  return apiFetch(`/accountant/companies/${companyId}/ledger-accounts`);
}
export async function getAccCompanyTaxCalendar(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/tax-calendar${qs(params)}`);
}
export async function getAccCompanyEntries(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/entries${qs(params)}`);
}
export async function createAccCompanyEntry(companyId, payload) {
  return apiFetch(`/accountant/companies/${companyId}/entries`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function deleteAccCompanyEntry(companyId, entryId) {
  return apiFetch(`/accountant/companies/${companyId}/entries/${entryId}`, {
    method: 'DELETE',
  });
}
export async function importAccCompanyEntries(companyId, rows) {
  return apiFetch(`/accountant/companies/${companyId}/import`, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
export async function uploadAccCompanyDoc(companyId, file) {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch(`/accountant/companies/${companyId}/upload`, {
    method: 'POST',
    body: fd,
  });
}
export async function getAccCompanyParties(companyId, params = {}) {
  return apiFetch(`/accountant/companies/${companyId}/parties${qs(params)}`);
}
export async function createAccCompanyParty(companyId, data) {
  return apiFetch(`/accountant/companies/${companyId}/parties`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function updateAccCompanyParty(companyId, partyId, data) {
  return apiFetch(`/accountant/companies/${companyId}/parties/${partyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
export async function deleteAccCompanyParty(companyId, partyId) {
  return apiFetch(`/accountant/companies/${companyId}/parties/${partyId}`, {
    method: 'DELETE',
  });
}
