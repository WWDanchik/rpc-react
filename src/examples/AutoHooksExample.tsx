/* eslint-disable @typescript-eslint/no-explicit-any */
import { RepositoryTypes, Rpc, RpcRepository } from "@yunu-lab/rpc-ts";
import React from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { z } from "zod";
import { createRpcHooks } from "../hooks/createRpcHooks";
import { RpcProvider } from "../providers/RpcStoreProvider";
import { extendStore } from "../store/extendStore";

const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.email(),
    age: z.number(),
    favoriteProducts: z.array(z.object({ id: z.number() })).optional(),
    ownedProducts: z.array(z.object({ id: z.number() })).optional(),
});

const productSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    description: z.string(),
    ownerId: z.number().optional(),
    purchasedByUsers: z.array(z.object({ id: z.number() })).optional(),
});

const rectangleSchema = z.object({
    id: z.number(),
    width: z.number(),
    height: z.number(),
    createdByUserId: z.number().optional(),
});

// Пример типа с подчеркиванием
const cell_codeSchema = z.object({
    id: z.number(),
    code: z.string(),
    description: z.string(),
    isActive: z.boolean(),
});

const errorSchema = z.object({
    code: z.string(),
    msg: z.string(),
    tech_msg: z.string().optional(),
    text_code: z.string().optional(),
});

const errorRpc = new Rpc("error", errorSchema, "code");

const userRpc = new Rpc("user", userSchema, "id");
const productRpc = new Rpc("product", productSchema, "id");
const rectangleRpc = new Rpc("rectangle", rectangleSchema, "id");
const cell_codeRpc = new Rpc("cell_code", cell_codeSchema, "id");

const repository = new RpcRepository()
    .registerRpc("user", userRpc, { storageType: "collection" })
    .registerRpc("product", productRpc, { storageType: "singleton" })
    .registerRpc("rectangle", rectangleRpc, { storageType: "collection" })
    .registerRpc("cell_code", cell_codeRpc, { storageType: "collection" })
    .registerRpc("error", errorRpc, { storageType: "singleton" });

repository.defineRelation("user", "product", "ownedProducts").hasMany(
    {
        field: "ownedProducts",
        key: "id",
    },
    "id"
);

repository.defineRelation("user", "product", "favoriteProducts").hasMany(
    {
        field: "favoriteProducts",
        key: "id",
    },
    "id"
);

repository.save("user", {
    id: 1,
    name: "Dmitriy",
    email: "dmitriy@example.com",
    age: 12,
    favoriteProducts: [{ id: 1 }, { id: 2 }],
    ownedProducts: [{ id: 1 }],
});

repository.save("user", {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    age: 25,
    favoriteProducts: [{ id: 1 }],
    ownedProducts: [{ id: 2 }],
});

repository.save("product", {
    id: 1,
    name: "Product 1",
    price: 100,
    description: "Product description",
    ownerId: 1,
    purchasedByUsers: [{ id: 1 }, { id: 2 }],
});

repository.save("product", {
    id: 2,
    name: "Product 2",
    price: 200,
    description: "Another product",
    ownerId: 2,
    purchasedByUsers: [{ id: 1 }],
});

repository.save("rectangle", {
    id: 1,
    width: 100,
    height: 100,
    createdByUserId: 1,
});

repository.save("cell_code", {
    id: 1,
    code: "ABC123",
    description: "Sample cell code",
    isActive: true,
});

repository.handleMessages([
    {
        type: "user",
        payload: [
            {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",
                age: 12,
            },
            {
                id: 1123,
                name: "John Doe 1112321312",
                email: "john.doe@example.com",
                age: 121,
            },
        ],
    },
]);

setTimeout(() => {
    repository.handleMessages([
        {
            type: "user",
            payload: {
                143: {
                    name: "John Doe 143",
                    email: "john.doe@example.com",
                    age: 121,
                    id: 143,
                },
                144: {
                    name: "John Doe 144",
                    email: "john.doe@example.com",
                    age: 121,
                    id: 144,
                },
            },
        },
    ]);
}, 3000);

// ========================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ БИБЛИОТЕКИ
// ========================================

// 1. Пользователь создает свой store с Redux Toolkit
import { configureStore } from "@reduxjs/toolkit";
import { cartSlice, themeSlice, userSlice } from "./slices/slices";

// Пользовательский store с несколькими slice'ами
const userStore = configureStore({
    reducer: {
        user: userSlice.reducer,
        cart: cartSlice.reducer,
        theme: themeSlice.reducer,
    },
});

// Расширяем существующий store RPC функциональностью
const { store: extendedStore, repository: configuredRepository } = extendStore({
    repository,
    store: userStore,
    slices: {
        user: userSlice.reducer,
        cart: cartSlice.reducer,
        theme: themeSlice.reducer,
    },
});

// Теперь extendedStore содержит:
// - user: { currentUser: null } (пользовательский reducer)
// - cart: { items: [], total: 0 } (корзина)
// - theme: { mode: "light" } (тема)
// - rpc: { user: {...}, product: {...} } (RPC reducer)

type RpcStorageType = {
    user: "collection";
    product: "singleton";
    rectangle: "collection";
    cell_code: "collection";
    error: "singleton";
};

const {
    useUser,
    useProduct,
    useUserFullRelatedData,
    useProductFullRelatedData,

    useProductListener,
    useDataListener,
    useUserRelated,
    useProductRelated,
    useCellCode,

    useUserListener,

    useErrorListener,
} = createRpcHooks<RepositoryTypes<typeof repository>>([
    "cell_code",
    "user",
    "product",
    "rectangle",
    "error",
]);

const CellCodeList: React.FC = () => {
    const { cell_codes } = useCellCode();

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                minWidth: "300px",
            }}
        >
            <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                📱 Cell Codes
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {cell_codes.map((cellCode) => (
                    <li
                        key={cellCode.id}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            margin: "10px 0",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{ fontWeight: "bold", marginBottom: "5px" }}
                        >
                            {cellCode.code}
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.9 }}>
                            {cellCode.description}
                        </div>
                        <div style={{ fontSize: "12px", opacity: 0.8 }}>
                            Status:{" "}
                            {cellCode.isActive ? "✅ Active" : "❌ Inactive"}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Компонент для работы с пользователями
const UsersList: React.FC = () => {
    const { users, mergeRpc } = useUser();
    useUserListener<RpcStorageType>((events) => {
        console.log(events);
    });
    const handleAddUser = () => {
        const id = Math.floor(Math.random() * 1000);
        mergeRpc({
            [id]: {
                age: 12,
                name: "John Doe",
                email: "john.doe@example.com",
                id,
            },
        });
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                minWidth: "300px",
            }}
        >
            <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>👥 Users</h2>
            <button
                onClick={handleAddUser}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "15px",
                    fontSize: "14px",
                }}
            >
                ➕ Add User
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {users.map((user) => (
                    <li
                        key={user.id}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            margin: "10px 0",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{ fontWeight: "bold", marginBottom: "5px" }}
                        >
                            {user.name}
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.9 }}>
                            Age: {user.age} years
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                opacity: 0.9,
                                marginBottom: "10px",
                            }}
                        >
                            {user.email}
                        </div>
                        <button
                            onClick={() => {
                                mergeRpc({
                                    [user.id]: null,
                                });
                            }}
                            style={{
                                background: "rgba(255,100,100,0.8)",
                                border: "none",
                                color: "white",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            🗑️ Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Компонент для работы с продуктами
const ProductsList: React.FC = () => {
    useProductListener((event) => {
        console.log(event);
    });
    const { products, mergeRpc } = useProduct();

    const handleAddProduct = () => {
        const id = Math.floor(Math.random() * 1000);
        mergeRpc({
            [id]: {
                description: "Product description",
                name: "Product name",
                price: 100,
                id,
            },
        });
    };

    const handleIncreasePrice = (id: number) => {
        const product = products.find((p) => p.id === id);
        if (product) {
            mergeRpc({
                [id]: { price: product.price * 1.1 },
            });
        }
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                minWidth: "300px",
            }}
        >
            <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                🛍️ Products
            </h2>
            <button
                onClick={handleAddProduct}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "15px",
                    fontSize: "14px",
                }}
            >
                ➕ Add Product
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {products.map((product) => (
                    <li
                        key={product.id}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            margin: "10px 0",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: "bold",
                                marginBottom: "5px",
                                fontSize: "16px",
                            }}
                        >
                            {product.name}
                        </div>
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#ffd700",
                                marginBottom: "5px",
                            }}
                        >
                            ${product.price.toFixed(2)}
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                opacity: 0.9,
                                marginBottom: "10px",
                            }}
                        >
                            {product.description}
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => handleIncreasePrice(product.id)}
                                style={{
                                    background: "rgba(255,215,0,0.8)",
                                    border: "none",
                                    color: "white",
                                    padding: "5px 10px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                }}
                            >
                                💰 +10% price
                            </button>
                            <button
                                onClick={() => {
                                    mergeRpc({
                                        [product.id]: null,
                                    });
                                }}
                                style={{
                                    background: "rgba(255,100,100,0.8)",
                                    border: "none",
                                    color: "white",
                                    padding: "5px 10px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                }}
                            >
                                🗑️ Remove
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Компонент для демонстрации получения отдельных элементов
const ItemDetails: React.FC<{ userId?: number; productId?: number }> = ({
    userId,
    productId,
}) => {
    const user = useUser(userId || 0);
    const product = useProduct(productId || 0);

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                🔍 Selected Items
            </h3>
            {user && (
                <div
                    style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "15px",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
                        👤 User: {user.name}
                    </h4>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        📧 Email: {user.email}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        🎂 Age: {user.age} years
                    </p>
                </div>
            )}
            {product && (
                <div
                    style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
                        🛍️ Product: {product.name}
                    </h4>
                    <p
                        style={{
                            margin: "5px 0",
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#ffd700",
                        }}
                    >
                        💰 Price: ${product.price.toFixed(2)}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                        📝 {product.description}
                    </p>
                </div>
            )}
        </div>
    );
};

// Компонент для демонстрации связанных данных
// Компонент для демонстрации связанных данных
const RelatedDataExample: React.FC = () => {
    const userRelatedProducts = useUserRelated(1, "product");
    const productRelatedUsers = useProductRelated(1, "user");

    console.log(productRelatedUsers);

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                🔗 Related Data Example
            </h3>

            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                    <h4 style={{ color: "#667eea" }}>👤 User 1 → Products</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {userRelatedProducts.map((product) => (
                            <li
                                key={product.id}
                                style={{
                                    background: "rgba(102, 126, 234, 0.1)",
                                    padding: "8px 12px",
                                    margin: "5px 0",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(102, 126, 234, 0.2)",
                                }}
                            >
                                <strong>{product.name}</strong> —{" "}
                                <span style={{ color: "#f5576c" }}>
                                    ${product.price}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ color: "#f093fb" }}>🛍️ Product 1 → Users</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {productRelatedUsers.map((user) => (
                            <li
                                key={user.id}
                                style={{
                                    background: "rgba(240, 147, 251, 0.1)",
                                    padding: "8px 12px",
                                    margin: "5px 0",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(240, 147, 251, 0.2)",
                                }}
                            >
                                <strong>{user.name}</strong>{" "}
                                <span style={{ opacity: 0.7 }}>
                                    ({user.email})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

//
const DataListenerExample: React.FC = () => {
    const [userEvents, setUserEvents] = React.useState<any[]>([]);
    const [productEvents, setProductEvents] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    useDataListener(
        (events) => {
            events.forEach(() => {});
        },
        { types: ["user", "product"] }
    );

    // Пример использования useErrorListener для singleton
    useErrorListener<RpcStorageType>((errorData) => {
        console.log("Error received:", errorData);
        console.log("Error payload:", errorData.payload);
        console.log("Error payload type:", typeof errorData.payload);
        console.log("Error payload is array:", Array.isArray(errorData.payload));
        
        // Для singleton payload это объект, а не массив
        if (errorData.payload && typeof errorData.payload === 'object' && !Array.isArray(errorData.payload)) {
            setError(errorData.payload.msg);
        } else {
            console.error("Unexpected payload format:", errorData.payload);
        }
    });

    const clearEvents = () => {
        setUserEvents([]);
        setProductEvents([]);
        setError(null);
    };

    const testError = () => {
        (repository as any).handleMessages([
            {
                type: "error",
                payload: [
                    {
                        code: "TEST_ERROR",
                        msg: "Это тестовая ошибка для проверки useErrorListener!",
                        tech_msg: "Technical details here",
                        text_code: "TEST_001"
                    }
                ]
            }
        ]);
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                marginTop: "20px",
            }}
        >
            {error && (
                <div
                    style={{
                        background: "rgba(255,0,0,0.1)",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "1px solid rgba(255,0,0,0.3)",
                        color: "#d32f2f",
                    }}
                >
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
                        ❌ Error from useErrorListener
                    </h4>
                    <p style={{ margin: 0 }}>{error}</p>
                </div>
            )}

            <h3 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                👂 Data Change Listeners
            </h3>
            
            <div style={{ marginBottom: "20px" }}>
                <button
                    onClick={testError}
                    style={{
                        background: "rgba(255,0,0,0.8)",
                        border: "none",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginRight: "10px",
                    }}
                >
                    🚨 Test Error (useErrorListener)
                </button>
                <button
                    onClick={clearEvents}
                    style={{
                        background: "rgba(102, 126, 234, 0.8)",
                        border: "none",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    🗑️ Clear All
                </button>
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#667eea",
                        }}
                    >
                        👤 User Events ({userEvents.length})
                    </h4>
                    <button
                        onClick={clearEvents}
                        style={{
                            background: "rgba(102, 126, 234, 0.8)",
                            border: "none",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginBottom: "10px",
                        }}
                    >
                        🗑️ Clear Events
                    </button>
                    <div style={{ maxHeight: "200px", overflow: "auto" }}>
                        {userEvents.map((event, index) => (
                            <div
                                key={index}
                                style={{
                                    background: "rgba(102, 126, 234, 0.1)",
                                    padding: "8px",
                                    margin: "5px 0",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    border: "1px solid rgba(102, 126, 234, 0.2)",
                                }}
                            >
                                <strong>{event.type}</strong>:{" "}
                                {event.payload.length} items
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#f093fb",
                        }}
                    >
                        🛍️ Product Events ({productEvents.length})
                    </h4>
                    <div style={{ maxHeight: "200px", overflow: "auto" }}>
                        {productEvents.map((event, index) => (
                            <div
                                key={index}
                                style={{
                                    background: "rgba(240, 147, 251, 0.1)",
                                    padding: "8px",
                                    margin: "5px 0",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    border: "1px solid rgba(240, 147, 251, 0.2)",
                                }}
                            >
                                <strong>{event.type}</strong>:{" "}
                                {event.payload.length} items
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div
                style={{
                    background: "rgba(255,255,255,0.8)",
                    padding: "15px",
                    borderRadius: "8px",
                    marginTop: "20px",
                    border: "1px solid rgba(0,0,0,0.1)",
                }}
            >
                <h4
                    style={{
                        margin: "0 0 15px 0",
                        fontSize: "18px",
                        color: "#4facfe",
                    }}
                >
                    📊 Event Statistics
                </h4>
                <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                        <strong>Total User Events:</strong> {userEvents.length}
                    </div>
                    <div>
                        <strong>Total Product Events:</strong>{" "}
                        {productEvents.length}
                    </div>
                    <div>
                        <strong>Total Events:</strong>{" "}
                        {userEvents.length + productEvents.length}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RelatedHooksExample: React.FC = () => {
    const userFavoriteProducts = useUserRelated(1, "product");
    const userOwnedProducts = useUserRelated(1, "product");

    const productOwner = useProductRelated(1, "user");
    const productPurchasers = useProductRelated(1, "user");

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                🔗 Related Hooks Example
            </h3>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#667eea",
                        }}
                    >
                        👤 User Related Data (ID: 1)
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                        <h5
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "16px",
                                color: "#f093fb",
                            }}
                        >
                            ❤️ Favorite Products ({userFavoriteProducts.length}
                            ):
                        </h5>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {userFavoriteProducts.map((product: any) => (
                                <span
                                    key={product.id}
                                    style={{
                                        background: "rgba(240, 147, 251, 0.2)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        border: "1px solid rgba(240, 147, 251, 0.3)",
                                    }}
                                >
                                    {product.name} - ${product.price}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h5
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "16px",
                                color: "#4facfe",
                            }}
                        >
                            🏠 Owned Products ({userOwnedProducts.length}):
                        </h5>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {userOwnedProducts.map((product: any) => (
                                <span
                                    key={product.id}
                                    style={{
                                        background: "rgba(79, 172, 254, 0.2)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        border: "1px solid rgba(79, 172, 254, 0.3)",
                                    }}
                                >
                                    {product.name} - ${product.price}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#f093fb",
                        }}
                    >
                        🛍️ Product Related Data (ID: 1)
                    </h4>

                    <div style={{ marginBottom: "15px" }}>
                        <h5
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "16px",
                                color: "#667eea",
                            }}
                        >
                            👑 Owner ({productOwner.length}):
                        </h5>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {productOwner.map((user: any) => (
                                <span
                                    key={user.id}
                                    style={{
                                        background: "rgba(102, 126, 234, 0.2)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        border: "1px solid rgba(102, 126, 234, 0.3)",
                                    }}
                                >
                                    {user.name} ({user.email})
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h5
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "16px",
                                color: "#f5576c",
                            }}
                        >
                            🛒 Purchasers ({productPurchasers.length}):
                        </h5>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {productPurchasers.map((user: any) => (
                                <span
                                    key={user.id}
                                    style={{
                                        background: "rgba(245, 87, 108, 0.2)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        border: "1px solid rgba(245, 87, 108, 0.3)",
                                    }}
                                >
                                    {user.name} ({user.email})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FullRelatedDataExample: React.FC = () => {
    const userFullData = useUserFullRelatedData(1);
    const productFullData = useProductFullRelatedData(1);
    const allUsersFullData = useUserFullRelatedData();

    const renderUserData = (user: any) => (
        <div
            style={{
                background: "rgba(102, 126, 234, 0.1)",
                padding: "15px",
                borderRadius: "8px",
                margin: "10px 0",
                border: "1px solid rgba(102, 126, 234, 0.2)",
            }}
        >
            <h5
                style={{
                    margin: "0 0 10px 0",
                    fontSize: "16px",
                    color: "#667eea",
                }}
            >
                👤 {user.name}
            </h5>
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                📧 {user.email} | 🎂 {user.age} years
            </div>

            {user.favoriteProducts && user.favoriteProducts.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#f093fb",
                            marginBottom: "5px",
                        }}
                    >
                        ❤️ Favorite Products:
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        {user.favoriteProducts.map((product: any) => (
                            <span
                                key={product.id}
                                style={{
                                    background: "rgba(240, 147, 251, 0.2)",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    border: "1px solid rgba(240, 147, 251, 0.3)",
                                }}
                            >
                                {product.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {user.ownedProducts && user.ownedProducts.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#4facfe",
                            marginBottom: "5px",
                        }}
                    >
                        🏠 Owned Products:
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        {user.ownedProducts.map((product: any) => (
                            <span
                                key={product.id}
                                style={{
                                    background: "rgba(79, 172, 254, 0.2)",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    border: "1px solid rgba(79, 172, 254, 0.3)",
                                }}
                            >
                                {product.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderProductData = (product: any) => (
        <div
            style={{
                background: "rgba(240, 147, 251, 0.1)",
                padding: "15px",
                borderRadius: "8px",
                margin: "10px 0",
                border: "1px solid rgba(240, 147, 251, 0.2)",
            }}
        >
            <h5
                style={{
                    margin: "0 0 10px 0",
                    fontSize: "16px",
                    color: "#f093fb",
                }}
            >
                🛍️ {product.name}
            </h5>
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                💰 ${product.price} | 📝 {product.description}
            </div>

            {product.ownerId && (
                <div style={{ marginTop: "10px" }}>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#667eea",
                            marginBottom: "5px",
                        }}
                    >
                        👑 Owner:
                    </div>
                    <span
                        style={{
                            background: "rgba(102, 126, 234, 0.2)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            border: "1px solid rgba(102, 126, 234, 0.3)",
                        }}
                    >
                        User ID: {product.ownerId}
                    </span>
                </div>
            )}

            {product.purchasedByUsers &&
                product.purchasedByUsers.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                        <div
                            style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#f5576c",
                                marginBottom: "5px",
                            }}
                        >
                            🛒 Purchased By:
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            {product.purchasedByUsers.map((user: any) => (
                                <span
                                    key={user.id}
                                    style={{
                                        background: "rgba(245, 87, 108, 0.2)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        border: "1px solid rgba(245, 87, 108, 0.3)",
                                    }}
                                >
                                    User {user.id}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                🌳 Full Related Data Example
            </h3>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#667eea",
                        }}
                    >
                        👤 User with Full Related Data (ID: 1)
                    </h4>
                    {userFullData && renderUserData(userFullData)}
                </div>

                <div
                    style={{
                        background: "rgba(255,255,255,0.8)",
                        padding: "15px",
                        borderRadius: "8px",
                        flex: 1,
                        minWidth: "300px",
                        border: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "18px",
                            color: "#f093fb",
                        }}
                    >
                        🛍️ Product with Full Related Data (ID: 1)
                    </h4>
                    {productFullData && renderProductData(productFullData)}
                </div>
            </div>

            <div
                style={{
                    background: "rgba(255,255,255,0.8)",
                    padding: "15px",
                    borderRadius: "8px",
                    marginTop: "20px",
                    border: "1px solid rgba(0,0,0,0.1)",
                }}
            >
                <h4
                    style={{
                        margin: "0 0 15px 0",
                        fontSize: "18px",
                        color: "#4facfe",
                    }}
                >
                    👥 All Users with Full Related Data
                </h4>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    {Array.isArray(allUsersFullData) &&
                        allUsersFullData.map((user: any, index: number) => (
                            <div
                                key={index}
                                style={{ flex: "1", minWidth: "250px" }}
                            >
                                {renderUserData(user)}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

// Компоненты для демонстрации работы с другими slice'ами
const CartExample: React.FC = () => {
    const cart = useSelector((state: any) => state.cart);
    const dispatch = useDispatch();

    const addSampleItem = () => {
        dispatch(
            cartSlice.actions.addToCart({
                id: Date.now(),
                name: "Sample Product",
                price: Math.floor(Math.random() * 100) + 10,
            })
        );
    };

    const removeItem = (id: number) => {
        dispatch(cartSlice.actions.removeFromCart({ id }));
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>
                🛒 Cart Example (Redux Slice)
            </h3>
            <div style={{ marginBottom: "15px" }}>
                <button
                    onClick={addSampleItem}
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "10px",
                    }}
                >
                    Add Item
                </button>
                <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                    Total: ${cart.total}
                </span>
            </div>
            <div>
                {cart.items.map((item: any) => (
                    <div
                        key={item.id}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: "10px",
                            margin: "5px 0",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>
                            {item.name} - ${item.price}
                        </span>
                        <button
                            onClick={() => removeItem(item.id)}
                            style={{
                                background: "rgba(255,0,0,0.3)",
                                border: "1px solid rgba(255,0,0,0.5)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ThemeExample: React.FC = () => {
    const theme = useSelector((state: any) => state.theme);
    const dispatch = useDispatch();

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>
                🎨 Theme Example (Redux Slice)
            </h3>
            <div style={{ marginBottom: "15px" }}>
                <span style={{ fontSize: "16px", marginRight: "15px" }}>
                    Current Theme: {theme.mode}
                </span>
                <button
                    onClick={() =>
                        (dispatch as any)(themeSlice.actions.toggleTheme())
                    }
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Toggle Theme
                </button>
            </div>
            <div
                style={{
                    background:
                        theme.mode === "light"
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(0,0,0,0.8)",
                    color: theme.mode === "light" ? "#333" : "#fff",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "2px solid rgba(255,255,255,0.3)",
                }}
            >
                <p style={{ margin: 0 }}>
                    This is a preview of the {theme.mode} theme!
                </p>
            </div>
        </div>
    );
};

const UserSliceExample: React.FC = () => {
    const user = useSelector((state: any) => state.user);
    const dispatch = useDispatch();

    const setRandomUser = () => {
        const users = [
            { id: 1, name: "Alice", email: "alice@example.com" },
            { id: 2, name: "Bob", email: "bob@example.com" },
            { id: 3, name: "Charlie", email: "charlie@example.com" },
        ];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        dispatch(userSlice.actions.setCurrentUser(randomUser));
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "#333",
                marginTop: "20px",
            }}
        >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>
                👤 User Slice Example (Redux Slice)
            </h3>
            <div style={{ marginBottom: "15px" }}>
                <button
                    onClick={setRandomUser}
                    style={{
                        background: "rgba(0,0,0,0.1)",
                        border: "1px solid rgba(0,0,0,0.2)",
                        color: "#333",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "10px",
                    }}
                >
                    Set Random User
                </button>
                <button
                    onClick={() =>
                        (dispatch as any)(
                            userSlice.actions.setCurrentUser(null)
                        )
                    }
                    style={{
                        background: "rgba(255,0,0,0.1)",
                        border: "1px solid rgba(255,0,0,0.3)",
                        color: "#d32f2f",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Clear User
                </button>
            </div>
            <div
                style={{
                    background: "rgba(255,255,255,0.7)",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.1)",
                }}
            >
                {user.currentUser ? (
                    <div>
                        <p>
                            <strong>Name:</strong> {user.currentUser.name}
                        </p>
                        <p>
                            <strong>Email:</strong> {user.currentUser.email}
                        </p>
                        <p>
                            <strong>ID:</strong> {user.currentUser.id}
                        </p>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontStyle: "italic" }}>
                        No user selected
                    </p>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Provider store={extendedStore}>
            <RpcProvider repository={configuredRepository}>
                <div
                    style={{
                        minHeight: "100vh",
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        padding: "20px",
                        fontFamily:
                            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                >
                    <div
                        style={{
                            maxWidth: "1200px",
                            margin: "0 auto",
                        }}
                    >
                        <h1
                            style={{
                                textAlign: "center",
                                color: "white",
                                fontSize: "36px",
                                margin: "0 0 30px 0",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                            }}
                        >
                            🚀 Auto-Generated Hooks Example
                        </h1>

                        <div
                            style={{
                                display: "flex",
                                gap: "2rem",
                                flexWrap: "wrap",
                                justifyContent: "center",
                            }}
                        >
                            <UsersList />
                            <ProductsList />
                            <CellCodeList />
                        </div>

                        <ItemDetails />
                        <RelatedDataExample />
                        <RelatedHooksExample />
                        <DataListenerExample />
                        <FullRelatedDataExample />

                        <CartExample />
                        <ThemeExample />
                        <UserSliceExample />
                    </div>
                </div>
            </RpcProvider>
        </Provider>
    );
};

export default App;
