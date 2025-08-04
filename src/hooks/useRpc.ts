/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from "react";
import { Rpc } from "@yunu-lab/rpc-ts";
import { RpcContext } from "../context/RpcContext";
import { RpcContextType } from "../providers/RpcProvider";

export const useRpc = <
    TTypes extends Record<string, Rpc<any>>
>(): RpcContextType<TTypes> => {
    const context = useContext(RpcContext);

    if (!context) {
        throw new Error("useRpc must be used within an RpcProvider");
    }

    return context as RpcContextType<TTypes>;
};