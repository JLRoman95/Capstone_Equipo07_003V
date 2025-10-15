import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

describe('Login component', () => {
  test('envía credenciales y llama onSuccess', async () => {
    const mockOnLogin = jest.fn().mockResolvedValue({ token: 't' });
    const mockOnSuccess = jest.fn();

    const { container } = render(React.createElement(Login, { onLogin: mockOnLogin, onSuccess: mockOnSuccess }));

    // selectores robustos con varios fallbacks
    const emailInput =
      screen.queryByPlaceholderText(/correo|email|ejemplo|user/i) ||
      container.querySelector('input[type="email"]') ||
      container.querySelector('input');

    const passwordInput =
      screen.queryByPlaceholderText(/contraseñ|password|pass/i) ||
      container.querySelector('input[type="password"]');

    const submitButton =
      screen.queryByRole('button', { name: /iniciar sesión|ingresar|entrar|login/i }) ||
      container.querySelector('button') ||
      screen.getByRole('button');

    if (!emailInput || !passwordInput || !submitButton) {
      // ayuda al debug si los selectores no coinciden con el componente real
      const html = container.innerHTML;
      throw new Error(`No se encontraron campos en el Login.\nHTML renderizado:\n${html}`);
    }

    const user = userEvent.setup();
    await user.type(emailInput, 'test@ejemplo.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // espera a que onLogin haya sido llamado y comprobar argumentos
    await waitFor(() => expect(mockOnLogin).toHaveBeenCalled());

    // comprobar que se llamó con las credenciales correctas
    const callArgs = mockOnLogin.mock.calls[0] || [];
    expect(callArgs[0]).toBe('test@ejemplo.com');
    expect(callArgs[1]).toBe('password123');

    // onSuccess debe haberse ejecutado después de resolver el login
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });
});