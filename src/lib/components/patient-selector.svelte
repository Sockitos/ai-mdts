<script lang="ts">
	import type { Patient } from '@/types';
	import { cn } from '@/utils';
	import { CaretSort, Check } from 'radix-icons-svelte';
	import { tick } from 'svelte';
	import { Button } from './ui/button';
	import * as Command from './ui/command';
	import * as Popover from './ui/popover';
	import { createEventDispatcher } from 'svelte';

	export let patients: Patient[];
	export let value: Patient | undefined;

	const dispatch = createEventDispatcher();

	let open = false;

	$: selectedValue = patients.find((p) => p.id === value?.id)?.name ?? 'Load a patient...';

	function onClick() {
		dispatch('message');
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class="md:max-w-[200px] lg:max-w-[300px]"
			on:click={onClick}
		>
			{selectedValue}
			<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-full p-0 md:w-[200px] lg:w-[300px]">
		<Command.Root>
			<Command.Input placeholder="Search patients..." />
			<Command.List>
				<Command.Empty>No patients found.</Command.Empty>
				{#each patients as patient}
					<Command.Item
						value={patient.name}
						class="aria-selected:bg-primary aria-selected:text-primary-foreground"
						onSelect={() => {
							value = patient;
							closeAndFocusTrigger(ids.trigger);
						}}
					>
						{patient.name}
						<Check
							class={cn('ml-auto h-4 w-4', value?.id === patient.id ? 'opacity-100' : 'opacity-0')}
						/>
					</Command.Item>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
