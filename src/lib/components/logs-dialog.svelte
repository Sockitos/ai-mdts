<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Download, Eraser, History } from 'lucide-svelte';
	import { Card } from './ui/card';

	let logs = [
		{
			id: 1,
			timestamp: '2022-01-01T00:00:00Z',
			from: 'USER',
			text: 'This is a message.',
		},
		{
			id: 2,
			timestamp: '2022-01-01T00:00:00Z',
			from: 'ASSITANT',
			text: 'This is another message.',
		},
		{
			id: 3,
			timestamp: '2022-01-01T00:00:00Z',
			from: 'USER',
			text: 'This is yet another message.',
		},
		{
			id: 4,
			timestamp: '2022-01-01T00:00:00Z',
			from: 'ASSITANT',
			text: 'This is the last message.',
		},
	];
</script>

<Dialog.Root>
	<Dialog.Trigger asChild let:builder>
		<Button variant="secondary" builders={[builder]}>
			Logs
			<History class="ml-2 h-4 w-4" />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[625px]">
		<Dialog.Header>
			<Dialog.Title>Logs</Dialog.Title>
			<Dialog.Description>You can check the logs of the AI MDTs here.</Dialog.Description>
		</Dialog.Header>
		<Card class="min-h-80 w-full overflow-y-auto">
			<div class="flex h-full flex-1 flex-col gap-y-4 px-5 py-4">
				{#each logs as log}
					<div
						class:self-end={log.from === 'USER'}
						class="flex flex-col gap-y-1"
						class:items-end={log.from === 'USER'}
					>
						<span class="text-xs font-semibold">{log.from}</span>
						<p class="text-sm">{log.text}</p>
					</div>
				{/each}
			</div>
		</Card>
		<div class="flex flex-row items-center justify-between">
			<Button variant="secondary">
				<Eraser class="mr-2 h-4 w-4" />
				Clear logs
			</Button>
			<Button>
				Download logs
				<Download class="ml-2 h-4 w-4" />
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
