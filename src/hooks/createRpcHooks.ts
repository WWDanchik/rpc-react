/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, Rpc, StorageType } from "@yunu-lab/rpc-ts";
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
    // Основные хуки для каждого типа
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
    // Хуки для полных связанных данных
    [K in keyof TTypes as `use${ToPascalCase<string & K>}FullRelatedData`]: <
        TResult = InferRpcType<TTypes[K]>
    >(
        id?: string | number
    ) => TResult | TResult[] | null;
} & {
    // Хуки для слушателей с типизацией
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Listener`]: <
        RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
            keyof TTypes,
            StorageType
        >
    >(
        callback: (event: {
            type: K;
            payload: RpcStorageType[K] extends "collection"
                ? Array<InferRpcType<TTypes[K]>>
                : RpcStorageType[K] extends "singleton"
                ? InferRpcType<TTypes[K]>
                : Array<InferRpcType<TTypes[K]>>;
        }) => void
    ) => () => void;
} & {
    // Общий слушатель данных
    useDataListener: <
        RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
            keyof TTypes,
            StorageType
        >
    >(
        callback: (
            events: Array<{
                type: keyof TTypes;
                payload: RpcStorageType[keyof TTypes] extends "collection"
                    ? Array<InferRpcType<TTypes[keyof TTypes]>>
                    : RpcStorageType[keyof TTypes] extends "singleton"
                    ? InferRpcType<TTypes[keyof TTypes]>
                    : Array<InferRpcType<TTypes[keyof TTypes]>>;
            }>
        ) => void,
        options?: { types?: (keyof TTypes)[] }
    ) => () => void;
} & {
    // Хуки для связанных данных
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Related`]: <
        TTarget extends keyof TTypes
    >(
        id: string | number,
        targetType: TTarget
    ) => Array<TTypes[TTarget] extends Rpc<infer S> ? z.infer<S> : never>;
} & {
    // Хук для обработки сообщений с полной типизацией
    useHandleMessages: () => {
        handleMessages(
            messages: Array<Message<TTypes>>,
            callbacks?: {
                [K in keyof TTypes]?: (
                    data:
                        | InferRpcType<TTypes[K]>[]
                        | Record<
                              string,
                              Partial<InferRpcType<TTypes[K]>> | null
                          >
                ) => void;
            }
        ): void;

        handleMessages<
            RpcStorageType extends Record<keyof TTypes, StorageType>
        >(
            messages: Array<Message<TTypes>>,
            callbacks?: {
                [K in keyof TTypes]?: (
                    data: RpcStorageType[K] extends "collection"
                        ?
                              | Record<
                                    string,
                                    Partial<InferRpcType<TTypes[K]>> | null
                                >
                              | Array<InferRpcType<TTypes[K]>>
                        : RpcStorageType[K] extends "singleton"
                        ? Partial<InferRpcType<TTypes[K]>>
                        : never
                ) => void;
            }
        ): void;
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

    // Основные хуки для каждого типа
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

            const findById = React.useCallback(
                (id: string | number) => repository.findById(typeKey, id),
                [repository, typeKey]
            );
            const findAll = React.useCallback(
                () => repository.findAll(typeKey),
                [repository, typeKey]
            );
            const mergeRpc = React.useCallback(
                (
                    data:
                        | Record<
                              string,
                              Partial<
                                  InferRpcType<TTypes[typeof typeKey]>
                              > | null
                          >
                        | InferRpcType<TTypes[typeof typeKey]>[]
                ) => repository.mergeRpc(typeKey, data),
                [repository, typeKey]
            );

            if (id !== undefined) {
                return findById(id);
            }
            return {
                [`${String(typeKey)}s`]: Object.values(allData) as InferRpcType<
                    TTypes[typeof typeKey]
                >[],
                [`${String(typeKey)}Map`]: allData as Record<
                    string,
                    InferRpcType<TTypes[typeof typeKey]>
                >,
                findById,
                findAll,
                mergeRpc,
            } as any;
        }

        (hooks as any)[hookName] = useHook;

        // Хуки для полных связанных данных
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

    // Хуки для слушателей с типизацией
    typeKeys.forEach((typeName) => {
        const listenerHookName = `use${toPascalCase(
            String(typeName)
        )}Listener` as keyof RpcHooks<TTypes>;

        function useListenerHook<
            RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
                keyof TTypes,
                StorageType
            >
        >(
            callback: (event: {
                type: typeof typeName;
                payload: RpcStorageType[typeof typeName] extends "collection"
                    ? Array<InferRpcType<TTypes[typeof typeName]>>
                    : RpcStorageType[typeof typeName] extends "singleton"
                    ? InferRpcType<TTypes[typeof typeName]>
                    : Array<InferRpcType<TTypes[typeof typeName]>>;
            }) => void
        ) {
            const { repository } = useRpc<TTypes>();
            const callbackRef = React.useRef(callback);
            const listenerIdRef = React.useRef<string | number | null>(null);
            callbackRef.current = callback;

            const filteredCallback = React.useCallback((
                events: Array<{
                    type: typeof typeName;
                    payload: any;
                }>
            ) => {
                const filteredEvents = events.filter(
                    (event) => event.type === typeName
                );
                if (filteredEvents.length > 0) {
                    callbackRef.current(filteredEvents[0] as any);
                }
            }, [typeName]);

            React.useEffect(() => {
                // Удаляем предыдущую подписку если есть
                if (listenerIdRef.current && typeof (repository as any).offDataChanged === "function") {
                    (repository as any).offDataChanged(listenerIdRef.current);
                    listenerIdRef.current = null;
                }

                listenerIdRef.current = (repository as any).onDataChanged(
                    filteredCallback,
                    {
                        types: [typeName],
                    }
                );

                return () => {
                    if (
                        listenerIdRef.current &&
                        typeof (repository as any).offDataChanged === "function"
                    ) {
                        (repository as any).offDataChanged(listenerIdRef.current);
                        listenerIdRef.current = null;
                    }
                };
            }, [repository, typeName, filteredCallback]);
            return () => {};
        }
        (hooks as any)[listenerHookName] = useListenerHook;
    });

    // Общий слушатель данных с типизацией
    function useDataListener<
        RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
            keyof TTypes,
            StorageType
        >
    >(
        callback: (
            events: Array<{
                type: keyof TTypes;
                payload: RpcStorageType[keyof TTypes] extends "collection"
                    ? Array<InferRpcType<TTypes[keyof TTypes]>>
                    : RpcStorageType[keyof TTypes] extends "singleton"
                    ? InferRpcType<TTypes[keyof TTypes]>
                    : Array<InferRpcType<TTypes[keyof TTypes]>>;
            }>
        ) => void,
        options?: { types?: (keyof TTypes)[] }
    ) {
        const { repository } = useRpc<TTypes>();
        const callbackRef = React.useRef(callback);
        const listenerIdRef = React.useRef<string | number | null>(null);
        callbackRef.current = callback;

        React.useEffect(() => {
            // Удаляем предыдущую подписку если есть
            if (listenerIdRef.current && typeof (repository as any).offDataChanged === "function") {
                (repository as any).offDataChanged(listenerIdRef.current);
                listenerIdRef.current = null;
            }

            listenerIdRef.current = (repository as any).onDataChanged(
                callbackRef.current as any,
                {
                    types: options?.types || typeKeys,
                }
            );
            return () => {
                if (
                    listenerIdRef.current &&
                    typeof (repository as any).offDataChanged === "function"
                ) {
                    (repository as any).offDataChanged(listenerIdRef.current);
                    listenerIdRef.current = null;
                }
            };
        }, [repository, options?.types]);
        return () => {};
    }
    (hooks as any).useDataListener = useDataListener;

    // Хуки для связанных данных
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
            }, [
                repository,
                id,
                targetType,
                JSON.stringify(sourceData),
                JSON.stringify(targetData),
            ]);
            return relatedData;
        }
        (hooks as any)[relatedHookName] = useRelatedHook;
    });

    // Хук для обработки сообщений с полной типизацией
    function useHandleMessages() {
        const { repository } = useRpc<TTypes>();

        const handleMessages = (
            messages: Array<Message<TTypes>>,
            callbacks?: {
                [K in keyof TTypes]?: (
                    data:
                        | InferRpcType<TTypes[K]>[]
                        | Record<
                              string,
                              Partial<InferRpcType<TTypes[K]>> | null
                          >
                ) => void;
            }
        ) => {
            repository.handleMessages(messages, callbacks);
        };

        const handleMessagesTyped = <
            RpcStorageType extends Record<keyof TTypes, StorageType>
        >(
            messages: Array<Message<TTypes>>,
            callbacks?: {
                [K in keyof TTypes]?: (
                    data: RpcStorageType[K] extends "collection"
                        ?
                              | Record<
                                    string,
                                    Partial<InferRpcType<TTypes[K]>> | null
                                >
                              | Array<InferRpcType<TTypes[K]>>
                        : RpcStorageType[K] extends "singleton"
                        ? Partial<InferRpcType<TTypes[K]>>
                        : never
                ) => void;
            }
        ) => {
            repository.handleMessages<RpcStorageType>(messages, callbacks);
        };

        return { handleMessages, handleMessagesTyped };
    }

    (hooks as any).useHandleMessages = useHandleMessages;

    return hooks;
};
