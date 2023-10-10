import { useEffect, useState } from "react";
import { ALCHEMY_KEY } from "../lib/constants";
import { bearzContractAddress } from "../lib/contracts";
import { getStatsByTokenId } from "../lib/blockchain";

const useBearzNFTs = (account) => {
  const [state, setState] = useState({
    data: [],
    isLoading: true,
    error: null,
  });

  const toParams = (p) =>
    Object.keys(p)
      .map((key) => (p[key] ? key + "=" + p[key] : ""))
      .filter(Boolean)
      .join("&");

  const getAllUserNFTs = async (account, address) => {
    if (!account) return [];

    let nfts = [];

    const params = {
      owner: account,
      "contractAddresses[]": [address],
    };

    if (!params.owner) {
      return nfts;
    }

    let { ownedNfts, pageKey } = await fetch(
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}/getNFTs/?${toParams(
        params,
      )}`,
    ).then((res) => res.json());

    nfts = nfts.concat(ownedNfts);

    let currentPage = pageKey;

    // Pagination needed
    while (currentPage) {
      const { ownedNfts: partialNfts, pageKey } = await fetch(
        `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}/getNFTs/?${toParams(
          {
            ...params,
            pageKey: currentPage,
          },
        )}`,
      ).then((res) => res.json());
      currentPage = pageKey;
      nfts = nfts.concat(partialNfts);
    }
    return nfts;
  };

  const onRefresh = async (addr) => {
    const nfts = await getAllUserNFTs(addr, bearzContractAddress);
    const tokenIds = nfts.map((nft) => parseInt(nft?.id.tokenId, 16));
    const data = await Promise.all(
      tokenIds?.map((tokenId) => getStatsByTokenId(tokenId, {})),
    );
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
      data,
    }));
  };

  useEffect(() => {
    onRefresh(account);
  }, [account]);

  return {
    ...state,
    onRefresh: onRefresh.bind(null, account),
  };
};

export default useBearzNFTs;
