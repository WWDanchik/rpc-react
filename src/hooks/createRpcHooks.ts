/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rpc } from "@yunu-lab/rpc-ts";
import React from "react";
import { useSelector } from "react-redux";
import { z } from "zod";
import { useRpc } from "./useRpc";

type InferRpcType<T> = T extends Rpc<infer S> ? z.infer<S> : never;

type ToPascalCase<S extends string> = S extends `${infer First}_${infer Rest}`
    ? `${Capitalize<First>}${ToPascalCase<Rest>}`
    : Capitalize<S>;

interface RpcState<TTypes extends Record<string, Rpc<any>>> {
    rpc: {
        [K in keyof TTypes]?: Record<string | number, InferRpcType<TTypes[K]>>;
    };
}

type RpcHooks<TTypes extends Record<string, Rpc<any>>> = {
    [K in keyof TTypes as `use${ToPascalCase<string & K>}`]: {
        (): {
            [P in K as `${P & string}s`]: InferRpcType<TTypes[P]>[];
        } & {
            [P in K as `${P & string}Map`]: Record<
                string,
                InferRpcType<TTypes[P]>
            >;
        } & {
            findById: (id: string | number) => InferRpcType<TTypes[K]> | null;
            findAll: () => InferRpcType<TTypes[K]>[];
            mergeRpc: (
                data:
                    | Record<string, Partial<InferRpcType<TTypes[K]>> | null>
                    | InferRpcType<TTypes[K]>[]
            ) => void;
        };
        (id: string | number): InferRpcType<TTypes[K]> | null;
    };
} & {
    [K in keyof TTypes as `use${ToPascalCase<string & K>}FullRelatedData`]: <
        TResult = InferRpcType<TTypes[K]>
    >(
        id?: string | number
    ) => TResult | TResult[] | null;
} & {
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Listener`]: (
        callback: (event: {
            type: K;
            payload:
                | InferRpcType<TTypes[K]>[]
                | Record<string, InferRpcType<TTypes[K]> | null>;
        }) => void
    ) => () => void;
} & {
    useDataListener: (
        callback: (
            events: Array<{
                type: keyof TTypes;
                payload: any[];
            }>
        ) => void,
        options?: { types?: (keyof TTypes)[] }
    ) => () => void;
} & {
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Related`]: <
        TTarget extends keyof TTypes
    >(
        id: string | number,
        targetType: TTarget
    ) => Array<TTypes[TTarget] extends Rpc<infer S> ? z.infer<S> : never>;
} & {
    useHandleMessages: () => {
        handleMessages: (
            messages: Array<{
                type: keyof TTypes;
                payload:
                    | InferRpcType<TTypes[keyof TTypes]>[]
                    | Record<string, InferRpcType<TTypes[keyof TTypes]> | null>;
            }>,
            callbacks?: { [K in keyof TTypes]: (data: any) => void }
        ) => void;
    };
};

export const createRpcHooks = <TTypes extends Record<string, Rpc<any>>>(
    typeKeys: Array<keyof TTypes>
): RpcHooks<TTypes> => {
    const toPascalCase = (s: string): string => {
        return s
            .split("_")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join("");
    };

    const hooks = {} as RpcHooks<TTypes>;

    typeKeys.forEach((typeName) => {
        const hookName = `use${toPascalCase(
            String(typeName)
        )}` as keyof RpcHooks<TTypes>;
        const typeKey = typeName as keyof TTypes;

        function useHook(id?: string | number) {
            const { repository } = useRpc<TTypes>();
            const allData = useSelector(
                (state: RpcState<TTypes>) => state.rpc[typeKey] || {}
            );
            
            const findById = React.useCallback((id: string | number) =>
                repository.findById(typeKey, id), [repository, typeKey]);
            const findAll = React.useCallback(() => repository.findAll(typeKey), [repository, typeKey]);
            const mergeRpc = React.useCallback((
                data:
                    | Record<
                          string,
                          Partial<InferRpcType<TTypes[typeof typeKey]>> | null
                      >
                    | InferRpcType<TTypes[typeof typeKey]>[]
            ) => repository.mergeRpc(typeKey, data), [repository, typeKey]);

            if (id !== undefined) {
                return findById(id);
            }
            return {
                [`${String(typeKey)}s`]: Object.values(allData) as InferRpcType<
                    TTypes[typeof typeKey]
                >[],
                findById,
                findAll,
                mergeRpc,
            } as any;
        }

        (hooks as any)[hookName] = useHook;

        const fullRelatedHookName = `use${toPascalCase(
            String(typeName)
        )}FullRelatedData` as keyof RpcHooks<TTypes>;

        function useFullRelatedHook<
            TResult = InferRpcType<TTypes[typeof typeName]>
        >(id?: string | number) {
            const { repository } = useRpc<TTypes>();
            const allRpcData = useSelector(
                (state: RpcState<TTypes>) => state.rpc
            );
            const [fullData, setFullData] = React.useState<
                TResult | TResult[] | null
            >(null);
            React.useEffect(() => {
                const getData = () => {
                    try {
                        const result = (repository as any).getFullRelatedData(
                            typeName,
                            id
                        ) as TResult | TResult[] | null;
                        setFullData(result);
                    } catch {
                        setFullData(null);
                    }
                };
                getData();
            }, [repository, id, JSON.stringify(allRpcData)]);
            return fullData;
        }
        (hooks as any)[fullRelatedHookName] = useFullRelatedHook;
    });

    typeKeys.forEach((typeName) => {
        const listenerHookName = `use${toPascalCase(
            String(typeName)
        )}Listener` as keyof RpcHooks<TTypes>;

        function useListenerHook(
            callback: (event: {
                type: typeof typeName;
                payload:
                    | InferRpcType<TTypes[typeof typeName]>[]
                    | Record<
                          string,
                          InferRpcType<TTypes[typeof typeName]> | null
                      >;
            }) => void
        ) {
            const { repository } = useRpc<TTypes>();
            const callbackRef = React.useRef(callback);
            callbackRef.current = callback;
            
            React.useEffect(() => {
                const filteredCallback = (
                    events: Array<{
                        type: typeof typeName;
                        payload:
                            | InferRpcType<TTypes[typeof typeName]>[]
                            | Record<
                                  string,
                                  InferRpcType<TTypes[typeof typeName]> | null
                              >;
                    }>
                ) => {
                    const filteredEvents = events.filter(
                        (event) => event.type === typeName
                    );
                    if (filteredEvents.length > 0) {
                        callbackRef.current(filteredEvents[0]);
                    }
                };

                const listenerId = (repository as any).onDataChanged(
                    filteredCallback,
                    {
                        types: [typeName],
                    }
                );
                return () => {
                    if (
                        listenerId &&
                        typeof (repository as any).removeListener === "function"
                    ) {
                        (repository as any).removeListener(listenerId);
                    }
                };
            }, [repository]);
            return () => {};
        }
        (hooks as any)[listenerHookName] = useListenerHook;
    });

    function useDataListener(
        callback: (
            events: Array<{
                type: keyof TTypes;
                payload: any[];
            }>
        ) => void,
        options?: { types?: (keyof TTypes)[] }
    ) {
        const { repository } = useRpc<TTypes>();
        const callbackRef = React.useRef(callback);
        callbackRef.current = callback;
        
        React.useEffect(() => {
            const listenerId = (repository as any).onDataChanged(callbackRef.current, {
                types: options?.types || typeKeys,
            });
            return () => {
                if (
                    listenerId &&
                    typeof (repository as any).removeListener === "function"
                ) {
                    (repository as any).removeListener(listenerId);
                }
            };
        }, [repository, options?.types]);
        return () => {};
    }
    (hooks as any).useDataListener = useDataListener;

    typeKeys.forEach((typeName) => {
        const relatedHookName = `use${toPascalCase(
            String(typeName)
        )}Related` as keyof RpcHooks<TTypes>;

        function useRelatedHook<TTarget extends keyof TTypes>(
            id: string | number,
            targetType: TTarget
        ) {
            const { repository } = useRpc<TTypes>();
            const sourceData = useSelector(
                (state: RpcState<TTypes>) => state.rpc[typeName] || {}
            );
            const targetData = useSelector(
                (state: RpcState<TTypes>) => state.rpc[targetType] || {}
            );
            const [relatedData, setRelatedData] = React.useState<
                Array<TTypes[TTarget] extends Rpc<infer S> ? z.infer<S> : never>
            >([]);
            React.useEffect(() => {
                const getRelatedData = () => {
                    try {
                        const result = (repository as any).getRelated(
                            typeName,
                            id,
                            targetType
                        );
                        setRelatedData(result);
                    } catch {
                        setRelatedData([]);
                    }
                };
                getRelatedData();
            }, [repository, id, targetType, JSON.stringify(sourceData), JSON.stringify(targetData)]);
            return relatedData;
        }
        (hooks as any)[relatedHookName] = useRelatedHook;
    });

    // Хук для обработки сообщений
    function useHandleMessages() {
        const { repository } = useRpc<TTypes>();

        const handleMessages = (
            messages: Array<{
                type: keyof TTypes;
                payload:
                    | InferRpcType<TTypes[keyof TTypes]>[]
                    | Record<string, InferRpcType<TTypes[keyof TTypes]> | null>;
            }>,
            callbacks?: { [K in keyof TTypes]: (data: any) => void }
        ) => {
            repository.handleMessages(messages, callbacks);
        };

        return { handleMessages };
    }

    (hooks as any).useHandleMessages = useHandleMessages;

    return hooks;
};
