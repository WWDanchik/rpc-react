/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Message, Rpc, RpcRepository, StorageType } from "@yunu-lab/rpc-ts";
import { z } from "zod";

type InferRpcType<T> = T extends Rpc<infer S> ? z.infer<S> : never;

type ToPascalCase<S extends string> = S extends `${infer First}_${infer Rest}`
    ? `${Capitalize<First>}${ToPascalCase<Rest>}`
    : Capitalize<S>;

type InlineRpcHooks<
    TTypes extends Record<string, Rpc<any>>,
    RpcStorageType extends Record<keyof TTypes, StorageType>
> = {
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
                ? InferRpcType<TTypes[P]> | null
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
                <Rst extends Record<keyof TTypes, StorageType>>(
                    data: Rst[K] extends "collection"
                        ?
                              | Record<
                                    string,
                                    Partial<InferRpcType<TTypes[K]>> | null
                                >
                              | InferRpcType<TTypes[K]>[]
                        : Rst[K] extends "singleton"
                        ? Partial<InferRpcType<TTypes[K]>>
                        : never
                ): Rst[K] extends "collection"
                    ? InferRpcType<TTypes[K]>[]
                    : Rst[K] extends "singleton"
                    ? InferRpcType<TTypes[K]>
                    : never;
            };
            clear: () => void;
        };
        (id: string | number): InferRpcType<TTypes[K]> | null;
    };
} & {
    // Пер-типовые слушатели
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Listener`]: <
        RpcStorageTypeMap extends Record<
            keyof TTypes,
            StorageType
        > = RpcStorageType
    >(
        callback: (event: {
            type: K;
            payload: RpcStorageTypeMap[K] extends "collection"
                ? Array<InferRpcType<TTypes[K]>>
                : RpcStorageTypeMap[K] extends "singleton"
                ? InferRpcType<TTypes[K]>
                : Array<InferRpcType<TTypes[K]>>;
        }) => void
    ) => () => void;
} & {
    // Общий слушатель по нескольким типам
    useDataListener: <
        RpcStorageTypeMap extends Record<
            keyof TTypes,
            StorageType
        > = RpcStorageType
    >(
        callback: (
            events: Array<{
                type: keyof TTypes;
                payload: RpcStorageTypeMap[keyof TTypes] extends "collection"
                    ? Array<InferRpcType<TTypes[keyof TTypes]>>
                    : RpcStorageTypeMap[keyof TTypes] extends "singleton"
                    ? InferRpcType<TTypes[keyof TTypes]>
                    : Array<InferRpcType<TTypes[keyof TTypes]>>;
            }>
        ) => void,
        options?: { types?: (keyof TTypes)[] }
    ) => () => void;
} & {
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

export type InlineRpcsConfig<
    TTypes extends Record<string, Rpc<any>>,
    RpcStorageType extends Record<keyof TTypes, StorageType>
> = {
    [K in keyof TTypes]: {
        rpc: TTypes[K];
        storageType: RpcStorageType[K];
        idField?: string;
    };
};

type RpcState<TTypes extends Record<string, Rpc<any>>> = {
    [K in keyof TTypes]?: any;
};

export function useInlineRpcStore<
    TTypes extends Record<string, Rpc<any>>,
    RpcStorageType extends Record<keyof TTypes, StorageType> = Record<
        keyof TTypes,
        StorageType
    >
>(rpcs: InlineRpcsConfig<TTypes, RpcStorageType>) {
    const typeNames = React.useMemo(
        () => Object.keys(rpcs) as Array<keyof TTypes>,
        [rpcs]
    );

    const typeNamesKey = React.useMemo(
        () => Object.keys(rpcs).map(String).sort().join("|"),
        [rpcs]
    );

    const repository = React.useMemo(() => {
        const repo = new RpcRepository<TTypes>();
        typeNames.forEach((key) => {
            const { rpc, storageType } = rpcs[key];
            repo.registerRpc(String(key), rpc, { storageType });
        });
        return repo;
    }, [typeNamesKey]);

    const [rpcState, setRpcState] = React.useState<RpcState<TTypes>>({});

    React.useEffect(() => {
        const unsubscribe = repository.onDataChanged(
            (events: Array<{ type: keyof TTypes; payload: any }>) => {
                console.log(events);

                setRpcState((prev) => {
                    const next: RpcState<TTypes> = { ...prev };
                    for (const event of events) {
                        const type = event.type as keyof TTypes;
                        const storageType =
                            (rpcs as any)[type]?.storageType ??
                            (repository as any).getStorageType?.(String(type));
                        if (storageType === "singleton") {
                            next[type] = Array.isArray(event.payload)
                                ? event.payload[0] ?? null
                                : event.payload ?? null;
                        } else {
                            // Store arrays for collections
                            const nextArray = Array.isArray(event.payload)
                                ? event.payload
                                : Object.values(event.payload || {});
                            next[type] = nextArray;
                        }
                    }
                    return next;
                });
            },
            {
                types: typeNames as readonly (keyof TTypes)[],
            }
        );
        return () => {
            repository.offDataChanged(unsubscribe);
        };
    }, [repository, typeNamesKey]);

    const useInlineSelector = React.useCallback(
        <TSelected>(
            selector: (state: RpcState<TTypes>) => TSelected
        ): TSelected => {
            return selector(rpcState);
        },
        [rpcState]
    );

    const hooks = React.useMemo<InlineRpcHooks<TTypes, RpcStorageType>>(() => {
        const toPascalCase = (s: string): string =>
            s
                .split("_")
                .map(
                    (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                )
                .join("");

        const result: Record<string, any> = {};

        (Object.keys(rpcs) as Array<keyof TTypes>).forEach((typeName) => {
            const storageType = rpcs[typeName].storageType as StorageType;
            const hookName = `use${toPascalCase(String(typeName))}`;

            function useTypeHook(id?: string | number) {
                const allData = useInlineSelector((state) => state[typeName]);

                const findById = React.useCallback(
                    (itemId: string | number) =>
                        (repository as any).findById(typeName, itemId),
                    []
                );
                const findAll = React.useCallback(
                    () => (repository as any).findAll(typeName),
                    []
                );
                const mergeRpc = React.useCallback(
                    (
                        data:
                            | Record<
                                  string,
                                  Partial<
                                      InferRpcType<TTypes[typeof typeName]>
                                  > | null
                              >
                            | Array<InferRpcType<TTypes[typeof typeName]>>
                            | Partial<InferRpcType<TTypes[typeof typeName]>>
                    ) => {
                        // Единственный источник обновления UI — onDataChanged
                        repository.mergeRpc(typeName, data);
                    },
                    []
                );
                const clear = React.useCallback(() => {
                    if (storageType === "singleton") {
                        // Синхронизируем локальное состояние
                        setRpcState((prev) => ({ ...prev, [typeName]: null }));
                    } else {
                        const ids: Array<string | number> = Array.isArray(
                            allData
                        )
                            ? ((allData as Array<any>)
                                  .map((item) =>
                                      item ? (item as any).id : undefined
                                  )
                                  .filter((v) => v !== undefined) as Array<
                                  string | number
                              >)
                            : Object.keys((allData as any) || {});
                        const deletePayload: Record<string | number, null> = {};
                        for (const id of ids) deletePayload[id] = null;
                        if (Object.keys(deletePayload).length > 0) {
                            repository.mergeRpc(typeName, deletePayload);
                        }
                        setRpcState((prev) => ({ ...prev, [typeName]: [] }));
                    }
                }, [allData]);

                const list = useMemo(
                    () =>
                        (Array.isArray(allData)
                            ? allData
                            : Object.values(allData || {})) as Array<
                            InferRpcType<TTypes[typeof typeName]>
                        >,
                    [allData]
                );
                const collectionMap = useMemo(() => {
                    const rec: Record<
                        string | number,
                        InferRpcType<TTypes[typeof typeName]>
                    > = {} as any;

                    if (Array.isArray(list)) {
                        for (const item of list as Array<any>) {
                            if (
                                item &&
                                typeof item === "object" &&
                                !Array.isArray(item) &&
                                "id" in (item as Record<string, unknown>)
                            ) {
                                rec[(item as any).id as any] = item as any;
                            }
                        }
                    }
                    return rec;
                }, [list]);

                if (id !== undefined) {
                    return findById(id);
                }

                if (storageType === "singleton") {
                    const current =
                        (allData as InferRpcType<TTypes[typeof typeName]>) ||
                        null;
                    return {
                        [`${String(typeName)}s`]: current,
                        [`${String(typeName)}Map`]: current,
                        findById,
                        findAll,
                        mergeRpc,
                        clear,
                    } as any;
                }

                return {
                    [`${String(typeName)}s`]: list,
                    [`${String(typeName)}Map`]: collectionMap,
                    findById,
                    findAll,
                    mergeRpc,
                    clear,
                } as any;
            }

            (result as any)[hookName] = useTypeHook;

            // Типизированный слушатель событий для конкретного типа
            const listenerHookName = `use${toPascalCase(
                String(typeName)
            )}Listener`;

            function useListenerHook<
                RpcStorageTypeMap extends Record<
                    keyof TTypes,
                    StorageType
                > = RpcStorageType
            >(
                callback: (event: {
                    type: typeof typeName;
                    payload: RpcStorageTypeMap[typeof typeName] extends "collection"
                        ? Array<InferRpcType<TTypes[typeof typeName]>>
                        : RpcStorageTypeMap[typeof typeName] extends "singleton"
                        ? InferRpcType<TTypes[typeof typeName]>
                        : Array<InferRpcType<TTypes[typeof typeName]>>;
                }) => void
            ) {
                const callbackRef = React.useRef(callback);
                callbackRef.current = callback;

                React.useEffect(() => {
                    const unsub = repository.onDataChanged(
                        (
                            events: Array<{
                                type: keyof TTypes;
                                payload: any;
                            }>
                        ) => {
                            const filtered = events.filter(
                                (e) => e.type === typeName
                            );
                            if (filtered.length === 0) return;
                            const event = filtered[0];
                            const storageType = repository.getStorageType(
                                String(typeName)
                            );
                            if (
                                storageType === "singleton" &&
                                Array.isArray(event.payload)
                            ) {
                                const payload = event.payload[0] ?? null;
                                // для singleton ожидаем объект
                                if (payload) {
                                    callbackRef.current({
                                        type: typeName,
                                        payload,
                                    } as any);
                                }
                            } else {
                                callbackRef.current(event as any);
                            }
                        },
                        { types: [typeName] as any }
                    );
                    return () => {
                        repository.offDataChanged(unsub);
                    };
                }, []);
                return () => {};
            }

            (result as any)[listenerHookName] = useListenerHook;
        });

        // Общий слушатель данных по нескольким типам
        function useDataListener<
            RpcStorageTypeMap extends Record<
                keyof TTypes,
                StorageType
            > = RpcStorageType
        >(
            callback: (
                events: Array<{
                    type: keyof TTypes;
                    payload: RpcStorageTypeMap[keyof TTypes] extends "collection"
                        ? Array<InferRpcType<TTypes[keyof TTypes]>>
                        : RpcStorageTypeMap[keyof TTypes] extends "singleton"
                        ? InferRpcType<TTypes[keyof TTypes]>
                        : Array<InferRpcType<TTypes[keyof TTypes]>>;
                }>
            ) => void,
            options?: { types?: (keyof TTypes)[] }
        ) {
            const callbackRef = React.useRef(callback);
            callbackRef.current = callback;

            const types = options?.types ?? (typeNames as (keyof TTypes)[]);
            const typesKey = React.useMemo(
                () => [...types].map(String).sort().join("|"),
                [types]
            );

            React.useEffect(() => {
                const unsub = repository.onDataChanged(
                    (events: any) => callbackRef.current(events),
                    { types: types as any }
                );
                return () => {
                    repository.offDataChanged(unsub);
                };
            }, [typesKey, types]);
            return () => {};
        }

        (result as any).useDataListener = useDataListener;

        function useHandleMessages() {
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
                RpcStorageTypeMap extends Record<keyof TTypes, StorageType>
            >(
                messages: Array<Message<TTypes>>,
                callbacks?: {
                    [K in keyof TTypes]?: (
                        data: RpcStorageTypeMap[K] extends "collection"
                            ?
                                  | Record<
                                        string,
                                        Partial<InferRpcType<TTypes[K]>> | null
                                    >
                                  | Array<InferRpcType<TTypes[K]>>
                            : RpcStorageTypeMap[K] extends "singleton"
                            ? Partial<InferRpcType<TTypes[K]>>
                            : never
                    ) => void;
                }
            ) => {
                repository.handleMessages<RpcStorageTypeMap>(
                    messages,
                    callbacks
                );
            };

            return { handleMessages, handleMessagesTyped };
        }

        (result as any).useHandleMessages = useHandleMessages;

        return result as InlineRpcHooks<TTypes, RpcStorageType>;
    }, [rpcs, repository, useInlineSelector, typeNames]);

    return { hooks, repository } as const;
}
