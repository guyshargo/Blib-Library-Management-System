import React, { createContext, useContext, useState } from 'react';
import type { Member, Librarian } from '../types';

interface AuthContextType {
    currentUser: Member | Librarian | null;
    currentRole: 'member' | 'librarian' | null;
    login: (user: Member | Librarian, role: 'member' | 'librarian') => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Member | Librarian | null>(() => {
        try {
            const saved = localStorage.getItem('currentUser');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [currentRole, setCurrentRole] = useState<'member' | 'librarian' | null>(() => {
        return (localStorage.getItem('currentRole') as 'member' | 'librarian' | null) || null;
    });

    const login = (user: Member | Librarian, role: 'member' | 'librarian') => {
        setCurrentUser(user);
        setCurrentRole(role);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentRole', role);
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentRole(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ currentUser, currentRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
