<script>
	import { tabs } from '$lib/utils/tabs';
	import Tab, { Icon, Label } from '@smui/tab';
	import List, { Item, Graphic, Text, Separator } from '@smui/list';
	import TabBar from '@smui/tab-bar';
    import { page } from '$app/state';
	import { goto, preloadData } from '$app/navigation';
	import { enableBlog, managers } from '$lib/utils/leagueInfo';

	let active = $state(tabs.find(tab => tab.dest == page.url.pathname || (tab.nest && tab.children.find(subTab => subTab.dest == page.url.pathname))));


	let display = $state(false);
	let width = $state(0);
	let height = $state(0);
	let left = $state(0);
	let top = $state(0);

	let innerWidth = $state();

	const open = (arg) => {
		// close when explicitly passed false
		if (arg === false) {
			display = false;
			return;
		}
		// if a tab key is provided, compute position and open
		if (typeof arg === 'string') {
			const tabKey = arg;
			const el = document.querySelector(`[data-tab-key="${tabKey}"]`);
			if (el) {
				let rect = el.getBoundingClientRect();
				// prefer the actual Tab element if available (SMUI renders .mdc-tab or role="tab")
				const childTab = el.querySelector('.mdc-tab, [role="tab"], .smui-tab');
				if (childTab) {
					rect = childTab.getBoundingClientRect();
				}
				const minWidth = 160;
				const desiredWidth = Math.max(rect.width, minWidth);
				// position relative to the nearest .parent container (absolute positioning)
				const container = el.closest('.parent');
				if (container) {
					const containerRect = container.getBoundingClientRect();
					let computedLeft = rect.left + rect.width / 2 - desiredWidth / 2 - containerRect.left;
					// clamp within container with 8px padding
					computedLeft = Math.max(8, Math.min(computedLeft, containerRect.width - desiredWidth - 8));
					width = desiredWidth;
					height = rect.bottom - rect.top + 1;
					top = rect.bottom - containerRect.top + 6;
					left = computedLeft;
				} else {
					// fallback to viewport-based positioning
					let computedLeft = rect.left + window.scrollX + rect.width / 2 - desiredWidth / 2;
					computedLeft = Math.max(8, Math.min(computedLeft, window.innerWidth - desiredWidth - 8));
					width = desiredWidth;
					height = rect.bottom - rect.top + 1;
					top = rect.bottom + window.scrollY + 6;
					left = computedLeft;
				}
				display = true;
				return;
			}
		}

		// fallback toggle
		display = !display;
	}

	const subGoto = (dest) => {
		open(false);
		goto(dest);
	}

	let tabChildren = $state([]);

	for(const tab of tabs) {
		if(tab.nest) {
			tabChildren = tab.children;
		}
	}

</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    :global(.navBar) {
		display: inline-flex;
		position: relative;
    	justify-content: center;
    }

	:global(.navBar .material-icons) {
		font-size: 1.8em;
		height: 25px;
		width: 22px;
	}

	.parent {
		position: relative;
	}

	.subMenu {
		overflow-y: hidden;
		display: block;
		position: absolute;
		z-index: 5;
		background-color: var(--fff);
		transition: all 0.4s;
	}

	.overlay {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		height: 100vh;
		z-index: 4;
	}

	:global(.mdc-deprecated-list) {
		padding: 0;
	}

	:global(.subText) {
		font-size: 0.8em;
	}

	:global(.dontDisplay) {
		display: none;
	}
</style>

<div tabindex="0" role="button" class="overlay" style="display: {display ? "block" : "none"};" onclick={() => open(false)}></div>

<div class="parent">
	<TabBar class="navBar" {tabs} key={(tab) => tab.key} bind:active>
		{#snippet tab(tab)}
				{#if tab.nest}
					<div data-tab-key={tab.key}>
						<Tab
							{tab}
							minWidth
							onclick={() => open(tab.key)}
						>
							<Icon class="material-icons">{tab.icon}</Icon>
							<Label>{tab.label}</Label>
						</Tab>
					</div>
			{:else}
				<Tab
					class="{tab.label == 'Blog' && !enableBlog ? 'dontDisplay' : ''}"
					{tab}
					onTouchstart={() => preloadData(tab.dest)}
					onMouseover={() => preloadData(tab.dest)}
					href={tab.dest}
					minWidth
				>
					<Icon class="material-icons">{tab.icon}</Icon>
					<Label>{tab.label}</Label>
				</Tab>
			{/if}
		{/snippet}
	</TabBar>
	<div class="subMenu" style="max-height: {display ? 49 * tabChildren.length - 1 - (managers.length ? 0 : 48) : 0}px; width: {width}px; top: {top}px; left: {left}px; box-shadow: 0 0 {display ? "3px" : "0"} 0 #00316b; border: {display ? "1px" : "0"} solid #00316b; border-top: none;">
		<List>
			{#each tabChildren as subTab, ix}
				{#if subTab.label == 'Managers'}
					<Item class="{managers.length ? '' : 'dontDisplay'}" onSMUIAction={() => subGoto(subTab.dest)} ontouchstart={() => preloadData(subTab.dest)} onmouseover={() => preloadData(subTab.dest)}>
						<Graphic class="material-icons">{subTab.icon}</Graphic>
						<Text class="subText">{subTab.label}</Text>
					</Item>
					{#if ix != tabChildren.length - 1}
						<Separator />
					{/if}
				{:else}
					<Item onSMUIAction={() => subGoto(subTab.dest)} ontouchstart={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}} onmouseover={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}}>
						<Graphic class="material-icons">{subTab.icon}</Graphic>
						<Text class="subText">{subTab.label}</Text>
					</Item>
					{#if ix != tabChildren.length - 1}
						<Separator />
					{/if}
				{/if}
			{/each}
		</List>
	</div>
</div>
