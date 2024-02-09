import type { AssistantWithPatient } from '@/types';
import { redirect } from '@sveltejs/kit';
import type { Assistant } from 'openai/resources/beta/index.mjs';

export const load = async ({ parent }) => {
	const { session, openai } = await parent();
	if (!session) {
		const basePath = import.meta.env.BASE_URL;
		return redirect(303, `${basePath}/login`);
	}

	function instanceOfPatient(assistant: Assistant): assistant is AssistantWithPatient {
		return (assistant as AssistantWithPatient).metadata.id !== undefined;
	}

	const files = await openai.files.list();
	const assistants = await openai.beta.assistants.list();
	const filteredAssistants = assistants.data.filter((assistant) =>
		instanceOfPatient(assistant)
	) as AssistantWithPatient[];

	return {
		user: session.user,
		files: files.data,
		assistants: filteredAssistants,
	};
};
