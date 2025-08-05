/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Store,
    combineReducers,
    createSlice,
    PayloadAction,
} from "@reduxjs/toolkit";
import { RpcRepository } from "@yunu-lab/rpc-ts";

export interface ExtendStoreOptions {
    repository: RpcRepository<any>;
    store: Store;
}

export const extendStore = (options: ExtendStoreOptions) => {
    const { repository, store } = options;

    const rpcSlice = createSlice({
        name: "rpc",
        initialState: {} as Record<string, Record<string | number, any>>,
        reducers: {
            setData: (
                state,
                action: PayloadAction<{
                    type: string;
                    data: Record<string | number, any>;
                }>
            ) => {
                const { type, data } = action.payload;
                state[type] = data;
            },
        },
    });

    const storeWithAsync = store as Store & {
        asyncReducers?: Record<string, any>;
        injectReducer?: (key: string, reducer: any) => void;
    };

    if (storeWithAsync.injectReducer) {
        storeWithAsync.injectReducer("rpc", rpcSlice.reducer);
    } else {
        storeWithAsync.asyncReducers = storeWithAsync.asyncReducers || {};
        storeWithAsync.asyncReducers.rpc = rpcSlice.reducer;

        storeWithAsync.injectReducer = (key: string, asyncReducer: any) => {
            storeWithAsync.asyncReducers![key] = asyncReducer;
            const currentState = store.getState();
            const newReducer = combineReducers({
                ...currentState,
                ...storeWithAsync.asyncReducers,
            });
            store.replaceReducer(newReducer);
        };

        const currentState = store.getState();
        const newReducer = combineReducers({
            ...currentState,
            ...storeWithAsync.asyncReducers,
        });
        store.replaceReducer(newReducer);
    }

    const unsubscribe = repository.onDataChanged((events) => {
        events.forEach((event) => {
            const { type, payload } = event;

            const dataObject = payload.reduce(
                (acc: Record<string | number, any>, item: any) => {
                    const id = item.id;
                    acc[id] = item;
                    return acc;
                },
                {}
            );

            store.dispatch(
                rpcSlice.actions.setData({
                    type: String(type),
                    data: dataObject,
                })
            );
        });
    });

    return {
        store,
        repository,
        unsubscribe,
    };
};
