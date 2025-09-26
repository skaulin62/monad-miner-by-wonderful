import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.VITE_NEXT_PRIVATE_PRIVY_APP_ID": JSON.stringify(
      process.env.VITE_NEXT_PRIVATE_PRIVY_APP_ID
    ),
    "process.env.VITE_GAME_WALLET_PRIVATE_KEY": JSON.stringify(
      process.env.VITE_GAME_WALLET_PRIVATE_KEY
    ),
    "process.env.VITE_RPC_URL": JSON.stringify(process.env.VITE_RPC_URL),
    "process.env.VITE_CONTRACT_ADDRESS": JSON.stringify(
      process.env.VITE_CONTRACT_ADDRESS
    ),
  },
});
