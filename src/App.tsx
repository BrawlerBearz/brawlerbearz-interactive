import React, { useState, useEffect } from "react";
import classnames from "classnames";
import { useParams } from "react-router-dom";
import { MdOpenInNew as ExternalIcon } from "react-icons/md";
import {
  GiClothes as WardrobeIcon,
  GiStrongMan as TrainingIcon,
  GiJourney as QuestIcon,
  GiBattleAxe as BattleIcon,
} from "react-icons/gi";
import { WagmiConfig, createConfig, useAccount } from "wagmi";
import { getWalletClient, getPublicClient, signMessage } from "@wagmi/core";
import {
  ConnectKitProvider,
  ConnectKitButton,
  getDefaultConfig,
} from "connectkit";
import {
  BaseSmartContractAccount,
  SimpleSmartAccountOwner,
  SimpleSmartContractAccount,
  SmartAccountProvider,
} from "@alchemy/aa-core";
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { polygon } from "viem/chains";
import {
  toHex,
  encodeFunctionData,
  createPublicClient,
  http,
  createWalletClient,
  custom,
} from "viem";
import { generateRenderingOrder } from "./lib/renderer";
import { getMetadataByTokenId } from "./lib/blockchain";
import {
  shortenAddress,
  getAttributeValue,
  formatNumber,
} from "./lib/formatting";
import {
  ALCHEMY_KEY,
  WALLETCONNECT_PROJECT_ID,
  CONNECT_KIT_THEME,
  L2_ALCHEMY_KEY,
} from "./lib/constants";
import pawButton from "./interactive/paw.png";
import buttonBackground from "./interactive/button.png";
import twoDButton from "./interactive/toggle2d.png";
import pixelButton from "./interactive/togglepixel.png";
import logoImage from "./interactive/logo.gif";
import {
  bearzShopContractAddress,
  bearzStakeChildABI,
  bearzStakeChildContractAddress,
} from "./lib/contracts";

// https://docs.alchemy.com/reference/simple-account-factory-addresses
const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
  "0x15Ba39375ee2Ab563E8873C8390be6f2E2F50232";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const POLICY_ID = "0d885d06-13ce-49de-bb92-8644673da502";

const LoadingScreen = ({ children, tokenId }) => {
  const [progress, setProgress] = useState(25);
  const [metadata, setMetadata] = useState(null);

  const fetchMetadata = async (currentTokenId) => {
    const start = Math.floor(Math.random() * 30 + 20);
    setProgress(start);

    if (currentTokenId > -1 && currentTokenId < 4170) {
      const metadata = await getMetadataByTokenId(currentTokenId);
      setProgress(100 - start > 70 ? Math.floor(100 - start / 2) : 90);
      setMetadata(metadata);
    }

    setTimeout(() => {
      setProgress(100);
    }, 500);
  };

  useEffect(() => {
    fetchMetadata(tokenId);
  }, [tokenId]);

  const isLoading = !metadata || progress !== 100;

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-dark">
          <img className="w-[200px]" src={logoImage} alt="logo" />
          <div className="w-[200px] h-[6px] rounded-full bg-transparent border-bg-main mt-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                transition: "width 300ms ease-in",
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      ) : (
        children({ metadata })
      )}
    </>
  );
};

const VIEWS = {
  WARDROBE: "WARDROBE",
  TRAINING: "TRAINING",
  QUESTING: "QUESTING",
  BATTLE: "BATTLE",
};

const SubView = ({ children, title, subtitle, onBack }) => (
  <div className="w-full h-full flex flex-col p-6 md:p-10 text-white overflow-auto">
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-col space-y-2">
        <h2 className="text-sm md:text-xl font-bold truncate">{title}</h2>
        <span className="opacity-50 text-[12px]">{subtitle}</span>
      </div>
      <div className="flex flex-col space-y-1 text-right">
        <button
          className="relative flex items-center justify-center pr-6 tablet:px-10 cursor-pointer text-white opacity-50 hover:opacity-100 duration-300"
          type="button"
          onClick={onBack}
        >
          <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
            Back
          </span>
        </button>
      </div>
    </div>
    <div className="w-full px-6 tablet:px-10 h-[1px] bg-white bg-opacity-50 my-2 md:my-4" />
    <div className="flex w-full overflow-auto my-2 md:my-4">{children}</div>
  </div>
);

const getStats = (attributes) => {
  const level = getAttributeValue(attributes, "level");
  const xp = getAttributeValue(attributes, "xp");
  const str = getAttributeValue(attributes, "strength");
  const end = getAttributeValue(attributes, "endurance");
  const int = getAttributeValue(attributes, "intelligence");
  const luck = getAttributeValue(attributes, "luck");
  return {
    level,
    xp,
    str,
    end,
    int,
    luck,
  };
};

const getEquippedItems = (equipped) => {
  const items = [];
  const dynamicItems = [
    "Background Id",
    "Weapon Id",
    "Face Armor Id",
    "Armor Id",
    "Eyewear Id",
    "Misc Id",
    "Head Id",
  ];

  dynamicItems.forEach((traitType) => {
    const itemId = getAttributeValue(equipped, traitType);
    if (itemId !== "0") {
      items.push({
        type: traitType,
        openseaUrl: `https://opensea.io/assets/ethereum/${bearzShopContractAddress}/${itemId}`,
        image: `https://allofthethings.s3.amazonaws.com/brawlerbearzshop/${itemId}.png`,
        label: getAttributeValue(equipped, traitType?.replace("Id", "Name")),
      });
    }
  });

  return items.filter(Boolean);
};

const factionToImage = {
  "1": "ironbearz.png",
  "2": "geoscapez.png",
  "3": "pawpunkz.png",
  "4": "techheadz.png",
};

const getFaction = (equipped) => {
  const factionId = getAttributeValue(equipped, "Faction Id");
  if (factionId !== "0") {
    return {
      image: `${process.env.PUBLIC_URL}/factions/${factionToImage[factionId]}`,
      label: getAttributeValue(equipped, "Faction Name"),
    };
  }
};

const Popup = ({ children, isOpen, onClose }) => {
  return (
    <>
      <div
        className={classnames(
          "z-[10000] absolute flex shadow-xl flex-row top-0 left-0 h-full w-full bg-dark duration-300 ease-in-out",
          {
            "bg-opacity-0": !isOpen,
            "bg-opacity-50": isOpen,
          },
        )}
        onClick={onClose}
      />
      <div
        className={classnames(
          "z-[10002] absolute flex shadow-xl flex-row h-[calc(100%-70px)] w-full bg-dark rounded-tl-2xl rounded-tr-2xl duration-300 ease-in-out",
          {
            "-bottom-[100%]": !isOpen,
            "bottom-0": isOpen,
          },
        )}
      >
        {isOpen ? children : null}
      </div>
    </>
  );
};

const useSimulatedAccount = (simulatedAddress) => {
  return {
    address: simulatedAddress,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const useNFTWrapped = ({ isSimulated, overrideAddress }) => {
  const account = !isSimulated
    ? useAccount()
    : useSimulatedAccount(overrideAddress);

  // const owner: SimpleSmartAccountOwner = {
  //   signMessage: async (msg) => {
  //     console.log(msg);
  //     return signMessage({
  //       message: toHex(msg),
  //     })
  //   },
  //   getAddress: async () => account?.address,
  // };
  //
  // let provider = new AlchemyProvider({
  //   apiKey: L2_ALCHEMY_KEY,
  //   chain: polygon,
  //   entryPointAddress: ENTRY_POINT_ADDRESS,
  // }).connect(
  //     (rpcClient) =>
  //         new SimpleSmartContractAccount({
  //           entryPointAddress: ENTRY_POINT_ADDRESS,
  //           chain: polygon,
  //           factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  //           rpcClient,
  //           owner,
  //         })
  // );
  //
  // console.log({
  //   provider
  // });
  //
  // provider = provider.withAlchemyGasManager({
  //   provider: provider.rpcClient,
  //   policyId: POLICY_ID,
  //   entryPoint: ENTRY_POINT_ADDRESS,
  // });

  return {
    ...account,
    // owner,
    // actions: {
    //   onTrain: async ({ tokenIds }) => {
    //     try {
    //
    //       // const publicClient = getPublicClient({
    //       //   chainId: polygon.id
    //       // })
    //       //
    //       // const { request } = await publicClient.simulateContract({
    //       //   address: bearzStakeChildContractAddress,
    //       //   abi: bearzStakeChildABI,
    //       //   functionName: 'train',
    //       //   args: [tokenIds],
    //       //   account,
    //       // })
    //       //
    //       // console.log({
    //       //  request
    //       // });
    //       //
    //       // const walletClient = await getWalletClient({
    //       //   chainId: polygon.id
    //       // })
    //       //
    //       // await walletClient.writeContract(request)
    //
    //       // const callData = encodeFunctionData({
    //       //   abi: bearzStakeChildABI,
    //       //   functionName: 'train',
    //       //   args: [tokenIds],
    //       // })
    //       // // //
    //       // console.log({
    //       //   callData
    //       // });
    //       // //
    //       // const { hash } = await provider.sendTransaction({
    //       //   from: account.address,
    //       //   to: bearzStakeChildContractAddress,
    //       //   data: callData
    //       // });
    //       // //
    //       // console.log({
    //       //   hash
    //       // });
    //
    //       // const gasPrice = await publicClient.getGasPrice()
    //       //
    //       // console.log({
    //       //   callData,
    //       //   gasPrice
    //       // });
    //       //
    //       //
    //       //
    //       // fetch('https://polygon-mainnet.g.alchemy.com/v2/LCNPCoXan5scqbRr4KOZK8kofDifu2fz', {
    //       //   method: 'POST',
    //       //   headers: {accept: 'application/json', 'content-type': 'application/json'},
    //       //   body: JSON.stringify({
    //       //     id: 137,
    //       //     jsonrpc: '2.0',
    //       //     method: 'eth_estimateUserOperationGas',
    //       //     params: [
    //       //       {
    //       //         sender: account.address,
    //       //         nonce: '0x0',
    //       //         initCode: '0x',
    //       //         callData,
    //       //         // callGasLimit: '0xF4240',
    //       //         // verificationGasLimit: '0xF4240',
    //       //         // preVerificationGas: '0xF4240',
    //       //         // maxFeePerGas: toHex(gasPrice),
    //       //         // maxPriorityFeePerGas: toHex(gasPrice / 10n),
    //       //         signature: '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
    //       //         paymasterAndData: '0x4Fd9098af9ddcB41DA48A1d78F91F1398965addcfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c'
    //       //       },
    //       //         ENTRY_POINT_ADDRESS
    //       //     ]
    //       //   })
    //       // })
    //       //     .then(response => response.json())
    //       //     .then(response => console.log(response))
    //       //     .catch(err => console.error(err));
    //
    //       // const options = {
    //       //   method: 'POST',
    //       //   headers: {accept: 'application/json', 'content-type': 'application/json'},
    //       //   body: JSON.stringify({
    //       //     id: 1,
    //       //     jsonrpc: '2.0',
    //       //     method: 'alchemy_simulateExecution',
    //       //     params: [
    //       //       {
    //       //         from: account.address,
    //       //         to: bearzStakeChildContractAddress,
    //       //         value: '0x0',
    //       //         data: callData
    //       //       }
    //       //     ]
    //       //   })
    //       // };
    //       //
    //       // fetch('https://polygon-mainnet.g.alchemy.com/v2/LCNPCoXan5scqbRr4KOZK8kofDifu2fz', options)
    //       //     .then(response => response.json())
    //       //     .then(response => console.log(response))
    //       //     .catch(err => console.error(err));
    //
    //     } catch (error){
    //       console.log(error);
    //     }
    //   }
    // }
  };
};

const ActionMenu = ({ metadata, isSimulated }) => {
  const [viewState, setViewState] = useState(null);

  const { attributes, equipped, ownerOf } = metadata;

  const { level, xp, str, end, int, luck } = getStats(attributes);

  const items = getEquippedItems(equipped);

  const faction = getFaction(equipped);

  const { address, isConnected } = useNFTWrapped({
    isSimulated,
    overrideAddress: ownerOf,
  });

  const isOwnerOfNFT = address === ownerOf;

  // console.log({
  //   items,
  //   equipped,
  //   isSimulated,
  //   isConnected,
  //   actions,
  //   isOwnerOfNFT
  // });

  const actionsLive = false;

  return (
    <>
      {!viewState && (
        <div className="w-full h-full flex flex-col p-6 tablet:p-10 text-white overflow-auto">
          <div className="flex flex-col gap-4 tablet:gap-0 tablet:flex-row tablet:items-center tablet:justify-between w-full">
            <div className="flex flex-col gap-2">
              <h2 className="flex flex-row items-center space-x-3 text-sm md:text-xl font-bold">
                <span title={metadata.name}>{metadata.name}</span>
                {faction?.image && (
                  <img
                    className="h-[20px] w-[20px]"
                    src={faction.image}
                    title={faction.label}
                    alt={faction.label}
                  />
                )}
              </h2>
              <a
                className="inline-flex opacity-50 text-[12px] hover:underline text-accent3"
                href={`https://etherscan.io/address/${metadata.ownerOf}`}
                target="_blank"
                rel="noreferrer"
              >
                <span title={metadata.ownerOf}>
                  Owner: {shortenAddress(metadata.ownerOf)}
                </span>
                <span className="ml-2 text-lg">
                  <ExternalIcon />
                </span>
              </a>
            </div>
            <div className="flex flex-col space-y-1 tablet:text-right">
              <span title={`Level ${level}`} className="text-sm md:text-lg">
                Level {level}
              </span>
              <span
                title={`${formatNumber(xp)} XP`}
                className="text-xs text-accent"
              >
                {formatNumber(xp)} XP
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 w-full px-6 h-[1px] bg-white bg-opacity-50 my-4" />
          <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
            <h3 className="text-xs opacity-50">Stats</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-xs opacity-50 text-accent3">STR</span>
                <span className="text-xs md:text-lg">{formatNumber(str)}</span>
              </div>
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-xs opacity-50 text-accent3">END</span>
                <span className="text-xs md:text-lg">{formatNumber(end)}</span>
              </div>
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-xs opacity-50 text-accent3">INT</span>
                <span className="text-xs md:text-lg">{formatNumber(int)}</span>
              </div>
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-xs opacity-50 text-accent3">LCK</span>
                <span className="text-xs md:text-lg">{formatNumber(luck)}</span>
              </div>
            </div>
          </div>
          {items.length > 0 && (
            <div className="flex flex-col flex-shrink-0 w-full my-4">
              <h3 className="text-xs opacity-50">Equipped Item(s)</h3>
              <div className="flex flex-shrink-0 items-center w-full overflow-x-auto space-x-4">
                {items.map((item) => (
                  <a
                    key={item.itemId}
                    title={item.label}
                    href={item.openseaUrl}
                    className="flex flex-col flex-shrink-0 h-[160px] py-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      className="h-full w-full"
                      src={item.image}
                      alt={item.label}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col flex-shrink-0 w-full my-4 space-y-4">
            <h3 className="text-xs opacity-50">Manage Brawler</h3>
            {!isSimulated ? (
              <ConnectKitButton.Custom>
                {({ isConnected, show, truncatedAddress, ensName }) => {
                  return !isConnected ? (
                    <button
                      onClick={show}
                      className="relative flex items-center justify-center w-[250px] cursor-pointer"
                    >
                      <img
                        className="object-cover h-full w-full"
                        src={buttonBackground}
                        alt="button"
                      />
                      <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                        Connect
                      </span>
                    </button>
                  ) : (
                    <button
                      className="hover:underline text-xs text-accent text-left"
                      onClick={show}
                    >
                      Connected to {ensName ?? truncatedAddress}
                    </button>
                  );
                }}
              </ConnectKitButton.Custom>
            ) : (
              <p className="text-[10px] py-2">
                Note: We have detected you are in an environment that cannot
                connect a wallet. The experience will run in a <u>simulated</u>{" "}
                mode. You can make changes but no real transactions will take
                place.
              </p>
            )}
            <div className="flex flex-wrap w-full gap-2 tablet:gap-4">
              {isConnected && isOwnerOfNFT ? (
                <>
                  {!actionsLive ? (
                    <p className="text-[10px]">
                      The Brawler Bearz interactive NFT is in development. If
                      you like, you will be able to run simulations and perform
                      your daily bearz upkeep!
                    </p>
                  ) : (
                    <>
                      <button
                        className="relative flex items-center justify-center w-[250px] cursor-pointer"
                        type="button"
                        onClick={() => {
                          setViewState(VIEWS.WARDROBE);
                        }}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          Wardrobe
                        </span>
                      </button>
                      <button
                        className="relative flex items-center justify-center w-[250px] cursor-pointer"
                        type="button"
                        onClick={() => {
                          setViewState(VIEWS.TRAINING);
                        }}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          Training
                        </span>
                      </button>
                      <button
                        className="relative flex items-center justify-center w-[250px] cursor-pointer"
                        type="button"
                        onClick={() => {
                          setViewState(VIEWS.QUESTING);
                        }}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          Questing
                        </span>
                      </button>
                      <button
                        className="hidden relative flex items-center justify-center w-[250px] cursor-pointer"
                        type="button"
                        onClick={() => {
                          setViewState(VIEWS.BATTLE);
                        }}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={buttonBackground}
                          alt="button"
                        />
                        <span className="flex absolute h-full w-full items-center justify-center text-base uppercase">
                          Battle
                        </span>
                      </button>
                    </>
                  )}
                </>
              ) : isConnected ? (
                <p className="text-[10px]">
                  You do not own this NFT to perform actions.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {viewState === VIEWS.WARDROBE && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <WardrobeIcon />
              </span>
              <span>Wardrobe</span>
            </div>
          }
          subtitle={metadata.name}
          onBack={() => {
            setViewState(null);
          }}
        >
          asdas
        </SubView>
      )}
      {viewState === VIEWS.TRAINING && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <TrainingIcon />
              </span>
              <span>Training</span>
            </div>
          }
          subtitle={metadata.name}
          onBack={() => {
            setViewState(null);
          }}
        >
          <button
            onClick={() => {
              // actions.onTrain({ tokenIds: [metadata.tokenId]})
            }}
          >
            Train em
          </button>
        </SubView>
      )}
      {viewState === VIEWS.QUESTING && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <QuestIcon />
              </span>
              <span>Questing</span>
            </div>
          }
          subtitle={metadata.name}
          onBack={() => {
            setViewState(null);
          }}
        >
          asdas
        </SubView>
      )}
      {viewState === VIEWS.BATTLE && (
        <SubView
          title={
            <div className="flex flex-row items-center space-x-3">
              <span className="text-2xl">
                <BattleIcon />
              </span>
              <span>Battle</span>
            </div>
          }
          subtitle={metadata.name}
          onBack={() => {
            setViewState(null);
          }}
        >
          asdas
        </SubView>
      )}
    </>
  );
};

const ImageRenderer = ({ images }) => {
  return (
    <div className="max-h-[2048px] relative h-full w-full max-w-[2048px]">
      {images.map((imageURL, index) => (
        <img
          key={`${imageURL}_${index}`}
          src={imageURL || ""}
          className="h-full w-full absolute top-0 left-0"
          style={{ zIndex: images.length + index }}
          alt="Layered image"
        />
      ))}
    </div>
  );
};

const Header = ({
  isSynthEnabled = false,
  isShowingPixel = true,
  onToggleMenu = null,
  onTogglePixel = null,
}) => {
  return (
    <div className="absolute top-0 flex flex-row h-[70px] items-center justify-between w-full z-[10001] px-3">
      {onToggleMenu ? (
        <button
          onClick={onToggleMenu}
          className="h-[40px] w-[40px] opacity-50 hover:opacity-80 bg-opacity-30 bg-white rounded-full overflow-hidden hover:shadow-xl duration-300"
        >
          <img
            src={pawButton}
            className="h-full w-full p-[9px]"
            alt="paw menu icon"
          />
        </button>
      ) : (
        <div />
      )}
      {isSynthEnabled && onTogglePixel && (
        <button onClick={onTogglePixel}>
          <img
            src={!isShowingPixel ? twoDButton : pixelButton}
            className="h-[57px] w-[104px]"
            alt="enabler icon"
          />
        </button>
      )}
    </div>
  );
};

const FullExperience = ({
  metadata,
  images,
  isSynthEnabled,
  isShowingPixel,
  onTogglePixel,
  isSimulated,
}) => {
  const [isShowingMenu, setIsShowingMenu] = useState(false);
  return (
    <div className="relative h-full w-full">
      <Header
        onToggleMenu={() => {
          setIsShowingMenu((value) => !value);
        }}
        isSynthEnabled={isSynthEnabled}
        isShowingPixel={isShowingPixel}
        onTogglePixel={onTogglePixel}
      />
      <ImageRenderer images={images} />
      <Popup
        isOpen={isShowingMenu}
        onClose={() => {
          setIsShowingMenu(false);
        }}
      >
        <ActionMenu metadata={metadata} isSimulated={isSimulated} />
      </Popup>
    </div>
  );
};

const MobileFullExperience = ({
  metadata,
  images,
  isSynthEnabled,
  isShowingPixel,
  onTogglePixel,
  isSimulated,
}) => {
  return (
    <div className="relative h-full w-full">
      <Header
        isSynthEnabled={isSynthEnabled}
        isShowingPixel={isShowingPixel}
        onTogglePixel={onTogglePixel}
      />
      <div className="aspect-square">
        <ImageRenderer images={images} />
      </div>
      <ActionMenu metadata={metadata} isSimulated={isSimulated} />
    </div>
  );
};

const Experience = ({ metadata, isSimulated = false }) => {
  const [isShowingPixel, setIsShowingPixel] = useState(false);

  const { images, isSynthEnabled } = generateRenderingOrder({
    dna: metadata?.dna,
    isShowingPixel,
  });

  const onTogglePixel = () => {
    setIsShowingPixel((value) => !value);
  };

  return (
    <div className="h-screen w-screen bg-dark font-primary">
      <div className="hidden tablet:flex max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden">
        <FullExperience
          metadata={metadata}
          isSimulated={isSimulated}
          isShowingPixel={isShowingPixel}
          images={images}
          isSynthEnabled={isSynthEnabled}
          onTogglePixel={onTogglePixel}
        />
      </div>
      <div className="flex tablet:hidden relative h-full w-full overflow-auto">
        <MobileFullExperience
          metadata={metadata}
          isSimulated={isSimulated}
          isShowingPixel={isShowingPixel}
          images={images}
          isSynthEnabled={isSynthEnabled}
          onTogglePixel={onTogglePixel}
        />
      </div>
    </div>
  );
};

const NFTViewer = ({ isSandboxed, metadata }) => {
  return isSandboxed ? (
    <Experience metadata={metadata} isSimulated />
  ) : (
    <WagmiConfig
      config={createConfig(
        getDefaultConfig({
          alchemyId: ALCHEMY_KEY, // or infuraId
          walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
          appName: "Brawler Bearz: Interactive Experience",
          appDescription: "A mini-dapp for managing your brawler bear",
        }),
      )}
    >
      <ConnectKitProvider
        customTheme={CONNECT_KIT_THEME}
        options={{
          embedGoogleFonts: true,
          walletConnectName: "Other Wallets",
        }}
      >
        <Experience metadata={metadata} isSimulated={false} />
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

const InteractiveNFT = () => {
  const { tokenId } = useParams();
  const isSandboxed =
    window.location !== window.parent.location ||
    window.self !== window.top ||
    window.frameElement;
  return (
    <LoadingScreen tokenId={tokenId}>
      {({ metadata }) => (
        <NFTViewer metadata={metadata} isSandboxed={isSandboxed} />
      )}
    </LoadingScreen>
  );
};

export default InteractiveNFT;
