// @ts-nocheck
import React, { useEffect, useState } from "react";
import {toast } from "react-toastify";
import classnames from "classnames";
import { useAccount, useWaitForTransaction } from "wagmi";
import {
  MdArrowBack as BackIcon,
} from "react-icons/md";
import { decodeEventLog } from "viem";
import Header from "./components/Header";
import logoImage from "./interactive/logo.gif";
import buttonBackground from "./interactive/button.png";
import baseVending from "./interactive/vending-machine/elements/base_vend.gif";
import emptyVending from "./interactive/vending-machine/elements/empty_vend.gif";
import leftArrow from "./interactive/vending-machine/elements/left_arrow.png";
import rightArrow from "./interactive/vending-machine/elements/right_arrow.png";
import vendComplete from "./interactive/vending-machine/elements/vend_complete.gif";
import vendPend from "./interactive/vending-machine/elements/vend_pend.gif";
import vendBar from "./interactive/vending-machine/elements/bar.png";
import burningTicket from "./interactive/vending-machine/elements/burning_ticket.gif";
import staticTicket from "./interactive/vending-machine/elements/static_ticket.png";
import { bearzVendingMachineABI } from "./lib/contracts";
import Loading from "./components/Loading";
import SandboxWrapper from "./components/SandboxWrapper";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import { BEARZ_SHOP_IMAGE_URI } from "./lib/blockchain";
import useVendingMachine from "./hooks/useVendingMachine";
import {Link} from "react-router-dom";

const DROPPED_STATUS = {
  WAITING: "WAITING",
  REVEALED_ALL: "REVEALED_ALL",
};

const WaitingForVend = ({ onClose, sounds }) => {
  useEffect(() => {
    setTimeout(() => {
      sounds.hum();
    }, 300);

    return () => {
      sounds.stopHum();
    }
  }, []);
  return (
      <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
        <div className="relative flex flex-col text-center text-white py-4 items-center justify-center space-y-4">
          <div className="absolute top-[-25px]">
            <img
                src={burningTicket}
                className="h-[80px]"
                alt="burning card"
            />
            <p className="text-accent text-sm hidden">Burning ticket(s)...</p>
          </div>
          <img src={vendPend} alt="Vend pend" />
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
  )
};

const SummaryView = ({ onClose, sounds, status }) => {
  const [showItem, setShowItem] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      sounds.process();
    }, 100);

    setTimeout(() => {
     setShowItem(true);
     sounds.winner();
    }, 7200);

    return () => {
      sounds.stopProcess();
    }
  }, []);

  return (
      <div className="font-primary flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1]">
        <div className="flex flex-col text-center text-white py-4 items-center justify-center space-y-4">
          {showItem && status?.context?.tokenId ? (
              <div className="flex flex-col py-4 space-y-4 items-center justify-center">
                <h2 className="text-2xl md:text-4xl text-accent">Success!</h2>
                <img src={status?.context?.details?.imageSrc} className="w-[200px]" />
              </div>
          ) : (
              <img src={vendComplete} alt="Vend complete" />
          )}
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
  )
};

const VendView = ({ vendLookup, txHash, onClose, sounds }) => {
  const [status, setStatus] = useState({
    event: DROPPED_STATUS.WAITING,
    context: null,
  });

  const { data, isLoading } = useWaitForTransaction({
    hash: txHash,
  });

  useEffect(() => {
    if (!txHash) {
      onClose();
    }

    if (!isLoading) {
      (async function () {
        try {

          const topic = decodeEventLog({
            abi: bearzVendingMachineABI,
            data: data?.logs?.[2]?.data,
            topics: data?.logs?.[2]?.topics,
            strict: false,
          });

          setTimeout(() => {
            setStatus({
              event: DROPPED_STATUS.REVEALED_ALL,
              context: {
                ...(topic?.args ?? {}),
                details: vendLookup?.find(item => String(item.vendId) === String(topic?.args?.vendId))
              },
            });
          }, 3000);

        } catch (e) {
          console.log(e);
          toast.error(
            "There was an error loading the crate drop from the transaction hash!",
          );
          onClose();
        }
      })();
    }
  }, [isLoading, txHash, data?.logs]);

  return (
    <div className="fixed top-0 left-0 z-[99999] h-full w-full bg-[#08111b] items-center justify-center">
      {(() => {
        switch (status.event) {
          case DROPPED_STATUS.WAITING:
            return <WaitingForVend onClose={onClose} sounds={sounds} />;
          case DROPPED_STATUS.REVEALED_ALL:
            return (
              <SummaryView
                sounds={sounds}
                status={status}
                setStatus={setStatus}
                onClose={onClose}
              />
            );
        }
      })()}
    </div>
  );
};

const VendingMachineSelector = ({ data, sounds, onVend, onClose, isVending }) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const moveLeft = () => {
    sounds.slide();
    setCarouselIndex(prev => {
      let next = prev - 1;
      if(next < 0){
        next = data?.length - 1;
      }
      return next;
    })
  }

  const moveRight = () => {
    sounds.slide();
    setCarouselIndex(prev => {
      let next = prev + 1;
      if(next > data?.length - 1){
        next = 0;
      }
      return next;
    })
  }

  const currentItem = data?.[carouselIndex] || data?.[0];

  useEffect(() => {
    setTimeout(() => {
      sounds.hum();
    }, 300);

    return () => {
      sounds.stopHum();
    }
  }, []);

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
      <div className="relative flex flex-col space-y-6 py-[65px]">
        <div className="flex absolute h-screen w-screen items-center justify-center left-0 top-0 overflow-hidden bg-dark2 z-[1]">
          <div className="relative flex w-[320px] md:w-[420px] h-full mx-auto top-[150px]">
            <img
              src={emptyVending}
              className="flex absolute aspect-square items-center justify-center left-0 top-0 h-[320px] w-[320px] md:w-[420px] md:h-[420px] scale-[2] z-[-1]"
              alt="Empty vend"
            />
            <div className="flex bg-white bg-opacity-20 text-white hover:text-accent hover:bg-accent hover:bg-opacity-50 animate-pulse hover:animate-none absolute h-[48px] w-[53px] md:h-[67px] md:w-[67px] items-center justify-center left-[220px] top-[43px] md:left-[290px] md:top-[55px] overflow-hidden z-[5]"
                 role="button"
                 onClick={async () => {
                   if(typeof currentItem.vendId === 'number'){
                     sounds.start()
                     await onVend(currentItem.vendId);
                   }
                 }}>
              <span className="text-white text-sm uppercase">
                {isVending ? 'Vending...' : 'Buy'}
              </span>
            </div>
            <div className="flex bg-white bg-opacity-20 animate-pulse absolute h-[35px] w-[113px] md:h-[50px] md:w-[155px] items-center justify-center left-[50px] top-[325px] md:left-[60px] md:top-[425px] overflow-hidden z-[5]"
            role="button"
                 onClick={() => {
              sounds.flap()
            }} />
            <div className="flex absolute h-[300px] w-[235px] md:h-[385px] md:w-[300px] items-center justify-center left-[-8px] top-[-50px] md:top-[-60px] overflow-hidden bg-transparent py-3 px-7 z-[2]">
              <div key={currentItem?.vendId} className="relative bg-transparent h-full w-full items-center justify-center">
                {currentItem?.isERC721 ? !currentItem?.imageSrc ? (
                    <div className="flex flex-col w-full h-full items-center justify-center px-2 md:px-6 py-3">
                      <h3 className="relative bottom-[20px] text-2xl font-bold uppercase text-error">SOLD!</h3>
                    </div>
                ) : (
                    <div className="flex flex-col w-full h-full items-center px-2 md:px-6 py-3">
                      <img src={currentItem?.imageSrc} className="h-[200px] md:h-[280px] z-[4] object-cover shadow-pixelWhite shadow-xs" alt={currentItem.vendId} />
                    </div>
                ) : (
                    <div className="flex flex-col w-full h-full items-center p-3">
                      <img src={currentItem?.imageSrc} className="h-[200px] md:h-[280px] z-[4]" alt={currentItem.vendId} />
                    </div>
                )}
                <div className="flex items-center justify-center absolute bottom-[10px] md:bottom-[20px] w-full z-[6]">
                  <div className="relative flex flex-col items-center justify-center w-full h-full">
                  <img src={vendBar} className="absolute w-full h-[55px] md:h-[75px] z-[1] object-cover" alt="bar bg" />
                  <div className="flex flex-col items-center justify-center w-full h-full z-[2]">
                    <div className="flex flex-row items-center justify-center w-full h-full space-x-2">
                      <img src={staticTicket} className="h-[47px] w-[60px]" alt="static ticket" />
                      <span className="text-base md:text-2xl text-[#2a1d27] font-bold">x</span>
                      <span className="text-base md:text-2xl text-[#2a1d27] font-bold">{currentItem.inCount}</span>
                    </div>
                    <span className="relative bottom-[5px] text-[8px] md:text-xs  text-[#2a1d27]">{currentItem.quantity} remaining</span>
                  </div>

                  </div>
                </div>

                <div className="absolute left-[8px] top-[36%] z-[5]">
                  <button
                    onClick={moveLeft}
                  >
                    <img
                      src={leftArrow}
                      className="w-[8px] h-[16px] scale-[1.5]"
                    />
                  </button>
                </div>
                <div className="absolute right-[8px] top-[36%] z-[5]">
                  <button
                    onClick={moveRight}
                  >
                    <img
                      src={rightArrow}
                      className="w-[8px] h-[16px] scale-[1.5]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendingMachineView = ({ isSimulated }) => {
  const [viewMachine, setViewMachine] = useState(false);
  const { isConnected } = useAccount();

  const { data, isLoadingBiconomy, actions, sounds, isApproving } =
    useVendingMachine({
      isSimulated,
      overrideAddress: null,
    });

  return (
    <div
      className={classnames("flex flex-col relative text-white items-center", {
        "h-screen w-screen": !isConnected,
        "h-full w-full overflow-x-hidden": isConnected,
      })}
    >
      {!isSimulated && (
        <div className="flex flex-col w-full">
          <Header />
          {!isConnected && <PleaseConnectWallet />}
        </div>
      )}
      {isConnected &&
        (isLoadingBiconomy ? (
          <Loading />
        ) : (
          <div className="flex flex-col h-screen w-screen space-y-4">
            {viewMachine && data.vendingMachine?.length && (
              <VendingMachineSelector
                data={data?.vendingMachine}
                isVending={data?.isVending}
                sounds={sounds}
                onVend={(vendId) => {
                  actions?.onVend({ vendId })
                }}
                onClose={() => {
                  setViewMachine(false);
                }}
              />
            )}
            {data?.isOpening ? (
              <div className="font-primary flex flex-col items-center h-full w-full z-[1]">
                <img className="w-[200px]" src={logoImage} alt="logo" />
                <div className="flex flex-col space-y-1 text-center text-white py-4">
                  <h1 className="text-sm">
                    {data?.openingContext ||
                      "Check your wallet for transaction..."}
                  </h1>
                </div>
              </div>
            ) : data?.txHash ? (
              <VendView
                vendLookup={data.vendingMachine}
                txHash={data?.txHash}
                sounds={sounds}
                onClose={async () => {
                  await actions?.onExitTxHash();
                }}
              />
            ) : data?.vendingMachine ? (
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex flex-row items-center space-x-4">
                  <h1 className="text-lg">Vending Machine</h1>
                </div>
                {!data?.isApproved && (
                  <div className="flex flex-col items-center space-y-4 max-w-xl text-center px-2 border-b-[2px] border-white border-opacity-20 pb-10">
                    <p className="text-xs text-warn">
                      Note: You need to approve burning neo city tickets.
                    </p>
                    <span className="text-xs text-white opacity-80">
                      This is a 1-time operation to allow the contract to burn
                      tickets on your behalf.
                    </span>
                    <button
                      onClick={async () => {
                        await actions?.onApproveTicketBurn();
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
                <div className="flex flex-col items-center justify-center gap-1">
                  {data.canVend ? (
                    <p className="text-accent">LIVE!</p>
                  ) : (
                    <p className="text-error">OUT OF ORDER</p>
                  )}
                  <button
                    className="flex flex-col"
                    onClick={() => {
                      if (data.canVend && data.vendingMachine?.length) {
                        sounds.start();
                        setViewMachine(true);
                      }
                    }}
                  >
                    <img
                      src={baseVending}
                      className={classnames("flex", {
                        "vending-machine-base": data.canVend,
                      })}
                      alt="Base vending machine"
                    />
                  </button>
                  <span className="text-sm">Neo City Ticket(s)</span>
                  <div className="flex flex-row items-center space-x-4 text-uppercase text-center py-2">
                    <img
                      className="h-[80px]"
                      src={`${BEARZ_SHOP_IMAGE_URI}325.png`}
                      alt="Tickets"
                    />
                    <span>x{Number(data?.balances) || 0}</span>
                  </div>
                  {!data?.balances && (
                      <Link
                          to={`https://bearzaar.brawlerbearz.club/collections/0xbd24a76f4135f930f5c49f6c30e0e30a61b97537/networks/mainnet/tokens/325`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-white text-sm text-center"
                      >
                        Buy tickets at the Bearzaar
                      </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ))}
    </div>
  );
};

const FullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <VendingMachineView isSimulated={isSimulated} />
    </div>
  );
};

const MobileFullExperience = ({ isSimulated }) => {
  return (
    <div className="relative h-full w-full">
      <VendingMachineView isSimulated={isSimulated} />
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
    </>
  );
};

const VendingMachine = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default VendingMachine;
