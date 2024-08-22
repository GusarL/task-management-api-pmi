module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            diagnostics: true,
        }],
    },
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    moduleNameMapper: {
        "^/opt/nodejs/utils/configSecrets$": "<rootDir>/src/lambdas/common/utils/configSecrets",
        "^/opt/nodejs/utils/interfaces$": "<rootDir>/src/lambdas/common/utils/interfaces",
        "^/opt/nodejs/utils/logger$": "<rootDir>/src/lambdas/common/utils/logger",
        "^/opt/nodejs/users/userService$": "<rootDir>/src/lambdas/common/users/userService",
        "^/opt/nodejs/users/userRepository$": "<rootDir>/src/lambdas/common/users/userRepository",
    },
    transformIgnorePatterns: [
        "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs)$"
    ],
    moduleDirectories: [
        "node_modules",
        "src"
    ],
};