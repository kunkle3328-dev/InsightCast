import { useState, useEffect } from 'react';
import { useUserManagement } from './useUserManagement';
import { User } from '../types';

// This hook gets the "currently logged in" user's data.
// In a real app, this would be based on an auth token.
// Here, we'll just grab the first user from our mock user list.
export const useUserData = () => {
    const { users, loading: usersLoading } = useUserManagement();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!usersLoading && users.length > 0) {
            setUser(users[0]); // Simulate logged-in user is the first one
            setLoading(false);
        }
    }, [users, usersLoading]);

    return { user, loading };
};
