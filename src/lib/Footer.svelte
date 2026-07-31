<script>
	import { goto } from '$app/navigation';
    import { managers } from '$lib/utils/helper';
	import { tabs } from '$lib/utils/tabs';
	import { onMount } from 'svelte';

	let outOfDate = false;
    let el, footerHeight;
    let innerWidth;

    const resize = (e, delay) => {
        const bottom = el?.getBoundingClientRect().bottom;
        const top = el?.getBoundingClientRect().top;
        if(delay) {
            setTimeout(() => {
                resize(e, false);
            }, 100)
        } else {
            footerHeight = bottom - top;
        }
    }

	onMount(async () => {
		const res = await fetch('/api/checkVersion', {compress: true})
		const needUpdate = await res.json();
		outOfDate = needUpdate;
        resize(el?.getBoundingClientRect(), true);
	})

    let managersOutOfDate = false;
    if(managers) {
        for(const manager of managers) {
            if(manager.roster && !manager.managerID) {
                managersOutOfDate = true;
                resize(el?.getBoundingClientRect(), true);
                break;
            }
        }
    }

	const year = new Date().getFullYear();

    $: resize(el?.getBoundingClientRect(), false, innerWidth);
</script>

<svelte:window bind:innerWidth={innerWidth} />

<div class="footerSpacer" style="height: {footerHeight}px;" />

<!-- Footer with update notice -->
<footer bind:this={el} class="absolute bottom-0 z-10 w-full border-t border-indigo-500/10 bg-gradient-to-b from-[#0a0f1bf8] to-[#13192afc] px-4 py-8 text-slate-300 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-6 md:px-8">
    <div class="mx-auto flex max-w-5xl flex-col items-center gap-6">
        
        <!-- Update Notices Stack -->
        {#if outOfDate || managersOutOfDate}
            <div class="w-full max-w-3xl space-y-3">
                {#if outOfDate}
                    <div class="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-4 text-sm leading-relaxed text-slate-200 shadow-sm backdrop-blur-sm">
                        <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <span>There is an update available for your League Page. </span>
                            <a href="https://github.com/nmelhado/league-page/blob/master/TRAINING_WHEELS.md#iv-updates" target="_blank" rel="noreferrer" class="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                                Follow the Update Instructions
                            </a>
                            <span> to get all of the newest features!</span>
                        </div>
                    </div>
                {/if}

                {#if managersOutOfDate}
                    <div class="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-4 text-sm leading-relaxed text-slate-200 shadow-sm backdrop-blur-sm">
                        <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <span>Your managers page needs an update. </span>
                            <a href="https://github.com/nmelhado/league-page/blob/master/TRAINING_WHEELS.md#2-add-managers" target="_blank" rel="noreferrer" class="font-medium text-amber-400 hover:text-amber-300 hover:underline">
                                Please follow the instructions
                            </a>
                            <span> to get the most up-to-date experience.</span>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Navigation Links Grid/Flex -->
        <nav aria-label="Footer Navigation" class="w-full">
            <ul class="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {#each tabs as tab}
                    {#if !tab.nest}
                        <li>
                            <button 
                                type="button"
                                class="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-white sm:text-sm" 
                                onclick={() => goto(tab.dest)}
                            >
                                {tab.label}
                            </button>
                        </li>
                    {:else}
                        {#each tab.children as child}
                            {#if child.label != "Managers" || managers.length > 0}
                                <li>
                                    <button 
                                        type="button"
                                        class="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-600/20 hover:text-white sm:text-sm" 
                                        onclick={() => goto(child.dest)}
                                    >
                                        {child.label}
                                    </button>
                                </li>
                            {/if}
                        {/each}
                    {/if}
                {/each}
            </ul>
        </nav>

        <!-- Copyright / Subtext Line -->
        <div class="text-center text-xs text-slate-500">
            <span>&copy; {year} Game of Inches</span>
        </div>

    </div>
</footer>