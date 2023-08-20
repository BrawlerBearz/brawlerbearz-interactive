import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { bearzContractAddress, bearzABI } from "./contracts";
import { ALCHEMY_KEY } from "./constants";

const client = createPublicClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
});

export const getMetadataByTokenId = async (tokenId) => {
  const [base64Encoding, ownerOf] = await Promise.all([
    client.readContract({
      address: bearzContractAddress,
      abi: bearzABI,
      functionName: "tokenURI",
      args: [tokenId],
    }),
    client.readContract({
      address: bearzContractAddress,
      abi: bearzABI,
      functionName: "ownerOf",
      args: [tokenId],
    }),
  ]);

  return {
    ...JSON.parse(
      atob(
        (base64Encoding as string).replace("data:application/json;base64,", ""),
      ),
    ),
    ownerOf,
  };
};
