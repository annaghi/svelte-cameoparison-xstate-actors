<script>
    import { fly, crossfade, scale } from 'svelte/transition';
    import * as eases from 'svelte/easing';

    import Card from './Card.svelte';

    import { pick_random } from '../utils.js';

    export let actor = null;
    const { send } = actor;

    $: ({ rounds, currentRoundIndex, results, currentResult } = $actor.context);

    $: [a, b] = rounds[currentRoundIndex];
    $: score = results.filter((x) => x === 'right').length;

    const pickMessage = (p) => {
        if (p <= 0.2) {
            return pick_random([`Oof.`, `Better luck next time?`]);
        }
        if (p <= 0.5) {
            return pick_random([`I've seen worse`, `Keep trying!`]);
        }
        if (p <= 0.8) {
            return pick_random([`Yeah!`, `Not bad. Practice makes perfect`]);
        }
        if (p < 1) {
            return pick_random([`Impressive.`]);
        }
        return pick_random([`Flawless victory`, `Top marks`]);
    };

    const [sendFade, receiveFade] = crossfade({
        easing: eases.cubicOut,
        duration: 300
    });
</script>

{#if !$actor.matches('over')}
    <header>
        <p>Tap on the more monetisable celebrity's face, or tap 'same price' if society values them equally.</p>
    </header>
{/if}

<div class="game-container">
    {#if !$actor.matches('over')}
        {#key a.id || b.id}
            <div in:fly={{ duration: 300, y: 20 }} out:fly={{ duration: 300, y: -20 }} class="game">
                <div class="card-container">
                    <Card
                        celeb={a}
                        showprice={$actor.matches('result')}
                        winner={a.price >= b.price}
                        on:select={() => send({ type: 'answer', a, b, sign: 1 })}
                    />
                </div>

                <div>
                    <button class="same" on:click={() => send({ type: 'answer', a, b, sign: 0 })}>same price</button>
                </div>

                <div class="card-container">
                    <Card
                        celeb={b}
                        showprice={$actor.matches('result')}
                        winner={b.price >= a.price}
                        on:select={() => send({ type: 'answer', a, b, sign: -1 })}
                    />
                </div>
            </div>
        {/key}
    {:else if $actor.matches('over')}
        <div class="done" in:scale={{ delay: 200, duration: 800, easing: eases.elasticOut }}>
            <strong>{score}/{results.length}</strong>
            <p>{pickMessage(score / results.length)}</p>
            <button on:click={() => send('back')}>Back to main screen</button>
        </div>
    {/if}
</div>

{#if $actor.matches('result')}
    <img
        in:fly={{ duration: 200, x: 100 }}
        out:sendFade={{ key: currentResult }}
        class="giant-result"
        alt="{currentResult} answer"
        src="/icons/{currentResult}.svg"
    />
{/if}

<div class="results" style="grid-template-columns: repeat({results.length}, 1fr)">
    {#each results as result}
        <span class="result">
            {#if result}
                <img in:receiveFade={{ key: result }} alt="{result} answer" src="/icons/{result}.svg" />
            {/if}
        </span>
    {/each}
</div>

<style>
    .game-container {
        flex: 1;
    }
    .game {
        display: grid;
        grid-template-rows: 1fr 2em 1fr;
        grid-gap: 0.5em;
        width: 100%;
        height: 100%;
        max-width: min(100%, 40vh);
        margin: 0 auto;
    }
    .game > div {
        display: flex;
        align-items: center;
    }
    .same {
        width: 100%;
        align-items: center;
        margin: 0;
    }
    .game .card-container button {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
    }
    .giant-result {
        position: fixed;
        width: 50vmin;
        height: 50vmin;
        left: calc(50vw - 25vmin);
        top: calc(50vh - 25vmin);
        opacity: 0.5;
    }
    .results {
        display: grid;
        grid-gap: 0.2em;
        width: 100%;
        max-width: 320px;
        margin: auto auto 0 auto;
    }
    .result {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        padding: 0 0 100% 0;
        transition: background 0.2s;
        transition-delay: 0.2s;
    }
    .result img {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
    }
    .done {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .done strong {
        font-size: 6em;
        font-weight: 700;
    }
    @media (min-width: 640px) {
        .game {
            max-width: 100%;
            grid-template-rows: none;
            grid-template-columns: 1fr 8em 1fr;
            /* work around apparent safari flex bug */
            max-height: calc(100vh - 6em);
        }
        .same {
            height: 8em;
        }
    }
</style>