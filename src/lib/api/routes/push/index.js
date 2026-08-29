import apiFetch from '../../auth/client';

export async function getVapidPublicKey() {
  return apiFetch('/push/vapid-public', { auth: false });
}

export async function subscribePush(subscription) {
  return apiFetch('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription }),
  });
}

export async function unsubscribePush(endpoint) {
  return apiFetch('/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}
