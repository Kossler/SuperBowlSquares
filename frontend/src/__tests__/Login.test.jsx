import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';

test('renders login form and submits', () => {
  render(<Login />);
  const usernameInput = screen.getByLabelText(/username/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /login/i });

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass' } });
  fireEvent.click(submitButton);

  expect(submitButton).toBeDisabled(); // Example: button disables on submit
});
