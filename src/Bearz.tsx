// @ts-nocheck
import React, { useMemo, useRef, useState } from "react";
import classnames from "classnames";
import { ToastContainer } from "react-toastify";
import { useAccount } from "wagmi";
import {
  MdLock as LockIcon,
  MdViewList as ListIcon,
  MdGridView as GridIcon,
  MdSort as SortIcon,
  MdOutlineFilterAlt as FilterIcon,
  MdClose as CloseIcon,
} from "react-icons/md";
import { LuMousePointer2 as EditIcon } from "react-icons/lu";
import { Link, useSearchParams } from "react-router-dom";
import { useClickOutside } from "@react-hookz/web";
import {
  GiStrongMan as TrainingIcon,
  GiJourney as QuestIcon,
} from "react-icons/gi";
import { keyBy, reduce, orderBy } from "lodash";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Header from "./components/Header";
import SandboxWrapper from "./components/SandboxWrapper";
import { useSimpleAccountOwner } from "./lib/useSimpleAccountOwner";
import { formatNumber } from "./lib/formatting";
import Loading from "./components/Loading";
import PleaseConnectWallet from "./components/PleaseConnectWallet";
import shadowImage from "./interactive/shadow.png";
import useBearzNFTs from "./hooks/useBearzNFTs";
import useBearzActions from "./hooks/useBearzActions";

const useSimulatedAccount = () => {
  return {
    address: null,
    isConnected: true,
    isDisconnected: false,
    status: "connected",
  };
};

const useNFTWrapped = ({ isSimulated }) => {
  const account = !isSimulated ? useAccount() : useSimulatedAccount();

  if (isSimulated) {
    return account;
  }

  const { isLoading, owner: signer } = useSimpleAccountOwner();

  const actions = useBearzActions({
    account,
    signer,
  });

  if (isLoading || !signer?.getAddress()) {
    return account;
  }

  return {
    ...account,
    actions,
  };
};

const canStake = (i) => !i?.activity.isStaked;

const canUnstake = (i) =>
  i?.activity.isStaked &&
  !i?.activity?.questing?.isQuesting &&
  !i?.activity?.training?.isTraining;

const canStopTraining = (i) => i?.activity?.training?.isTraining;

const reduceStakable = (acc, item) => {
  if (canStake(item)) {
    acc[item?.metadata?.tokenId] = item;
  }
  return acc;
};

const reduceUnstakable = (acc, item) => {
  if (canUnstake(item)) {
    acc[item?.metadata?.tokenId] = item;
  }
  return acc;
};

const reduceTrainable = (acc, item) => {
  if (canUnstake(item)) {
    acc[item?.metadata?.tokenId] = item;
  }
  return acc;
};

const reduceStopTrainable = (acc, item) => {
  if (canStopTraining(item)) {
    acc[item?.metadata?.tokenId] = item;
  }
  return acc;
};

const getStakable = (data) => data?.reduce(reduceStakable, {});

const getUnstakable = (data) => data?.reduce(reduceUnstakable, {});

const getTrainable = (data) => data?.reduce(reduceTrainable, {});

const getStopTrainable = (data) => data?.reduce(reduceStopTrainable, {});

const getQuestable = (data, questId) => {};

const GridView = ({ data, selected, setSelected }) => {
  return (
    <div className="flex flex-row justify-center flex-wrap gap-4 px-6 md:px-10 pt-6 pb-20">
      {data.map((item) => {
        const { metadata, stats, activity } = item;
        const { end, int, lck, level, nextXpLevel, str, xp } = stats || {};
        const { isStaked, training, questing } = activity;
        const isSelected = selected[metadata?.tokenId];

        return (
          <div
            role="button"
            key={metadata?.tokenId}
            className="flex flex-col w-[250px] items-center justify-center"
            onClick={() => {
              setSelected((prev) => ({
                ...prev,
                [metadata?.tokenId]: !prev[metadata?.tokenId],
              }));
            }}
          >
            <div
              className={classnames(
                "cursor-pointer relative flex flex-col w-full bg-dark shadow-pixel hover:shadow-pixelAccent shadow-xs overflow-hidden transition ease-in duration-200",
                {
                  "shadow-pixelAccent": isSelected,
                },
              )}
            >
              <div className="absolute top-[10px] left-[10px] bg-dark2 shadow-pixel px-2 py-1 z-[2]">
                <div className="flex flex-row">
                  <span className="text-xs text-white">LVL {level || 0}</span>
                </div>
              </div>
              {(isStaked || questing?.isQuesting || training?.isTraining) && (
                <div className="absolute top-[10px] right-[10px] bg-dark2 shadow-pixel px-2 py-1 z-[2]">
                  <div className="flex flex-row items-center justify-center space-x-2">
                    {isStaked && (
                      <LockIcon className="relative text-lg text-accent flex-shrink-0" />
                    )}
                    {questing?.isQuesting && (
                      <QuestIcon className="relative text-lg text-accent flex-shrink-0" />
                    )}
                    {training?.isTraining && (
                      <TrainingIcon className="relative text-lg text-accent flex-shrink-0" />
                    )}
                  </div>
                </div>
              )}
              <div className="relative w-full z-[1]">
                <LazyLoadImage
                  alt={metadata.dna}
                  height={250}
                  src={metadata.image}
                  placeholderSrc={shadowImage}
                  width={250}
                />
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
              <div className="flex flex-col w-full px-4 pt-2 pb-3 space-y-4">
                <div className="flex flex-col justify-center space-y-2">
                  <h2 className="relative top-[2px] text-sm truncate">
                    {metadata.name}
                  </h2>
                  <span className="hidden relative text-accent text-xs">
                    {formatNumber(xp)} XP
                  </span>
                </div>
                <div className="flex flex-row w-full justify-between text-xs">
                  <div className="flex flex-col space-y-1 text-center">
                    <span className="text-accent2">STR</span>
                    <span>{str || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 text-center">
                    <span className="text-accent2">END</span>
                    <span>{end || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 text-center">
                    <span className="text-accent2">INT</span>
                    <span>{int || 0}</span>
                  </div>
                  <div className="flex flex-col space-y-1 text-center">
                    <span className="text-accent2">LCK</span>
                    <span>{lck || 0}</span>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-center w-full text-xs w-full">
                  <Link
                    to={`/${metadata?.tokenId}`}
                    className="shadow-pixel py-2 px-4 bg-main text-xs hover:animate-pulse hover:text-accent transition ease-in duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ListView = ({ data, selected, setSelected }) => {
  return (
    <div className="flex flex-row flex-wrap justify-center gap-4 px-3 md:px-10 pt-6 pb-20">
      {data.map((item) => {
        const { metadata, stats, activity } = item;
        const { end, int, lck, level, nextXpLevel, str, xp } = stats || {};
        const { isStaked, training, questing } = activity;
        const isSelected = selected[metadata?.tokenId];

        return (
          <div
            role="button"
            key={metadata?.tokenId}
            className="flex flex-row w-full max-w-[365px] items-center space-x-2 h-[120px]"
            onClick={() => {
              setSelected((prev) => ({
                ...prev,
                [metadata?.tokenId]: !prev[metadata?.tokenId],
              }));
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
                <div className="flex flex-row items-center w-full text-xs space-x-3">
                  <Link
                    to={`/${metadata?.tokenId}`}
                    className="shadow-pixel py-1 px-2 bg-main text-xs hover:animate-pulse hover:text-accent transition ease-in duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const parseOutParams = (params) => {
  const parsed = {};
  for (const p of params) {
    parsed[p[0]] = p[1];
  }
  return parsed;
};

const sortOptions = [
  { label: "Level (desc)", value: "-stats.level" },
  { label: "Level (asc)", value: "stats.level" },
  { label: "XP (desc)", value: "-stats.xp" },
  { label: "XP (asc)", value: "stats.xp" },
  { label: "Next Level XP (desc)", value: "-stats.nextXpLevel" },
  { label: "Next Level XP (asc)", value: "stats.nextXpLevel" },
  { label: "Strength (desc)", value: "-stats.str" },
  { label: "Strength (asc)", value: "stats.str" },
  { label: "Endurance (desc)", value: "-stats.end" },
  { label: "Endurance (asc)", value: "stats.end" },
  {
    label: "Intelligence (desc)",
    value: "-stats.int",
  },
  { label: "Intelligence (asc)", value: "stats.int" },
  { label: "Luck (desc)", value: "-stats.lck" },
  { label: "Luck (asc)", value: "stats.lck" },
];

const Dropdown = ({ title, trigger, menu, className, containerClassName }) => {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(!open);
  };

  const ref = useRef(null);

  useClickOutside(ref, () => {
    setOpen(false);
  });

  return (
    <div ref={ref} className="relative">
      {React.cloneElement(trigger, {
        onClick: handleOpen,
      })}
      {open ? (
        <div
          className={classnames(
            "flex flex-col fixed z-[10000] md:absolute h-screen w-screen top-0 left-0 md:right-0 md:top-[40px] pt-2 pb-4 px-4 text-left bg-dark2 md:w-[250px] md:h-auto shadow-xs shadow-pixel",
            containerClassName,
          )}
        >
          <div className="hidden md:flex flex-row mt-1 my-2 w-full pl-1">
            <h1 className="text-md">{title}</h1>
          </div>
          <div className="flex flex-row items-center justify-between md:hidden my-4 px-2">
            <h1 className="text-md">{title}</h1>
            <button className="text-4xl" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <ul className="list-style-none space-y-2 w-full">
            {menu.map((menuItem, index) => (
              <li
                key={index}
                className="flex flex-row p-1 text-xs truncate hover:opacity-100 opacity-80 w-full"
              >
                {React.cloneElement(menuItem, {
                  onClick: () => {
                    if (menuItem?.props?.onClick) {
                      menuItem?.props?.onClick();
                      setOpen(false);
                    }
                  },
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const Input = ({ onChange, value, ...rest }) => {
  return (
    <input
      className="bg-dark2 shadow-pixel px-2 py-1 h-[32px] w-full text-xs"
      onChange={(e) => {
        onChange(e.target.value);
      }}
      value={value}
      {...rest}
    />
  );
};

const Select = ({ onChange, value, options, ...rest }) => {
  return (
    <select
      className="bg-dark2 shadow-pixel px-2 py-1 h-[32px] w-full text-xs"
      onChange={(e) => {
        onChange(e.target.value);
      }}
      value={value}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const Experience = ({ isSimulated = false }) => {
  const { address, isConnected, actions } = useNFTWrapped({
    isSimulated,
  });

  const { data, isLoading, onRefresh } = useBearzNFTs(address);

  const [selected, setSelected] = useState({});
  const [isShowingWarning, setIsShowingWarning] = useState(false);

  const dataLookup = useMemo(() => keyBy(data, "metadata.tokenId"), [data]);

  const [searchParams, setSearchParams] = useSearchParams();

  const {
    name = "",
    isLocked = "",
    isQuesting = "",
    isTraining = "",
    viewType = "LIST",
    sortBy,
  } = parseOutParams(searchParams);

  const updateParams = (params) => {
    setSearchParams({
      name,
      isLocked,
      isQuesting,
      isTraining,
      sortBy,
      ...params,
    });
  };

  const filtered = useMemo(() => {
    const currentSortBy = sortBy ?? "-level";
    const sortDir = currentSortBy[0] === "-" ? "desc" : "asc";
    return orderBy(
      data.filter((item) => {
        if (!item) return false;
        return (
          (!name ||
            item?.metadata?.name.toLowerCase().includes(name?.toLowerCase())) &&
          (!isLocked ||
            (isLocked === "TRUE" && item?.activity?.isStaked) ||
            (isLocked === "FALSE" && !item?.activity?.isStaked)) &&
          (!isQuesting ||
            (isQuesting === "TRUE" && item?.activity?.questing?.isQuesting) ||
            (isQuesting === "FALSE" &&
              !item?.activity?.questing?.isQuesting)) &&
          (!isTraining ||
            (isTraining === "TRUE" && item?.activity?.training?.isTraining) ||
            (isTraining === "FALSE" && !item?.activity?.training?.isTraining))
        );
      }),
      [currentSortBy?.replace("-", "")],
      [sortDir],
    );
  }, [data, name, isLocked, isQuesting, isTraining, sortBy]);

  const hasFiltersApplied =
    !!name || !!isLocked || !!isQuesting || !!isTraining;

  const selectedValues = useMemo(() => {
    return reduce(
      selected,
      (acc, value, key) => {
        if (value && dataLookup[key]) {
          acc.push(dataLookup[key]);
        }
        return acc;
      },
      [],
    );
  }, [selected, dataLookup]);

  const hasItemsSelected = selectedValues?.length > 0;

  const isProcessing = false;

  const isCondensed = viewType === "LIST";

  const canStakeSelected = useMemo(
    () => hasItemsSelected && selectedValues?.every(canStake),
    [hasItemsSelected, selectedValues],
  );

  const canUnstakeSelected = useMemo(
    () => hasItemsSelected && selectedValues?.every(canUnstake),
    [hasItemsSelected, selectedValues],
  );

  const canTrainSelected = useMemo(
    () => hasItemsSelected && selectedValues?.every(canUnstake),
    [hasItemsSelected, selectedValues],
  );

  const canStopTrainSelected = useMemo(
    () => hasItemsSelected && selectedValues?.every(canStopTraining),
    [hasItemsSelected, selectedValues],
  );

  const hasAction =
    hasItemsSelected &&
    (canStakeSelected ||
      canUnstakeSelected ||
      canTrainSelected ||
      canStopTrainSelected);

  const isReady = !isLoading;

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-dark font-primary space-y-4 text-white overflow-x-hidden">
        {!isSimulated && (
          <div className="flex flex-col h-full w-full">
            <Header />
            {!isConnected ? (
              <PleaseConnectWallet />
            ) : (
              <div className="flex flex-col w-full h-full items-center space-y-10">
                <h1 className="text-lg">Your Brawler Bearz ({data.length})</h1>
                {!isReady ? (
                  <Loading />
                ) : (
                  <div className="flex flex-col w-full h-full space-y-2">
                    <header className="flex flex-row items-center justify-center w-full gap-3">
                      <Dropdown
                        title="Action Selectors"
                        trigger={
                          <button className="flex items-center justify-center bg-dark2 shadow-pixel h-[32px] w-[48px] text-2xl">
                            <EditIcon />
                          </button>
                        }
                        menu={[
                          <button
                            onClick={() => setSelected(getStakable(data))}
                          >
                            Select stakeable
                          </button>,
                          <button
                            onClick={() => setSelected(getUnstakable(data))}
                          >
                            Select un-stakeable
                          </button>,
                          <button
                            onClick={() => setSelected(getTrainable(data))}
                          >
                            Select trainable
                          </button>,
                          <button
                            onClick={() => setSelected(getStopTrainable(data))}
                          >
                            Select stop trainable
                          </button>,
                        ]}
                      />
                      <Dropdown
                        title="Filters"
                        containerClassName="md:!w-[300px]"
                        trigger={
                          <button
                            className={classnames(
                              "flex items-center justify-center bg-dark2 shadow-pixel h-[32px] w-[48px] text-2xl",
                              {
                                "text-accent": hasFiltersApplied,
                              },
                            )}
                          >
                            <FilterIcon />
                          </button>
                        }
                        menu={[
                          <Input
                            placeholder="Search..."
                            value={name}
                            onChange={(name) => updateParams({ name })}
                          />,
                          <Select
                            placeholder="Is Staking?"
                            value={isLocked}
                            onChange={(isLocked) => updateParams({ isLocked })}
                            options={[
                              { label: "Is Staked?", value: "" },
                              { label: "Yes", value: "TRUE" },
                              { label: "No", value: "FALSE" },
                            ]}
                          />,
                          <Select
                            placeholder="Is Training?"
                            value={isTraining}
                            onChange={(isTraining) =>
                              updateParams({ isTraining })
                            }
                            options={[
                              { label: "Is Training?", value: "" },
                              { label: "Yes", value: "TRUE" },
                              { label: "No", value: "FALSE" },
                            ]}
                          />,
                          <Select
                            placeholder="Is Questing?"
                            value={isQuesting}
                            onChange={(isQuesting) =>
                              updateParams({ isQuesting })
                            }
                            options={[
                              { label: "Is Questing?", value: "" },
                              { label: "Yes", value: "TRUE" },
                              { label: "No", value: "FALSE" },
                            ]}
                          />,
                        ]}
                      />
                      <Dropdown
                        title="Sort By"
                        trigger={
                          <button
                            className="flex items-center justify-center bg-dark2 shadow-pixel h-[32px] w-[48px] text-2xl"
                            title={
                              sortBy
                                ? `Sort by: ${sortOptions.find(
                                    (i) => i.value === sortBy,
                                  )?.label}`
                                : "Sort by..."
                            }
                          >
                            <SortIcon />
                          </button>
                        }
                        menu={sortOptions.map((option) => (
                          <button
                            key={option.value}
                            className={classnames({
                              "text-accent": sortBy === option.value,
                            })}
                            onClick={() => {
                              updateParams({
                                sortBy: option.value,
                              });
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      />
                      <button
                        className="flex items-center justify-center bg-dark2 shadow-pixel h-[32px] w-[48px] text-2xl"
                        onClick={() => {
                          updateParams({
                            viewType: isCondensed ? "GRID" : "LIST",
                          });
                        }}
                        title="Choose view type"
                      >
                        {isCondensed ? <GridIcon /> : <ListIcon />}
                      </button>
                    </header>
                    {hasFiltersApplied ? (
                      <div className="flex flex-row items-center justify-center space-x-6 py-3">
                        <span className="text-warn text-xs">
                          Showing {filtered?.length} results
                        </span>
                        <button
                          className="opacity-80 text-xs text-error hover:opacity-100"
                          onClick={() =>
                            updateParams({
                              name: "",
                              isLocked: "",
                              isQuesting: "",
                              isTraining: "",
                              sortBy: "",
                            })
                          }
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}
                    {hasItemsSelected && (
                      <button
                        className="flex md:hidden items-center justify-center focus:scale-[98%] text-xs text-error hover:text-accent transition ease-in duration-200 pt-2"
                        onClick={(e) => {
                          setSelected({});
                        }}
                      >
                        Unselect All
                      </button>
                    )}
                    {isCondensed ? (
                      <ListView
                        data={filtered}
                        selected={selected}
                        setSelected={setSelected}
                      />
                    ) : (
                      <GridView
                        data={filtered}
                        selected={selected}
                        setSelected={setSelected}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {hasItemsSelected && (
          <div className="flex flex-row items-center justify-center fixed z-[10000] bottom-0 w-full text-base bg-dark2 border-t-[3px] border-accent">
            <div
              className="flex flex-row h-[75px] w-full items-center justify-center px-6 space-x-6"
              style={{
                backdropFilter: "blur(12px)",
              }}
            >
              {canStakeSelected && (
                <button
                  className={classnames(
                    "flex items-center justify-center focus:scale-[98%] text-xs uppercase transition ease-in duration-200 px-2",
                    {
                      "opacity-50 cursor-not-allowed":
                        !canStakeSelected || isProcessing,
                      "hover:text-accent": canStakeSelected,
                    },
                  )}
                  onClick={async (e) => {
                    setIsShowingWarning(true);

                    const success = await actions.onStake({
                      tokenIds: selectedValues.map((item) =>
                        BigInt(item.metadata.tokenId),
                      ),
                    });

                    setIsShowingWarning(false);

                    if (success) {
                      setSelected({});
                      onRefresh();
                    }
                  }}
                >
                  Stake
                </button>
              )}
              {canUnstakeSelected && (
                <button
                  className={classnames(
                    "flex items-center justify-center focus:scale-[98%] text-xs uppercase transition ease-in duration-200 px-2",
                    {
                      "opacity-50 cursor-not-allowed":
                        !canUnstakeSelected || isProcessing,
                      "hover:text-accent": canUnstakeSelected,
                    },
                  )}
                  onClick={async (e) => {
                    setIsShowingWarning(true);

                    const success = await actions.onUnstake({
                      tokenIds: selectedValues.map((item) =>
                        BigInt(item.metadata.tokenId),
                      ),
                    });

                    setIsShowingWarning(false);

                    if (success) {
                      setSelected({});
                      onRefresh();
                    }
                  }}
                  disabled={!canUnstakeSelected || isProcessing}
                >
                  Unstake
                </button>
              )}
              {canTrainSelected && (
                <button
                  className={classnames(
                    "flex items-center justify-center focus:scale-[98%] text-xs uppercase transition ease-in duration-200 px-2",
                    {
                      "opacity-50 cursor-not-allowed":
                        !canTrainSelected || isProcessing,
                      "hover:text-accent": canTrainSelected,
                    },
                  )}
                  onClick={async (e) => {
                    setIsShowingWarning(true);

                    const success = await actions.onStartTraining({
                      tokenIds: selectedValues.map((item) =>
                        BigInt(item.metadata.tokenId),
                      ),
                    });

                    setIsShowingWarning(false);

                    if (success) {
                      setSelected({});
                      onRefresh();
                    }
                  }}
                  disabled={!canTrainSelected || isProcessing}
                >
                  Train
                </button>
              )}
              {canStopTrainSelected && (
                <button
                  className={classnames(
                    "flex items-center justify-center focus:scale-[98%] text-xs uppercase transition ease-in duration-200 px-2",
                    {
                      "opacity-50 cursor-not-allowed":
                        !canStopTrainSelected || isProcessing,
                      "hover:text-accent": canStopTrainSelected,
                    },
                  )}
                  onClick={async (e) => {
                    setIsShowingWarning(true);

                    const success = await actions.onStopTraining({
                      tokenIds: selectedValues.map((item) =>
                        BigInt(item.metadata.tokenId),
                      ),
                    });

                    setIsShowingWarning(false);

                    if (success) {
                      setSelected({});
                      onRefresh();
                    }
                  }}
                  disabled={!canStopTrainSelected || isProcessing}
                >
                  Stop Training
                </button>
              )}
              <button
                className={classnames(
                  " items-center justify-center focus:scale-[98%] text-xs hover:text-accent uppercase transition ease-in duration-200 px-2",
                  {
                    "hidden md:flex": hasAction,
                    flex: !hasAction,
                  },
                )}
                onClick={(e) => {
                  setSelected({});
                }}
              >
                Unselect
              </button>
            </div>
          </div>
        )}
      </div>
      {isShowingWarning && (
        <div
          className="fixed z-[10000] w-full h-[100vh] mx-auto overflow-hidden flex flex-col mx-auto"
          style={{
            backdropFilter: "blur(64px)",
          }}
        >
          <div className="flex flex-col w-full h-full max-w-3xl mx-auto space-y-6 items-center justify-center text-center px-10">
            <h1 className="text-xl text-accent font-black uppercase">
              Staking
            </h1>
            <p className="text-xs">Check wallet to sign transaction!</p>
            <div className="flex flex-col w-full space-y-4 items-center justify-center">
              <p className="text-base">
                Staked NFTs are <strong className="text-error">LOCKED</strong>{" "}
                and <strong className="text-error">CANNOT</strong> be sold
              </p>
              <p className="text-xs">
                Ensure you unlist your NFT from secondary or unstake your NFT
                when you are selling!
              </p>
              <button
                className="cursor-pointer relative flex items-center justify-center focus:scale-[98%] max-h-[74px] top-[230px] z-[2]"
                onClick={() => setIsShowingWarning(false)}
              >
                <img
                  className="object-cover h-full w-full"
                  src="/images/button.png"
                  alt="button"
                />
                <span className="animate-pulse absolute flex h-full w-full items-center justify-center text-lg sm:text-xl text-accent uppercase transition ease-in duration-200">
                  Close
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Bearz = () => (
  <SandboxWrapper
    isSandboxed={
      window.location !== window.parent.location ||
      window.self !== window.top ||
      window.frameElement
    }
    Component={Experience}
  />
);

export default Bearz;
