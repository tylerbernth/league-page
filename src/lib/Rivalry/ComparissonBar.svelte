<script>
    export let sideOne, sideTwo, label, unit;
</script>

<div class="my-4 px-2 text-center">
    <h4 class="mx-2.5 my-2.5 text-lg font-medium text-slate-200 sm:text-xl">
        {label}
    </h4>

    <div class="relative mx-auto h-2 w-3/4 rounded-full border border-slate-700 bg-slate-800">
        <div 
            class="absolute top-0 right-1/2 h-2 rounded-l-full bg-indigo-500 transition-all duration-300" 
            style="width: {sideOne / (sideOne + sideTwo) * 50}%"
        ></div>
        <div 
            class="absolute top-0 left-1/2 h-2 rounded-r-full bg-cyan-500 transition-all duration-300" 
            style="width: {sideTwo / (sideOne + sideTwo) * 50}%"
        ></div>
    </div>

    <div class="mx-auto mt-2 flex w-3/4 justify-between text-sm">
        <span class={sideOne > sideTwo ? 'font-extrabold text-indigo-400 underline decoration-indigo-400/60 decoration-2 underline-offset-4' : 'text-slate-400'}>
            {sideOne} {unit}
        </span>
        <span class={sideTwo > sideOne ? 'font-extrabold text-cyan-400 underline decoration-cyan-400/60 decoration-2 underline-offset-4' : 'text-slate-400'}>
            {sideTwo} {unit}
        </span>
    </div>
</div>