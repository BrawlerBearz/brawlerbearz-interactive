// @ts-nocheck
import { mainnet, polygon } from "viem/chains";
import { toast } from "react-toastify";
import {
  getPublicClient,
  getWalletClient,
  waitForTransaction,
  switchNetwork,
  getNetwork,
} from "@wagmi/core";
import { ethers } from "ethers";
import useBiconomy from "./useBiconomy";
import { chunk } from "lodash";
import {
  bearzConsumableABI,
  bearzConsumableContractAddress,
  bearzStakeABI,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
  bearzStakeContractAddress,
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

  // const biconomyAccount = new BiconomySmartAccount({
  //   signer,
  //   chainId: ChainId.POLYGON_MAINNET,
  //   rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`,
  //   paymaster: new BiconomyPaymaster({
  //     paymasterUrl:
  //         "https://paymaster.biconomy.io/api/v1/137/pQ4YfSfVI.5f85bc99-110a-4594-9629-5f5c5ddacded",
  //   }),
  //   bundler: new Bundler({
  //     bundlerUrl:
  //         "https://bundler.biconomy.io/api/v2/137/BB897hJ89.dd7fopYh-iJkl-jI89-af80-6877f74b7Fcg",
  //     chainId: ChainId.POLYGON_MAINNET,
  //     entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  //   }),
  //   entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  // });
  //
  // const checkSmartWalletAssociation = async ({ smartAccount }) => {
  //   const polygonClient = createPublicClient({
  //     chain: polygon,
  //     transport: http(
  //         `https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`,
  //     ),
  //   });
  //
  //   const smartAccountAddress = await smartAccount.getSmartAccountAddress();
  //
  //   // Check if smart wallet is enabled already and associated to leverage
  //   const smartWalletAssociated = await polygonClient.readContract({
  //     address: bearzStakeChildContractAddress,
  //     abi: bearzStakeChildABI,
  //     functionName: "operatorAccess",
  //     args: [smartAccountAddress],
  //   });
  //
  //   await switchNetwork({ chainId: polygon.id });
  //
  //   // Set up smart wallet association if different than expected
  //   if (
  //       true // smartWalletAssociated.toLowerCase() !== smartAccount.owner.toLowerCase()
  //   ) {
  //     toast.info(
  //         `Setting up smart wallet permissions for EOA: ${smartAccount.owner}`,
  //     );
  //
  //     const publicClient = getPublicClient({
  //       chainId: polygon.id,
  //     });
  //
  //     const { request } = await publicClient.simulateContract({
  //       address: bearzStakeChildContractAddress,
  //       abi: bearzStakeChildABI,
  //       functionName: "associateOperatorAsOwner",
  //       args: [smartAccountAddress],
  //       account: {
  //         address: signer.getAddress(),
  //       },
  //     });
  //
  //     const walletClient = await getWalletClient({
  //       chainId: polygon.id,
  //     });
  //
  //     const hash = await walletClient.writeContract(request);
  //
  //     const receipt = await waitForTransaction({
  //       hash,
  //     });
  //
  //     toast.success(
  //         `Created smart wallet: ${smartAccountAddress}...continuing...`,
  //     );
  //   }
  // };

  return {
    onQuest: async ({ tokenIds, questTypeIds, tokenAmount }) => {
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
  };
};

export default useBearzActions;
