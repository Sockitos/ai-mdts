<script lang="ts">
	import * as Card from '@/components/ui/card';
	import * as Form from '@/components/ui/form';
	import { Input } from '@/components/ui/input';
	import { loginSchema } from '@/schemas';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { defaults, superForm } from 'sveltekit-superforms/client';

	export let data;

	let submitting = false;

	const login = async () => {
		submitting = true;
		const { error } = await data.supabase.auth.signInWithPassword({
			email: $formData.email,
			password: $formData.password,
		});

		if (error) {
			toast.error(error.message ?? 'Something went wrong');
			submitting = false;
		}
	};

	const form = superForm(defaults(zod(loginSchema)), {
		SPA: true,
		validators: zodClient(loginSchema),
		resetForm: false,
		onUpdate: ({ form }) => {
			if (form.valid) {
				login();
			}
		},
	});

	const { form: formData, enhance } = form;
</script>

<div class="container flex h-full flex-col items-center justify-center">
	<Card.Root class="w-96">
		<Card.Header>
			<Card.Title>Welcome!</Card.Title>
			<Card.Description>Login to enter AI MDTs</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} bind:value={$formData.email} />
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control let:attrs>
						<Form.Label>Password</Form.Label>
						<Input {...attrs} type="password" bind:value={$formData.password} />
						<Form.FieldErrors />
					</Form.Control>
				</Form.Field>
				<Form.Button class="mt-5" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Login
				</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
