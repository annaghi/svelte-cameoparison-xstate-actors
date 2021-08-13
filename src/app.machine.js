import { assign, createMachine, send, spawn, actions } from 'xstate';
const { stop } = actions;

import { welcomeMachine } from './welcome/machine.js';
import { gameMachine } from './game/machine.js';

export const machine = createMachine({
    id: 'appMachine',
    context: {
        welcomeActor: undefined,
        gameActor: undefined
    },

    entry: assign({ welcomeActor: (context, event) => spawn(welcomeMachine, 'welcomeActor') }),

    initial: 'welcome',
    states: {
        welcome: {
            on: {
                start: {
                    target: 'game',
                    actions: assign({
                        gameActor: (context, event) => spawn(gameMachine(event.rounds), 'gameActor')
                    })
                }
            }
        },
        game: {
            on: { restart: 'welcome' },
            exit: stop('gameActor')
        }
    }
});