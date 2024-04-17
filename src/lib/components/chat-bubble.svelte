<script lang="ts">
	import type { Message } from '@/types';
	import SvelteMarkdown from 'svelte-markdown';

	export let message: Message;
	export let markdown: boolean = true;
</script>

<div
	class:self-end={message.role === 'user'}
	class="flex flex-col gap-y-1"
	class:items-end={message.role === 'user'}
>
	<span class="text-xs font-bold">{message.role.toUpperCase()}</span>
	{#each message.content as contentItem}
		{#if contentItem.type === 'text'}
			{#if markdown}
				<div class="prose-sm prose-neutral max-w-[600px] dark:prose-invert">
					<SvelteMarkdown source={contentItem.text.value} />
				</div>
			{:else}
				<p class="max-w-[400px] text-sm">{contentItem.text.value}</p>
			{/if}
		{:else}
			<!-- else content here -->
		{/if}
	{/each}
</div>
