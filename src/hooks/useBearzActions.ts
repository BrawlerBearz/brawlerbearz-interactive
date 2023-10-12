// @ts-nocheck
import { mainnet, polygon } from "viem/chains";
import { toast } from "react-toastify";
import { signERC2612Permit } from "eth-permit";
import {
  getPublicClient,
  getWalletClient,
  waitForTransaction,
  switchNetwork,
  getNetwork,
  readContracts,
} from "@wagmi/core";
import { ethers } from "ethers";
import useBiconomy from "./useBiconomy";
import { chunk } from "lodash";
import {
  bearzABI,
  bearzConsumableABI,
  bearzConsumableContractAddress,
  bearzContractAddress,
  bearzQuestABI,
  bearzQuestContractAddress,
  bearzStakeABI,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
  bearzStakeContractAddress,
  bearzTokenABI,
  bearzTokenContractAddress,
} from "../lib/contracts";

const useBearzActions = ({ account, signer }) => {
  const CHUNK_SIZE = 25;

  const { initializeBiconomy } = useBiconomy({
    account,
    contractAddresses: [bearzStakeChildContractAddress],
    strictMode: true,
    debug: false,
    chainId: polygon.id,
  });

  return {
    onQuest: async ({ tokenIds, questId }) => {
      let toastId;

      try {
        const network = await getNetwork();

        if (network.chain.id !== polygon.id) {
          await switchNetwork({ chainId: polygon.id });
        }

        const [
          { result: questPrice },
          { result: balance },
          { result: allowances },
        ] = await readContracts({
          contracts: [
            {
              address: bearzStakeChildContractAddress,
              abi: bearzStakeChildABI,
              chainId: polygon.id,
              functionName: "questPrice",
            },
            {
              address: bearzTokenContractAddress,
              abi: bearzTokenABI,
              chainId: polygon.id,
              functionName: "balanceOf",
              args: [account.address],
            },
            {
              address: bearzTokenContractAddress,
              abi: bearzTokenABI,
              chainId: polygon.id,
              functionName: "allowance",
              args: [account.address, bearzStakeChildContractAddress],
            },
          ],
        });

        if (!balance || balance < questPrice * BigInt(tokenIds.length)) {
          toast.error("You do not have enough credits to quest!");
          return;
        }

        if (allowances < questPrice * BigInt(tokenIds.length)) {
          const approvalToastId = toast.loading(
            "Awaiting for $CREDIT token allowance. You are signing to allow usage of your token.",
          );

          const provider = await initializeBiconomy();

          const { maxFeePerGas } = await provider.getFeeData();

          const tokenContract = new ethers.Contract(
            bearzTokenContractAddress,
            bearzTokenABI,
            provider.getSigner(account.address),
          );

          console.log(provider);

          const result = await signERC2612Permit(
            provider,
            bearzTokenContractAddress,
            account.address,
            bearzStakeChildContractAddress,
          );

          const gasLimit = await tokenContract.estimateGas.permit(
            account.address,
            bearzStakeChildContractAddress,
            result.value,
            result.deadline,
            result.v,
            result.r,
            result.s,
          );

          const approval = await tokenContract.permit(
            account.address,
            bearzStakeChildContractAddress,
            result.value,
            result.deadline,
            result.v,
            result.r,
            result.s,
            {
              gasLimit,
              maxFeePerGas,
            },
          );

          await approval.wait();

          toast.update(approvalToastId, {
            render: `Approved token usage! Continuing quest tx...`,
            type: "success",
            isLoading: false,
            closeButton: true,
            autoClose: 5000,
          });
        }

        const chunks = chunk(tokenIds, CHUNK_SIZE);

        toastId = toast(`Check wallet for ${chunks.length} transaction(s)...`, {
          autoClose: false,
          progress: 0,
        });

        const provider = await initializeBiconomy();

        const contract = new ethers.Contract(
          bearzStakeChildContractAddress,
          bearzStakeChildABI,
          provider.getSigner(account.address),
        );

        for (let i = 0; i < chunks.length; i++) {
          const chunkTokenIds = chunks[i];

          const questTokenIds = chunkTokenIds.map((_) => questId);

          const gasLimit = await contract.estimateGas.quest(
            chunkTokenIds,
            questTokenIds,
            questPrice * chunkTokenIds.length,
          );

          const { maxFeePerGas } = await provider.getFeeData();

          const transaction = await contract.quest(
            chunkTokenIds,
            questTokenIds,
            questPrice * chunkTokenIds.length,
            {
              gasLimit: gasLimit.mul(100).div(50),
              maxFeePerGas,
            },
          );

          toast.update(toastId, {
            type: "default",
            render: "Time to quest...",
            autoClose: false,
          });
          await transaction.wait();
          toast.update(toastId, {
            type: "success",
            render: "Bear(s) are questing.",
            autoClose: i === chunks?.length - 1 ? 5000 : false,
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        if (toastId) {
          toast.update(toastId, {
            type: "error",
            render: "There was an error please try again.",
          });
        }
        return false;
      }
    },
    onEndQuest: async ({ tokenIds, questTypeIds }) => {
      try {
        // const smartAccount = await biconomyAccount.init();
        //
        // await checkSmartWalletAssociation({ smartAccount });
        //
        // const callData = encodeFunctionData({
        //   abi: bearzStakeChildABI,
        //   functionName: "quest",
        //   args: [tokenIds, questTypeIds, tokenAmount],
        // });
        //
        // const partialUserOp = await smartAccount.buildUserOp([
        //   {
        //     to: bearzStakeChildContractAddress,
        //     data: callData,
        //   },
        // ]);
        //
        // const { paymasterAndData } =
        //   await smartAccount.paymaster.getPaymasterAndData(partialUserOp, {
        //     mode: PaymasterMode.SPONSORED,
        //   });
        //
        // partialUserOp.paymasterAndData = paymasterAndData;
        //
        // const userOpResponse = await smartAccount.sendUserOp(partialUserOp);
        //
        // const toastId = toast.info("Packing up to go out on quest...", {
        //   autoClose: false,
        // });
        //
        // const { success } = await userOpResponse.wait();
        //
        // if (success === "false") {
        //   toast.update(toastId, {
        //     type: toast.TYPE.ERROR,
        //     render: "There was an error while trying to quest the bearz!",
        //   });
        //   return;
        // }
        //
        // toast.update(toastId, {
        //   type: toast.TYPE.SUCCESS,
        //   autoClose: 7500,
        //   render: "Bear(s) left to go on quest.",
        // });

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
        return false;
      }
    },
    onStopTraining: async ({ tokenIds }) => {
      let toastId;

      try {
        const network = await getNetwork();

        if (network.chain.id !== polygon.id) {
          await switchNetwork({ chainId: polygon.id });
        }

        const chunks = chunk(tokenIds, CHUNK_SIZE);

        toastId = toast(`Check wallet for ${chunks.length} transaction(s)...`, {
          autoClose: false,
          progress: 0,
        });

        const provider = await initializeBiconomy();

        const contract = new ethers.Contract(
          bearzStakeChildContractAddress,
          bearzStakeChildABI,
          provider.getSigner(account.address),
        );

        for (let i = 0; i < chunks.length; i++) {
          const chunkTokenIds = chunks[i];
          const { maxFeePerGas } = await provider.getFeeData();
          const gasLimit =
            await contract.estimateGas.stopTraining(chunkTokenIds);
          const transaction = await contract.stopTraining(chunkTokenIds, {
            gasLimit: gasLimit.mul(2),
            maxFeePerGas,
          });
          toast.update(toastId, {
            type: "default",
            render: "Time to stop training...",
            autoClose: false,
          });
          await transaction.wait();
          toast.update(toastId, {
            type: "success",
            render: "Bear(s) are now back from training.",
            autoClose: i === chunks?.length - 1 ? 5000 : false,
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        if (toastId) {
          toast.update(toastId, {
            type: "error",
            render: "There was an error while stopping training.",
          });
        }
        return false;
      }
    },
    onStartTraining: async ({ tokenIds }) => {
      let toastId;

      try {
        const network = await getNetwork();

        if (network.chain.id !== polygon.id) {
          await switchNetwork({ chainId: polygon.id });
        }

        const chunks = chunk(tokenIds, CHUNK_SIZE);

        toastId = toast(`Check wallet for ${chunks.length} transaction(s)...`, {
          autoClose: false,
          progress: 0,
        });

        const provider = await initializeBiconomy();

        const contract = new ethers.Contract(
          bearzStakeChildContractAddress,
          bearzStakeChildABI,
          provider.getSigner(account.address),
        );

        for (let i = 0; i < chunks.length; i++) {
          const chunkTokenIds = chunks[i];
          const { maxFeePerGas } = await provider.getFeeData();
          const gasLimit = await contract.estimateGas.train(chunkTokenIds);
          const transaction = await contract.train(chunkTokenIds, {
            gasLimit: gasLimit.mul(2),
            maxFeePerGas,
          });
          toast.update(toastId, {
            type: "default",
            render: "Time to start training...",
            autoClose: false,
          });
          await transaction.wait();
          toast.update(toastId, {
            type: "success",
            render: "Bear(s) are training.",
            autoClose: i === chunks?.length - 1 ? 5000 : false,
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        if (toastId) {
          toast.update(toastId, {
            type: "error",
            render: "There was an error while starting training.",
          });
        }
        return false;
      }
    },
    onStake: async ({ tokenIds }) => {
      try {
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        const publicClient = getPublicClient({
          chainId: mainnet.id,
        });

        const { request } = await publicClient.simulateContract({
          address: bearzStakeContractAddress,
          abi: bearzStakeABI,
          functionName: "stake",
          args: [tokenIds],
          account: {
            address: signer.getAddress(),
          },
        });

        const walletClient = await getWalletClient({
          chainId: mainnet.id,
        });

        const hash = await walletClient.writeContract(request);

        await toast.promise(
          waitForTransaction({
            hash,
          }),
          {
            pending: "Staking assets...",
            success: "Bear assets have been staked!",
            error: "There was an error",
          },
        );

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
        return false;
      }
    },
    onUnstake: async ({ tokenIds }) => {
      try {
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        const publicClient = getPublicClient({
          chainId: mainnet.id,
        });

        const { request } = await publicClient.simulateContract({
          address: bearzStakeContractAddress,
          abi: bearzStakeABI,
          functionName: "unstake",
          args: [tokenIds],
          account: {
            address: signer.getAddress(),
          },
        });

        const walletClient = await getWalletClient({
          chainId: mainnet.id,
        });

        const hash = await walletClient.writeContract(request);

        await toast.promise(
          waitForTransaction({
            hash,
          }),
          {
            pending: "Unstaking assets...",
            success: "Bear assets have been unstaked!",
            error: "There was an error",
          },
        );

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
        return false;
      }
    },
    onDeactivate: async ({ tokenId, itemTokenId }) => {
      try {
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        const publicClient = getPublicClient({
          chainId: mainnet.id,
        });

        const { request } = await publicClient.simulateContract({
          address: bearzConsumableContractAddress,
          abi: bearzConsumableABI,
          functionName: "deactivate",
          args: [tokenId, itemTokenId],
          account: {
            address: signer.getAddress(),
          },
        });

        const walletClient = await getWalletClient({
          chainId: mainnet.id,
        });

        const hash = await walletClient.writeContract(request);

        await toast.promise(
          waitForTransaction({
            hash,
          }),
          {
            pending: "De-activating consumable",
            success: "Consumable deactivated!",
            error: "There was an error",
          },
        );

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
      }
    },
    onActivate: async ({ tokenId, itemTokenId }) => {
      try {
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        const publicClient = getPublicClient({
          chainId: mainnet.id,
        });

        const { request } = await publicClient.simulateContract({
          address: bearzConsumableContractAddress,
          abi: bearzConsumableABI,
          functionName: "activate",
          args: [tokenId, itemTokenId],
          account: {
            address: signer.getAddress(),
          },
        });

        const walletClient = await getWalletClient({
          chainId: mainnet.id,
        });

        const hash = await walletClient.writeContract(request);

        await toast.promise(
          waitForTransaction({
            hash,
          }),
          {
            pending: "Activating consumable",
            success: "Consumable activated!",
            error: "There was an error",
          },
        );

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
      }
    },
    onTransfer: async ({ recipient, tokenIds }) => {
      try {
        const network = await getNetwork();

        if (network.chain.id !== mainnet.id) {
          await switchNetwork({ chainId: mainnet.id });
        }

        const [{ result: hasApprovals }] = await readContracts({
          contracts: [
            {
              address: bearzContractAddress,
              abi: bearzABI,
              chainId: mainnet.id,
              functionName: "isApprovedForAll",
              args: [
                signer.getAddress(),
                "0x2e2234b3a848f895a60b2071f90303cd02f7491d",
              ],
            },
          ],
        });

        const publicClient = getPublicClient({
          chainId: mainnet.id,
        });

        if (!hasApprovals) {
          const { request } = await publicClient.simulateContract({
            address: bearzContractAddress,
            abi: bearzABI,
            functionName: "setApprovalForAll",
            args: ["0x2e2234b3a848f895a60b2071f90303cd02f7491d", true],
            account: {
              address: signer.getAddress(),
            },
          });

          const walletClient = await getWalletClient({
            chainId: mainnet.id,
          });

          const hash = await walletClient.writeContract(request);

          await toast.promise(
            waitForTransaction({
              hash,
            }),
            {
              pending: "Approving Bearz for batch transfer...",
              success: "Bearz are able to be batch transferred",
              error: "There was an error approving tokens",
            },
          );
        }

        const { request } = await publicClient.simulateContract({
          address: "0x2e2234b3a848f895a60b2071f90303cd02f7491d",
          abi: [
            {
              inputs: [
                {
                  internalType: "contract ERC721Partial",
                  name: "tokenContract",
                  type: "address",
                },
                { internalType: "address", name: "recipient", type: "address" },
                {
                  internalType: "uint256[]",
                  name: "tokenIds",
                  type: "uint256[]",
                },
              ],
              name: "batchTransfer",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "batchTransfer",
          args: [bearzContractAddress, recipient, tokenIds],
          account: {
            address: signer.getAddress(),
          },
        });

        const walletClient = await getWalletClient({
          chainId: mainnet.id,
        });

        const hash = await walletClient.writeContract(request);

        await toast.promise(
          waitForTransaction({
            hash,
          }),
          {
            pending: `Transferring ${tokenIds.length} tokens...`,
            success: "Your bearz are now being transferred!",
            error: "There was an error transferring tokens.",
          },
        );

        return true;
      } catch (e) {
        console.log(e);
        toast.error("There was an error. Please try again!");
        return false;
      }
    },
  };
};

export default useBearzActions;
