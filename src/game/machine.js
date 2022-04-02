import { actions, assign, createMachine, sendParent, spawn } from 'xstate';
const { stop } = actions;

import { feedbackMachine } from '../feedback/machine.js';
import { errorMachine } from '../error/machine.js';

import { ROUNDS_PER_GAME } from './constants.js';
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

export const gameMachine = ({ celebs, lookup, category }) =>
    createMachine({
        id: 'gameActor',
        context: {
            celebs: celebs,
            lookup: lookup,
            category: category,
            rounds: [],
            currentRound: [],
            currentRoundIndex: 0,
            results: Array(ROUNDS_PER_GAME),
            currentResult: undefined,
            feedbackActor: undefined,
            errorActor: undefined,
            retries: 0
        },

        initial: 'loadingRounds',
        states: {
            loadingRounds: {
                invoke: {
                    src: (context, event) =>
                        loadRounds(select(context.celebs, context.lookup, context.category.slug, ROUNDS_PER_GAME)),
                    onDone: {
                        target: 'loadingRound',
                        actions: assign({ rounds: (context, event) => event.data })
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
                    onError: [
                        {
                            cond: (context, event) => context.retries < 3,
                            target: 'healingRounds',
                            actions: assign({ retries: (context, event) => context.retries + 1 })
                        },
                        {
                            target: 'failure',
                            actions: assign({
                                errorActor: (context, event) => spawn(errorMachine, 'errorActor'),
                                retries: 0
                            })
                        }
                    ]
                }
            },
            healingRounds: {
                invoke: {
                    src: (context, event) =>
                        loadRounds(select(context.celebs, context.lookup, context.category.slug, 1)),
                    onDone: {
                        target: 'loadingRound',
                        actions: assign({
                            rounds: (context, event) => [
                                ...context.rounds.slice(0, context.currentRoundIndex),
                                event.data[0],
                                ...context.rounds.slice(context.currentRoundIndex + 1)
                            ]
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
                        actions: [stop('feedbackActor'), assign({ feedbackActor: undefined }), sendParent('GREET')]
                    }
                }
            },

            failure: {
                on: {
                    RETRY: 'loadingRounds'
                },
                exit: [stop('errorActor'), assign({ errorActor: undefined })]
            }
        }
    });
