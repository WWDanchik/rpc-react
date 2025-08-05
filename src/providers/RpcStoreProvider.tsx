import React from "react";
import { RpcRepository } from "@yunu-lab/rpc-ts";
import { createContext } from "react";

const RpcContext = createContext<{
    repository: RpcRepository;
} | null>(null);

export interface RpcProviderProps {
    children: React.ReactNode;
    repository: RpcRepository;
}

export const RpcProvider: React.FC<RpcProviderProps> = ({
    children,
    repository,
}) => {
    return (
        <RpcContext.Provider value={{ repository }}>
            {children}
        </RpcContext.Provider>
    );
};

export { RpcContext }; 