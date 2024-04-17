<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import ChatBubble from '@/components/chat-bubble.svelte';
	import LogsDialog from '@/components/logs-dialog.svelte';
	import ModeToggle from '@/components/mode-toggle.svelte';
	import PatientSelector from '@/components/patient-selector.svelte';
	import * as Avatar from '@/components/ui/avatar';
	import { Button } from '@/components/ui/button';
	import { Card } from '@/components/ui/card';
	import { Separator } from '@/components/ui/separator';
	import type { AssistantWithPatient, Message, Patient, UserThread } from '@/types';
	import { Download, Eraser, Loader2, LogOut, Paperclip, SendHorizontal } from 'lucide-svelte';
	import type { FileObject } from 'openai/resources/index.mjs';
	import { queryParam } from 'sveltekit-search-params';

	export let data;

	let patients: Patient[] = [];
	$: restrict = $page.url.searchParams.get('restrict') === 'true' ?? false;
	$: legacy = $page.url.searchParams.get('legacy') === 'true' ?? false;
	const patientId = queryParam('patient');
	let patient: Patient | undefined;
	let previousPatient: Patient | undefined;
	let assistantWithPatient: AssistantWithPatient | undefined;

	let files: FileObject[] = [];
	let threadId: string | undefined;
	let messages: Message[] = [];
	$: reversedMessages = messages.toReversed();
	let userThreads: UserThread[] = data.userThreads;
	let canLoadLastThread: boolean = false;

	$: patients = data.assistants.map((assistant) => assistant.metadata);

	$: if (patientId) {
		patient = patients.find((p) => p.id === $patientId);
	}

	$: assistantWithPatient = data.assistants.find(
		(assistant) => assistant.metadata.id === patient?.id
	);

	$: if (patient?.id !== previousPatient?.id) {
		previousPatient = patient;
		threadId = undefined;
		messages = [];
		insertAuditLog('Patient selected', patient?.id);
		files = data.files.filter((file) => assistantWithPatient?.file_ids.includes(file.id));
		userThreads = data.userThreads.filter(
			(thread) => thread.assistant_id === assistantWithPatient?.id
		);
		canLoadLastThread = userThreads.length > 0;
		if (!canLoadLastThread) {
			createThread();
		}
	}

	$: if (threadId) {
		insertThread();
		readMessages();
	}

	let message = '';
	let running = false;

	const logout = async () => {
		await insertAuditLog('Log Out', undefined);
		data.supabase.auth.signOut();
	};

	const insertThread = async () => {
		await data.supabase.from('threads').upsert({
			user_id: data.user.id,
			thread_id: threadId,
			assistant_id: assistantWithPatient?.id,
		});
	};

	const createThread = async () => {
		const thread = await data.openai.beta.threads.create({});
		await insertAuditLog('Created new thread', thread.id);
		threadId = thread.id;
	};

	const loadLastThread = async () => {
		threadId = userThreads[0].thread_id;
		await insertAuditLog('Load thread', threadId);
	};

	const readMessages = async () => {
		if (threadId) {
			const messagesData = await data.openai.beta.threads.messages.list(threadId);
			messages = messagesData.data;
		}
	};

	const createMessage = async () => {
		if (threadId) {
			const newMessage = message;
			message = '';
			messages = [
				{
					role: 'user',
					content: [{ type: 'text', text: { value: newMessage, annotations: [] } }],
				},
				...messages,
			];
			const receivedMessage = await data.openai.beta.threads.messages.create(threadId, {
				role: 'user',
				content: newMessage,
			});
			await insertAuditLog('Sent Message', threadId + ';' + receivedMessage.id);
		}
	};

	const createAndPollRun = async () => {
		if (threadId && assistantWithPatient) {
			let runIsProcessing = true;
			let run = await data.openai.beta.threads.runs.create(threadId, {
				assistant_id: assistantWithPatient?.id,
			});
			while (runIsProcessing) {
				run = await data.openai.beta.threads.runs.retrieve(threadId, run.id);
				if (run.status === 'completed') {
					runIsProcessing = false;
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
			readMessages();
		}
	};

	const insertAuditLog = async (action: string | undefined, entityId: string | undefined) => {
		await data.supabase.from('audit_log').insert({
			user_id: data.user.id,
			action: action,
			entity_id: entityId,
		});
	};

	const onSelectorClicked = () => {
		insertAuditLog('Click dropdown', undefined);
	};

	const onModeToggleClicked = () => {
		insertAuditLog('Click mode toggle', undefined);
	};

	const downloadFile = async (file: FileObject) => {
		const { data: urlData } = await data.supabase.storage
			.from('files')
			.createSignedUrl(file.filename, 60);
		if (urlData) {
			window.open(urlData.signedUrl, '_blank');
		}
	};

	const handleSubmit = async () => {
		running = true;
		await createMessage();
		await createAndPollRun();
		running = false;
	};
</script>

<div class="flex h-full flex-col">
	<div class="container flex h-16 flex-row items-center justify-between py-4">
		<h1 class="text-xl font-bold">AI MDTs</h1>
		<div class="flex flex-row items-center gap-x-2">
			<ModeToggle on:message={onModeToggleClicked} />
			<Button size="icon" variant="outline" on:click={logout}>
				<LogOut class="h-4 w-4" />
			</Button>
		</div>
	</div>
	<Separator />
	<div class="flex flex-1 flex-row overflow-y-auto">
		<div class="container w-96 py-6">
			{#if patient}
				<div class="flex flex-col gap-y-4">
					<div class="flex flex-col items-center gap-y-4">
						<Avatar.Root class="h-40 w-40">
							<Avatar.Image src="{base}{patient.avatar}" alt="PT" />
							<Avatar.Fallback>PT</Avatar.Fallback>
						</Avatar.Root>
						<PatientSelector {patients} disabled={restrict} bind:value={$patientId} />
					</div>
					<div class="mt-10 flex flex-col gap-y-2">
						<div class="flex flex-row items-center gap-x-2 pb-2">
							<span class="flex-1 font-semibold">FILES</span>
							<Button variant="secondary" size="sm" disabled>
								<Paperclip class="mr-2 h-3 w-3" />
								Add file
							</Button>
						</div>
						{#each files as file}
							<div class="flex flex-row items-center gap-x-2">
								<span class="flex-1 truncate text-sm">{file.filename}</span>
								<Button size="iconsm" variant="outline" on:click={() => downloadFile(file)}>
									<Download class="h-3 w-3" />
								</Button>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-y-4">
					<span class="text-center text-sm text-muted-foreground">
						Please select a patient to start a conversation.
					</span>
					<PatientSelector
						{patients}
						disabled={restrict}
						bind:value={$patientId}
						on:message={onSelectorClicked}
					/>
				</div>
			{/if}
		</div>
		<Separator orientation="vertical" />
		<div class="flex flex-1 flex-col">
			<div class="container flex flex-row items-center gap-x-2 py-4">
				<span class="text-xs font-bold">CONVERSATION</span>
				<span class="flex-1 text-xs text-muted-foreground"
					>{threadId ?? 'Select a patient to start conversation'}</span
				>
				<Button
					variant="secondary"
					on:click={() => {
						messages = [];
						createThread();
					}}
				>
					<Eraser class="mr-2 h-4 w-4" />
					Clear
				</Button>
				<LogsDialog />
			</div>
			{#if threadId}
				<div
					class="mx-auto flex w-full max-w-[1200px] flex-1 flex-col-reverse overflow-y-auto px-6 py-4"
				>
					{#each reversedMessages as message}
						<ChatBubble {message} markdown={!legacy} />
					{/each}
				</div>
				<form method="POST" on:submit|preventDefault={handleSubmit}>
					<div class="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-y-4 px-6 py-5">
						<Card class="flex w-full flex-col gap-y-4 px-5 py-5">
							<textarea
								placeholder="Enter your message..."
								class="resize-none border-none outline-none"
								bind:value={message}
							/>
							<div class="flex flex-row items-center justify-between">
								<Button
									size="icon"
									variant="secondary"
									on:click={() => {
										message = '';
									}}
								>
									<Eraser class="h-4 w-4" />
								</Button>
								<Button disabled={!message || running} type="submit">
									Send
									{#if running}
										<Loader2 class="ml-2 h-4 w-4 animate-spin" />
									{:else}
										<SendHorizontal class="ml-2 h-4 w-4" />
									{/if}
								</Button>
							</div>
						</Card>
						<span class="text-sm text-muted-foreground">
							This conversation is being recorded anonymously.
						</span>
					</div>
				</form>
			{:else if patient && canLoadLastThread}
				<div class="flex flex-1 flex-col items-center justify-center gap-y-4">
					<Button class="" variant="outline" on:click={createThread}>Start Conversation</Button>
					<span class="text-sm text-muted-foreground"> Or continue with </span>
					<Button class="" variant="outline" on:click={loadLastThread}>Last Conversation</Button>
				</div>
				{#if legacy}
					<form method="POST" on:submit|preventDefault={handleSubmit}>
						<div class="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-y-4 px-6 py-5">
							<Card class="flex w-full flex-col gap-y-4 px-5 py-5">
								<textarea
									placeholder="Enter your message..."
									class="resize-none border-none outline-none"
									bind:value={message}
								/>
								<div class="flex flex-row items-center justify-between">
									<Button
										size="icon"
										variant="secondary"
										on:click={() => {
											message = '';
										}}
									>
										<Eraser class="h-4 w-4" />
									</Button>
									<Button disabled={!message || running} type="submit">
										Send
										{#if running}
											<Loader2 class="ml-2 h-4 w-4 animate-spin" />
										{:else}
											<SendHorizontal class="ml-2 h-4 w-4" />
										{/if}
									</Button>
								</div>
							</Card>
							<span class="text-sm text-muted-foreground">
								This conversation is being recorded anonymously.
							</span>
						</div>
					</form>
				{/if}
			{/if}
		</div>
	</div>
</div>
