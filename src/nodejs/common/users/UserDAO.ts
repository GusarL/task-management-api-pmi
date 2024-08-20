export interface UserDAO {
    userId: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    passwordHash: string;
    isActive: boolean;
}