/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { Rpc, RpcRepository, StorageType } from "@yunu-lab/rpc-ts";
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
        };
        (id: string | number): InferRpcType<TTypes[K]> | null;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(Object.keys(rpcs).sort())]
    );

    const repository = React.useMemo(() => {
        const repo = new RpcRepository<TTypes>();
        typeNames.forEach((key) => {
            const { rpc, storageType } = rpcs[key];
            repo.registerRpc(String(key), rpc, { storageType });
        });
        return repo;
    }, [typeNames]);

    const [rpcState, setRpcState] = React.useState<RpcState<TTypes>>({});

    React.useEffect(() => {
        const unsubscribe = repository.onDataChanged(
            (events: Array<{ type: keyof TTypes; payload: any }>) => {
                setRpcState((prev) => {
                    const next: RpcState<TTypes> = { ...prev };
                    for (const event of events) {
                        const type = event.type as keyof TTypes;
                        const storageType = (
                            repository as any
                        ).getStorageType?.(String(type));
                        if (storageType === "singleton") {
                            next[type] = event.payload ?? null;
                        } else {
                            const map = (event.payload as any[]).reduce(
                                (
                                    acc: Record<string | number, any>,
                                    item: any
                                ) => {
                                    acc[item.id] = item;
                                    return acc;
                                },
                                {}
                            );
                            next[type] = map;
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
    }, [repository, typeNames]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const useInlineSelector = <TSelected>(
        selector: (state: RpcState<TTypes>) => TSelected
    ): TSelected => {
        return selector(rpcState);
    };

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
                        repository.mergeRpc(typeName, data);
                        const updated = repository.findAll(typeName) as Array<
                            InferRpcType<TTypes[typeof typeName]>
                        >;
                        setRpcState((prev) => {
                            const next: RpcState<TTypes> = { ...prev };
                            if (storageType === "singleton") {
                                next[typeName] =
                                    updated.length > 0 ? updated[0] : null;
                            } else {
                                const map = updated.reduce(
                                    (
                                        acc: Record<string | number, any>,
                                        item: any
                                    ) => {
                                        acc[(item as any).id] = item;
                                        return acc;
                                    },
                                    {}
                                );
                                next[typeName] = map;
                            }
                            return next;
                        });
                    },
                    [repository, typeName, storageType]
                );

                const collectionMap = useMemo(
                    () =>
                        (storageType === "singleton"
                            ? {}
                            : allData || {}) as Record<
                            string | number,
                            InferRpcType<TTypes[typeof typeName]>
                        >,
                    [allData]
                );
                const list = useMemo(
                    () =>
                        Object.values(collectionMap) as Array<
                            InferRpcType<TTypes[typeof typeName]>
                        >,
                    [collectionMap]
                );

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
                    } as any;
                }

                return {
                    [`${String(typeName)}s`]: list,
                    [`${String(typeName)}Map`]: collectionMap,
                    findById,
                    findAll,
                    mergeRpc,
                } as any;
            }

            (result as any)[hookName] = useTypeHook;
        });

        return result as InlineRpcHooks<TTypes, RpcStorageType>;
    }, [rpcs, repository, useInlineSelector]);

    return { hooks, repository } as const;
}
