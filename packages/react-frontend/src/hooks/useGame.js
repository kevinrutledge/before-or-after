import { useContext } from "react";
import { GameContext } from "../context/GameContext";

/**
 * Hook to access game context.
 */
export function useGame() {
  return useContext(GameContext);
}
