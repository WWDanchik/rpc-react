/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from "react";
import { RpcContextType } from "../providers/RpcProvider";

export const RpcContext = createContext<RpcContextType<any> | null>(null);