import { NextRequest } from "next/server";
import { createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Smart contract ABI for updatePlayerData function
const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "playerAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "scoreAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "transactionAmount",
        type: "uint256",
      },
    ],
    name: "updatePlayerData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const { playerAddress, scoreAmount } = await request.json();

    // Validation
    if (!playerAddress || scoreAmount === undefined || scoreAmount <= 0) {
      return Response.json(
        {
          error:
            "Invalid parameters: playerAddress and scoreAmount required, scoreAmount > 0",
        },
        { status: 400 }
      );
    }

    // Get configuration from server environment variables
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.GAME_WALLET_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;

    if (!contractAddress || !privateKey || !rpcUrl) {
      console.error("Missing environment variables:", {
        hasContract: !!contractAddress,
        hasPrivateKey: !!privateKey,
        hasRpc: !!rpcUrl,
      });
      return Response.json(
        { error: "Server configuration incomplete" },
        { status: 500 }
      );
    }

    // Create wallet client with private key (server-side only)
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    // Call smart contract
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "updatePlayerData",
      args: [
        playerAddress as `0x${string}`,
        BigInt(scoreAmount),
        BigInt(1), // transactionAmount = 1 for each save
      ],
    });

    return Response.json({
      success: true,
      transactionHash: hash,
      message: "Score saved to blockchain successfully",
    });
  } catch (error) {
    console.error("❌ Error saving score:", error);

    // Handle specific errors
    let errorMessage = "Failed to save score";
    if (error instanceof Error) {
      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to complete transaction";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Contract execution failed - check permissions";
      } else if (error.message.includes("AccessControlUnauthorizedAccount")) {
        errorMessage =
          "Unauthorized: Wallet does not have required permissions";
      } else {
        errorMessage = error.message;
      }
    }

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
