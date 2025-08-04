/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Rpc, RpcRepository } from "@yunu-lab/rpc-ts";
import { JSX, ReactNode } from "react";
import { Provider } from "react-redux";
import { Store } from "@reduxjs/toolkit";
import { RpcContext } from "../context/RpcContext";

export type RpcContextType<
    TTypes extends Record<string, Rpc<any>> = Record<string, Rpc<any>>
> = {
    repository: RpcRepository<TTypes>;
    store: Store;
};

export interface RpcProviderProps<TTypes extends Record<string, Rpc<any>>> {
    children: ReactNode;
    repository: RpcRepository<TTypes>;
    store: Store;
}
export const RpcProvider = <TTypes extends Record<string, Rpc<any>>>({
    children,
    repository,
    store,
}: RpcProviderProps<TTypes>): JSX.Element => {
    const contextValue: RpcContextType<TTypes> = {
        repository,
        store,
    };

    return (
        <Provider store={store}>
            <RpcContext.Provider value={contextValue as RpcContextType<any>}>
                {children}
            </RpcContext.Provider>
        </Provider>
    );
};
