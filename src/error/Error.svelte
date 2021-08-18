<script>
    export let actor = null;
    const { send } = actor;
</script>

<div class="error">
    <p class="message">Server or network error</p>
    <button on:click={() => send('RETRY')}>Try again</button>
</div>

<style>
    .error {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .message {
        color: red;
    }
    button {
        align-self: center;
    }
</style>
