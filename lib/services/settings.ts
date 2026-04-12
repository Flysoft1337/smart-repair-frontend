import { apiJson } from '@/lib/api';

export interface PriorityModeResponse {
  autoPriorityEnabled: boolean;
}

export function fetchPriorityMode() {
  return apiJson<PriorityModeResponse>('/api/settings/priority-mode');
}

export function updatePriorityMode(autoPriorityEnabled: boolean) {
  return apiJson<PriorityModeResponse>('/api/settings/priority-mode', {
    method: 'PATCH',
    body: JSON.stringify({ autoPriorityEnabled }),
  });
}

