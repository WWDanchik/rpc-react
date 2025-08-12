import React from "react";
import { z } from "zod";
import { Rpc } from "@yunu-lab/rpc-ts";
import { useInlineRpcStore } from "..";

// 1) Описываем схемы и Rpc
const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
});
const errorSchema = z.object({
    code: z.string(),
    msg: z.string(),
});

const cellSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.enum(["shelf", "pallet", "box", "loss"]),
    is_stretched: z.boolean(),
    parent_cell_id: z.number().nullable(),
    code: z.string(),
    warehouse_id: z.number(),
    children: z.array(z.object({ id: z.number() })),
    products: z.array(
        z.object({
            id: z.number(),
            barcodes: z.array(z.object({ id: z.number() })),
        })
    ),
});

const userRpc = new Rpc("user", userSchema, "id");
const errorRpc = new Rpc("error", errorSchema, "code");
const cellRpc = new Rpc("cell", cellSchema, "id");

const InlineDemo: React.FC = () => {
    const { hooks } = useInlineRpcStore<
        { user: typeof userRpc; error: typeof errorRpc; cell: typeof cellRpc },
        { user: "collection"; error: "singleton"; cell: "collection" }
    >({
        user: { rpc: userRpc, storageType: "collection" },
        error: { rpc: errorRpc, storageType: "singleton" },
        cell: { rpc: cellRpc, storageType: "collection" },
    });

    const { useUser, useError, useCell } = hooks;

    const { users, mergeRpc: mergeUser } = useUser();

    const { errors, mergeRpc: mergeError } = useError();

    const { cells, mergeRpc: mergeCell } = useCell();
    console.log(cells);

    const addUser = () => {
        const id = Math.floor(Math.random() * 1000);

        mergeUser({
            [id]: { id, name: "Alice", email: "alice@example.com" },
        });
    };

    const setError = () => {
        mergeError({ code: "AUTH_ERROR", msg: "Auth failed" });
    };

    const clearError = () => {
        mergeError({ code: "", msg: "" });
    };

    return (
        <div>
            <h3>Inline RPC Store Demo</h3>

            <div>
                <button onClick={addUser}>Add User</button>
                <ul>
                    {users.map((u) => (
                        <li key={u.id}>
                            {u.name} — {u.email} - {u.id}
                            <button onClick={() => mergeUser({ [u.id]: null })}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <button onClick={setError}>Set Error</button>
                <button onClick={clearError}>Clear Error</button>
                <div>
                    Current error:{" "}
                    {errors ? `${errors.code}: ${errors.msg}` : "none"}
                </div>
            </div>

            <div>
                <button
                    onClick={() =>
                        mergeCell({
                            12: {
                                id: 12,
                                name: "Cell 12",
                                type: "shelf",
                                is_stretched: false,
                                parent_cell_id: null,
                                code: "12",
                                warehouse_id: 1,
                                products: [
                                    {
                                        id: 1,
                                        barcodes: [{ id: 1 }, { id: 2 }],
                                    },
                                ],
                            },
                            13: {
                                id: 13,
                                name: "Cell 13",
                                type: "pallet",
                                is_stretched: true,
                                parent_cell_id: 12,
                                code: "13",
                                warehouse_id: 1,
                                products: [
                                    {
                                        id: 2,
                                        barcodes: [{ id: 3 }, { id: 4 }],
                                    },
                                ],
                            },
                        })
                    }
                >
                    Add Cell
                </button>
                {cells.map((cell) => {
                    return (
                        <div>
                            <div key={cell.id}>{cell.name}</div>;
                            {cell.products.map((product) => {
                                return (
                                    <div>
                                        <div key={product.id}>{product.id}</div>
                                        {product.barcodes.map((barcode) => {
                                            return (
                                                <div key={barcode.id}>
                                                    {barcode.id}{" "}
                                                    <button
                                                        onClick={() =>
                                                            mergeCell({
                                                                [cell.id]: {
                                                                    products: {
                                                                        [product.id]:
                                                                            {
                                                                                barcodes:
                                                                                    {
                                                                                        [barcode.id]:
                                                                                            null,
                                                                                    },
                                                                            },
                                                                    },
                                                                },
                                                            })
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            onClick={() =>
                                                mergeCell({
                                                    [cell.id]: {
                                                        products: {
                                                            [product.id]: {
                                                                barcodes: {
                                                                    [100]: {
                                                                        id: 100,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                })
                                            }
                                        >
                                            add barcode
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InlineDemo;
