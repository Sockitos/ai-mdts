<script lang="ts">
	import LogsDialog from '@/components/logs-dialog.svelte';
	import ModeToggle from '@/components/mode-toggle.svelte';
	import PatientSelector from '@/components/patient-selector.svelte';
	import * as Avatar from '@/components/ui/avatar';
	import { Button } from '@/components/ui/button';
	import { Card } from '@/components/ui/card';
	import { Separator } from '@/components/ui/separator';
	import type { AssistantWithPatient, Message, Patient } from '@/types';
	import { Download, Eraser, Loader2, LogOut, Paperclip, SendHorizontal } from 'lucide-svelte';
	import type { Thread } from 'openai/resources/beta/index.mjs';
	import type { FileObject } from 'openai/resources/index.mjs';

	export let data;

	let patients: Patient[] = [];
	let patient: Patient | undefined;
	let assistantWithPatient: AssistantWithPatient | undefined;
	let files: FileObject[] = [];
	let thread: Thread | undefined;
	let messages: Message[] = [];

	$: patients = data.assistants.map((assistant) => assistant.metadata);

	$: assistantWithPatient = data.assistants.find(
		(assistant) => assistant.metadata.id === patient?.id
	);

	$: if (patient) {
		readFiles();
		createThread();
	}

	$: if (thread) {
		readMessages();
	}

	$: reversedMessages = messages.toReversed();
	let message = '';
	let running = false;

	const logout = () => {
		data.supabase.auth.signOut();
	};

	const readFiles = async () => {
		if (patient) {
			files = data.files.filter((file) => assistantWithPatient?.file_ids.includes(file.id));
		}
	};

	const createThread = async () => {
		thread = await data.openai.beta.threads.retrieve('thread_1zicz16ftyUhkIfv5rGbJ4cy');
		// thread = await data.openai.beta.threads.create({});
	};

	const readMessages = async () => {
		if (thread) {
			const messagesData = await data.openai.beta.threads.messages.list(thread.id);
			messages = messagesData.data;
		}
	};

	const createMessage = async () => {
		if (thread) {
			const newMessage = message;
			message = '';
			messages = [
				{
					role: 'user',
					content: [{ type: 'text', text: { value: newMessage, annotations: [] } }],
				},
				...messages,
			];
			await data.openai.beta.threads.messages.create(thread.id, {
				role: 'user',
				content: newMessage,
			});
		}
	};

	const createAndPollRun = async () => {
		if (thread && assistantWithPatient) {
			let runIsProcessing = true;
			let run = await data.openai.beta.threads.runs.create(thread.id, {
				assistant_id: assistantWithPatient?.id,
			});
			while (runIsProcessing) {
				run = await data.openai.beta.threads.runs.retrieve(thread.id, run.id);
				if (run.status === 'completed') {
					runIsProcessing = false;
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
			readMessages();
		}
	};
</script>

<div class="flex h-full flex-col">
	<div class="container flex h-16 flex-row items-center justify-between py-4">
		<h1 class="text-xl font-bold">AI MDTs</h1>
		<div class="flex flex-row items-center gap-x-2">
			<ModeToggle />
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
							<Avatar.Image src={patient.avatar} alt="PT" />
							<Avatar.Fallback>PT</Avatar.Fallback>
						</Avatar.Root>
						<PatientSelector {patients} bind:value={patient} />
					</div>
					<div class="mt-10 flex flex-col gap-y-2">
						<div class="flex flex-row items-center gap-x-2 pb-2">
							<span class="flex-1 font-semibold">FILES</span>
							<Button variant="secondary" size="sm">
								<Paperclip class="mr-2 h-3 w-3" />
								Add file
							</Button>
						</div>
						{#each files as file}
							<div class="flex flex-row items-center gap-x-2">
								<span class="flex-1 truncate text-sm">{file.filename}</span>
								<Button size="iconsm" variant="outline">
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
					<PatientSelector {patients} bind:value={patient} />
				</div>
			{/if}
		</div>
		<Separator orientation="vertical" />
		<div class="flex flex-1 flex-col">
			<div class="container flex flex-row items-center gap-x-2 py-4">
				<span class="text-xs font-bold">CONVERSATION</span>
				<span class="flex-1 text-xs text-muted-foreground"
					>{thread?.id ?? 'Select a patient to start conversation'}</span
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
			<div
				class="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-y-4 overflow-y-auto px-6 py-4"
			>
				{#each reversedMessages as message}
					<div
						class:self-end={message.role === 'user'}
						class="flex flex-col gap-y-1"
						class:items-end={message.role === 'user'}
					>
						<span class="text-xs font-bold">{message.role.toUpperCase()}</span>
						{#each message.content as contentItem}
							{#if contentItem.type === 'text'}
								<p class="max-w-[400px] text-sm">{contentItem.text.value}</p>
							{:else}
								<!-- else content here -->
							{/if}
						{/each}
					</div>
				{/each}
			</div>
			<div class="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-y-4 px-6 py-5">
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
						<Button
							disabled={!message || running}
							on:click={async () => {
								running = true;
								await createMessage();
								await createAndPollRun();
								running = false;
							}}
						>
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
		</div>
	</div>
</div>
