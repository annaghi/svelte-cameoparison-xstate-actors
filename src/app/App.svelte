<script>
    import Welcome from '../welcome/Welcome.svelte';
    import Game from '../game/Game.svelte';

    import { onMount, onDestroy } from 'svelte';

    import { interpret } from 'xstate';

    import { loadImage } from '../utils.js';
    import { log } from '../logger.js';

    import { machine } from './machine.js';

    const service = interpret(machine).start();
    log(service);

    $: ({ welcomeActor, gameActor } = $service.context);

    onMount(() => {
        loadImage('/icons/right.svg');
        loadImage('/icons/wrong.svg');
    });

    onDestroy(() => {
        service.stop();
    });
</script>

<main>
    {#if $service.matches('welcome')}
        <Welcome actor={welcomeActor} />
    {:else if $service.matches('game')}
        <Game actor={gameActor} />
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
