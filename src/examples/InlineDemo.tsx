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

const userRpc = new Rpc("user", userSchema, "id");
const errorRpc = new Rpc("error", errorSchema, "code");

const InlineDemo: React.FC = () => {
    const { hooks } = useInlineRpcStore<
        { user: typeof userRpc; error: typeof errorRpc },
        { user: "collection"; error: "singleton" }
    >({
        user: { rpc: userRpc, storageType: "collection" },
        error: { rpc: errorRpc, storageType: "singleton" },
    });

    const { useUser, useError } = hooks;

    const { users, mergeRpc: mergeUser } = useUser();

    const { errors, mergeRpc: mergeError } = useError();

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
        </div>
    );
};

export default InlineDemo;
