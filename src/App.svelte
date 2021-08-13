<script>
    import { onMount } from 'svelte';

    import { load_image } from './utils.js';

    import Welcome from './welcome/Welcome.svelte';
    import Game from './game/Game.svelte';
    import Error from './error/Error.svelte';

    import { useMachine } from '@xstate/svelte';
    import { machine } from './app.machine.js';
    import { log } from './logger.js';

    const { state, send, service } = useMachine(machine);

    log(service);

    $: ({ welcomeActor, gameActor } = $state.context);
    $: ({ errorActor } = $welcomeActor.context);

    $: onMount(() => {
        welcomeActor.send('loadCelebs');
        load_image('/icons/right.svg');
        load_image('/icons/wrong.svg');
    });
</script>

<main>
    {#if $state.matches('welcome') && !$welcomeActor.matches('error')}
        <Welcome actor={welcomeActor} />
    {:else if $state.matches('game')}
        <Game actor={gameActor} />
    {:else if $welcomeActor.matches('error')}
        <Error actor={errorActor} />
    {/if}
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        max-width: 800px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
    }
</style>
