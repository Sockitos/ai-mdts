<script lang="ts">
	import type { Message } from '@/types';
	import SvelteMarkdown from 'svelte-markdown';

	export let message: Message;
</script>

<div
	class:self-end={message.role === 'user'}
	class="flex flex-col gap-y-1"
	class:items-end={message.role === 'user'}
>
	<span class="text-xs font-bold">{message.role.toUpperCase()}</span>
	{#each message.content as contentItem}
		{#if contentItem.type === 'text'}
			<div class="prose prose-sm max-w-[600px]">
				<SvelteMarkdown source={contentItem.text.value} />
			</div>
		{:else}
			<!-- else content here -->
		{/if}
	{/each}
</div>
