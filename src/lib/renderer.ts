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
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
  63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
  83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101,
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 115, 116, 117,
  119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
  134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148,
  149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163,
  164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178,
  180, 181, 182, 183, 184, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195,
  196, 198, 199, 200, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
];

const SYNTH_ITEM_ID = 211;

export const generateRenderingOrder = ({ dna, isShowingPixel }) => {
  const fields = dnaToFields(dna);
  const isSynthEnabled = fields?.miscId === SYNTH_ITEM_ID;
  const isRendering2d = isSynthEnabled && !isShowingPixel;

  const basePath = isRendering2d
    ? `${process.env.PUBLIC_URL}/layers2d`
    : `${process.env.PUBLIC_URL}/layers`;

  return {
    images: isRendering2d
      ? [
          fields.dynamicBackgroundId &&
          completed2Ds.includes(fields?.dynamicBackgroundId)
            ? `${basePath}/Dynamic/${fields?.dynamicBackgroundId}.png`
            : `${basePath}/Background/${fields?.backgroundValue}.png`,
          fields?.weaponId && completed2Ds.includes(fields?.weaponId)
            ? `${basePath}/Dynamic/${fields?.weaponId}.png`
            : null,
          `${basePath}/Skin/${fields?.skinValue}.png`,
          fields?.outfitValue === "None"
            ? null
            : fields?.armorId && completed2Ds.includes(fields?.armorId)
            ? `${basePath}/Dynamic/${fields?.armorId}.png`
            : `${basePath}/Outfit/${fields?.outfitValue}.png`,
          `${basePath}/Eyes/${fields?.eyesValue}.png`,
          fields.dynamicEyewearId &&
          completed2Ds.includes(fields?.dynamicEyewearId)
            ? `${basePath}/Dynamic/${fields?.dynamicEyewearId}.png`
            : null,
          `${basePath}/Mouth/${fields?.mouthValue}.png`,
          fields.dynamicHeadId && completed2Ds.includes(fields?.dynamicHeadId)
            ? `${basePath}/Dynamic/${fields?.dynamicHeadId}.png`
            : fields.headValue === "None" || fields.faceArmorId
            ? null
            : `${basePath}/Head/${fields?.headValue}.png`,
          // Face armor
          fields?.faceArmorId && completed2Ds.includes(fields?.faceArmorId)
            ? `${basePath}/Dynamic/${fields?.faceArmorId}.png`
            : null,
          // MISC
          fields?.miscId &&
          completed2Ds.includes(fields?.miscId) &&
          fields?.miscId !== 211
            ? `${basePath}/Dynamic/${fields?.miscId}.png`
            : null,
        ].filter(Boolean)
      : [
          fields.dynamicBackgroundId > 0
            ? `${basePath}/Dynamic/${fields?.dynamicBackgroundId}.gif`
            : `${basePath}/Background/${fields?.backgroundValue}.gif`,
          // Weapon
          fields?.weaponId
            ? `${basePath}/Dynamic/${fields?.weaponId}.gif`
            : null,
          // Skin
          `${basePath}/Skin/${fields?.skinValue}.gif`,
          // Outfit or Armor
          fields?.outfitValue === "None"
            ? null
            : fields?.armorId
            ? `${basePath}/Dynamic/${fields?.armorId}.gif`
            : `${basePath}/Outfit/${fields?.outfitValue}.gif`,
          ,
          // Eyes
          `${basePath}/Eyes/${fields?.eyesValue}.gif`,
          // Eyewear
          fields.dynamicEyewearId
            ? `${basePath}/Dynamic/${fields?.dynamicEyewearId}.gif`
            : null,
          // Mouth
          `${basePath}/Mouth/${fields?.mouthValue}.gif`,
          // Head or Blocking Face Armor
          fields.dynamicHeadId
            ? `${basePath}/Dynamic/${fields?.dynamicHeadId}.gif`
            : fields.headValue === "None" || fields.faceArmorId
            ? null
            : `${basePath}/Head/${fields?.headValue}.gif`,
          // Face armor
          fields?.faceArmorId
            ? `${basePath}/Dynamic/${fields?.faceArmorId}.gif`
            : null,
          ,
          // Misc
          fields?.miscId && !isSynthEnabled
            ? `${basePath}/Dynamic/${fields?.miscId}.gif`
            : null,
          ,
        ].filter(Boolean),
    isSynthEnabled,
    isRendering2d,
    basePath,
  };
};
