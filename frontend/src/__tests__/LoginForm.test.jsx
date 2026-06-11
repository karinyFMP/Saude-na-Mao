import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================
// MOCKS — antes de qualquer import do componente
// ============================================================
vi.mock('../components/Login.css', () => ({}));
vi.mock('../assets/images/icone.png', () => ({ default: 'mock-logo.png' }));

import LoginForm from '../components/LoginForm.jsx';

// ============================================================
// SUÍTE: LoginForm — Validação Zod + React Hook Form (Caixa Preta)
// ============================================================
describe('🔐 LoginForm — Validação de Formulário', () => {

  const mockSubmit = vi.fn();
  const mockToggle = vi.fn();

  const renderForm = (loading = false) =>
    render(
      <LoginForm
        onSubmit={mockSubmit}
        loading={loading}
        onToggleMode={mockToggle}
      />
    );

  it('TC-L01 | Deve renderizar os campos de CPF e Senha', () => {
    renderForm();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('TC-L02 | Deve exibir erro se tentar submeter com campos vazios (Zod)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      // O Zod deve bloquear e mostrar mensagem de erro no DOM
      expect(screen.getByText(/cpf é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha deve ter pelo menos/i)).toBeInTheDocument();
    });

    // onSubmit NÃO deve ter sido chamado
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-L03 | Deve exibir erro de formato de CPF inválido', async () => {
    const user = userEvent.setup();
    renderForm();

    // Digita CPF com formato errado diretamente no input
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');
    await user.type(cpfInput, '123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato de cpf inválido/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-L04 | Deve exibir erro se senha tiver menos de 6 caracteres', async () => {
    const user = userEvent.setup();
    renderForm();

    const senhaInput = screen.getByPlaceholderText(/sua senha/i);
    await user.type(senhaInput, '123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/senha deve ter pelo menos 6/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-L05 | Deve chamar onSubmit com dados corretos (CPF válido + senha OK)', async () => {
    const user = userEvent.setup();
    renderForm();

    // Simula formatação que o próprio handleCPFChange faz
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');
    await user.type(cpfInput, '123.456.789-00'); // Formato aceito pelo Zod
    await user.type(screen.getByPlaceholderText(/sua senha/i), 'minha123');

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: '123.456.789-00', senha: 'minha123' }),
        expect.anything()
      );
    });
  });

  it('TC-L06 | Deve alternar visibilidade da senha ao clicar no ícone', async () => {
    const user = userEvent.setup();
    renderForm();

    const senhaInput = screen.getByPlaceholderText(/sua senha/i);
    expect(senhaInput).toHaveAttribute('type', 'password');

    // Clica no botão de visibilidade (tem "eye" icon, sem texto)
    const toggleBtn = screen.getByRole('button', { name: '' });
    await user.click(toggleBtn);
    expect(senhaInput).toHaveAttribute('type', 'text');

    // Clica de volta para esconder
    await user.click(toggleBtn);
    expect(senhaInput).toHaveAttribute('type', 'password');
  });

  it('TC-L07 | Deve desabilitar botão de Entrar quando loading=true', () => {
    renderForm(true);
    // Quando loading=true, o botão de submit exibe o Loader2 (sem texto) e fica disabled
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find((b) => b.getAttribute('type') === 'submit');
    expect(submitBtn).toBeDisabled();
  });

  it('TC-L08 | Deve chamar onToggleMode ao clicar em "Cadastre-se"', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /cadastre-se/i }));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
