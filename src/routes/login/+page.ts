export const prerender = true;

import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	const { session } = await parent();
	if (session) {
		return redirect(303, '/');
	}

	return;
};
