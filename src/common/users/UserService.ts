import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { UserDAO } from './UserDAO';
import { UserRepository } from './UserRepository';

export class UserService {
    private readonly userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    public async createUser(username: string, password: string, email: string): Promise<UserDAO> {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user: UserDAO = {
            userId: uuidv4(),
            username,
            email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            passwordHash: hashedPassword,
            isActive: true
        };

        await this.userRepository.createUser(user);
        return user;
    }

    public async getUserByUsername(username: string): Promise<UserDAO | null> {
        return this.userRepository.getUserByUsername(username);
    }
}