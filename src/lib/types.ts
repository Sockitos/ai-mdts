import type { Assistant } from 'openai/resources/beta/index.js';
import type {
	MessageContentImageFile,
	MessageContentText,
} from 'openai/src/resources/beta/threads/index.js';

export type Patient = {
	id: string;
	avatar: string;
	name: string;
};

export type Message = {
	role: 'user' | 'assistant';
	content: Array<MessageContentImageFile | MessageContentText>;
};

export type AssistantWithPatient = Assistant & { metadata: Patient };
