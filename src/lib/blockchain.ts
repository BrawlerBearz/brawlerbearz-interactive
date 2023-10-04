import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";
import { keyBy, isEmpty, reduce, pick, zipObject, forEach } from "lodash";
import {
  bearzContractAddress,
  bearzABI,
  bearzStakeChildContractAddress,
  bearzStakeChildABI,
  bearzShopContractAddress,
  bearzShopABI,
} from "./contracts";
import { L2_ALCHEMY_KEY, ALCHEMY_KEY } from "./constants";
import { getAttributeValue } from "./formatting";

const XP_BASIS = 2000;
const COEFFICIENT = 50;

const itemKeyToStatKey = {
  atk: "str",
  def: "end",
  luck: "lck",
  intel: "int",
};

export const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
});

export const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${L2_ALCHEMY_KEY}`),
});

export const BEARZ_SHOP_IMAGE_URI = `${process.env.PUBLIC_URL}/cards/`;

const getMetadataByTokenId = async (tokenId) => {
  const [base64Encoding, ownerOf] = await Promise.all([
    ethClient.readContract({
      address: bearzContractAddress,
      abi: bearzABI,
      functionName: "tokenURI",
      args: [tokenId],
    }),
    ethClient.readContract({
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

const factionBonus = {
  "1": {
    atk: 10,
  },
  "2": {
    def: 10,
  },
  "3": {
    luck: 10,
  },
  "4": {
    intel: 10,
  },
};

// B1 DMG = (((B1:Intelligence * (B1:Strength / B2:Endurance) / 100) + 2) * B1:Luck * Chance (65%-115%)
// B1 Crit Chance = B1:Luck / 100
const calculateDamage = (stats, oppEndurance, chance) => {
  return (
    (stats.str / oppEndurance + 2 + (stats.int * 0.5) / 40) *
      chance *
      (stats.lck * 0.8) +
    150
  ).toFixed(2);
};

// HP = Floor(0.01 * ((2 * Endurance) + Intelligence + Luck) * Level + 15
const calculateHitPoints = (stats, level) => {
  return (
    Math.floor(0.01 * (2 * stats.end + (stats.int + stats.lck) * level) + 15) *
    COEFFICIENT
  );
};

const extractValues = (base, item, keyChange = itemKeyToStatKey) => {
  const typeOf = item?.boostTypeOf;
  const isPercent = typeOf === "percent";
  const normalizedItem = pick(item, Object.keys(keyChange));
  const extracted = reduce(
    normalizedItem,
    (acc, value, key) => {
      const normalizedValue = Number(value);
      if (!isNaN(normalizedValue)) {
        const baseValue = Number(base[keyChange[key]]);
        const change = isPercent ? normalizedValue / 100 : normalizedValue;
        acc[keyChange[key]] = Number(isPercent ? baseValue * change : change);
      }
      return acc;
    },
    {},
  );
  return isEmpty(extracted) ? null : extracted;
};

const aggregateBoosts = (boosts) =>
  reduce(
    boosts,
    (acc, value, key) => {
      forEach(value, (currValue, currKey) => {
        acc[currKey] += Number(currValue);
      });
      return acc;
    },
    {
      str: 0,
      end: 0,
      lck: 0,
      int: 0,
    },
  );

const getEquippedItems = (baseURI, equipped, itemLookup) => {
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
      const itemMetadata = itemLookup[itemId];
      items.push({
        tokenId: itemId,
        type: traitType,
        contract: {
          address: bearzShopContractAddress,
        },
        openseaUrl: `https://opensea.io/assets/ethereum/${bearzShopContractAddress}/${itemId}`,
        image: `${baseURI}${itemId}.png`,
        ...itemMetadata,
      });
    }
  });

  return items.filter(Boolean);
};

export const getStatsByTokenId = async (
  tokenId,
  overrideEquipped = {} as any,
) => {
  try {
    const [metadata, stateBatch] = await Promise.all([
      getMetadataByTokenId(tokenId),
      polygonClient.readContract({
        address: bearzStakeChildContractAddress,
        abi: bearzStakeChildABI,
        functionName: "getStateBatch",
        args: [[tokenId]],
      }),
    ]);

    const [state] = stateBatch as any;

    const { syncXP: pendingXP } = state;

    const xp = Number(pendingXP || 0);

    const baseLevel = Number(getAttributeValue(metadata?.attributes, "Level"));

    const levelIndex = metadata.attributes.findIndex(
      (attr) => attr.trait_type === "Level",
    );

    const xpIndex = metadata.attributes.findIndex(
      (attr) => attr.trait_type === "XP",
    );

    let totalXP = Number(metadata.attributes[xpIndex]?.value);
    let aggregateLevel = baseLevel;

    // Calculate new level from derived XP
    if (xp > 0) {
      totalXP += xp;
      aggregateLevel = Math.floor(1 + Math.sqrt(totalXP / XP_BASIS));

      metadata.attributes[xpIndex] = {
        ...metadata.attributes[xpIndex],
        value: String(totalXP),
      };

      metadata.attributes[levelIndex] = {
        ...metadata.attributes[levelIndex],
        value: String(aggregateLevel),
      };
    }

    const attributeLookup = keyBy(metadata.attributes, "trait_type");

    if (overrideEquipped?.dynamicWeaponId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Weapon Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicWeaponId;
    }

    if (overrideEquipped?.dynamicArmorId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Armor Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicArmorId;
    }

    if (overrideEquipped?.dynamicFaceArmorId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Face Armor Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicFaceArmorId;
    }

    if (overrideEquipped?.dynamicEyewearId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Eyewear Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicEyewearId;
    }

    if (overrideEquipped?.dynamicMiscId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Misc Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicMiscId;
    }

    if (overrideEquipped?.dynamicBackgroundId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Background Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicBackgroundId;
    }

    if (overrideEquipped?.dynamicHeadId > 0) {
      const index = metadata.equipped.findIndex(
        (attr) => attr.trait_type === "Head Id",
      );
      metadata.equipped[index].value = overrideEquipped?.dynamicHeadId;
    }

    const equipLookup = keyBy(metadata.equipped, "trait_type");
    const factionId = equipLookup?.["Faction Id"]?.value;
    const weaponId = equipLookup?.["Weapon Id"]?.value;
    const armorId = equipLookup?.["Armor Id"]?.value;
    const faceArmorId = equipLookup?.["Face Armor Id"]?.value;
    const eyewearId = equipLookup?.["Eyewear Id"]?.value;
    const miscId = equipLookup?.["Misc Id"]?.value;
    const dynamicBackgroundId = equipLookup?.["Background Id"]?.value;
    const dynamicHeadId = equipLookup?.["Head Id"]?.value;

    const currentStrength = Number(attributeLookup?.["Strength"]?.value);
    const currentEndurance = Number(attributeLookup?.["Endurance"]?.value);
    const currentLuck = Number(attributeLookup?.["Luck"]?.value);
    const currentIntelligence = Number(
      attributeLookup?.["Intelligence"]?.value,
    );

    const baseline = {
      str: currentStrength / baseLevel,
      end: currentEndurance / baseLevel,
      lck: currentLuck,
      int: currentIntelligence,
    };

    const baseAggregate = {
      str: baseline.str * aggregateLevel,
      end: baseline.end * aggregateLevel,
      lck: currentLuck,
      int: currentIntelligence,
    };

    const boosts = {
      faction: null,
      weapon: null,
      armor: null,
      faceArmor: null,
      eyewear: null,
      misc: null,
      head: null,
      background: null,
    };

    const boostsByItemId = {};

    const itemPickProps = ["atk", "def", "intel", "luck"];

    // Calculate bonuses
    if (factionId && factionBonus[factionId]) {
      boosts.faction = extractValues(baseAggregate, {
        ...pick(factionBonus[factionId], itemPickProps),
        boostTypeOf: "percent",
      });
    }

    const itemLookupIds = [
      factionId,
      weaponId,
      armorId,
      faceArmorId,
      eyewearId,
      miscId,
      dynamicBackgroundId,
      dynamicHeadId,
    ].filter((item) => item !== "0");

    let itemLookup = {};

    if (itemLookupIds?.length > 0) {
      const items = await ethClient.readContract({
        address: bearzShopContractAddress,
        abi: bearzShopABI,
        functionName: "getMetadataBatch",
        args: [itemLookupIds],
      });

      itemLookup = zipObject(itemLookupIds, items);

      // Equipped weapon
      if (weaponId !== "0") {
        boosts.weapon = extractValues(baseAggregate, {
          ...pick(itemLookup[weaponId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[weaponId] = boosts.weapon;
      }

      // Equipped armor
      if (armorId !== "0") {
        boosts.armor = extractValues(baseAggregate, {
          ...pick(itemLookup[armorId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[armorId] = boosts.armor;
      }

      // Equipped face armor
      if (faceArmorId !== "0") {
        boosts.faceArmor = extractValues(baseAggregate, {
          ...pick(itemLookup[faceArmorId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[faceArmorId] = boosts.faceArmor;
      }

      // Equipped eyewear
      if (eyewearId !== "0") {
        boosts.eyewear = extractValues(baseAggregate, {
          ...pick(itemLookup[eyewearId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[eyewearId] = boosts.eyewear;
      }

      // Equipped misc
      if (miscId !== "0") {
        boosts.misc = extractValues(baseAggregate, {
          ...pick(itemLookup[miscId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[miscId] = boosts.misc;
      }

      // Equipped background
      if (dynamicBackgroundId !== "0") {
        boosts.background = extractValues(baseAggregate, {
          ...pick(itemLookup[dynamicBackgroundId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[dynamicBackgroundId] = boosts.background;
      }

      // Equipped head
      if (dynamicHeadId !== "0") {
        boosts.head = extractValues(baseAggregate, {
          ...pick(itemLookup[dynamicHeadId], itemPickProps),
          boostTypeOf: "percent",
        });
        boostsByItemId[dynamicHeadId] = boosts.head;
      }
    }

    const computed = aggregateBoosts(boosts);

    const final = {
      str: baseAggregate.str + computed.str,
      end: baseAggregate.end + computed.end,
      lck: baseAggregate.lck + computed.lck,
      int: baseAggregate.int + computed.int,
    };

    const hp = calculateHitPoints(final, aggregateLevel);

    const factionName =
      getAttributeValue(metadata?.attributes, "Faction") || "";

    return {
      metadata,
      calculated: {
        baseline,
        baseAggregate,
        boosts,
        boostsByItemId,
        computed,
        final,
        attributeLookup,
        equipLookup,
        hp,
      },
      activity: {
        isStaked: attributeLookup?.["Is Locked"]?.value === "TRUE",
        questing: {
          isQuesting: state?.isQuesting,
          currentQuest: state?.questMetadata,
          quest: state?.quest,
        },
        training: {
          isTraining: state?.isTraining,
          training: state?.training,
        },
      },
      stats: {
        level: aggregateLevel,
        xp: totalXP,
        nextXpLevel: aggregateLevel * aggregateLevel * XP_BASIS,
        ...final,
      },
      items: getEquippedItems(
        BEARZ_SHOP_IMAGE_URI,
        metadata?.equipped,
        itemLookup,
      ),
      faction:
        factionId !== "0"
          ? {
              image: `${
                process.env.PUBLIC_URL
              }/factions/${factionName?.toLowerCase()}.png`,
              label: factionName,
            }
          : null,
      isSynced: baseLevel === aggregateLevel,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
};
