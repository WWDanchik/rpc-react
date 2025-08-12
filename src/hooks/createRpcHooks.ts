/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, Rpc, StorageType } from "@yunu-lab/rpc-ts";
import React from "react";
import { useSelector } from "react-redux";
import { z } from "zod";
import { useRpc } from "./useRpc";

type InferRpcType<T> = T extends Rpc<infer S> ? z.infer<S> : never;

const toPascalCase = (s: string): string => {
    return s
        .split("_")
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
};

type ToPascalCase<S extends string> = S extends `${infer First}_${infer Rest}`
    ? `${Capitalize<First>}${ToPascalCase<Rest>}`
    : Capitalize<S>;

interface RpcState<TTypes extends Record<string, Rpc<any>>> {
    rpc: {
        [K in keyof TTypes]?: Record<string | number, InferRpcType<TTypes[K]>>;
    };
}

type RpcHooks<
    TTypes extends Record<string, Rpc<any>>,
    RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
        keyof TTypes,
        StorageType
    >
> = {
    // Основные хуки для каждого типа
    [K in keyof TTypes as `use${ToPascalCase<string & K>}`]: {
        (): {
            [P in K as `${P & string}s`]: RpcStorageType[P] extends "collection"
                ? InferRpcType<TTypes[P]>[]
                : RpcStorageType[P] extends "singleton"
                ? InferRpcType<TTypes[P]> | null
                : InferRpcType<TTypes[P]>[];
        } & {
            [P in K as `${P &
                string}Map`]: RpcStorageType[P] extends "collection"
                ? Record<string, InferRpcType<TTypes[P]>>
                : RpcStorageType[P] extends "singleton"
                ? InferRpcType<TTypes[P]>
                : Record<string, InferRpcType<TTypes[P]>>;
        } & {
            findById: (id: string | number) => InferRpcType<TTypes[K]> | null;
            findAll: () => InferRpcType<TTypes[K]>[];
            mergeRpc: {
                (
                    data:
                        | Record<
                              string,
                              Partial<InferRpcType<TTypes[K]>> | null
                          >
                        | InferRpcType<TTypes[K]>[]
                        | Partial<InferRpcType<TTypes[K]>>
                ): InferRpcType<TTypes[K]>[];
                <RpcStorageType extends Record<keyof TTypes, StorageType>>(
                    data: RpcStorageType[K] extends "collection"
                        ?
                              | Record<
                                    string,
                                    Partial<InferRpcType<TTypes[K]>> | null
                                >
                              | InferRpcType<TTypes[K]>[]
                        : RpcStorageType[K] extends "singleton"
                        ? Partial<InferRpcType<TTypes[K]>>
                        : never
                ): InferRpcType<TTypes[K]>[];
            };
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

export const createRpcHooks = <
    TTypes extends Record<string, Rpc<any>>,
    RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
        keyof TTypes,
        StorageType
    >
>(
    typeKeys: Array<keyof TTypes>
): RpcHooks<TTypes, RpcStorageType> => {
    const EMPTY_MAP: Record<string, unknown> = Object.freeze({});

    const hooks = {} as RpcHooks<TTypes, RpcStorageType>;

    // Основные хуки для каждого типа
    typeKeys.forEach((typeName) => {
        const hookName = `use${toPascalCase(
            String(typeName)
        )}` as keyof RpcHooks<TTypes>;
        const typeKey = typeName as keyof TTypes;

        function useHook(id?: string | number) {
            const { repository } = useRpc<TTypes>();
            const allData = useSelector(
                (state: RpcState<TTypes>) =>
                    (state.rpc[typeKey] as unknown) ?? EMPTY_MAP
            ) as Record<string | number, InferRpcType<TTypes[typeof typeKey]>>;

            const list = React.useMemo(
                () =>
                    Object.values(allData) as InferRpcType<
                        TTypes[typeof typeKey]
                    >[],
                [allData]
            );


            const findById = React.useCallback(
                (id: string | number) => repository.findById(typeKey, id),
                [repository]
            );
            const findAll = React.useCallback(
                () => repository.findAll(typeKey),
                [repository]
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
                        | Partial<InferRpcType<TTypes[typeof typeKey]>>
                ) => {
                    repository.mergeRpc(typeKey, data);
                },
                [repository]
            );

            if (id !== undefined) {
                return findById(id);
            }

            const storageType = (repository as any).getStorageType?.(
                String(typeKey)
            );
            const dataForKey =
                storageType === "singleton" && list.length > 0
                    ? allData
                    : storageType === "singleton"
                    ? null
                    : list;

            const mapForKey =
                storageType === "singleton" && list.length > 0
                    ? allData
                    : allData;

            return {
                [`${String(typeKey)}s`]: dataForKey,
                [`${String(typeKey)}Map`]: mapForKey,
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

            const rpcVersion = React.useMemo(() => {
                return Object.keys(allRpcData).length;
            }, [allRpcData]);

            const fullData = React.useMemo(() => {
                void rpcVersion;
                try {
                    return (repository as any).getFullRelatedData(
                        typeName,
                        id
                    ) as TResult | TResult[] | null;
                } catch {
                    return null;
                }
            }, [repository, id, rpcVersion]);

            return fullData;
        }
        (hooks as any)[fullRelatedHookName] = useFullRelatedHook;
    });

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

            // Кэшируем тип хранилища для данного типа
            const storageType = React.useMemo(() => {
                return (repository as any).getStorageType?.(String(typeName));
            }, [repository]);

            const invoke = React.useCallback(
                (
                    events: Array<{
                        type: typeof typeName;
                        payload: any;
                    }>
                ) => {
                    if (!events || events.length === 0) return;
                    const event = events[0];

                    if (
                        storageType === "singleton" &&
                        Array.isArray(event.payload) &&
                        event.payload.length > 0
                    ) {
                        const singletonEvent = {
                            ...event,
                            payload: event.payload[0],
                        };
                        callbackRef.current(singletonEvent as any);
                    } else {
                        callbackRef.current(event as any);
                    }
                },
                [storageType]
            );

            React.useEffect(() => {
                if (
                    listenerIdRef.current &&
                    typeof (repository as any).offDataChanged === "function"
                ) {
                    (repository as any).offDataChanged(listenerIdRef.current);
                    listenerIdRef.current = null;
                }

                listenerIdRef.current = (repository as any).onDataChanged(
                    invoke,
                    {
                        types: [typeName],
                    }
                );

                return () => {
                    if (
                        listenerIdRef.current &&
                        typeof (repository as any).offDataChanged === "function"
                    ) {
                        (repository as any).offDataChanged(
                            listenerIdRef.current
                        );
                        listenerIdRef.current = null;
                    }
                };
            }, [repository, invoke]);
            // Возвращаем функцию для ручной отписки
            return () => {
                if (
                    listenerIdRef.current &&
                    typeof (repository as any).offDataChanged === "function"
                ) {
                    (repository as any).offDataChanged(listenerIdRef.current);
                    listenerIdRef.current = null;
                }
            };
        }
        (hooks as any)[listenerHookName] = useListenerHook;
    });

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

        const types = (options?.types || typeKeys) as Array<keyof TTypes>;

        // Стабилизируем массив типов через ключ-строку
        const typesKey = React.useMemo(() => {
            const sorted = [...types].sort();
            return sorted.join(",");
        }, [types]);

        const stableTypes = React.useMemo(() => {
            // Используем typesKey для инвалидации
            void typesKey;
            return options?.types || typeKeys;
        }, [typesKey, options?.types]);

        React.useEffect(() => {
            if (
                listenerIdRef.current &&
                typeof (repository as any).offDataChanged === "function"
            ) {
                (repository as any).offDataChanged(listenerIdRef.current);
                listenerIdRef.current = null;
            }

            listenerIdRef.current = (repository as any).onDataChanged(
                callbackRef.current as any,
                {
                    types: stableTypes,
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
        }, [repository, stableTypes]);
        // Возвращаем функцию для ручной отписки
        return () => {
            if (
                listenerIdRef.current &&
                typeof (repository as any).offDataChanged === "function"
            ) {
                (repository as any).offDataChanged(listenerIdRef.current);
                listenerIdRef.current = null;
            }
        };
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
                (state: RpcState<TTypes>) =>
                    (state.rpc[typeName] as unknown) ?? EMPTY_MAP
            );
            const targetData = useSelector(
                (state: RpcState<TTypes>) =>
                    (state.rpc[targetType] as unknown) ?? EMPTY_MAP
            );

            // Используем объединенную версию для инвалидации кэша
            const dataVersion = React.useMemo(() => {
                const sourceKeys = Object.keys(sourceData as any).length;
                const targetKeys = Object.keys(targetData as any).length;
                return `${sourceKeys}:${targetKeys}`;
            }, [sourceData, targetData]);

            const relatedData = React.useMemo(() => {
                // Привязываем пересчет к dataVersion
                void dataVersion;
                try {
                    return (repository as any).getRelated(
                        typeName,
                        id,
                        targetType
                    ) as Array<
                        TTypes[TTarget] extends Rpc<infer S>
                            ? z.infer<S>
                            : never
                    >;
                } catch {
                    return [] as Array<
                        TTypes[TTarget] extends Rpc<infer S>
                            ? z.infer<S>
                            : never
                    >;
                }
            }, [repository, id, targetType, dataVersion]);

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
