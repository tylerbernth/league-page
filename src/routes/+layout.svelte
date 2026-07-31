<!-- +layout.svelte -->
<script>
	import { Nav, Footer } from "$lib/components";
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	
	// Import Tailwind's global styles
	import '$lib/app.css';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<!-- Outer wrapper ensures the screen fills 100vh and the footer stays pushed to the bottom -->
<div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
	<!-- Navigation -->
	<Nav />

	<!-- Main Content Area: grows to fill remaining vertical space -->
	<main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<slot />
	</main>

	<!-- Footer -->
	<Footer />
</div>