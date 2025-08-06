/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: "user",
    initialState: { currentUser: null },
    reducers: {
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
    },
});

export const cartSlice = createSlice({
    name: "cart",
    initialState: { items: [] as any[], total: 0 },
    reducers: {
        addToCart: (
            state,
            action: { payload: { id: number; name: string; price: number } }
        ) => {
            state.items.push(action.payload);
            state.total += action.payload.price;
        },
        removeFromCart: (state, action: { payload: { id: number } }) => {
            const index = state.items.findIndex(
                (item) => item.id === action.payload.id
            );
            if (index > -1) {
                state.total -= state.items[index].price;
                state.items.splice(index, 1);
            }
        },
    },
});

export const themeSlice = createSlice({
    name: "theme",
    initialState: { mode: "light" },
    reducers: {
        toggleTheme: (state: any) => {
            state.mode = state.mode === "light" ? "dark" : "light";
        },
    },
});
