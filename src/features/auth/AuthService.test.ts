import { getAuth, setAuth, clearAuth } from './AuthService';

const mockUser = { id: 1, name: 'Korben Dallas', email: 'korben@fhloston.com', picture: '/images/korben.jpg' };

describe('AuthService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getAuth()', () => {
        it('returns null when localStorage is empty', () => {
            expect(getAuth()).toBeNull();
        });

        it('returns null when only token is present', () => {
            localStorage.setItem('token', 'tok');
            expect(getAuth()).toBeNull();
        });

        it('returns null when only user is present', () => {
            localStorage.setItem('user', JSON.stringify(mockUser));
            expect(getAuth()).toBeNull();
        });

        it('returns { token, user } when both keys are set', () => {
            localStorage.setItem('token', 'tok');
            localStorage.setItem('user', JSON.stringify(mockUser));
            expect(getAuth()).toEqual({ token: 'tok', user: mockUser });
        });
    });

    describe('setAuth()', () => {
        it('writes token to localStorage under the key "token"', () => {
            setAuth('abc123', mockUser);
            expect(localStorage.getItem('token')).toBe('abc123');
        });

        it('writes user as JSON string under the key "user"', () => {
            setAuth('abc123', mockUser);
            expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
        });

        it('after setAuth, getAuth returns the same token and user', () => {
            setAuth('abc123', mockUser);
            expect(getAuth()).toEqual({ token: 'abc123', user: mockUser });
        });
    });

    describe('clearAuth()', () => {
        it('removes token from localStorage', () => {
            setAuth('tok', mockUser);
            clearAuth();
            expect(localStorage.getItem('token')).toBeNull();
        });

        it('removes user from localStorage', () => {
            setAuth('tok', mockUser);
            clearAuth();
            expect(localStorage.getItem('user')).toBeNull();
        });

        it('after clearAuth, getAuth returns null', () => {
            setAuth('tok', mockUser);
            clearAuth();
            expect(getAuth()).toBeNull();
        });

        it('does not throw when called with empty localStorage', () => {
            expect(() => clearAuth()).not.toThrow();
        });
    });
});
