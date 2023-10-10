// @ts-nocheck
import { useContractReads } from "wagmi";
import { polygon } from "viem/chains";
import { fromUnixTime } from "date-fns";
import { formatEther } from "viem";
import { orderBy } from "lodash";
import {
  bearzQuestABI,
  bearzQuestContractAddress,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
  bearzTokenABI,
  bearzTokenContractAddress,
} from "../lib/contracts";

const useQuests = ({ address }) => {
  const { data, isLoading } = useContractReads({
    contracts: [
      {
        address: bearzStakeChildContractAddress,
        abi: bearzStakeChildABI,
        chainId: polygon.id,
        functionName: "getAllQuests",
      },
      {
        address: bearzQuestContractAddress,
        abi: bearzQuestABI,
        chainId: polygon.id,
        functionName: "getClaimableRewards",
        args: [address],
      },
      {
        address: bearzTokenContractAddress,
        abi: bearzTokenABI,
        chainId: polygon.id,
        functionName: "balanceOf",
        args: [address],
      },
    ],
  });

  return [
    {
      isLoading,
      quests: orderBy(
        data?.[0]?.result,
        (quest) => fromUnixTime(quest?.activeUntil),
        "desc",
      ),
      rewards: data?.[1]?.result,
      balance: formatEther(data?.[2]?.result ?? 0n),
    },
  ];
};

export default useQuests;
