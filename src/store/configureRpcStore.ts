/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rpc, RpcRepository } from "@yunu-lab/rpc-ts";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

type InferRpcType<T> = T extends Rpc<infer S> ? z.infer<S> : never;

type RpcStoreState<T extends Record<string, Rpc<any>>> = {
    [K in keyof T]?: Record<string | number, InferRpcType<T[K]>>;
};

export const configureRpcStore = <T extends Record<string, Rpc<any>>>(
    repository: RpcRepository<T>
) => {
    const rpcSlice = createSlice({
        name: "rpc",
        initialState: {} as RpcStoreState<T>,
        reducers: {
            setData: (
                state,
                action: PayloadAction<{
                    type: keyof T;
                    data: Record<string | number, any>;
                }>
            ) => {
                const { type, data } = action.payload;
                (state as any)[type] = data;
            },
            removeData: (
                state,
                action: PayloadAction<{
                    type: keyof T;
                    ids: (string | number)[];
                }>
            ) => {
                const { type, ids } = action.payload;
                const currentData = (state as any)[type] || {};
                ids.forEach((id) => {
                    delete currentData[id];
                });
                (state as any)[type] = currentData;
            },
        },
    });

    const store = configureStore({
        reducer: {
            rpc: rpcSlice.reducer,
        },
    });

    const unsubscribe = repository.onDataChanged((events) => {
        events.forEach((event) => {
            const { type, payload } = event;

            const dataObject = payload.reduce((acc, item) => {
                const id = (item as any).id;
                acc[id] = item;
                return acc;
            }, {} as Record<string | number, any>);

            store.dispatch(
                rpcSlice.actions.setData({
                    type: type as keyof T,
                    data: dataObject,
                })
            );
        });
    });

    return {
        repository,
        store,
        unsubscribe,
    };
};
