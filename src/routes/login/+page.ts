export const prerender = true;

import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	const { session } = await parent();
	if (session) {
		const basePath = import.meta.env.BASE_URL;
		return redirect(303, `${basePath}`);
	}

	return;
};
