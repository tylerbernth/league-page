<script>
	import { tabs } from '$lib/utils/tabs';
	import Drawer, {
	  Content,
	  Header,
	  Title,
	} from '@smui/drawer';
	import { Icon } from '@smui/tab';
	import List, { Item, Text, Graphic, Separator, Subheader } from '@smui/list';
	import { goto, preloadData } from '$app/navigation';
	import { page } from '$app/state';
	import { leagueName } from '$lib/utils/helper';
	import { enableBlog, managers } from '$lib/utils/leagueInfo';

	let active = $state(page.url.pathname);
	let open = $state(false);

	const selectTab = (tab) => {
		open = false;
		goto(tab.dest);
	}
</script>

<style>
	:global(.menuIcon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.8em !important;
		color: var(--g555, #64748b);
		padding: 8px;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.menuIcon:hover) {
		color: var(--blueOne, #2563eb);
		background: rgba(37, 99, 235, 0.08);
	}

	:global(.nav-drawer) {
		z-index: 120 !important;
		border-top-right-radius: 20px;
		border-bottom-right-radius: 20px;
		overflow: hidden;
	}

	:global(.nav-drawer .mdc-drawer__header) {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		color: #ffffff;
		padding: 24px 20px;
	}

	:global(.drawer-title) {
		font-weight: 700 !important;
		font-size: 1.25rem !important;
		letter-spacing: -0.02em;
		color: #ffffff !important;
	}

	:global(.drawer-item) {
		border-radius: 10px !important;
		margin: 3px 12px !important;
		transition: all 0.15s ease !important;
	}

	:global(.drawer-item.activated) {
		background-color: rgba(37, 99, 235, 0.1) !important;
		color: #2563eb !important;
		font-weight: 600;
	}

	:global(.nav-item) {
		color: #64748b !important;
	}

	.nav-back {
		position: fixed;
		z-index: 110;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		background-color: rgba(15, 23, 42, 0.4);
		backdrop-filter: blur(4px);
		transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>

<Icon class="material-icons menuIcon" onclick={() => open = true} ripple={false} touch={true}>menu</Icon>

<div 
	class="nav-back" 
	style="pointer-events: {open ? 'visible' : 'none'}; opacity: {open ? 1 : 0};" 
	onclick={() => open = false}
></div>

<Drawer variant="modal" class="nav-drawer" fixed={true} bind:open>
	<Header>
		<Title class="drawer-title">{leagueName}</Title>
	</Header>
	<Content>
		<List>
			{#each tabs as tab}
				{#if !tab.nest && (tab.label != 'Blog' || (tab.label == 'Blog' && enableBlog))}
					<Item 
						href="javascript:void(0)" 
						class="drawer-item {active == tab.dest ? 'activated' : ''}"
						onSMUIAction={() => selectTab(tab)} 
						ontouchstart={() => preloadData(tab.dest)} 
						onmouseover={() => preloadData(tab.dest)} 
						activated={active == tab.dest} 
					>
						<Graphic class="material-icons{active == tab.dest ? '' : ' nav-item'}" aria-hidden="true">{tab.icon}</Graphic>
						<Text class="{active == tab.dest ? '' : 'nav-item'}">{tab.label}</Text>
					</Item>
				{/if}
			{/each}
			{#each tabs as tab}
				{#if tab.nest}
					<Separator />
					<Subheader>{tab.label}</Subheader>
					{#each tab.children as subTab}
						{#if subTab.label == 'Managers'}
							{#if managers.length}
								<Item 
									href="javascript:void(0)" 
									class="drawer-item {active == subTab.dest ? 'activated' : ''}"
									onSMUIAction={() => selectTab(subTab)} 
									activated={active == subTab.dest}  
									ontouchstart={() => preloadData(subTab.dest)} 
									onmouseover={() => preloadData(subTab.dest)}
								>
									<Graphic class="material-icons{active == subTab.dest ? '' : ' nav-item'}" aria-hidden="true">{subTab.icon}</Graphic>
									<Text class="{active == subTab.dest ? '' : 'nav-item'}">{subTab.label}</Text>
								</Item>
							{/if}
						{:else}
							<Item 
								href="javascript:void(0)" 
								class="drawer-item {active == subTab.dest ? 'activated' : ''}"
								onSMUIAction={() => selectTab(subTab)} 
								activated={active == subTab.dest}  
								ontouchstart={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}} 
								onmouseover={() => {if(subTab.label != 'Go to Sleeper') preloadData(subTab.dest)}}
							>
								<Graphic class="material-icons{active == subTab.dest ? '' : ' nav-item'}" aria-hidden="true">{subTab.icon}</Graphic>
								<Text class="{active == subTab.dest ? '' : 'nav-item'}">{subTab.label}</Text>
							</Item>
						{/if}
					{/each}
				{/if}
			{/each}
		</List>
	</Content>
</Drawer>