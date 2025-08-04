/* eslint-disable @typescript-eslint/no-explicit-any */
import { Rpc } from "@yunu-lab/rpc-ts";
import React from "react";
import { useSelector } from "react-redux";
import { useRpc } from "./useRpc";
import { z } from "zod";

type InferRpcType<T> = T extends Rpc<infer S> ? z.infer<S> : never;

// Преобразует snake_case в PascalCase для названий хуков
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
        callback: (events: Array<{
            type: K;
            payload: InferRpcType<TTypes[K]>[];
        }>) => void,
        options?: { types?: K[] }
    ) => () => void;
} & {
    useDataListener: (
        callback: (events: Array<{
            type: keyof TTypes;
            payload: any[];
        }>) => void,
        options?: { types?: (keyof TTypes)[] }
    ) => () => void;
} & {
    [K in keyof TTypes as `use${ToPascalCase<string & K>}Related`]: <TTarget extends keyof TTypes>(
        id: string | number,
        targetType: TTarget
    ) => Array<TTypes[TTarget] extends Rpc<infer S> ? z.infer<S> : never>;
};

export const createRpcHooks = <TTypes extends Record<string, Rpc<any>>>(
    typeKeys: Array<keyof TTypes>
): RpcHooks<TTypes> => {
    // Преобразует snake_case в camelCase и делает первую букву заглавной
    const toPascalCase = (s: string): string => {
        return s
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    };

    const capitalize = (s: string): string =>
        s.charAt(0).toUpperCase() + s.slice(1);

    const hooks = {} as RpcHooks<TTypes>;

    typeKeys.forEach((typeName) => {
        const hookName = `use${toPascalCase(
            String(typeName)
        )}` as keyof RpcHooks<TTypes>;
        const typeKey = typeName as keyof TTypes;

        const hook = (id?: string | number) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { repository } = useRpc<TTypes>();

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const allData = useSelector(
                (state: RpcState<TTypes>) => state.rpc[typeKey] || {}
            );

            const findById = (id: string | number) =>
                repository.findById(typeKey, id);
            const findAll = () => repository.findAll(typeKey);
            const mergeRpc = (
                data:
                    | Record<
                          string,
                          Partial<InferRpcType<TTypes[typeof typeKey]>> | null
                      >
                    | InferRpcType<TTypes[typeof typeKey]>[]
            ) => repository.mergeRpc(typeKey, data);

            if (id !== undefined) {
                return (
                    (allData[id] as InferRpcType<
                        TTypes[typeof typeKey]
                    > | null) || null
                );
            }

            const types = Object.values(allData) as InferRpcType<
                TTypes[typeof typeKey]
            >[];
            return {
                [`${String(typeName)}s`]: types,
                findById,
                findAll,
                mergeRpc,
            };
        };

        (hooks as any)[hookName] = hook;
    });

    typeKeys.forEach((typeName) => {
        const fullRelatedHookName = `use${capitalize(
            String(typeName)
        )}FullRelatedData` as keyof RpcHooks<TTypes>;

        const fullRelatedHook = <
            TResult = InferRpcType<TTypes[typeof typeName]>
        >(
            id?: string | number
        ) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { repository } = useRpc<TTypes>();

            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [fullData, setFullData] = React.useState<
                TResult | TResult[] | null
            >(null);

            // eslint-disable-next-line react-hooks/rules-of-hooks
            React.useEffect(() => {
                const getData = () => {
                    try {
                        const result = (repository as any).getFullRelatedData(
                            typeName,
                            id
                        ) as TResult | TResult[] | null;
                        setFullData(result);
                    } catch (error) {
                        console.error(
                            `Error getting full related data for ${String(
                                typeName
                            )}:`,
                            error
                        );
                        setFullData(null);
                    }
                };

                getData();
            }, [repository, id]);

            return fullData;
        };

        (hooks as any)[fullRelatedHookName] = fullRelatedHook;
    });

    // Добавляем хуки для слушания изменений
    typeKeys.forEach((typeName) => {
        const listenerHookName = `use${capitalize(
            String(typeName)
        )}Listener` as keyof RpcHooks<TTypes>;
        
        const listenerHook = (
            callback: (events: Array<{
                type: typeof typeName;
                payload: InferRpcType<TTypes[typeof typeName]>[];
            }>) => void,
            options?: { types?: (typeof typeName)[] }
        ) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { repository } = useRpc<TTypes>();
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React.useEffect(() => {
                const listenerId = (repository as any).onDataChanged(
                    callback,
                    { types: options?.types || [typeName] }
                );
                
                // Возвращаем функцию для отписки
                return () => {
                    if (listenerId && typeof (repository as any).removeListener === 'function') {
                        (repository as any).removeListener(listenerId);
                    }
                };
            }, [repository, callback, options?.types]);
            
            // Возвращаем функцию для ручной отписки
            return () => {
                // Эта функция может быть вызвана вручную для отписки
            };
        };

        (hooks as any)[listenerHookName] = listenerHook;
    });

    // Добавляем универсальный хук для слушания всех изменений
    const useDataListener = (
        callback: (events: Array<{
            type: keyof TTypes;
            payload: any[];
        }>) => void,
        options?: { types?: (keyof TTypes)[] }
    ) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { repository } = useRpc<TTypes>();
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
            const listenerId = (repository as any).onDataChanged(
                callback,
                { types: options?.types || typeKeys }
            );
            
            // Возвращаем функцию для отписки
            return () => {
                if (listenerId && typeof (repository as any).removeListener === 'function') {
                    (repository as any).removeListener(listenerId);
                }
            };
        }, [repository, callback, options?.types]);
        
        // Возвращаем функцию для ручной отписки
        return () => {
            // Эта функция может быть вызвана вручную для отписки
        };
    };

    (hooks as any).useDataListener = useDataListener;

    // Добавляем хуки для получения связанных данных
    typeKeys.forEach((typeName) => {
        const relatedHookName = `use${capitalize(
            String(typeName)
        )}Related` as keyof RpcHooks<TTypes>;
        
        const relatedHook = <TTarget extends keyof TTypes>(
            id: string | number,
            targetType: TTarget
        ) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { repository } = useRpc<TTypes>();
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [relatedData, setRelatedData] = React.useState<Array<
                TTypes[TTarget] extends Rpc<infer S> ? z.infer<S> : never
            >>([]);
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            React.useEffect(() => {
                const getRelatedData = () => {
                    try {
                        // Используем метод getRelated из репозитория
                        const result = (repository as any).getRelated(
                            typeName,
                            id,
                            targetType
                        );
                        setRelatedData(result);
                    } catch (error) {
                        console.error(
                            `Error getting related data for ${String(typeName)}:`,
                            error
                        );
                        setRelatedData([]);
                    }
                };
                
                getRelatedData();
            }, [repository, typeName, id, targetType]);
            
            return relatedData;
        };

        (hooks as any)[relatedHookName] = relatedHook;
    });

    return hooks;
};
