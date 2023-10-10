// @ts-nocheck
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import classnames from "classnames";
import { useAccount, useWalletClient, useContractRead } from "wagmi";
import { mainnet } from "viem/chains";
import { MdArrowBack as BackIcon, MdLock as LockIcon } from "react-icons/md";
import { createPublicClient, http } from "viem";
import { keyBy } from "lodash";
import { providers, Contract } from "ethers";
import Header from "./components/Header";
import { ALCHEMY_KEY } from "./lib/constants";
import buttonBackground from "./interactive/button.png";
import burningCrate from "./interactive/crates/burning.gif";
import {
  bearzShopABI,
  bearzShopContractAddress,
  bearzQuickSale2Address,
  bearzQuickSale2ABI,
  bearzConsumableContractAddress,
  bearzConsumableABI,
} from "./lib/contracts";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import SandboxWrapper from "./components/SandboxWrapper";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import { BEARZ_SHOP_IMAGE_URI } from "./lib/blockchain";
import useBearzNFTs from "./hooks/useBearzNFTs";
import shadowImage from "./interactive/shadow.png";
import { formatNumber } from "./lib/formatting";
import {
  GiJourney as QuestIcon,
  GiStrongMan as TrainingIcon,
} from "react-icons/gi";
import { waitForTransaction } from "@wagmi/core";
import logoImage from "./interactive/logo.gif";

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const getUserConsumables = async (address, tokenIds) => {
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  const [balances, items] = await Promise.all([
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "balanceOfBatch",
      args: [tokenIds.map((_) => address), tokenIds],
    }),
    ethClient.readContract({
      address: bearzShopContractAddress,
      abi: bearzShopABI,
      functionName: "getMetadataBatch",
      args: [tokenIds],
    }),
  ]);

  const lookupItems = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      item: items[index],
    })),
    "tokenId",
  );

  const lookupBalances = keyBy(
    tokenIds.map((tokenId, index) => ({
      tokenId,
      balance: balances[index],
    })),
    "tokenId",
  );

  return tokenIds.reduce((acc, tokenId) => {
    acc[tokenId] = {
      ...lookupItems[tokenId],
      ...lookupBalances[tokenId],
    };
    return acc;
  }, {});
};

const CONSUMABLE_TOKEN_IDS = [300];

function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  return provider.getSigner(account.address);
}

function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  );
}

const useConsumables = ({ isSimulated, overrideAddress }) => {
  const navigate = useNavigate();

  const [consumables, setConsumables] = useState(null);
  const [isApproving, setApproving] = useState(false);

  const [isConsuming, setIsConsuming] = useState(false);
  const [consumingContext, setConsumingContext] = useState(null);

  const [isBuying, setBuying] = useState(false);
  const [buyingContext, setBuyingContext] = useState(null);

  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  const { isLoading } = useSimpleAccountOwner();
  const signer = useEthersSigner();

  const { data: isApproved, refetch } = useContractRead({
    address: bearzShopContractAddress,
    abi: bearzShopABI,
    functionName: "isApprovedForAll",
    args: [account?.address, bearzConsumableContractAddress],
  });

  const onRefresh = async (address) => {
    setConsumables(await getUserConsumables(address, CONSUMABLE_TOKEN_IDS));
  };

  useEffect(() => {
    (async function () {
      if (account?.address) {
        await onRefresh(account?.address);
      }
    })();
  }, [account?.address, signer?.provider]);

  if (isSimulated || isLoading || !signer?.provider) {
    return account;
  }

  return {
    ...account,
    isApproving,
    data: {
      consumables,
      isConsuming,
      isApproved,
      consumingContext,
      isBuying,
      buyingContext,
    },
    actions: {
      onRefresh: onRefresh.bind(null, account?.address),
      onApproveConsumable: async () => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzShopContractAddress,
            bearzShopABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.setApprovalForAll(
            bearzConsumableContractAddress,
            true,
          );

          setApproving(true);

          const tx = await contract.setApprovalForAll(
            bearzConsumableContractAddress,
            true,
            {
              gasLimit: gasLimit.mul(100).div(80),
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            },
          );

          await tx.wait();
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setApproving(false);
          refetch();
        }
      },
      onBuyConsumables: async ({ amount }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzQuickSale2Address,
            bearzQuickSale2ABI,
            signer,
          );

          const ethPrice = await contract.ethPrice();

          const gasLimit = await contract.estimateGas.buy(amount, {
            value: ethPrice.mul(amount),
          });

          setBuying(true);
          setBuyingContext(`Check wallet for transaction...`);

          const tx = await contract.buy(amount, {
            value: ethPrice.mul(amount),
            gasLimit,
            maxFeePerGas: feeData.maxFeePerGas,
          });

          setBuyingContext(`Buying ${amount} consumable(s)...`);

          await tx.wait();

          navigate(`/consumables`);

          toast.success(`Successfully bought ${amount} consumable(s)!`);

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setBuying(false);
          setBuyingContext(null);
        }
      },
      onConsume: async ({ tokenId, itemTokenId }) => {
        try {
          const feeData = await signer.provider.getFeeData();

          const contract = new Contract(
            bearzConsumableContractAddress,
            bearzConsumableABI,
            signer,
          );

          const gasLimit = await contract.estimateGas.consume(
            tokenId,
            itemTokenId,
            true,
          );

          setIsConsuming(true);
          setConsumingContext(`Check wallet for transaction...`);

          const tx = await contract.consume(tokenId, itemTokenId, true, {
            gasLimit: gasLimit.mul(100).div(80),
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          });

          await toast.promise(tx.wait(), {
            pending: "Burning consumable(s)...",
            success: `Successfully applied consumable to ${tokenId}!`,
            error: "There was an error",
          });

          return true;
        } catch (e) {
          console.log(e);
          toast.error("There was an error. Please try again!");
        } finally {
          setIsConsuming(false);
          setConsumingContext(null);
        }
      },
    },
  };
};

const WaitingForBurn = ({ onClose }) => (
  <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
    <div className="flex flex-col text-center text-white py-4 items-center justify-center space-y-4">
      <img
        src={burningCrate}
        className="h-[245px] w-[179px]"
        alt="burning card"
      />
      <p className="text-accent text-sm">Burning consumable(s)...</p>
      <button
        onClick={onClose}
        className="relative flex items-center justify-center w-[250px] cursor-pointer"
      >
        <img
          className="object-cover h-full w-full"
          src={buttonBackground}
          alt="button"
        />
        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
          Close
        </span>
      </button>
    </div>
  </div>
);

const ListView = ({ data, selected, setSelected }) => {
  return (
    <div className="flex flex-row flex-wrap justify-center gap-4 px-6 md:px-10 pt-6 pb-20">
      {data.map((item) => {
        const { metadata, stats, activity } = item;
        const { end, int, lck, level, nextXpLevel, str, xp } = stats || {};
        const { isStaked, training, questing } = activity;
        const isSelected = Number(selected) === Number(metadata?.tokenId);

        return (
          <div
            role="button"
            key={metadata?.tokenId}
            className="flex flex-row w-[365px] items-center space-x-2 h-[120px]"
            onClick={() => {
              setSelected(isSelected ? null : metadata?.tokenId);
            }}
          >
            <div
              className={classnames(
                "cursor-pointer relative flex flex-row w-full h-full bg-dark shadow-pixel hover:shadow-pixelAccent shadow-xs overflow-hidden transition ease-in duration-200",
                {
                  "shadow-pixelAccent": isSelected,
                },
              )}
            >
              <div className="relative z-[1]">
                <LazyLoadImage
                  alt={metadata.dna}
                  height={120}
                  src={metadata.image}
                  placeholderSrc={shadowImage}
                  width={120}
                />
                <div className="flex w-full absolute top-0 left-0 z-[2]">
                  <div className="flex items-center justify-center bg-dark2 shadow-pixel text-[10px] text-white px-2">
                    LVL {level || 0}
                  </div>
                </div>
                <div className="absolute bottom-0 flex flex-row w-full">
                  <div className="flex border border-1 border-accent bg-dark2 h-[8px] w-full overflow-hidden">
                    <div
                      title={`Next Level: ${formatNumber(nextXpLevel)} XP`}
                      className="z-[1] bg-accent h-full duration-300"
                      style={{
                        width: `${(xp / nextXpLevel) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="hidden text-[8px] text-accent relative top-[2px] left-[2px] h-[8px]">
                    {level + 1}
                  </span>
                </div>
              </div>
              <div className="flex flex-col w-full px-3 py-2">
                <div className="flex flex-row items-center justify-between mb-1">
                  <h2 className="relative text-sm truncate">{metadata.name}</h2>
                  {(isStaked ||
                    questing?.isQuesting ||
                    training?.isTraining) && (
                    <div className="flex flex-row items-center space-x-2 flex-shrink-0 text-accent">
                      {isStaked && <LockIcon />}
                      {questing?.isQuesting && <QuestIcon />}
                      {training?.isTraining && <TrainingIcon />}
                    </div>
                  )}
                </div>
                <div className="flex flex-row items-center w-full justify-between text-xs space-x-3 mb-4">
                  <div className="flex flex-col space-y-1 justify-center">
                    <span className="text-accent2">STR</span>
                    <span className="text-xs">{str || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 justify-center">
                    <span className="text-accent2">END</span>
                    <span className="text-xs">{end || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 justify-center">
                    <span className="text-accent2">INT</span>
                    <span className="text-xs">{int || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 justify-center">
                    <span className="text-accent2">LCK</span>
                    <span className="text-xs">{lck || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BearzSelector = ({ address, onClose, onSubmit }) => {
  const [selected, setSelected] = useState(null);
  const { data } = useBearzNFTs(address);

  return (
    <div className="fixed top-0 left-0 h-full w-full z-[99999] bg-dark overflow-auto">
      <div className="absolute top-0 left-0 flex flex-row flex-shrink-0 w-full justify-between items-center h-[65px] px-4 sm:px-10 text-white z-[2]">
        <button
          className="bg-main p-1 rounded-full text-3xl shadow-xl"
          onClick={onClose}
        >
          <BackIcon />
        </button>
      </div>
      <div className="flex flex-col space-y-3 py-[65px]">
        <div className="flex flex-col flex-shrink-0 items-center justify-center w-full gap-4 px-6 md:px-10">
          <h1 className="text-white text-2xl text-center">
            Select bear for consumable
          </h1>
        </div>
        <div className="flex flex-wrap w-full h-full gap-6 overflow-x-auto pt-[65px]">
          <ListView data={data} selected={selected} setSelected={setSelected} />
        </div>
        {selected && (
          <div className="flex flex-row items-center justify-center fixed z-[10000] bottom-0 w-full text-base bg-dark2 border-t-[3px] border-accent">
            <div
              className="flex flex-row h-[75px] w-full items-center justify-center px-6 space-x-6"
              style={{
                backdropFilter: "blur(12px)",
              }}
            >
              <button
                className={classnames(
                  "flex flex-col space-x-2 items-center justify-center focus:scale-[98%] text-xs uppercase transition ease-in duration-200 px-2",
                  {
                    "opacity-50 cursor-not-allowed": !selected,
                    "hover:text-accent": selected,
                  },
                )}
                onClick={async () => {
                  onClose();
                  await onSubmit(selected);
                }}
              >
                <span>Consume</span>
                <span className="text-[10px] text-warn">
                  (Token Id: {selected})
                </span>
              </button>
              <button
                className="hidden md:flex items-center justify-center focus:scale-[98%] text-xs hover:text-accent uppercase transition ease-in duration-200 px-2"
                onClick={(e) => {
                  setSelected(null);
                }}
              >
                Unselect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConsumablesView = ({ isSimulated }) => {
  const [viewConsumableId, setViewConsumableId] = useState(null);
  const [amountToBuy, setAmountToBuy] = useState(1);
  const [bearzSelectorId, setBearzSelectorId] = useState(null);
  const { address, isConnected } = useAccount();

  const { data, actions, sounds, isApproving } = useConsumables({
    isSimulated,
    overrideAddress: null,
  });

  return (
    <div
      className={classnames("flex flex-col relative text-white items-center", {
        "justify-center h-screen w-screen": !isConnected,
        "h-full w-full": isConnected,
      })}
    >
      {!isSimulated && (
        <div className="flex flex-col h-full w-full">
          <Header />
          {!isConnected && <PleaseConnectWallet />}
        </div>
      )}
      {isConnected && (
        <div className="flex flex-col h-screen w-screen space-y-4">
          {bearzSelectorId && (
            <BearzSelector
              address={address}
              onClose={() => {
                setBearzSelectorId(null);
              }}
              onSubmit={async (selectedTokenId) => {
                const success = await actions?.onConsume({
                  tokenId: selectedTokenId,
                  itemTokenId: bearzSelectorId,
                });

                if (success) {
                  setBearzSelectorId(null);
                }
              }}
            />
          )}
          {viewConsumableId && (
            <div className="fixed top-0 left-0 h-full w-full z-[99999] bg-dark overflow-auto">
              <div className="absolute top-0 left-0 flex flex-row flex-shrink-0 w-full justify-between items-center h-[65px] px-4 sm:px-10 text-white z-[2]">
                <button
                  className="bg-main p-1 rounded-full text-3xl shadow-xl"
                  onClick={() => {
                    setViewConsumableId(null);
                  }}
                >
                  <BackIcon />
                </button>
              </div>
              <div className="flex flex-col space-y-6 py-[65px]">
                <div className="flex flex-col flex-shrink-0 items-center justify-center w-full gap-4 px-6 md:px-10">
                  <h1 className="text-white text-2xl">
                    {data?.consumables?.[viewConsumableId]?.item?.name}
                  </h1>
                  <p className="text-white text-sm opacity-80">
                    {data?.consumables?.[viewConsumableId]?.item?.description}
                  </p>
                </div>
                <div className="flex flex-wrap w-full h-full gap-6 overflow-x-auto">
                  <div className="flex flex-col w-full h-full items-center justify-center space-y-2">
                    <p className="text-center text-sm text-accent">
                      Price: 0.02ETH
                    </p>
                    <img
                      className="h-[250px]"
                      src={`${BEARZ_SHOP_IMAGE_URI}${viewConsumableId}.png`}
                      alt={String(viewConsumableId)}
                    />
                    <div className="flex flex-col space-y-1">
                      <div className="flex flex-row items-center justify-center space-x-2 mt-3">
                        <select
                          className="flex text-right h-[34px] px-1 rounded-full bg-main border-dark border-[1px] text-white cursor-pointer z-[1]"
                          value={amountToBuy}
                          onChange={(e) => {
                            setAmountToBuy(e.target.value);
                          }}
                          disabled={data?.isBuying}
                        >
                          {new Array(Number(100)).fill(0).map((i, index) => (
                            <option key={index} value={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={async () => {
                            sounds?.start();

                            const success = await actions?.onBuyConsumables({
                              amount: amountToBuy,
                            });

                            if (success) {
                              setViewConsumableId(null);
                              actions?.onRefresh();
                            }
                          }}
                          className="relative flex items-center justify-center h-[36px] cursor-pointer z-[1]"
                          disabled={data?.isBuying}
                        >
                          <img
                            className="object-cover h-full w-full"
                            src={buttonBackground}
                            alt="button"
                          />
                          <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                            {data?.isBuying ? "Buying..." : "Buy"}
                          </span>
                        </button>
                      </div>
                      {data?.buyingContext && (
                        <p className="text-center text-warn text-sm py-2">
                          {data?.buyingContext}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4 items-center justify-center mx-auto overflow-x-hidden">
                    <Link
                      to={`https://bearzaar.brawlerbearz.club/collections/0xbd24a76f4135f930f5c49f6c30e0e30a61b97537/networks/mainnet/tokens/${viewConsumableId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-white text-sm text-center"
                    >
                      Buy with credit card at the Bearzaar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          {data?.consumables ? (
            <div className="flex flex-col items-center justify-center space-y-10">
              <div className="flex flex-row items-center space-x-4">
                <h1 className="text-lg">Your Consumables</h1>
              </div>
              {!data?.isApproved && (
                <div className="flex flex-col items-center space-y-4 max-w-xl text-center px-2 border-b-[2px] border-white border-opacity-20 pb-10">
                  <p className="text-xs text-warn">
                    Note: You need to approve burning consumable cards.
                  </p>
                  <span className="text-xs text-white opacity-80">
                    This is a 1-time operation to allow the contract to burn
                    consumable cards on your behalf.
                  </span>
                  <button
                    onClick={async () => {
                      await actions?.onApproveConsumable();
                    }}
                    className="relative flex items-center justify-center w-[280px] cursor-pointer z-[1] mt-6"
                  >
                    <img
                      className="object-cover h-full w-full"
                      src={buttonBackground}
                      alt="button"
                    />
                    <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                      {isApproving ? "Approving..." : "Approve"}
                    </span>
                  </button>
                </div>
              )}
              {data?.isConsuming ? (
                <div className="font-primary flex flex-col items-center h-full w-full z-[1]">
                  <img
                    src={burningCrate}
                    className="h-[245px] w-[179px]"
                    alt="burning card"
                  />
                  <div className="flex flex-col space-y-1 text-center text-white py-4">
                    <h1 className="text-sm">
                      {data?.consumingContext ||
                        "Check your wallet for transaction..."}
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-wrap gap-4">
                  {Object.keys(data?.consumables || {}).map((tokenId) => {
                    const consumable = data?.consumables[tokenId];
                    return (
                      <div
                        key={tokenId}
                        className="relative flex flex-col items-center justify-center w-[270px]"
                      >
                        <div className="relative flex w-full h-full">
                          <img
                            src={`${process.env.PUBLIC_URL}/cards/${tokenId}.png`}
                            className="w-full z-[2]"
                          />
                          <div className="absolute flex items-center justify-center border-white border-[3px] top-[-22px] right-[-22px] h-[45px] w-[45px] bg-[#887d8d] shadow-xl rounded-full text-white text-xs z-[2]">
                            <span>x{String(consumable?.balance || 0)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-3 my-4">
                          {data?.isApproved && consumable?.balance > 0n && (
                            <div className="flex flex-row items-center justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setBearzSelectorId(tokenId);
                                }}
                                className="relative flex items-center justify-center w-full cursor-pointer z-[1]"
                              >
                                <img
                                  className="object-cover h-full w-full"
                                  src={buttonBackground}
                                  alt="button"
                                />
                                <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                                  Burn & Consume
                                </span>
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setViewConsumableId(tokenId);
                            }}
                            className="relative flex items-center justify-center w-full cursor-pointer z-[1]"
                          >
                            <img
                              className="object-cover h-full w-full"
                              src={buttonBackground}
                              alt="button"
                            />
                            <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                              View & Buy more
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const FullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <ConsumablesView isSimulated={isSimulated} />
    </div>
  );
};

const MobileFullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <ConsumablesView isSimulated={isSimulated} />
    </div>
  );
};

const Experience = ({ isSandboxed, isSimulated = false }) => {
  return (
    <>
      <div className="h-screen w-screen bg-dark font-primary">
        <div className="hidden tablet:flex max-w-screen relative mx-auto max-h-screen overflow-hidden">
          <FullExperience isSimulated={isSimulated} />
        </div>
        {isSandboxed ? (
          <div className="flex tablet:hidden max-w-screen relative mx-auto max-h-screen overflow-hidden">
            <FullExperience isSimulated={isSimulated} />
          </div>
        ) : (
          <div className="flex tablet:hidden relative h-full w-full overflow-auto">
            <MobileFullExperience isSimulated={isSimulated} />
          </div>
        )}
      </div>
      <ToastContainer
        theme="dark"
        position="bottom-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  );
};

const Consumables = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Consumables;
