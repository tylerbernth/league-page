<script>
	import NavSmall from './NavSmall.svelte';
	import NavLarge from './NavLarge.svelte';
	import { page } from '$app/state';
	import IconButton from '@smui/icon-button';
	import { Icon } from '@smui/common';

	// Toggle dark mode
	let darkTheme = $state(typeof window === "undefined" || window.matchMedia("(prefers-color-scheme: dark)").matches);
	
	function switchTheme(currentTheme) {
		currentTheme = !currentTheme;
		let themeLink = document.head.querySelector("#theme");
		if (!themeLink) {
			themeLink = document.createElement("link");
			themeLink.rel = "stylesheet";
			themeLink.id = "theme";
		}
		themeLink.href = `/smui${currentTheme ? "" : "-dark"}.css`;
		document.head
			.querySelector('link[href="/smui-dark.css"]')
			.insertAdjacentElement("afterend", themeLink);
	}
</script>

<svelte:head>
	<title>{!page.url.pathname[1] ? 'Home' : page.url.pathname[1].toUpperCase() + page.url.pathname.slice(2)} | League Page</title>
</svelte:head>

<style>
	.nav-header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 100;
		/* Uses SMUI background variable so it automatically shifts between light and dark themes */
		background-color: var(--fff, #ffffff);
		border-bottom: 1px solid var(--eee, rgba(255, 255, 255, 0.1));
		box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
		transition: background-color 0.3s ease, border-color 0.3s ease;
	}

	.nav-container {
		max-width: 1280px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1.25rem;
		position: relative;
	}

	.brand-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		z-index: 2;
	}

	#logo {
		height: 48px;
		width: auto;
		object-fit: contain;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	#logo:hover {
		transform: scale(1.08) rotate(-2deg);
	}

	.actions-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 2;
	}

	:global(.lightDark) {
		color: var(--g555, #888) !important;
		border-radius: 12px !important;
		transition: all 0.2s ease !important;
	}

	:global(.lightDark:hover) {
		color: var(--blueOne, #00316b) !important;
		background: rgba(0, 0, 0, 0.05);
	}

	.large {
		display: block;
	}

	.small {
		display: none;
	}

	@media (max-width: 950px) {
		.large {
			display: none;
		}

		.small {
			display: block;
		}

		.nav-container {
			padding: 0.5rem 0.75rem;
			justify-content: center;
		}

		.actions-container {
			position: absolute;
			right: 0.75rem;
		}
	}
</style>

<header class="nav-header">
	<div class="nav-container">
		<div class="small">
			<NavSmall />
		</div>

		<a href="/" class="brand-link">
			<img id="logo" alt="league logo" src="/badge.png" />
		</a>

		<div class="large">
			<NavLarge />
		</div>

		<div class="actions-container">
			<IconButton
				toggle
				bind:pressed={darkTheme}
				onclick={() => switchTheme(darkTheme)}
				class="lightDark"
			>
				<Icon class="material-icons" on>dark_mode</Icon>
				<Icon class="material-icons">light_mode</Icon>
			</IconButton>
		</div>
	</div>
</header>