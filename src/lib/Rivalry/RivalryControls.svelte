<script>
	import IconButton from '@smui/icon-button';

    export let year, displayWeek, selected, length;

    const nav = (dir) => {
        if(dir === "left") {
            if(selected > 0) {
                selected--;
            } else {
                selected = length - 1;
            }
        } else {
            if(selected < length - 1) {
                selected++;
            } else {
                selected = 0;
            }
        }
    }
</script>

<div class="flex items-center justify-center py-2">
    {#if length > 0}
        <IconButton class="material-icons text-slate-300 hover:text-white" onclick={() => nav("left")}>chevron_left</IconButton>
    {/if}
    <h4 class="mx-5 my-2.5 text-center text-xl font-light tracking-wide text-slate-200 sm:text-2xl">
        {year} Week {displayWeek}
    </h4>
    {#if length > 0}
        <IconButton class="material-icons text-slate-300 hover:text-white" onclick={() => nav("right")}>chevron_right</IconButton>
    {/if}
</div>