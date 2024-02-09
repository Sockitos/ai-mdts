export const ssr = false;

import {
	PUBLIC_OPENAI_API_KEY,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_URL,
} from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';
import OpenAI from 'openai';

export const load = async ({ fetch, depends }) => {
	depends('supabase:auth');

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch,
		},
		cookies: {},
	});

	const {
		data: { session },
	} = await supabase.auth.getSession();

	const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

	return { supabase, session, openai };
};
