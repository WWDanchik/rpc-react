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
    slices?: Record<string, any>;
}

export const extendStore = (options: ExtendStoreOptions) => {
    const { repository, store, slices = {} } = options;

    const rpcSlice = createSlice({
        name: "rpc",
        initialState: {} as Record<string, any>,
        reducers: {
            setData: (
                state,
                action: PayloadAction<{
                    type: string;
                    data: any;
                }>
            ) => {
                const { type, data } = action.payload;
                state[type] = data;
            },
        },
    });

    const newReducer = combineReducers({
        ...slices,
        rpc: rpcSlice.reducer,
    });

    store.replaceReducer(newReducer);

    const unsubscribe = repository.onDataChanged((events) => {
        events.forEach((event) => {
            const { type, payload } = event;

            const storageType = repository.getStorageType(String(type));

            if (storageType === "singleton") {
                const nextValue = Array.isArray(payload)
                    ? payload[0] ?? null
                    : payload ?? null;
                store.dispatch(
                    rpcSlice.actions.setData({
                        type: String(type),
                        data: nextValue,
                    })
                );
            } else {
                const nextArray = Array.isArray(payload)
                    ? payload
                    : Object.values(payload || {});
                store.dispatch(
                    rpcSlice.actions.setData({
                        type: String(type),
                        data: nextArray,
                    })
                );
            }
        });
    });

    return {
        store,
        repository,
        unsubscribe,
    };
};
