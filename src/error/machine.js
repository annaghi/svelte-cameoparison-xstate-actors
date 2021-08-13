import { createMachine, sendParent } from 'xstate';

export const errorMachine = createMachine({
    id: 'errorActor',
    context: {
        targetState: undefined
    },

    initial: 'idle',
    states: {
        idle: {
            on: {
                retry: {
                    actions: sendParent((context, event) => ({
                        type: 'retry',
                        targetState: context.targetState
                    }))
                }
            }
        }
    }
});
