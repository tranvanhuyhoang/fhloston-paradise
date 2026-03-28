import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { setAuth, clearAuth } from './AuthService';

const mockUser = { id: 1, name: 'Korben Dallas', email: 'korben@fhloston.com', picture: '' };

const PROTECTED_CONTENT = 'protected content';
const LOGIN_PAGE = 'login page';

function renderRoute(authenticated: boolean) {
    if (authenticated) {
        setAuth('tok', mockUser);
    }
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div>{PROTECTED_CONTENT}</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>{LOGIN_PAGE}</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        clearAuth();
    });

    it('renders children when the user is authenticated', () => {
        renderRoute(true);
        expect(screen.getByText(PROTECTED_CONTENT)).toBeInTheDocument();
    });

    it('does not render children when the user is unauthenticated', () => {
        renderRoute(false);
        expect(screen.queryByText(PROTECTED_CONTENT)).not.toBeInTheDocument();
    });

    it('redirects to /login when the user is unauthenticated', () => {
        renderRoute(false);
        expect(screen.getByText(LOGIN_PAGE)).toBeInTheDocument();
    });

    it('does not redirect to /login when the user is authenticated', () => {
        renderRoute(true);
        expect(screen.queryByText(LOGIN_PAGE)).not.toBeInTheDocument();
    });
});
