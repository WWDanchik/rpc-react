export { configureRpcStore } from "./store/configureRpcStore";

export { RpcProvider } from "./providers/RpcProvider";
export type { RpcContextType, RpcProviderProps } from "./providers/RpcProvider";

export { useRpc } from "./hooks/useRpc";

export { createRpcHooks } from "./hooks/createRpcHooks";

export type {
    Message,
    RepositoryTypes,
} from "@yunu-lab/rpc-ts";

// Экспортируем Rpc и RpcRepository как значения для использования в коде
export { Rpc, RpcRepository } from "@yunu-lab/rpc-ts";
