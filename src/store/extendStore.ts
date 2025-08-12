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
                store.dispatch(
                    rpcSlice.actions.setData({
                        type: String(type),
                        data: payload,
                    })
                );
            } else {
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
            }
        });
    });

    return {
        store,
        repository,
        unsubscribe,
    };
};
