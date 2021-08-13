import { assign, createMachine, sendParent } from 'xstate';

export const ROUNDS_PER_GAME = 10;

export const gameMachine = (rounds) =>
    createMachine({
        id: 'gameActor',
        context: {
            rounds: rounds,
            currentRoundIndex: 0,
            results: Array(ROUNDS_PER_GAME),
            currentResult: undefined
        },
        initial: 'question',
        states: {
            question: {
                on: {
                    answer: {
                        target: 'result',
                        actions: assign({
                            currentResult: (context, event) =>
                                Math.sign(event.a.price - event.b.price) === event.sign ? 'right' : 'wrong'
                        })
                    }
                }
            },
            result: {
                after: {
                    1500: {
                        target: 'next',
                        actions: assign({
                            results: (context, event) => [
                                ...context.results.slice(0, context.currentRoundIndex),
                                context.currentResult,
                                ...context.results.slice(context.currentRoundIndex + 1)
                            ]
                        })
                    }
                }
            },
            next: {
                after: {
                    500: [
                        {
                            cond: (context, event) => context.currentRoundIndex < ROUNDS_PER_GAME - 1,
                            target: 'question',
                            actions: assign({
                                currentRoundIndex: (context, event) => context.currentRoundIndex + 1
                            })
                        },
                        { target: 'over' }
                    ]
                }
            },
            over: {
                on: {
                    back: {
                        actions: sendParent({ type: 'restart' })
                    }
                }
            }
        }
    });
