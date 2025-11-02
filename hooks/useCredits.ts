import { useState, useEffect, useCallback } from 'react';
import { useUserManagement } from './useUserManagement';

// This hook manages the credits for the "currently logged-in" user.
export const useCredits = () => {
    const { users, updateUserCredits, loading: usersLoading } = useUserManagement();
    const [currentUser, setCurrentUser] = useState(users[0]);
    const [credits, setCredits] = useState<number>(0);

    useEffect(() => {
        if (!usersLoading && users.length > 0) {
            const user = users[0]; // Assume first user is the logged-in one
            setCurrentUser(user);
            setCredits(user.credits);
        }
    }, [users, usersLoading]);

    const deductCredits = useCallback((amount: number) => {
        if (currentUser && credits >= amount) {
            const newCredits = credits - amount;
            updateUserCredits(currentUser.id, newCredits);
            setCredits(newCredits);
            return true;
        }
        return false;
    }, [credits, currentUser, updateUserCredits]);
    
    // This would typically be done by an admin or after a purchase
    const addCredits = useCallback((amount: number) => {
        if (currentUser) {
            const newCredits = credits + amount;
            updateUserCredits(currentUser.id, newCredits);
            setCredits(newCredits);
        }
    }, [credits, currentUser, updateUserCredits]);

    return { credits, deductCredits, addCredits, isLoading: usersLoading };
};
