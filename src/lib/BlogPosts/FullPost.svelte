<script>
	import LinearProgress from '@smui/linear-progress';
    import { generateParagraph, waitForAll } from "$lib/utils/helper";
    import { onMount } from "svelte";
    import Comments from "./Comments.svelte";
	import AuthorAndDate from './AuthorAndDate.svelte';

    export let leagueTeamManagersData, postsData, postID;

    let createdAt, id;

    let safePost = false;
    let loading = true;
    let title, body, type, author;

    let loadingComments = true;
    let total, comments;
    let leagueTeamManagersDataLoaded, postsDataLoaded;

    onMount(async()=> {
        [leagueTeamManagersDataLoaded, postsDataLoaded] = await waitForAll(leagueTeamManagersData, postsData);
        const post = postsDataLoaded.posts.filter(p => p.sys.id === postID)[0];
        id = post.sys.id;

        if(post != null) {
            createdAt = post.sys.createdAt;
            ({title, body, type, author} = post.fields);
            if(!title) {
                console.error('Invalid post: No title provided');
            } else if(!body) {
                console.error(`Invalid post (${title}): No body provided`)
            } else if(!type) {
                console.error(`Invalid post (${title}): No type provided`)
            } else if(!author) {
                console.error(`Invalid post (${title}): No author provided`)
            } else {
                safePost = true;
            }
        }
        loading = false;

        const res = await fetch(`/api/getBlogComments/${id}`, {compress: true});
        const commentsData = await res.json();

        total = commentsData.total;
        comments = [...commentsData.items].sort((a, b) => Date.parse(a.sys.createdAt) - Date.parse(b.sys.createdAt));
        loadingComments = false;
    });
</script>

<style>
    /* Global style overrides to fix Contentful generated HTML layout and alignment */
    :global(.body *) {
        text-align: left !important;
    }

    :global(.body blockquote) {
        border-left: 4px solid var(--blueTwo);
        margin: 1.5rem 0 !important;
        padding: 1rem !important;
        background-color: rgba(79, 70, 229, 0.03);
        border-radius: 4px;
        font-style: italic;
    }

    :global(.body .heading-1) {
        padding: 0.4rem 0;
        font-size: 1.9rem;
        font-weight: 700;
        color: var(--blueOne);
    }

    :global(.body .heading-2) {
        padding: 0.4rem 0;
        font-size: 1.7rem;
        font-weight: 700;
        color: var(--blueOne);
    }

    :global(.body .heading-3), :global(.body .heading-4), :global(.body .heading-5), :global(.body .heading-6) {
        padding: 0.4rem 0;
        font-size: 1.4rem;
        font-weight: 600;
    }

    :global(.body .bodyParagraph) {
        padding: 0.5rem 0 !important;
        margin: 0 0 1rem 0 !important;
    }

    :global(.body ul), :global(.body ol) {
        padding-left: 2rem !important;
        margin: 1rem 0 !important;
    }

    :global(.body li) {
        margin-bottom: 0.4rem;
    }

    :global(.body table) {
        margin: 1.5rem 0 !important;
        width: 100%;
        border: 1px solid var(--ddd);
        border-collapse: collapse;
    }

    :global(.body tr:nth-child(odd)) {
        background-color: rgba(0, 0, 0, 0.02);
    }

    :global(.body td) {
        padding: 0.75rem 1rem !important;
        text-align: center !important;
    }

    :global(.body th) {
        padding: 0.85rem 1rem !important;
        background-color: var(--blueOne);
        color: #fff;
        text-align: center !important;
    }
</style>

{#if loading}
    <div class="flex flex-col items-center justify-center w-[85%] max-w-[500px] mx-auto my-20">
        <p class="mb-4 text-sm font-medium text-gray-400">Loading Blog Post...</p>
        <div class="w-full">
            <LinearProgress indeterminate />
        </div>
    </div>
{:else if safePost}
    <div class="bg-[linear-gradient(135deg,rgba(79,70,229,0.02)_0%,rgba(6,182,212,0.02)_100%)] border border-[var(--eee)] rounded-[12px] text-[var(--g333)] p-6 md:p-10 my-8 mx-auto max-w-4xl shadow-[0_4px_12px_rgba(79,70,229,0.08)]">
        
        <!-- Post Header -->
        <h3 class="text-3xl md:text-4xl font-extrabold text-center text-[var(--blueOne)] m-0 mb-6 tracking-tight">
            {title}
        </h3>

        <!-- Post Body Content -->
        <div class="body space-y-4 text-base md:text-lg leading-relaxed text-[var(--g333)] px-2 md:px-8">
            {#each body.content as paragraph}
                {@html generateParagraph(paragraph)}
            {/each}
        </div>

        <hr class="border-0 w-full h-[1px] bg-[var(--ddd)] my-8" />

        <!-- Metadata & Comments Section -->
        <div class="flex flex-col gap-4 px-2 md:px-8">
            <AuthorAndDate {type} leagueTeamManagers={leagueTeamManagersDataLoaded} {author} {createdAt} />

            {#if !loadingComments}
                <hr class="border-0 w-full h-[1px] bg-[var(--ddd)] my-4" />
                <Comments leagueTeamManagers={leagueTeamManagersDataLoaded} {comments} {total} postID={id} />
            {/if}
        </div>

    </div>
{/if}