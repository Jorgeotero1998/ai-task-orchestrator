export interface User {
    username: string;
    token: string;
}

export interface AIResponse {
    answer: string;
    error?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
