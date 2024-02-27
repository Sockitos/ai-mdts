import type { AssistantWithPatient, UserThread } from '@/types';
import { redirect } from '@sveltejs/kit';
import type { Assistant } from 'openai/resources/beta/index.mjs';

export const load = async ({ parent }) => {
	const { supabase, session, openai } = await parent();
	if (!session) {
		const basePath = import.meta.env.BASE_URL;
		return redirect(303, `${basePath}login`);
	}

	async function getUserThreads(): Promise<UserThread[]> {
		const { data } = await supabase
			.from('threads')
			.select('*')
			.order('created_at', { ascending: false });
		return data ?? [];
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
		userThreads: await getUserThreads(),
		files: files.data,
		assistants: filteredAssistants,
	};
};
