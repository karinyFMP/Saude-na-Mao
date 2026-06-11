import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================================
// MOCKS — devem vir ANTES de qualquer import do código alvo
// ============================================================

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock de CSS para evitar falha no JSDOM
vi.mock('../components/admin/AdminProtocoloDetails.css', () => ({}));

vi.mock('../contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({
    servidor: { nome: 'Admin Teste' },
    logoutServidor: vi.fn(),
  }),
}));

const mockGetProtocolo = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock('../services/adminApi', () => ({
  getAdminProtocolo: (...args) => mockGetProtocolo(...args),
  updateProtocoloStatus: (...args) => mockUpdateStatus(...args),
}));

// Import DEPOIS dos mocks
import { toast } from 'react-toastify';
import AdminProtocoloDetails from '../components/admin/AdminProtocoloDetails.jsx';

// ============================================================
// DADOS DE REFERÊNCIA (Seed Fake)
// ============================================================
const protocoloEmAnalise = {
  id: 1,
  especialidade: 'Cardiologia',
  descricao: 'Encaminhamento para ecocardiograma urgente.',
  status: 'Em análise',
  data_pedido: '2026-04-25',
  paciente_nome: 'Maria Silva',
  paciente_cpf: '123.456.789-00',
  cartao_sus: '898 0012 3456 7890',
  telefone: '(11) 98765-4321',
  paciente_unidade: 'UBS Central',
};

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={['/admin/protocolo/1']}>
      <AdminProtocoloDetails />
    </MemoryRouter>
  );

// ============================================================
// SUÍTE A: Renderização e Exibição de Dados
// ============================================================
describe('🖥️ AdminProtocoloDetails — Renderização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProtocolo.mockResolvedValue(protocoloEmAnalise);
  });

  it('TC-F01 | Deve renderizar o nome do paciente', async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    );
  });

  it('TC-F02 | Deve exibir a especialidade do protocolo', async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Cardiologia')).toBeInTheDocument()
    );
  });

  it('TC-F03 | Deve exibir o textarea de Parecer quando status é "Em análise"', async () => {
    renderComponent();
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('id', 'parecerText');
    });
  });

  it('TC-F04 | Deve exibir os botões Negar e Aprovar quando "Em análise"', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Negar Pedido')).toBeInTheDocument();
      expect(screen.getByText('Aprovar Pedido')).toBeInTheDocument();
    });
  });
});

// ============================================================
// SUÍTE B: Regras de Negócio (UX)
// ============================================================
describe('🛡️ AdminProtocoloDetails — Regras de Negócio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProtocolo.mockResolvedValue(protocoloEmAnalise);
  });

  it('TC-F05 | CRÍTICO: Deve BLOQUEAR negação sem preencher o Parecer', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Negar Pedido'));
    await user.click(screen.getByText('Negar Pedido'));

    // API NÃO deve ser chamada
    expect(mockUpdateStatus).not.toHaveBeenCalled();
    // Toast de erro deve disparar
    expect(toast.error).toHaveBeenCalledWith(
      'Preencha o Parecer/Justificativa para negar o pedido.'
    );
  });

  it('TC-F06 | Deve BLOQUEAR negação com apenas espaços em branco (validação trim)', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '         ');
    await user.click(screen.getByText('Negar Pedido'));

    expect(mockUpdateStatus).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('TC-F07 | Deve PERMITIR aprovação sem preencher o Parecer (campo opcional)', async () => {
    const user = userEvent.setup();
    mockUpdateStatus.mockResolvedValue({ protocolo: { status: 'Aprovado' } });
    renderComponent();

    await waitFor(() => screen.getByText('Aprovar Pedido'));
    // Clica SEM digitar nada no textarea
    await user.click(screen.getByText('Aprovar Pedido'));

    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'Aprovado');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('TC-F08 | Deve chamar a API com "Negado" quando Parecer está preenchido', async () => {
    const user = userEvent.setup();
    mockUpdateStatus.mockResolvedValue({ protocolo: { status: 'Negado' } });
    renderComponent();

    await waitFor(() => screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Documentação médica insuficiente para aprovação.');
    await user.click(screen.getByText('Negar Pedido'));

    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'Negado');
    expect(toast.error).not.toHaveBeenCalled();
  });
});

// ============================================================
// SUÍTE C: Resiliência e Tratamento de Erros
// ============================================================
describe('💥 AdminProtocoloDetails — Resiliência', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-F09 | Deve exibir tela de carregamento enquanto busca dados', () => {
    // Promise que nunca resolve — simula rede lenta
    mockGetProtocolo.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('TC-F10 | Deve chamar toast.success após aprovação bem-sucedida', async () => {
    const user = userEvent.setup();
    mockGetProtocolo.mockResolvedValue(protocoloEmAnalise);
    mockUpdateStatus.mockResolvedValue({ protocolo: { status: 'Aprovado' } });
    renderComponent();

    await waitFor(() => screen.getByText('Aprovar Pedido'));
    await user.click(screen.getByText('Aprovar Pedido'));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Protocolo marcado como Aprovado.')
    );
  });

  it('TC-F11 | Deve disparar toast.error quando a API de atualização falha', async () => {
    const user = userEvent.setup();
    mockGetProtocolo.mockResolvedValue(protocoloEmAnalise);
    mockUpdateStatus.mockRejectedValue(new Error('Network Error'));
    renderComponent();

    await waitFor(() => screen.getByText('Aprovar Pedido'));
    await user.click(screen.getByText('Aprovar Pedido'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar status.')
    );
  });
});
