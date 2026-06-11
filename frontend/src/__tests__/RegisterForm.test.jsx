import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================
// MOCKS
// ============================================================
vi.mock('../components/Login.css', () => ({}));

import RegisterForm from '../components/RegisterForm.jsx';

// ============================================================
// SUÍTE: RegisterForm — Validação Zod + React Hook Form
// ============================================================
describe('📝 RegisterForm — Validação de Formulário de Cadastro', () => {

  const mockSubmit = vi.fn();
  const mockToggle = vi.fn();

  const renderForm = () =>
    render(
      <RegisterForm
        onSubmit={mockSubmit}
        loading={false}
        onToggleMode={mockToggle}
      />
    );

  it('TC-R01 | Deve renderizar todos os campos do formulário', () => {
    renderForm();
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
  });

  it('TC-R02 | Deve bloquear submissão com campos obrigatórios vazios (Zod)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 3/i)).toBeInTheDocument();
      expect(screen.getByText(/cpf é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha deve ter pelo menos 6/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-R03 | Deve rejeitar nome com menos de 3 caracteres', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText(/seu nome completo/i), 'AB');
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 3/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-R04 | Deve rejeitar CPF com formato inválido ao submeter', async () => {
    const user = userEvent.setup();
    renderForm();

    // Preenche nome e senha mas deixa o CPF sem o formato correto (sem pontuação)
    await user.type(screen.getByPlaceholderText(/seu nome completo/i), 'Fulano de Tal');
    await user.type(screen.getByPlaceholderText(/crie uma senha/i), 'senha123');
    // Não preenche o CPF — o Zod deve barrar com 'CPF é obrigatório'
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/cpf é obrigatório/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-R05 | Deve rejeitar CNS em formato inválido (dígitos sem espaço)', async () => {
    const user = userEvent.setup();
    renderForm();

    // Preenche todos os campos corretamente exceto o CNS
    await user.type(screen.getByPlaceholderText(/seu nome completo/i), 'Fulano de Tal');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '111.222.333-44');
    await user.type(screen.getByPlaceholderText(/crie uma senha/i), 'senha123');
    // Digita dígitos soltos no CNS sem formatação correta ("898" sem espaços)
    const cnsInput = screen.getByPlaceholderText('000 0000 0000 0000');
    await user.type(cnsInput, '898');
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato de cns inválido/i)).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('TC-R06 | Deve chamar onSubmit com dados válidos (nome + CPF + senha)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText(/seu nome completo/i), 'Paciente Válido');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '111.222.333-44');
    await user.type(screen.getByPlaceholderText(/crie uma senha/i), 'senha123');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Paciente Válido',
          cpf: '111.222.333-44',
          senha: 'senha123',
        }),
        expect.anything()
      );
    });
  });

  it('TC-R07 | Deve aceitar formulário completo incluindo CNS válido', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText(/seu nome completo/i), 'João da Silva');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '987.654.321-00');
    await user.type(screen.getByPlaceholderText('000 0000 0000 0000'), '898 0012 3456 7890');
    await user.type(screen.getByPlaceholderText(/crie uma senha/i), 'senhaSegura99');

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'João da Silva',
          cpf: '987.654.321-00',
          cartao_sus: '898 0012 3456 7890',
          senha: 'senhaSegura99',
        }),
        expect.anything()
      );
    });
  });

  it('TC-R08 | Deve chamar onToggleMode ao clicar em "Faça login"', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /faça login/i }));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
