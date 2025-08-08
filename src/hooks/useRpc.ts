/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext } from "react";
import { Rpc, RpcRepository } from "@yunu-lab/rpc-ts";
import { RpcContext } from "../providers/RpcStoreProvider";

export interface RpcContextType<TTypes extends Record<string, Rpc<any>>> {
    repository: RpcRepository<TTypes>;
}

export const useRpc = <
    TTypes extends Record<string, Rpc<any>>
>(): RpcContextType<TTypes> => {
    const context = useContext(RpcContext);

    if (!context) {
        throw new Error("useRpc must be used within an RpcProvider");
    }

    const repository = React.useMemo(
        () => context.repository as unknown as RpcRepository<TTypes>,
        [context.repository]
    );

    return {
        repository
    };
};