import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { setAuth, clearAuth } from './AuthService';

const mockUser = { id: 1, name: 'Korben Dallas', email: 'korben@fhloston.com', picture: '/images/korben.jpg' };
const mockToken = 'jwt.token.here';
const VALID_PASSWORD = 'multipass';
const INVALID_PASSWORD = 'wrongpassword';

const PAGE_TITLE = 'Authenticate';
const DASHBOARD_STUB = 'dashboard';
const ERR_INVALID_EMAIL = 'Please enter a valid email';
const ERR_SHORT_PASSWORD = 'Password must be at least 6 characters';
const ERR_INVALID_CREDENTIALS = 'Invalid credentials';

const fetchMock = vi.fn();

beforeAll(() => {
    globalThis.fetch = fetchMock;
});

afterAll(() => {
    vi.restoreAllMocks();
});

function renderLoginPage(initialRoute = '/login') {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<div>{DASHBOARD_STUB}</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        clearAuth();
        fetchMock.mockReset();
    });

    describe('redirect when already authenticated', () => {
        it('redirects to / when the user already has a session', () => {
            setAuth(mockToken, mockUser);
            renderLoginPage('/login');
            expect(screen.queryByText(PAGE_TITLE)).not.toBeInTheDocument();
            expect(screen.getByText(DASHBOARD_STUB)).toBeInTheDocument();
        });
    });

    describe('initial render', () => {
        it('shows the page title "Authenticate"', () => {
            renderLoginPage();
            expect(screen.getByText(PAGE_TITLE)).toBeInTheDocument();
        });

        it('renders an email input', () => {
            renderLoginPage();
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
        });

        it('renders a password input of type password', () => {
            renderLoginPage();
            const input = screen.getByLabelText('Password') as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input.type).toBe('password');
        });

        it('renders a submit button with text "Login"', () => {
            renderLoginPage();
            expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
        });

        it('does not show any error messages on initial render', () => {
            renderLoginPage();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('client-side validation', () => {
        it('shows an email validation error when email is empty on submit', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await user.click(screen.getByRole('button', { name: /login/i }));
            expect(await screen.findByText(ERR_INVALID_EMAIL)).toBeInTheDocument();
        });

        it('shows an email validation error when email format is invalid', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), 'not-an-email');
            await user.click(screen.getByRole('button', { name: /login/i }));
            expect(await screen.findByText(ERR_INVALID_EMAIL)).toBeInTheDocument();
        });

        it('shows a password validation error when password is empty on submit', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), 'valid@email.com');
            await user.click(screen.getByRole('button', { name: /login/i }));
            expect(await screen.findByText(ERR_SHORT_PASSWORD)).toBeInTheDocument();
        });

        it('shows a password validation error when password is fewer than 6 characters', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), 'valid@email.com');
            await user.type(screen.getByLabelText('Password'), 'abc');
            await user.click(screen.getByRole('button', { name: /login/i }));
            expect(await screen.findByText(ERR_SHORT_PASSWORD)).toBeInTheDocument();
        });

        it('does not call fetch when validation fails', async () => {
            const user = userEvent.setup();
            renderLoginPage();
            await user.click(screen.getByRole('button', { name: /login/i }));
            await screen.findByText(ERR_INVALID_EMAIL);
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe('successful login', () => {
        beforeEach(async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: mockToken, user: mockUser }),
            });
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));
        });

        it('calls fetch with the correct URL and payload', async () => {
            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: mockUser.email, password: VALID_PASSWORD }),
                });
            });
        });

        it('stores token in localStorage after successful login', async () => {
            await waitFor(() => {
                expect(localStorage.getItem('token')).toBe(mockToken);
            });
        });

        it('stores user JSON in localStorage after successful login', async () => {
            await waitFor(() => {
                expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
            });
        });

        it('redirects to / after successful login', async () => {
            expect(await screen.findByText(DASHBOARD_STUB)).toBeInTheDocument();
            expect(screen.queryByText(PAGE_TITLE)).not.toBeInTheDocument();
        });
    });

    describe('failed login (API error)', () => {
        it('shows the error message from the API on a failed response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: ERR_INVALID_CREDENTIALS }),
            });
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), INVALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText(ERR_INVALID_CREDENTIALS)).toBeInTheDocument();
        });

        it('shows the error message when fetch rejects (network error)', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network failure'));
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('Network failure')).toBeInTheDocument();
        });

        it('shows "Something went wrong" when the error is not an Error instance', async () => {
            fetchMock.mockRejectedValueOnce('raw string error');
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
        });

        it('does not redirect to / after a failed login', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: ERR_INVALID_CREDENTIALS }),
            });
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), INVALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));

            await screen.findByText(ERR_INVALID_CREDENTIALS);
            expect(screen.queryByText(DASHBOARD_STUB)).not.toBeInTheDocument();
            expect(screen.getByText(PAGE_TITLE)).toBeInTheDocument();
        });

        it('does not write to localStorage after a failed login', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: ERR_INVALID_CREDENTIALS }),
            });
            const user = userEvent.setup();
            renderLoginPage();
            await user.type(screen.getByLabelText('Email'), mockUser.email);
            await user.type(screen.getByLabelText('Password'), INVALID_PASSWORD);
            await user.click(screen.getByRole('button', { name: /login/i }));

            await screen.findByText(ERR_INVALID_CREDENTIALS);
            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });
    });
});
