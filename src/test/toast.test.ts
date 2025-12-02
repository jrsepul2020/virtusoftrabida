import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showSuccess, showError } from '../lib/toast';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: Object.assign(
    vi.fn(), // La función base toast()
    {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
      custom: vi.fn(),
    }
  ),
}));

describe('Toast Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showSuccess llama a toast.success', () => {
    showSuccess('Operación exitosa');
    expect(toast.success).toHaveBeenCalledWith('Operación exitosa', expect.any(Object));
  });

  it('showError llama a toast.error', () => {
    showError('Error ocurrido');
    expect(toast.error).toHaveBeenCalledWith('Error ocurrido', expect.any(Object));
  });
});
