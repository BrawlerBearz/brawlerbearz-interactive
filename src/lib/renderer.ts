export const getRenderingGene = (dna, position) => {
  const normalizedDna = BigInt(dna);
  const shiftBy = BigInt(16 * position);
  const mask = BigInt(0xfff) << shiftBy;
  const gene = normalizedDna & mask;
  return Number(gene >> shiftBy);
};

export const getGene = (dna, position) => {
  const normalizedDna = BigInt(dna);
  const shiftBy = BigInt(8 * position);
  const mask = BigInt(0xff) << shiftBy;
  const gene = normalizedDna & mask;
  return Number(gene >> shiftBy);
};

export const geneToBackground = (gene) => {
  if (gene === 0) {
    return "Gray";
  }
  if (gene === 1) {
    return "Moss";
  }
  if (gene === 2) {
    return "Orange";
  }
  if (gene === 3) {
    return "Red";
  }
  if (gene === 4) {
    return "Green";
  }
  if (gene === 5) {
    return "Blue";
  }
  if (gene === 6) {
    return "Brown";
  }
  if (gene === 7) {
    return "Smoke";
  }
  if (gene === 8) {
    return "Red Smoke";
  }
  if (gene === 9) {
    return "Maroon";
  }
  if (gene === 10) {
    return "Purple";
  }
  if (gene === 11) {
    return "Navy";
  }
  if (gene === 12) {
    return "Graffiti";
  }
  if (gene === 13) {
    return "Cyber Safari";
  }
  return "";
};

export const geneToSkin = (gene) => {
  if (gene === 0) {
    return "Plasma";
  }

  if (gene === 1) {
    return "Sun Breaker";
  }

  if (gene === 2) {
    return "Negative";
  }

  if (gene === 3) {
    return "Mash";
  }

  if (gene === 4) {
    return "Grey Tiger";
  }

  if (gene === 5) {
    return "Polar Bear";
  }

  if (gene === 6) {
    return "Tan Tiger";
  }

  if (gene === 7) {
    return "Tiger";
  }

  if (gene === 8) {
    return "Chocolate Striped";
  }

  if (gene === 9) {
    return "Ripper";
  }

  if (gene === 10) {
    return "Brown Panda";
  }

  if (gene === 11) {
    return "Panda";
  }

  if (gene === 12) {
    return "Brown";
  }

  if (gene === 13) {
    return "Grey";
  }

  if (gene === 14) {
    return "Tan";
  }

  if (gene === 15) {
    return "Black Bear";
  }

  if (gene === 16) {
    return "Toxic";
  }

  if (gene === 17) {
    return "Green Chalk";
  }

  if (gene === 18) {
    return "Negative Tiger";
  }

  if (gene === 19) {
    return "Metal";
  }

  if (gene === 20) {
    return "Orange";
  }
  return "";
};

export const geneToHead = (gene) => {
  if (gene === 0) {
    return "Green Soda Hat";
  }

  if (gene === 1) {
    return "Orange Soda Hat";
  }

  if (gene === 2) {
    return "Golden Gladiator Helmet";
  }

  if (gene === 3) {
    return "Gladiator Helmet";
  }

  if (gene === 4) {
    return "Bone Head";
  }

  if (gene === 5) {
    return "Holiday Beanie";
  }

  if (gene === 6) {
    return "Pan";
  }

  if (gene === 7) {
    return "Snow Trooper";
  }

  if (gene === 8) {
    return "Bearlympics Headband";
  }

  if (gene === 9) {
    return "Sea Cap";
  }

  if (gene === 10) {
    return "Green Goggles";
  }

  if (gene === 11) {
    return "Red Goggles";
  }

  if (gene === 12) {
    return "Society Cap";
  }

  if (gene === 13) {
    return "Fireman Hat";
  }

  if (gene === 14) {
    return "Vendor Cap";
  }

  if (gene === 15) {
    return "Banana";
  }

  if (gene === 16) {
    return "Cake";
  }

  if (gene === 17) {
    return "Rabbit Ears";
  }

  if (gene === 18) {
    return "Party Hat";
  }

  if (gene === 19) {
    return "Rice Hat";
  }

  if (gene === 20) {
    return "None";
  }

  if (gene === 21) {
    return "Alarm";
  }

  if (gene === 22) {
    return "Karate Band";
  }

  if (gene === 23) {
    return "Butchered";
  }

  if (gene === 24) {
    return "Green Bear Rag";
  }

  if (gene === 25) {
    return "Red Bear Rag";
  }

  if (gene === 26) {
    return "Wizard Hat";
  }

  if (gene === 27) {
    return "Ninja Headband";
  }

  if (gene === 28) {
    return "Sombrero";
  }

  if (gene === 29) {
    return "Blue Ice Cream";
  }

  if (gene === 30) {
    return "Red Ice Cream";
  }

  if (gene === 31) {
    return "Viking Helmet";
  }

  if (gene === 32) {
    return "Snow Hat";
  }

  if (gene === 33) {
    return "Green Bucket Hat";
  }

  if (gene === 34) {
    return "Blue Bucket Hat";
  }

  if (gene === 35) {
    return "Red Bucket Hat";
  }

  if (gene === 36) {
    return "Chef Hat";
  }

  if (gene === 37) {
    return "Bearz Police";
  }

  if (gene === 38) {
    return "Cowboy Hat";
  }

  if (gene === 39) {
    return "Straw Hat";
  }

  if (gene === 40) {
    return "Kings Crown";
  }

  if (gene === 41) {
    return "Halo";
  }

  if (gene === 42) {
    return "Jester Hat";
  }

  if (gene === 43) {
    return "Dark Piratez";
  }

  if (gene === 44) {
    return "Santa Hat";
  }

  if (gene === 45) {
    return "Cyber Rice hat";
  }

  if (gene === 46) {
    return "Wulfz";
  }

  if (gene === 47) {
    return "Two Toned Cap";
  }

  if (gene === 48) {
    return "Black Cap";
  }

  if (gene === 49) {
    return "Green Cap";
  }

  if (gene === 50) {
    return "Trainer Cap";
  }

  if (gene === 51) {
    return "Horn";
  }

  if (gene === 52) {
    return "Green Punk Hair";
  }

  if (gene === 53) {
    return "Blue Punk Hair";
  }

  if (gene === 54) {
    return "Red Punk Hair";
  }

  if (gene === 55) {
    return "Purple Punk Hair";
  }

  if (gene === 56) {
    return "Grey Poof";
  }

  if (gene === 57) {
    return "Blue Beanie";
  }

  if (gene === 58) {
    return "Orange Beanie";
  }

  if (gene === 59) {
    return "Red Beanie";
  }

  if (gene === 60) {
    return "Green Flames";
  }

  if (gene === 61) {
    return "Blue Flames";
  }

  if (gene === 62) {
    return "Flames";
  }

  if (gene === 63) {
    return "Grey Headphones";
  }

  if (gene === 64) {
    return "Blue Headphones";
  }

  if (gene === 65) {
    return "Red Headphones";
  }

  if (gene === 66) {
    return "Black Snapback";
  }

  if (gene === 67) {
    return "Green Snapback";
  }

  if (gene === 68) {
    return "Blue Snapback";
  }

  if (gene === 69) {
    return "Two Tones Snapback";
  }

  if (gene === 70) {
    return "Red Snapback";
  }

  if (gene === 71) {
    return "Vault Bear";
  }
  return "";
};

export const geneToEyes = (gene) => {
  if (gene === 0) {
    return "Real Green";
  }

  if (gene === 1) {
    return "Black";
  }

  if (gene === 2) {
    return "Black Side Eye";
  }

  if (gene === 3) {
    return "Real Black";
  }

  if (gene === 4) {
    return "Real Blue";
  }

  if (gene === 5) {
    return "Honey";
  }

  if (gene === 6) {
    return "Ghost";
  }

  if (gene === 7) {
    return "Snake";
  }

  if (gene === 8) {
    return "Worried";
  }

  if (gene === 9) {
    return "Cyber";
  }

  if (gene === 10) {
    return "Lizard";
  }

  if (gene === 11) {
    return "Brown";
  }

  if (gene === 12) {
    return "Bloodshot";
  }
  return "";
};

export const geneToMouth = (gene) => {
  if (gene === 0) {
    return "Serious";
  }

  if (gene === 1) {
    return "Tongue";
  }

  if (gene === 2) {
    return "Ramen";
  }

  if (gene === 3) {
    return "Lollipop";
  }

  if (gene === 4) {
    return "Orge";
  }

  if (gene === 5) {
    return "Tiger";
  }

  if (gene === 6) {
    return "Smile";
  }

  if (gene === 7) {
    return "Angry";
  }

  if (gene === 8) {
    return "Worried";
  }

  if (gene === 9) {
    return "Rage";
  }

  if (gene === 10) {
    return "Bloody Fangs";
  }
  return "";
};

export const geneToOutfit = (gene) => {
  if (gene === 0) {
    return "Dark Space Suit";
  }

  if (gene === 1) {
    return "Golden Space Suit";
  }

  if (gene === 2) {
    return "Space Suit";
  }

  if (gene === 3) {
    return "Rugged Jacket";
  }

  if (gene === 4) {
    return "Multi Jacket";
  }

  if (gene === 5) {
    return "Plated Suit";
  }

  if (gene === 6) {
    return "T16 Jacket";
  }

  if (gene === 7) {
    return "Sand Raider Armor";
  }

  if (gene === 8) {
    return "Raider Armor";
  }

  if (gene === 9) {
    return "Tuxedo";
  }

  if (gene === 10) {
    return "Blue Don Jacket";
  }

  if (gene === 11) {
    return "Green Don Jacket";
  }

  if (gene === 12) {
    return "Purple Don Jacket";
  }

  if (gene === 13) {
    return "Red Don Jacket";
  }

  if (gene === 14) {
    return "Hunter Jacket";
  }

  if (gene === 15) {
    return "Brawler Bearz Hoodie";
  }

  if (gene === 16) {
    return "Quartz Paw Hoodie";
  }

  if (gene === 17) {
    return "Cyan Paw Hoodie";
  }

  if (gene === 18) {
    return "Blue Two Tone Hoodie";
  }

  if (gene === 19) {
    return "Red Two Tone Hoodie";
  }

  if (gene === 20) {
    return "Purple Two Tone Hoodie";
  }

  if (gene === 21) {
    return "Orange Paw Hoodie";
  }

  if (gene === 22) {
    return "Green Paw Hoodie";
  }

  if (gene === 23) {
    return "MVHQ Hoodie";
  }

  if (gene === 24) {
    return "Green Bearz Hoodie";
  }

  if (gene === 25) {
    return "Red Bearz Hoodie";
  }

  if (gene === 26) {
    return "Street Hoodie";
  }

  if (gene === 27) {
    return "Ranger Trench Jacket";
  }

  if (gene === 28) {
    return "Night Rider Jacket";
  }

  if (gene === 29) {
    return "Blue Utility Jacket";
  }

  if (gene === 30) {
    return "Orange Utility Jacket";
  }

  if (gene === 31) {
    return "Red Utility Jacket";
  }

  if (gene === 32) {
    return "Brown Neo Jacket";
  }

  if (gene === 33) {
    return "Green Neo Jacet";
  }

  if (gene === 34) {
    return "Forester Jacket";
  }

  if (gene === 35) {
    return "Robe";
  }

  if (gene === 36) {
    return "Champions Robe";
  }

  if (gene === 37) {
    return "Red Flame Pullover";
  }

  if (gene === 38) {
    return "Blue Flame Pullover";
  }

  if (gene === 39) {
    return "Leather Jacket";
  }

  if (gene === 40) {
    return "Chain";
  }

  if (gene === 41) {
    return "Tech Suit";
  }

  if (gene === 42) {
    return "Red 10 Plate Armor";
  }

  if (gene === 43) {
    return "Blue 10 Plate Armor";
  }

  if (gene === 44) {
    return "Orange 10 Plate Armor";
  }

  if (gene === 45) {
    return "Green 9 Plate Armor";
  }

  if (gene === 46) {
    return "Orange 9 Plate Armor";
  }

  if (gene === 47) {
    return "Blue 9 Plate Armor";
  }

  if (gene === 48) {
    return "Red 9 Plate Armor";
  }

  if (gene === 49) {
    return "Forester Bandana";
  }

  if (gene === 50) {
    return "Purple Striped Bandana";
  }

  if (gene === 51) {
    return "Green Striped Bandana";
  }

  if (gene === 52) {
    return "Green Bandana";
  }

  if (gene === 53) {
    return "Blue Striped Bandana";
  }

  if (gene === 54) {
    return "Red Striped Bandana";
  }

  if (gene === 55) {
    return "Red Bandana";
  }

  if (gene === 56) {
    return "Red Arm Bandana";
  }

  if (gene === 57) {
    return "Blue Arm Bandana";
  }

  if (gene === 58) {
    return "Black Arm Bandana";
  }

  if (gene === 59) {
    return "Black Tee";
  }

  if (gene === 60) {
    return "White Tee";
  }

  if (gene === 61) {
    return "Two Toned Tee";
  }

  if (gene === 62) {
    return "Two Tone Long Sleeve";
  }

  if (gene === 63) {
    return "Bearz Long Sleeve";
  }

  if (gene === 64) {
    return "Bearz Tee";
  }

  if (gene === 65) {
    return "Graphic Tee";
  }

  if (gene === 66) {
    return "Black Graphic Tee";
  }

  if (gene === 67) {
    return "Dark Piratez Suit";
  }

  if (gene === 68) {
    return "Green Arm Bandana";
  }

  if (gene === 69) {
    return "Black Bearz Hoodie";
  }

  if (gene === 70) {
    return "White Futura Jacket";
  }

  if (gene === 71) {
    return "Orange Futura Jacket";
  }

  if (gene === 72) {
    return "Red Futura Jacket";
  }

  if (gene === 73) {
    return "Damaged Shirt";
  }

  if (gene === 74) {
    return "None";
  }
  return "";
};

export const dnaToFields = (dna) => {
  const backgroundId = getRenderingGene(dna, 12);
  const skinId = getRenderingGene(dna, 11);
  const headId = getRenderingGene(dna, 10);
  const eyesId = getRenderingGene(dna, 9);
  const mouthId = getRenderingGene(dna, 8);
  const outfitId = getRenderingGene(dna, 7);
  return {
    backgroundId: backgroundId,
    skinId: skinId,
    headId: headId,
    eyesId: eyesId,
    mouthId: mouthId,
    outfitId: outfitId,
    dynamicBackgroundId: getRenderingGene(dna, 6),
    weaponId: getRenderingGene(dna, 5),
    armorId: getRenderingGene(dna, 4),
    faceArmorId: getRenderingGene(dna, 3),
    dynamicEyewearId: getRenderingGene(dna, 2),
    miscId: getRenderingGene(dna, 1),
    dynamicHeadId: getRenderingGene(dna, 0),
    backgroundValue: geneToBackground(backgroundId),
    skinValue: geneToSkin(skinId),
    headValue: geneToHead(headId),
    eyesValue: geneToEyes(eyesId),
    mouthValue: geneToMouth(mouthId),
    outfitValue: geneToOutfit(outfitId),
  };
};

const completed2Ds = [
  0, 7, 8, 19, 21, 22, 23, 40, 67, 70, 74, 77, 81, 92, 93, 101, 102, 103, 120,
  142, 152, 153, 154, 155, 166, 169, 179, 184, 200, 210, 212, 221, 226, 242,
  252, 255, 265, 266, 267, 268, 276, 277, 286, 294, 304, 309, 318, 335, 345,
  349, 359, 374, 378, 380, 381, 389, 399, 406, 410, 413, 0, 9, 32, 41, 42, 49,
  53, 55, 58, 62, 64, 73, 82, 83, 98, 99, 104, 108, 113, 115, 119, 121, 124,
  131, 132, 133, 134, 135, 140, 143, 145, 149, 157, 158, 164, 165, 191, 206,
  208, 215, 216, 230, 235, 236, 237, 238, 244, 253, 258, 260, 261, 278, 280,
  283, 284, 296, 299, 314, 321, 322, 337, 340, 341, 352, 353, 360, 362, 365,
  379, 383, 392, 394, 396, 407, 414, 415, 0, 1, 4, 34, 35, 37, 38, 43, 44, 48,
  52, 54, 57, 61, 63, 71, 75, 76, 84, 87, 95, 96, 97, 105, 106, 107, 109, 110,
  111, 112, 114, 116, 117, 122, 123, 127, 128, 129, 130, 141, 144, 146, 147,
  148, 150, 151, 161, 170, 178, 180, 186, 190, 193, 194, 196, 198, 201, 205,
  209, 214, 219, 224, 228, 229, 232, 233, 239, 243, 245, 248, 249, 250, 251,
  257, 259, 262, 263, 269, 271, 272, 275, 305, 311, 313, 315, 330, 336, 342,
  343, 351, 354, 358, 361, 363, 366, 368, 370, 387, 395, 398, 400, 401, 402,
  403, 405, 408, 411, 412, 0, 15, 91, 171, 172, 187, 188, 195, 270, 287, 301,
  302, 307, 338, 347, 369, 371, 375, 0, 5, 39, 47, 60, 68, 72, 80, 85, 88, 100,
  126, 136, 138, 156, 162, 167, 181, 199, 218, 241, 247, 256, 264, 293, 323,
  326, 327, 328, 329, 332, 357, 382, 384, 388, 393, 397, 0, 2, 3, 6, 16, 17, 18,
  25, 26, 27, 28, 29, 30, 31, 33, 36, 45, 46, 56, 65, 86, 90, 94, 139, 159, 163,
  173, 174, 175, 176, 177, 189, 192, 204, 213, 217, 222, 223, 227, 231, 234,
  246, 254, 282, 288, 289, 295, 316, 317, 324, 339, 344, 355, 356, 373, 376,
  377, 386, 391, 409, 4000, 4001, 0, 10, 11, 12, 13, 14, 20, 24, 50, 51, 59, 66,
  69, 78, 79, 89, 125, 137, 160, 168, 182, 183, 185, 197, 202, 203, 207, 220,
  225, 240, 273, 274, 279, 281, 285, 291, 292, 298, 303, 306, 308, 310, 312,
  319, 320, 331, 333, 334, 346, 348, 350, 367, 372, 385, 390, 404, 4019,
];

const SYNTH_ITEM_ID = 211;

export const generateRenderingOrder = ({
  consumables,
  dna,
  isShowingPixel,
}) => {
  const fields = dnaToFields(dna);

  const isStimulated =
    consumables?.find((item) => item?.trait_type === "2D Stimulant")?.value ===
    "ACTIVE";

  const isSynthEnabled = isStimulated || fields?.miscId === SYNTH_ITEM_ID;
  const isRendering2d = isSynthEnabled && !isShowingPixel;

  const basePath = isRendering2d
    ? `${process.env.PUBLIC_URL}/layers2d`
    : `${process.env.PUBLIC_URL}/layers`;

  return {
    images: isRendering2d
      ? [
          {
            id: fields.dynamicBackgroundId,
            typeOf: "BACKGROUND",
            path:
              fields.dynamicBackgroundId &&
              completed2Ds.includes(fields?.dynamicBackgroundId)
                ? `${basePath}/Dynamic/${fields?.dynamicBackgroundId}.png`
                : `${basePath}/Background/${fields?.backgroundValue}.png`,
          },
          {
            id: fields?.weaponId,
            typeOf: "WEAPON",
            path:
              fields?.weaponId && completed2Ds.includes(fields?.weaponId)
                ? `${basePath}/Dynamic/${fields?.weaponId}.png`
                : null,
          },
          {
            id: 0,
            typeOf: "SKIN",
            path: `${basePath}/Skin/${fields?.skinValue}.png`,
          },
          {
            id: fields?.armorId,
            typeOf: "ARMOR",
            path:
              fields?.outfitValue === "None"
                ? null
                : fields?.armorId && completed2Ds.includes(fields?.armorId)
                ? `${basePath}/Dynamic/${fields?.armorId}.png`
                : `${basePath}/Outfit/${fields?.outfitValue}.png`,
          },
          {
            id: 0,
            typeOf: "EYES",
            path: `${basePath}/Eyes/${fields?.eyesValue}.png`,
          },
          {
            id: fields.dynamicEyewearId,
            typeOf: "EYEWEAR",
            path:
              fields.dynamicEyewearId &&
              completed2Ds.includes(fields?.dynamicEyewearId)
                ? `${basePath}/Dynamic/${fields?.dynamicEyewearId}.png`
                : null,
          },
          {
            id: 0,
            typeOf: "MOUTH",
            path: `${basePath}/Mouth/${fields?.mouthValue}.png`,
          },
          {
            id: fields.dynamicHeadId,
            typeOf: "HEAD",
            path:
              fields.dynamicHeadId &&
              completed2Ds.includes(fields?.dynamicHeadId)
                ? `${basePath}/Dynamic/${fields?.dynamicHeadId}.png`
                : fields.headValue === "None" || fields.faceArmorId
                ? null
                : `${basePath}/Head/${fields?.headValue}.png`,
          },
          {
            id: fields?.faceArmorId,
            typeOf: "FACE_ARMOR",
            path:
              fields?.faceArmorId && completed2Ds.includes(fields?.faceArmorId)
                ? `${basePath}/Dynamic/${fields?.faceArmorId}.png`
                : null,
          },
          {
            id: fields?.miscId,
            typeOf: "MISC",
            path:
              fields?.miscId &&
              completed2Ds.includes(fields?.miscId) &&
              fields?.miscId !== 211
                ? `${basePath}/Dynamic/${fields?.miscId}.png`
                : null,
          },
        ].filter((item) => item.path)
      : [
          {
            id: fields.dynamicBackgroundId,
            typeOf: "BACKGROUND",
            path:
              fields.dynamicBackgroundId > 0
                ? `${basePath}/Dynamic/${fields?.dynamicBackgroundId}.gif`
                : `${basePath}/Background/${fields?.backgroundValue}.gif`,
          },
          {
            id: fields.weaponId,
            typeOf: "WEAPON",
            path: fields?.weaponId
              ? `${basePath}/Dynamic/${fields?.weaponId}.gif`
              : null,
          },
          {
            id: 0,
            typeOf: "SKIN",
            path: `${basePath}/Skin/${fields?.skinValue}.gif`,
          },
          {
            id: fields.armorId,
            typeOf: "ARMOR",
            path:
              fields?.outfitValue === "None"
                ? null
                : fields?.armorId
                ? `${basePath}/Dynamic/${fields?.armorId}.gif`
                : `${basePath}/Outfit/${fields?.outfitValue}.gif`,
          },
          {
            id: 0,
            typeOf: "EYES",
            path: `${basePath}/Eyes/${fields?.eyesValue}.gif`,
          },
          {
            id: fields.dynamicEyewearId,
            typeOf: "EYEWEAR",
            path: fields.dynamicEyewearId
              ? `${basePath}/Dynamic/${fields?.dynamicEyewearId}.gif`
              : null,
          },
          {
            id: 0,
            typeOf: "MOUTH",
            path: `${basePath}/Mouth/${fields?.mouthValue}.gif`,
          },

          {
            id: fields.dynamicHeadId,
            typeOf: "HEAD",
            path: fields.dynamicHeadId
              ? `${basePath}/Dynamic/${fields?.dynamicHeadId}.gif`
              : fields.headValue === "None" || fields.faceArmorId
              ? null
              : `${basePath}/Head/${fields?.headValue}.gif`,
          },

          {
            id: fields?.faceArmorId,
            typeOf: "FACE_ARMOR",
            path: fields?.faceArmorId
              ? `${basePath}/Dynamic/${fields?.faceArmorId}.gif`
              : null,
          },

          {
            id: fields?.faceArmorId,
            typeOf: "MISC",
            path:
              fields?.miscId && !isSynthEnabled
                ? `${basePath}/Dynamic/${fields?.miscId}.gif`
                : null,
          },
        ].filter((item) => item.path),
    isSynthEnabled,
    isRendering2d,
    basePath,
  };
};
