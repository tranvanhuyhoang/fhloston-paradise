import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { setAuth, clearAuth } from '../auth/AuthService';

const mockUser = {
    id: 1,
    name: 'Leeloo Dallas',
    email: 'leeloo@fhloston.com',
    picture: 'https://example.com/leeloo.jpg',
};

const LOGIN_PAGE = 'login page'

function renderDashboard(authenticated = true) {
    if (authenticated) {
        setAuth('tok', mockUser);
    }
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/login" element={<div>{LOGIN_PAGE}</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('DashboardPage', () => {
    beforeEach(() => {
        clearAuth();
    });

    describe('authenticated user', () => {
        it('displays the user name', () => {
            renderDashboard();
            expect(screen.getByText(/Leeloo Dallas/)).toBeInTheDocument();
        });

        it('displays the user email', () => {
            renderDashboard();
            expect(screen.getByText(/leeloo@fhloston\.com/)).toBeInTheDocument();
        });

        it('renders the user picture with correct src and alt', () => {
            renderDashboard();
            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('src', mockUser.picture);
            expect(img).toHaveAttribute('alt', mockUser.name);
        });

        it('renders a Logout button', () => {
            renderDashboard();
            expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        });
    });

    describe('logout behavior', () => {
        beforeEach(async () => {
            const user = userEvent.setup();
            renderDashboard();
            await user.click(screen.getByRole('button', { name: /logout/i }));
        });

        it('removes token from localStorage when Logout is clicked', () => {
            expect(localStorage.getItem('token')).toBeNull();
        });

        it('removes user from localStorage when Logout is clicked', () => {
            expect(localStorage.getItem('user')).toBeNull();
        });

        it('redirects to /login after logout', async () => {
            expect(await screen.findByText(LOGIN_PAGE)).toBeInTheDocument();
        });

        it('no longer shows the dashboard content after logout', async () => {
            await screen.findByText(LOGIN_PAGE);
            expect(screen.queryByText(/Leeloo Dallas/)).not.toBeInTheDocument();
        });
    });

    describe('unauthenticated access', () => {
        it('redirects to /login when there is no auth in localStorage', async () => {
            renderDashboard(false);
            expect(await screen.findByText(LOGIN_PAGE)).toBeInTheDocument();
        });
    });
});
