import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

const USERS_STORAGE_KEY = 'podcast_studio_users';

const initialUsers: User[] = [
    { id: 'user-1', email: 'demo_user@example.com', name: 'Demo User', credits: 150, role: 'User' },
    { id: 'user-2', email: 'jane.doe@example.com', name: 'Jane Doe', credits: 500, role: 'User' },
    { id: 'user-3', email: 'john.smith@example.com', name: 'John Smith', credits: 25, role: 'User' },
];

export const useUserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
                setUsers(initialUsers);
            }
        } catch (error) {
            console.error("Failed to access localStorage for users:", error);
            setUsers(initialUsers);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserCredits = useCallback((userId: string, newCreditAmount: number) => {
        setUsers(prevUsers => {
            const updatedUsers = prevUsers.map(user =>
                user.id === userId ? { ...user, credits: newCreditAmount } : user
            );
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
            return updatedUsers;
        });
    }, []);

    return { users, loading, updateUserCredits };
};
