<div class="card-outer">
    <button class="card-inner" disabled />
</div>

<style>
    .card-outer {
        width: 100%;
        height: 100%;
    }
    .card-inner {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        background-position: 50% 0;
        background-size: cover;
        border-radius: var(--border-radius);
        box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        padding: 0;
        text-align: left;
    }

    @media (min-width: 640px) {
        .card-outer {
            height: 0;
            padding: 0 0 100% 0;
        }
    }
</style>
