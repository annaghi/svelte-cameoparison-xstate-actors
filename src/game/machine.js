import { assign, createMachine, sendParent, spawn } from 'xstate';

import { feedbackMachine } from '../feedback/machine.js';
import { errorMachine } from '../error/machine.js';

import { ROUNDS_PER_GAME } from '../constants.js';
import { select } from './select.js';
import { loadImage } from '../utils.js';

const loadRounds = async (selection) =>
    selection.map((round) => Promise.all([loadCelebDetails(round.a), loadCelebDetails(round.b)]));

const loadCelebDetails = async (celeb) => {
    const res = await fetch(`https://cameo-explorer.netlify.app/celebs/${celeb.id}.json`);
    const details = await res.json();
    await loadImage(details.image);
    return details;
};

export const gameMachine = ({ filteredCelebs, lookup }) =>
    createMachine({
        id: 'gameActor',
        context: {
            filteredCelebs: filteredCelebs,
            lookup: lookup,
            rounds: [],
            currentRound: [],
            currentRoundIndex: 0,
            results: Array(ROUNDS_PER_GAME),
            currentResult: undefined,
            feedbackActor: undefined,
            errorActor: undefined
        },

        initial: 'idle',
        states: {
            idle: {
                on: {
                    LOAD_ROUNDS: 'loadingRounds'
                }
            },
            loadingRounds: {
                invoke: {
                    src: (context, event) =>
                        loadRounds(select(context.filteredCelebs, context.lookup, ROUNDS_PER_GAME)),
                    onDone: {
                        target: 'loadingRound',
                        actions: assign({ rounds: (context, event) => event.data })
                    },
                    onError: {
                        target: 'failure',
                        actions: assign({
                            errorActor: (context, event) => spawn(errorMachine, 'errorActor')
                        })
                    }
                }
            },
            loadingRound: {
                invoke: {
                    src: (context, event) => context.rounds[context.currentRoundIndex].then((round) => round),
                    onDone: {
                        target: 'question',
                        actions: assign({ currentRound: (context, event) => event.data })
                    },
                    onError: {
                        target: 'failure',
                        actions: assign({
                            errorActor: (context, event) => spawn(errorMachine, 'errorActor')
                        })
                    }
                }
            },
            question: {
                on: {
                    ATTEMPT: {
                        target: 'answer',
                        actions: assign({
                            currentResult: (context, event) =>
                                Math.sign(event.a.price - event.b.price) === event.sign ? 'right' : 'wrong'
                        })
                    }
                }
            },
            answer: {
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
                            target: 'loadingRound',
                            actions: assign({
                                currentRoundIndex: (context, event) => context.currentRoundIndex + 1
                            })
                        },
                        {
                            target: 'feedback',
                            actions: assign({
                                feedbackActor: (context, event) =>
                                    spawn(feedbackMachine(context.results), 'feedbackActor')
                            })
                        }
                    ]
                }
            },
            feedback: {
                on: {
                    RESTART: {
                        actions: sendParent({ type: 'GREET' })
                    }
                },
                exit: stop('feedbackActor')
            },
            failure: {
                on: {
                    RETRY: {
                        actions: sendParent({ type: 'GREET' })
                    }
                },
                exit: stop('errorActor')
            }
        }
    });
