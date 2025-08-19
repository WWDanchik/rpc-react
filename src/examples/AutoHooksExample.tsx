/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    MessageWithStorageType,
    RepositoryTypes,
    Rpc,
    RpcRepository,
} from "@yunu-lab/rpc-ts";
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

const barcodeCodeSchema = z.record(
    z.string(),
    z.object({
        id: z.number(),
        version: z.number(),
    })
);

const errorRpc = new Rpc("error", errorSchema, "code");

const userRpc = new Rpc("user", userSchema, "id");
const productRpc = new Rpc("product", productSchema, "id");
const rectangleRpc = new Rpc("rectangle", rectangleSchema, "id");
const cell_codeRpc = new Rpc("cell_code", cell_codeSchema, "id");
const barcodeCodeRpc = new Rpc("barcode_code", barcodeCodeSchema);

const repository = new RpcRepository()
    .registerRpc("user", userRpc, { storageType: "collection" })
    .registerRpc("product", productRpc, { storageType: "collection" })
    .registerRpc("rectangle", rectangleRpc, { storageType: "collection" })
    .registerRpc("cell_code", cell_codeRpc, { storageType: "collection" })
    .registerRpc("error", errorRpc, { storageType: "singleton" })
    .registerRpc("barcode_code", barcodeCodeRpc, { storageType: "singleton" });

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

// ========================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ БИБЛИОТЕКИ
// ========================================

// 1. Пользователь создает свой store с Redux Toolkit
import { configureStore } from "@reduxjs/toolkit";
import { cartSlice, themeSlice, userSlice } from "./slices/slices";
import InlineDemo from "./InlineDemo";

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
    product: "collection";
    rectangle: "collection";
    cell_code: "collection";
    error: "singleton";
    barcode_code: "singleton";
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

    useErrorListener,
    useHandleMessages,
    useError,
    useBarcodeCode,
} = createRpcHooks<RepositoryTypes<typeof repository>, RpcStorageType>([
    "cell_code",
    "user",
    "product",
    "rectangle",
    "error",
    "barcode_code",
]);

const BarcodeCodeList: React.FC = () => {
    const { barcode_codes, mergeRpc } = useBarcodeCode();

    const handleAddBarcodeCode = () => {
        const testBarcodes = {
            "0000007959028": {
                id: 795902,
                version: 1,
            },
            '{"barcode_id":795902,"product_id":50504,"ff_user_id":259}': {
                id: 795902,
                version: 2,
            },
            "795902_50504_259": {
                id: 795902,
                version: 3,
            },
            B_795902_50504_259: {
                id: 795902,
                version: 4,
            },
            "0000007959356": {
                id: 795935,
                version: 1,
            },
            '{"barcode_id":795935,"product_id":50562,"ff_user_id":259}': {
                id: 795935,
                version: 2,
            },
            "795935_50562_259": {
                id: 795935,
                version: 3,
            },
            B_795935_50562_259: {
                id: 795935,
                version: 4,
            },
            "0000008019813": {
                id: 801981,
                version: 1,
            },
            '{"barcode_id":801981,"product_id":44273,"ff_user_id":297}': {
                id: 801981,
                version: 2,
            },
            "801981_44273_297": {
                id: 801981,
                version: 3,
            },
            B_801981_44273_297: {
                id: 801981,
                version: 4,
            },
            "0000008019820": {
                id: 801982,
                version: 1,
            },
            '{"barcode_id":801982,"product_id":44273,"ff_user_id":297}': {
                id: 801982,
                version: 2,
            },
            "801982_44273_297": {
                id: 801982,
                version: 3,
            },
            B_801982_44273_297: {
                id: 801982,
                version: 4,
            },
            "0000008019844": {
                id: 801984,
                version: 1,
            },
            '{"barcode_id":801984,"product_id":44273,"ff_user_id":297}': {
                id: 801984,
                version: 2,
            },
            "801984_44273_297": {
                id: 801984,
                version: 3,
            },
            B_801984_44273_297: {
                id: 801984,
                version: 4,
            },
            "0000008019851": {
                id: 801985,
                version: 1,
            },
            '{"barcode_id":801985,"product_id":44273,"ff_user_id":297}': {
                id: 801985,
                version: 2,
            },
            "801985_44273_297": {
                id: 801985,
                version: 3,
            },
            B_801985_44273_297: {
                id: 801985,
                version: 4,
            },
            "0000008019868": {
                id: 801986,
                version: 1,
            },
            '{"barcode_id":801986,"product_id":44273,"ff_user_id":297}': {
                id: 801986,
                version: 2,
            },
            "801986_44273_297": {
                id: 801986,
                version: 3,
            },
            B_801986_44273_297: {
                id: 801986,
                version: 4,
            },
            "0000008019875": {
                id: 801987,
                version: 1,
            },
            '{"barcode_id":801987,"product_id":44273,"ff_user_id":297}': {
                id: 801987,
                version: 2,
            },
            "801987_44273_297": {
                id: 801987,
                version: 3,
            },
            B_801987_44273_297: {
                id: 801987,
                version: 4,
            },
            "0000008019905": {
                id: 801990,
                version: 1,
            },
            '{"barcode_id":801990,"product_id":44273,"ff_user_id":297}': {
                id: 801990,
                version: 2,
            },
            "801990_44273_297": {
                id: 801990,
                version: 3,
            },
            B_801990_44273_297: {
                id: 801990,
                version: 4,
            },
            "0000008019912": {
                id: 801991,
                version: 1,
            },
            '{"barcode_id":801991,"product_id":44273,"ff_user_id":297}': {
                id: 801991,
                version: 2,
            },
            "801991_44273_297": {
                id: 801991,
                version: 3,
            },
            B_801991_44273_297: {
                id: 801991,
                version: 4,
            },
            "0000008019929": {
                id: 801992,
                version: 1,
            },
            '{"barcode_id":801992,"product_id":44273,"ff_user_id":297}': {
                id: 801992,
                version: 2,
            },
            "801992_44273_297": {
                id: 801992,
                version: 3,
            },
            B_801992_44273_297: {
                id: 801992,
                version: 4,
            },
            "0000008019936": {
                id: 801993,
                version: 1,
            },
            '{"barcode_id":801993,"product_id":44273,"ff_user_id":297}': {
                id: 801993,
                version: 2,
            },
            "801993_44273_297": {
                id: 801993,
                version: 3,
            },
            B_801993_44273_297: {
                id: 801993,
                version: 4,
            },
            "0000009688216": {
                id: 968821,
                version: 1,
            },
            '{"barcode_id":968821,"product_id":54928,"ff_user_id":31}': {
                id: 968821,
                version: 2,
            },
            "968821_54928_31": {
                id: 968821,
                version: 3,
            },
            B_968821_54928_31: {
                id: 968821,
                version: 4,
            },
            "0000009688223": {
                id: 968822,
                version: 1,
            },
            '{"barcode_id":968822,"product_id":54928,"ff_user_id":31}': {
                id: 968822,
                version: 2,
            },
            "968822_54928_31": {
                id: 968822,
                version: 3,
            },
            B_968822_54928_31: {
                id: 968822,
                version: 4,
            },
            "0000009688254": {
                id: 968825,
                version: 1,
            },
            '{"barcode_id":968825,"product_id":54928,"ff_user_id":31}': {
                id: 968825,
                version: 2,
            },
            "968825_54928_31": {
                id: 968825,
                version: 3,
            },
            B_968825_54928_31: {
                id: 968825,
                version: 4,
            },
            "0000009688261": {
                id: 968826,
                version: 1,
            },
            '{"barcode_id":968826,"product_id":54928,"ff_user_id":31}': {
                id: 968826,
                version: 2,
            },
            "968826_54928_31": {
                id: 968826,
                version: 3,
            },
            B_968826_54928_31: {
                id: 968826,
                version: 4,
            },
            "0000009688278": {
                id: 968827,
                version: 1,
            },
            '{"barcode_id":968827,"product_id":54928,"ff_user_id":31}': {
                id: 968827,
                version: 2,
            },
            "968827_54928_31": {
                id: 968827,
                version: 3,
            },
            B_968827_54928_31: {
                id: 968827,
                version: 4,
            },
            "0000009688308": {
                id: 968830,
                version: 1,
            },
            '{"barcode_id":968830,"product_id":54928,"ff_user_id":31}': {
                id: 968830,
                version: 2,
            },
            "968830_54928_31": {
                id: 968830,
                version: 3,
            },
            B_968830_54928_31: {
                id: 968830,
                version: 4,
            },
            "0000009688377": {
                id: 968837,
                version: 1,
            },
            '{"barcode_id":968837,"product_id":54928,"ff_user_id":31}': {
                id: 968837,
                version: 2,
            },
            "968837_54928_31": {
                id: 968837,
                version: 3,
            },
            B_968837_54928_31: {
                id: 968837,
                version: 4,
            },
            "0000009688391": {
                id: 968839,
                version: 1,
            },
            '{"barcode_id":968839,"product_id":54928,"ff_user_id":31}': {
                id: 968839,
                version: 2,
            },
            "968839_54928_31": {
                id: 968839,
                version: 3,
            },
            B_968839_54928_31: {
                id: 968839,
                version: 4,
            },
            "0000009688407": {
                id: 968840,
                version: 1,
            },
            '{"barcode_id":968840,"product_id":54928,"ff_user_id":31}': {
                id: 968840,
                version: 2,
            },
            "968840_54928_31": {
                id: 968840,
                version: 3,
            },
            B_968840_54928_31: {
                id: 968840,
                version: 4,
            },
            "0000009688452": {
                id: 968845,
                version: 1,
            },
            '{"barcode_id":968845,"product_id":54928,"ff_user_id":31}': {
                id: 968845,
                version: 2,
            },
            "968845_54928_31": {
                id: 968845,
                version: 3,
            },
            B_968845_54928_31: {
                id: 968845,
                version: 4,
            },
            "0000012345038": {
                id: 1234503,
                version: 1,
            },
            '{"barcode_id":1234503,"product_id":44205,"ff_user_id":297}': {
                id: 1234503,
                version: 2,
            },
            "1234503_44205_297": {
                id: 1234503,
                version: 3,
            },
            B_1234503_44205_297: {
                id: 1234503,
                version: 4,
            },
            "0000012345045": {
                id: 1234504,
                version: 1,
            },
            '{"barcode_id":1234504,"product_id":44205,"ff_user_id":297}': {
                id: 1234504,
                version: 2,
            },
            "1234504_44205_297": {
                id: 1234504,
                version: 3,
            },
            B_1234504_44205_297: {
                id: 1234504,
                version: 4,
            },
            "0000012345052": {
                id: 1234505,
                version: 1,
            },
            '{"barcode_id":1234505,"product_id":44205,"ff_user_id":297}': {
                id: 1234505,
                version: 2,
            },
            "1234505_44205_297": {
                id: 1234505,
                version: 3,
            },
            B_1234505_44205_297: {
                id: 1234505,
                version: 4,
            },
            "0000014130540": {
                id: 1413054,
                version: 1,
            },
            '{"barcode_id":1413054,"product_id":59574,"ff_user_id":380}': {
                id: 1413054,
                version: 2,
            },
            "1413054_59574_380": {
                id: 1413054,
                version: 3,
            },
            B_1413054_59574_380: {
                id: 1413054,
                version: 4,
            },
            "0000014130557": {
                id: 1413055,
                version: 1,
            },
            '{"barcode_id":1413055,"product_id":59574,"ff_user_id":380}': {
                id: 1413055,
                version: 2,
            },
            "1413055_59574_380": {
                id: 1413055,
                version: 3,
            },
            B_1413055_59574_380: {
                id: 1413055,
                version: 4,
            },
            "0000014130564": {
                id: 1413056,
                version: 1,
            },
            '{"barcode_id":1413056,"product_id":59574,"ff_user_id":380}': {
                id: 1413056,
                version: 2,
            },
            "1413056_59574_380": {
                id: 1413056,
                version: 3,
            },
            B_1413056_59574_380: {
                id: 1413056,
                version: 4,
            },
            "0000014130571": {
                id: 1413057,
                version: 1,
            },
            '{"barcode_id":1413057,"product_id":59574,"ff_user_id":380}': {
                id: 1413057,
                version: 2,
            },
            "1413057_59574_380": {
                id: 1413057,
                version: 3,
            },
            B_1413057_59574_380: {
                id: 1413057,
                version: 4,
            },
            "0000014130588": {
                id: 1413058,
                version: 1,
            },
            '{"barcode_id":1413058,"product_id":59574,"ff_user_id":380}': {
                id: 1413058,
                version: 2,
            },
            "1413058_59574_380": {
                id: 1413058,
                version: 3,
            },
            B_1413058_59574_380: {
                id: 1413058,
                version: 4,
            },
            "0000014130595": {
                id: 1413059,
                version: 1,
            },
            '{"barcode_id":1413059,"product_id":59574,"ff_user_id":380}': {
                id: 1413059,
                version: 2,
            },
            "1413059_59574_380": {
                id: 1413059,
                version: 3,
            },
            B_1413059_59574_380: {
                id: 1413059,
                version: 4,
            },
            "0000014130601": {
                id: 1413060,
                version: 1,
            },
            '{"barcode_id":1413060,"product_id":59574,"ff_user_id":380}': {
                id: 1413060,
                version: 2,
            },
            "1413060_59574_380": {
                id: 1413060,
                version: 3,
            },
            B_1413060_59574_380: {
                id: 1413060,
                version: 4,
            },
            "0000014130618": {
                id: 1413061,
                version: 1,
            },
            '{"barcode_id":1413061,"product_id":59574,"ff_user_id":380}': {
                id: 1413061,
                version: 2,
            },
            "1413061_59574_380": {
                id: 1413061,
                version: 3,
            },
            B_1413061_59574_380: {
                id: 1413061,
                version: 4,
            },
            "0000014130625": {
                id: 1413062,
                version: 1,
            },
            '{"barcode_id":1413062,"product_id":59574,"ff_user_id":380}': {
                id: 1413062,
                version: 2,
            },
            "1413062_59574_380": {
                id: 1413062,
                version: 3,
            },
            B_1413062_59574_380: {
                id: 1413062,
                version: 4,
            },
            "0000014130632": {
                id: 1413063,
                version: 1,
            },
            '{"barcode_id":1413063,"product_id":59574,"ff_user_id":380}': {
                id: 1413063,
                version: 2,
            },
            "1413063_59574_380": {
                id: 1413063,
                version: 3,
            },
            B_1413063_59574_380: {
                id: 1413063,
                version: 4,
            },
            "0000014130649": {
                id: 1413064,
                version: 1,
            },
            '{"barcode_id":1413064,"product_id":59574,"ff_user_id":380}': {
                id: 1413064,
                version: 2,
            },
            "1413064_59574_380": {
                id: 1413064,
                version: 3,
            },
            B_1413064_59574_380: {
                id: 1413064,
                version: 4,
            },
            "0000014130656": {
                id: 1413065,
                version: 1,
            },
            '{"barcode_id":1413065,"product_id":59574,"ff_user_id":380}': {
                id: 1413065,
                version: 2,
            },
            "1413065_59574_380": {
                id: 1413065,
                version: 3,
            },
            B_1413065_59574_380: {
                id: 1413065,
                version: 4,
            },
            "0000014130663": {
                id: 1413066,
                version: 1,
            },
            '{"barcode_id":1413066,"product_id":59574,"ff_user_id":380}': {
                id: 1413066,
                version: 2,
            },
            "1413066_59574_380": {
                id: 1413066,
                version: 3,
            },
            B_1413066_59574_380: {
                id: 1413066,
                version: 4,
            },
            "0000014130670": {
                id: 1413067,
                version: 1,
            },
            '{"barcode_id":1413067,"product_id":59574,"ff_user_id":380}': {
                id: 1413067,
                version: 2,
            },
            "1413067_59574_380": {
                id: 1413067,
                version: 3,
            },
            B_1413067_59574_380: {
                id: 1413067,
                version: 4,
            },
            "0000014130687": {
                id: 1413068,
                version: 1,
            },
            '{"barcode_id":1413068,"product_id":59574,"ff_user_id":380}': {
                id: 1413068,
                version: 2,
            },
            "1413068_59574_380": {
                id: 1413068,
                version: 3,
            },
            B_1413068_59574_380: {
                id: 1413068,
                version: 4,
            },
            "0000014130694": {
                id: 1413069,
                version: 1,
            },
            '{"barcode_id":1413069,"product_id":59574,"ff_user_id":380}': {
                id: 1413069,
                version: 2,
            },
            "1413069_59574_380": {
                id: 1413069,
                version: 3,
            },
            B_1413069_59574_380: {
                id: 1413069,
                version: 4,
            },
            "0000014130700": {
                id: 1413070,
                version: 1,
            },
            '{"barcode_id":1413070,"product_id":59574,"ff_user_id":380}': {
                id: 1413070,
                version: 2,
            },
            "1413070_59574_380": {
                id: 1413070,
                version: 3,
            },
            B_1413070_59574_380: {
                id: 1413070,
                version: 4,
            },
            "0000014130717": {
                id: 1413071,
                version: 1,
            },
            '{"barcode_id":1413071,"product_id":59574,"ff_user_id":380}': {
                id: 1413071,
                version: 2,
            },
            "1413071_59574_380": {
                id: 1413071,
                version: 3,
            },
            B_1413071_59574_380: {
                id: 1413071,
                version: 4,
            },
            "0000014130724": {
                id: 1413072,
                version: 1,
            },
            '{"barcode_id":1413072,"product_id":59574,"ff_user_id":380}': {
                id: 1413072,
                version: 2,
            },
            "1413072_59574_380": {
                id: 1413072,
                version: 3,
            },
            B_1413072_59574_380: {
                id: 1413072,
                version: 4,
            },
            "0000014130731": {
                id: 1413073,
                version: 1,
            },
            '{"barcode_id":1413073,"product_id":59574,"ff_user_id":380}': {
                id: 1413073,
                version: 2,
            },
            "1413073_59574_380": {
                id: 1413073,
                version: 3,
            },
            B_1413073_59574_380: {
                id: 1413073,
                version: 4,
            },
            "0000014130748": {
                id: 1413074,
                version: 1,
            },
            '{"barcode_id":1413074,"product_id":59574,"ff_user_id":380}': {
                id: 1413074,
                version: 2,
            },
            "1413074_59574_380": {
                id: 1413074,
                version: 3,
            },
            B_1413074_59574_380: {
                id: 1413074,
                version: 4,
            },
            "0000014130755": {
                id: 1413075,
                version: 1,
            },
            '{"barcode_id":1413075,"product_id":59574,"ff_user_id":380}': {
                id: 1413075,
                version: 2,
            },
            "1413075_59574_380": {
                id: 1413075,
                version: 3,
            },
            B_1413075_59574_380: {
                id: 1413075,
                version: 4,
            },
            "0000014130762": {
                id: 1413076,
                version: 1,
            },
            '{"barcode_id":1413076,"product_id":59574,"ff_user_id":380}': {
                id: 1413076,
                version: 2,
            },
            "1413076_59574_380": {
                id: 1413076,
                version: 3,
            },
            B_1413076_59574_380: {
                id: 1413076,
                version: 4,
            },
            "0000014130786": {
                id: 1413078,
                version: 1,
            },
            '{"barcode_id":1413078,"product_id":59574,"ff_user_id":380}': {
                id: 1413078,
                version: 2,
            },
            "1413078_59574_380": {
                id: 1413078,
                version: 3,
            },
            B_1413078_59574_380: {
                id: 1413078,
                version: 4,
            },
            "0000014130793": {
                id: 1413079,
                version: 1,
            },
            '{"barcode_id":1413079,"product_id":59574,"ff_user_id":380}': {
                id: 1413079,
                version: 2,
            },
            "1413079_59574_380": {
                id: 1413079,
                version: 3,
            },
            B_1413079_59574_380: {
                id: 1413079,
                version: 4,
            },
            "0000014130823": {
                id: 1413082,
                version: 1,
            },
            '{"barcode_id":1413082,"product_id":59574,"ff_user_id":380}': {
                id: 1413082,
                version: 2,
            },
            "1413082_59574_380": {
                id: 1413082,
                version: 3,
            },
            B_1413082_59574_380: {
                id: 1413082,
                version: 4,
            },
            "0000014130830": {
                id: 1413083,
                version: 1,
            },
            '{"barcode_id":1413083,"product_id":59574,"ff_user_id":380}': {
                id: 1413083,
                version: 2,
            },
            "1413083_59574_380": {
                id: 1413083,
                version: 3,
            },
            B_1413083_59574_380: {
                id: 1413083,
                version: 4,
            },
            "0000014130847": {
                id: 1413084,
                version: 1,
            },
            '{"barcode_id":1413084,"product_id":59574,"ff_user_id":380}': {
                id: 1413084,
                version: 2,
            },
            "1413084_59574_380": {
                id: 1413084,
                version: 3,
            },
            B_1413084_59574_380: {
                id: 1413084,
                version: 4,
            },
            "0000014130854": {
                id: 1413085,
                version: 1,
            },
            '{"barcode_id":1413085,"product_id":59574,"ff_user_id":380}': {
                id: 1413085,
                version: 2,
            },
            "1413085_59574_380": {
                id: 1413085,
                version: 3,
            },
            B_1413085_59574_380: {
                id: 1413085,
                version: 4,
            },
            "0000014130861": {
                id: 1413086,
                version: 1,
            },
            '{"barcode_id":1413086,"product_id":59574,"ff_user_id":380}': {
                id: 1413086,
                version: 2,
            },
            "1413086_59574_380": {
                id: 1413086,
                version: 3,
            },
            B_1413086_59574_380: {
                id: 1413086,
                version: 4,
            },
            "0000014130878": {
                id: 1413087,
                version: 1,
            },
            '{"barcode_id":1413087,"product_id":59574,"ff_user_id":380}': {
                id: 1413087,
                version: 2,
            },
            "1413087_59574_380": {
                id: 1413087,
                version: 3,
            },
            B_1413087_59574_380: {
                id: 1413087,
                version: 4,
            },
            "0000014130892": {
                id: 1413089,
                version: 1,
            },
            '{"barcode_id":1413089,"product_id":59574,"ff_user_id":380}': {
                id: 1413089,
                version: 2,
            },
            "1413089_59574_380": {
                id: 1413089,
                version: 3,
            },
            B_1413089_59574_380: {
                id: 1413089,
                version: 4,
            },
            "0000014130908": {
                id: 1413090,
                version: 1,
            },
            '{"barcode_id":1413090,"product_id":59574,"ff_user_id":380}': {
                id: 1413090,
                version: 2,
            },
            "1413090_59574_380": {
                id: 1413090,
                version: 3,
            },
            B_1413090_59574_380: {
                id: 1413090,
                version: 4,
            },
            "0000014130915": {
                id: 1413091,
                version: 1,
            },
            '{"barcode_id":1413091,"product_id":59574,"ff_user_id":380}': {
                id: 1413091,
                version: 2,
            },
            "1413091_59574_380": {
                id: 1413091,
                version: 3,
            },
            B_1413091_59574_380: {
                id: 1413091,
                version: 4,
            },
            "0000014130922": {
                id: 1413092,
                version: 1,
            },
            '{"barcode_id":1413092,"product_id":59574,"ff_user_id":380}': {
                id: 1413092,
                version: 2,
            },
            "1413092_59574_380": {
                id: 1413092,
                version: 3,
            },
            B_1413092_59574_380: {
                id: 1413092,
                version: 4,
            },
            "0000014130939": {
                id: 1413093,
                version: 1,
            },
            '{"barcode_id":1413093,"product_id":59574,"ff_user_id":380}': {
                id: 1413093,
                version: 2,
            },
            "1413093_59574_380": {
                id: 1413093,
                version: 3,
            },
            B_1413093_59574_380: {
                id: 1413093,
                version: 4,
            },
            "0000014130946": {
                id: 1413094,
                version: 1,
            },
            '{"barcode_id":1413094,"product_id":59574,"ff_user_id":380}': {
                id: 1413094,
                version: 2,
            },
            "1413094_59574_380": {
                id: 1413094,
                version: 3,
            },
            B_1413094_59574_380: {
                id: 1413094,
                version: 4,
            },
            "0000014130953": {
                id: 1413095,
                version: 1,
            },
            '{"barcode_id":1413095,"product_id":59574,"ff_user_id":380}': {
                id: 1413095,
                version: 2,
            },
            "1413095_59574_380": {
                id: 1413095,
                version: 3,
            },
            B_1413095_59574_380: {
                id: 1413095,
                version: 4,
            },
            "0000014130960": {
                id: 1413096,
                version: 1,
            },
            '{"barcode_id":1413096,"product_id":59574,"ff_user_id":380}': {
                id: 1413096,
                version: 2,
            },
            "1413096_59574_380": {
                id: 1413096,
                version: 3,
            },
            B_1413096_59574_380: {
                id: 1413096,
                version: 4,
            },
            "0000014130977": {
                id: 1413097,
                version: 1,
            },
            '{"barcode_id":1413097,"product_id":59574,"ff_user_id":380}': {
                id: 1413097,
                version: 2,
            },
            "1413097_59574_380": {
                id: 1413097,
                version: 3,
            },
            B_1413097_59574_380: {
                id: 1413097,
                version: 4,
            },
            "0000014130984": {
                id: 1413098,
                version: 1,
            },
            '{"barcode_id":1413098,"product_id":59574,"ff_user_id":380}': {
                id: 1413098,
                version: 2,
            },
            "1413098_59574_380": {
                id: 1413098,
                version: 3,
            },
            B_1413098_59574_380: {
                id: 1413098,
                version: 4,
            },
            "0000014130991": {
                id: 1413099,
                version: 1,
            },
            '{"barcode_id":1413099,"product_id":59574,"ff_user_id":380}': {
                id: 1413099,
                version: 2,
            },
            "1413099_59574_380": {
                id: 1413099,
                version: 3,
            },
            B_1413099_59574_380: {
                id: 1413099,
                version: 4,
            },
            "0000014131004": {
                id: 1413100,
                version: 1,
            },
            '{"barcode_id":1413100,"product_id":59574,"ff_user_id":380}': {
                id: 1413100,
                version: 2,
            },
            "1413100_59574_380": {
                id: 1413100,
                version: 3,
            },
            B_1413100_59574_380: {
                id: 1413100,
                version: 4,
            },
            "0000018393057": {
                id: 1839305,
                version: 1,
            },
            '{"barcode_id":1839305,"product_id":68716,"ff_user_id":352}': {
                id: 1839305,
                version: 2,
            },
            "1839305_68716_352": {
                id: 1839305,
                version: 3,
            },
            B_1839305_68716_352: {
                id: 1839305,
                version: 4,
            },
            "0000022305039": {
                id: 2230503,
                version: 1,
            },
            '{"barcode_id":2230503,"product_id":75427,"ff_user_id":164}': {
                id: 2230503,
                version: 2,
            },
            "2230503_75427_164": {
                id: 2230503,
                version: 3,
            },
            B_2230503_75427_164: {
                id: 2230503,
                version: 4,
            },
            "0000022305046": {
                id: 2230504,
                version: 1,
            },
            '{"barcode_id":2230504,"product_id":75427,"ff_user_id":164}': {
                id: 2230504,
                version: 2,
            },
            "2230504_75427_164": {
                id: 2230504,
                version: 3,
            },
            B_2230504_75427_164: {
                id: 2230504,
                version: 4,
            },
            "0000022305077": {
                id: 2230507,
                version: 1,
            },
            '{"barcode_id":2230507,"product_id":75427,"ff_user_id":164}': {
                id: 2230507,
                version: 2,
            },
            "2230507_75427_164": {
                id: 2230507,
                version: 3,
            },
            B_2230507_75427_164: {
                id: 2230507,
                version: 4,
            },
            "0000022305084": {
                id: 2230508,
                version: 1,
            },
            '{"barcode_id":2230508,"product_id":75427,"ff_user_id":164}': {
                id: 2230508,
                version: 2,
            },
            "2230508_75427_164": {
                id: 2230508,
                version: 3,
            },
            B_2230508_75427_164: {
                id: 2230508,
                version: 4,
            },
            "0000022305091": {
                id: 2230509,
                version: 1,
            },
            '{"barcode_id":2230509,"product_id":75427,"ff_user_id":164}': {
                id: 2230509,
                version: 2,
            },
            "2230509_75427_164": {
                id: 2230509,
                version: 3,
            },
            B_2230509_75427_164: {
                id: 2230509,
                version: 4,
            },
            "0000022305107": {
                id: 2230510,
                version: 1,
            },
            '{"barcode_id":2230510,"product_id":75427,"ff_user_id":164}': {
                id: 2230510,
                version: 2,
            },
            "2230510_75427_164": {
                id: 2230510,
                version: 3,
            },
            B_2230510_75427_164: {
                id: 2230510,
                version: 4,
            },
            "0000022305121": {
                id: 2230512,
                version: 1,
            },
            '{"barcode_id":2230512,"product_id":75427,"ff_user_id":164}': {
                id: 2230512,
                version: 2,
            },
            "2230512_75427_164": {
                id: 2230512,
                version: 3,
            },
            B_2230512_75427_164: {
                id: 2230512,
                version: 4,
            },
            "0000022305138": {
                id: 2230513,
                version: 1,
            },
            '{"barcode_id":2230513,"product_id":75427,"ff_user_id":164}': {
                id: 2230513,
                version: 2,
            },
            "2230513_75427_164": {
                id: 2230513,
                version: 3,
            },
            B_2230513_75427_164: {
                id: 2230513,
                version: 4,
            },
            "0000022305152": {
                id: 2230515,
                version: 1,
            },
            '{"barcode_id":2230515,"product_id":75427,"ff_user_id":164}': {
                id: 2230515,
                version: 2,
            },
            "2230515_75427_164": {
                id: 2230515,
                version: 3,
            },
            B_2230515_75427_164: {
                id: 2230515,
                version: 4,
            },
            "0000022305176": {
                id: 2230517,
                version: 1,
            },
            '{"barcode_id":2230517,"product_id":75427,"ff_user_id":164}': {
                id: 2230517,
                version: 2,
            },
            "2230517_75427_164": {
                id: 2230517,
                version: 3,
            },
            B_2230517_75427_164: {
                id: 2230517,
                version: 4,
            },
            "0000024902953": {
                id: 2490295,
                version: 1,
            },
            '{"barcode_id":2490295,"product_id":78282,"ff_user_id":259}': {
                id: 2490295,
                version: 2,
            },
            "2490295_78282_259": {
                id: 2490295,
                version: 3,
            },
            B_2490295_78282_259: {
                id: 2490295,
                version: 4,
            },
            "0000024902984": {
                id: 2490298,
                version: 1,
            },
            '{"barcode_id":2490298,"product_id":78282,"ff_user_id":259}': {
                id: 2490298,
                version: 2,
            },
            "2490298_78282_259": {
                id: 2490298,
                version: 3,
            },
            B_2490298_78282_259: {
                id: 2490298,
                version: 4,
            },
            "0000024903042": {
                id: 2490304,
                version: 1,
            },
            '{"barcode_id":2490304,"product_id":78282,"ff_user_id":259}': {
                id: 2490304,
                version: 2,
            },
            "2490304_78282_259": {
                id: 2490304,
                version: 3,
            },
            B_2490304_78282_259: {
                id: 2490304,
                version: 4,
            },
            "0000037443498": {
                id: 3744349,
                version: 1,
            },
            '{"barcode_id":3744349,"product_id":75427,"ff_user_id":164}': {
                id: 3744349,
                version: 2,
            },
            "3744349_75427_164": {
                id: 3744349,
                version: 3,
            },
            B_3744349_75427_164: {
                id: 3744349,
                version: 4,
            },
            "0000037443504": {
                id: 3744350,
                version: 1,
            },
            '{"barcode_id":3744350,"product_id":75427,"ff_user_id":164}': {
                id: 3744350,
                version: 2,
            },
            "3744350_75427_164": {
                id: 3744350,
                version: 3,
            },
            B_3744350_75427_164: {
                id: 3744350,
                version: 4,
            },
            "0000037443511": {
                id: 3744351,
                version: 1,
            },
            '{"barcode_id":3744351,"product_id":75427,"ff_user_id":164}': {
                id: 3744351,
                version: 2,
            },
            "3744351_75427_164": {
                id: 3744351,
                version: 3,
            },
            B_3744351_75427_164: {
                id: 3744351,
                version: 4,
            },
            "0000037443528": {
                id: 3744352,
                version: 1,
            },
            '{"barcode_id":3744352,"product_id":75427,"ff_user_id":164}': {
                id: 3744352,
                version: 2,
            },
            "3744352_75427_164": {
                id: 3744352,
                version: 3,
            },
            B_3744352_75427_164: {
                id: 3744352,
                version: 4,
            },
        };
        mergeRpc(testBarcodes);
    };

    return (
        <div>
            <button onClick={handleAddBarcodeCode}>Add Barcode Code</button>
            {barcode_codes &&
                Object.values(barcode_codes).map(({ id, version }) => {
                    return (
                        <div key={id}>
                            {id} - {version}
                        </div>
                    );
                })}
        </div>
    );
};

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

// Компонент для демонстрации singleton типа (error)
const ErrorSingletonExample: React.FC = () => {
    const { errors, mergeRpc } = useError();

    const handleSetError = () => {
        mergeRpc({
            code: "TEST_ERROR",
            msg: "Это тестовая ошибка",
            tech_msg: "Test error for singleton demonstration",
            text_code: "test_error",
        });
    };

    const handleClearError = () => {
        mergeRpc({
            code: "",
            msg: "",
            tech_msg: "",
            text_code: "",
        });
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)",
                padding: "20px",
                borderRadius: "12px",
                color: "white",
                minWidth: "300px",
            }}
        >
            <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>
                ⚠️ Error Singleton Example
            </h2>

            <div style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "14px", opacity: 0.9 }}>
                    Singleton тип хранит только одно значение (не массив)
                </p>
                {errors && (
                    <div
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: "15px",
                            borderRadius: "8px",
                            marginTop: "10px",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <div
                            style={{ fontWeight: "bold", marginBottom: "5px" }}
                        >
                            Код: {errors.code || "(пусто)"}
                        </div>
                        <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                            Сообщение: {errors.msg || "(пусто)"}
                        </div>
                        {errors.tech_msg && (
                            <div style={{ fontSize: "12px", opacity: 0.8 }}>
                                Техническое: {errors.tech_msg}
                            </div>
                        )}
                    </div>
                )}
                {!errors && (
                    <p style={{ fontStyle: "italic", opacity: 0.8 }}>
                        Нет активной ошибки
                    </p>
                )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
                <button
                    onClick={handleSetError}
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    🚨 Установить ошибку
                </button>
                <button
                    onClick={handleClearError}
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                    }}
                >
                    ✅ Очистить ошибку
                </button>
            </div>
        </div>
    );
};

// Компонент для работы с пользователями
const UsersList: React.FC = () => {
    const { users, mergeRpc } = useUser();

    const handleAddUser = () => {
        mergeRpc([
            {
                age: 120,
                name: "John Doe 120",
                email: "john.doe@example.com",
                id: 120,
            },
            {
                age: 1,
                name: "John Doe 1",
                email: "john.doe@example.com",
                id: 1,
            },
            {
                age: 12,
                name: "John Doe12",
                email: "john.doe@example.com",
                id: 12,
            },
            {
                age: 11,
                name: "John Doe 11",
                email: "john.doe@example.com",
                id: 11,
            },
        ]);
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
                        <div
                            style={{ fontWeight: "bold", marginBottom: "5px" }}
                        >
                            {user.id}
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
    const { handleMessages } = useHandleMessages();
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
        console.log(
            "Error payload is array:",
            Array.isArray(errorData.payload)
        );

        // Для singleton payload это объект, а не массив
        if (
            errorData.payload &&
            typeof errorData.payload === "object" &&
            !Array.isArray(errorData.payload)
        ) {
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
        const messages: Array<
            MessageWithStorageType<
                RepositoryTypes<typeof repository>,
                RpcStorageType
            >
        > = [
            {
                type: "error",
                payload: {
                    code: "AUTHENTICATION_ERROR",
                    msg: "Обновленная ошибка аутентификации",
                },
            },
        ];
        handleMessages(messages as any);
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
                <BarcodeCodeList />
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
                            <ErrorSingletonExample />
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
                <InlineDemo />
            </RpcProvider>
        </Provider>
    );
};

export default App;
