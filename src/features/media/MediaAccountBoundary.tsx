import { createContext, useContext } from "react";
export const MediaAccountContext = createContext<string | null>(null);
export function useMediaAccountId() {
  return useContext(MediaAccountContext);
}
