import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, RolePermissions, Role } from '../types';
import { MOCK_CREDENTIALS } from '../data/mockUsers';
import { getDefaultPermissions } from './permissions';

interface PermissionsContextType {
  users: User[];
  updateUserPermissions: (userId: string, permissions: RolePermissions) => void;
  createUser: (data: Omit<User, 'id' | 'permissions' | 'createdAt'> & { createdAt?: Date }) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const STORAGE_KEY = 'vacci360_users';

function initializeUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((u: any) => ({
        ...u,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      }));
    }
  } catch (err) {
    console.error('Failed to load users from localStorage:', err);
  }

  // Initialize from mockUsers if localStorage is empty
  const mockUsers: User[] = MOCK_CREDENTIALS.map((cred) => ({
    ...cred.user,
    lastLoginAt: cred.user.lastLoginAt ? new Date(cred.user.lastLoginAt) : null,
    createdAt: cred.user.createdAt ? new Date(cred.user.createdAt) : new Date(),
    permissions: cred.user.permissions || getDefaultPermissions(cred.user.role),
  }));

  // Persist to localStorage
  persistUsers(mockUsers);
  return mockUsers;
}

function persistUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to localStorage:', err);
  }
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize users on mount
  useEffect(() => {
    const initialUsers = initializeUsers();
    setUsers(initialUsers);
    setIsLoaded(true);
  }, []);

  const updateUserPermissions = (userId: string, permissions: RolePermissions) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, permissions } : u
      );
      persistUsers(updated);
      return updated;
    });
  };

  const createUser = (data: Omit<User, 'id' | 'permissions' | 'createdAt'> & { createdAt?: Date }): User => {
    const newUser: User = {
      ...data,
      id: `u${Date.now()}`,
      permissions: getDefaultPermissions(data.role),
      createdAt: data.createdAt || new Date(),
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      persistUsers(updated);
      return updated;
    });

    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, ...updates } : u
      );
      persistUsers(updated);
      return updated;
    });
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      persistUsers(updated);
      return updated;
    });
  };

  return (
    <PermissionsContext.Provider
      value={{
        users,
        updateUserPermissions,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
