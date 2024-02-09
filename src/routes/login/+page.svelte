<script lang="ts">
	import * as Card from '@/components/ui/card';
	import * as Form from '@/components/ui/form';
	import { loginSchema } from '@/schemas';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { superForm, superValidateSync } from 'sveltekit-superforms/client';

	export let data;

	let submitting = false;

	const form = superForm(superValidateSync(loginSchema), {
		SPA: true,
		validators: loginSchema,
		onSubmit: async () => {
			submitting = true;
			await login();
			submitting;
		},
	});

	const { form: formStore } = form;

	const login = async () => {
		const { error } = await data.supabase.auth.signInWithPassword({
			email: $formStore.email,
			password: $formStore.password,
		});

		if (error) {
			toast.error(error.message ?? 'Something went wrong');
		}
	};
</script>

<div class="container flex h-full flex-col items-center justify-center">
	<Card.Root class="w-96">
		<Card.Header>
			<Card.Title>Welcome!</Card.Title>
			<Card.Description>Login to enter AI MDTs</Card.Description>
		</Card.Header>
		<Card.Content>
			<Form.Root method="POST" controlled {form} schema={loginSchema} let:config>
				<Form.Field {config} name="email">
					<Form.Item>
						<Form.Label>Email</Form.Label>
						<Form.Input />
						<Form.Validation />
					</Form.Item>
				</Form.Field>
				<Form.Field {config} name="password">
					<Form.Item>
						<Form.Label>Password</Form.Label>
						<Form.Input type="password" />
						<Form.Validation />
					</Form.Item>
				</Form.Field>
				<Form.Button class="mt-5" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Login
				</Form.Button>
			</Form.Root>
		</Card.Content>
	</Card.Root>
</div>
