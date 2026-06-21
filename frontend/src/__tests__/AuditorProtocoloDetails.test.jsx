import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================================
// MOCKS â€” devem vir ANTES de qualquer import do cÃ³digo alvo
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
vi.mock('../components/admin/AuditorProtocoloDetails.css', () => ({}));

vi.mock('../contexts/AuditorAuthContext', () => ({
  useAuditorAuth: () => ({
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
import AuditorProtocoloDetails from '../components/admin/AuditorProtocoloDetails.jsx';

// ============================================================
// DADOS DE REFERÃŠNCIA (Seed Fake)
// ============================================================
const protocoloEmAnalise = {
  id: 1,
  especialidade: 'Cardiologia',
  descricao: 'Encaminhamento para ecocardiograma urgente.',
  status: 'Em anÃ¡lise',
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
      <AuditorProtocoloDetails />
    </MemoryRouter>
  );

// ============================================================
// SUÃTE A: RenderizaÃ§Ã£o e ExibiÃ§Ã£o de Dados
// ============================================================
describe('ðŸ–¥ï¸ AuditorProtocoloDetails â€” RenderizaÃ§Ã£o', () => {
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

  it('TC-F03 | Deve exibir o textarea de Parecer quando status Ã© "Em anÃ¡lise"', async () => {
    renderComponent();
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('id', 'parecerText');
    });
  });

  it('TC-F04 | Deve exibir os botÃµes Negar e Aprovar quando "Em anÃ¡lise"', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Negar Pedido')).toBeInTheDocument();
      expect(screen.getByText('Aprovar Pedido')).toBeInTheDocument();
    });
  });
});

// ============================================================
// SUÃTE B: Regras de NegÃ³cio (UX)
// ============================================================
describe('ðŸ›¡ï¸ AuditorProtocoloDetails â€” Regras de NegÃ³cio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProtocolo.mockResolvedValue(protocoloEmAnalise);
  });

  it('TC-F05 | CRÃTICO: Deve BLOQUEAR negaÃ§Ã£o sem preencher o Parecer', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByText('Negar Pedido'));
    await user.click(screen.getByText('Negar Pedido'));

    // API NÃƒO deve ser chamada
    expect(mockUpdateStatus).not.toHaveBeenCalled();
    // Toast de erro deve disparar
    expect(toast.error).toHaveBeenCalledWith(
      'Preencha o Parecer/Justificativa para negar o pedido.'
    );
  });

  it('TC-F06 | Deve BLOQUEAR negaÃ§Ã£o com apenas espaÃ§os em branco (validaÃ§Ã£o trim)', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '         ');
    await user.click(screen.getByText('Negar Pedido'));

    expect(mockUpdateStatus).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('TC-F07 | Deve PERMITIR aprovaÃ§Ã£o sem preencher o Parecer (campo opcional)', async () => {
    const user = userEvent.setup();
    mockUpdateStatus.mockResolvedValue({ protocolo: { status: 'Aprovado' } });
    renderComponent();

    await waitFor(() => screen.getByText('Aprovar Pedido'));
    // Clica SEM digitar nada no textarea
    await user.click(screen.getByText('Aprovar Pedido'));

    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'Aprovado');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('TC-F08 | Deve chamar a API com "Negado" quando Parecer estÃ¡ preenchido', async () => {
    const user = userEvent.setup();
    mockUpdateStatus.mockResolvedValue({ protocolo: { status: 'Negado' } });
    renderComponent();

    await waitFor(() => screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'DocumentaÃ§Ã£o mÃ©dica insuficiente para aprovaÃ§Ã£o.');
    await user.click(screen.getByText('Negar Pedido'));

    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'Negado');
    expect(toast.error).not.toHaveBeenCalled();
  });
});

// ============================================================
// SUÃTE C: ResiliÃªncia e Tratamento de Erros
// ============================================================
describe('ðŸ’¥ AuditorProtocoloDetails â€” ResiliÃªncia', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-F09 | Deve exibir tela de carregamento enquanto busca dados', () => {
    // Promise que nunca resolve â€” simula rede lenta
    mockGetProtocolo.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('TC-F10 | Deve chamar toast.success apÃ³s aprovaÃ§Ã£o bem-sucedida', async () => {
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

  it('TC-F11 | Deve disparar toast.error quando a API de atualizaÃ§Ã£o falha', async () => {
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
