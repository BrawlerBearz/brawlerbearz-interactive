import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import classnames from "classnames";
import {useParams} from "react-router-dom";
import twoDButton from './interactive/toggle2d.png';
import pixelButton from './interactive/togglepixel.png';
import logoImage from './interactive/logo.gif';

const getGene = (dna, position) => {
  const normalizedDna = ethers.BigNumber.from(dna);
  const shiftBy = 8 * position;
  const gene = normalizedDna.and(ethers.BigNumber.from(0xff).shl(shiftBy));
  return gene.shr(shiftBy);
};

const geneToBackground = (gene) => {
  if (gene == 0) {
    return "Gray";
  }
  if (gene == 1) {
    return "Moss";
  }
  if (gene == 2) {
    return "Orange";
  }
  if (gene == 3) {
    return "Red";
  }
  if (gene == 4) {
    return "Green";
  }
  if (gene == 5) {
    return "Blue";
  }
  if (gene == 6) {
    return "Brown";
  }
  if (gene == 7) {
    return "Smoke";
  }
  if (gene == 8) {
    return "Red Smoke";
  }
  if (gene == 9) {
    return "Maroon";
  }
  if (gene == 10) {
    return "Purple";
  }
  if (gene == 11) {
    return "Navy";
  }
  if (gene == 12) {
    return "Graffiti";
  }
  if (gene == 13) {
    return "Cyber Safari";
  }
  return "";
};

const geneToSkin = (gene) => {
  if (gene == 0) {
    return "Plasma";
  }

  if (gene == 1) {
    return "Sun Breaker";
  }

  if (gene == 2) {
    return "Negative";
  }

  if (gene == 3) {
    return "Mash";
  }

  if (gene == 4) {
    return "Grey Tiger";
  }

  if (gene == 5) {
    return "Polar Bear";
  }

  if (gene == 6) {
    return "Tan Tiger";
  }

  if (gene == 7) {
    return "Tiger";
  }

  if (gene == 8) {
    return "Chocolate Striped";
  }

  if (gene == 9) {
    return "Ripper";
  }

  if (gene == 10) {
    return "Brown Panda";
  }

  if (gene == 11) {
    return "Panda";
  }

  if (gene == 12) {
    return "Brown";
  }

  if (gene == 13) {
    return "Grey";
  }

  if (gene == 14) {
    return "Tan";
  }

  if (gene == 15) {
    return "Black Bear";
  }

  if (gene == 16) {
    return "Toxic";
  }

  if (gene == 17) {
    return "Green Chalk";
  }

  if (gene == 18) {
    return "Negative Tiger";
  }

  if (gene == 19) {
    return "Metal";
  }

  if (gene == 20) {
    return "Orange";
  }
  return "";
};

const geneToHead = (gene) => {
  if (gene == 0) {
    return "Green Soda Hat";
  }

  if (gene == 1) {
    return "Orange Soda Hat";
  }

  if (gene == 2) {
    return "Golden Gladiator Helmet";
  }

  if (gene == 3) {
    return "Gladiator Helmet";
  }

  if (gene == 4) {
    return "Bone Head";
  }

  if (gene == 5) {
    return "Holiday Beanie";
  }

  if (gene == 6) {
    return "Pan";
  }

  if (gene == 7) {
    return "Snow Trooper";
  }

  if (gene == 8) {
    return "Bearlympics Headband";
  }

  if (gene == 9) {
    return "Sea Cap";
  }

  if (gene == 10) {
    return "Green Goggles";
  }

  if (gene == 11) {
    return "Red Goggles";
  }

  if (gene == 12) {
    return "Society Cap";
  }

  if (gene == 13) {
    return "Fireman Hat";
  }

  if (gene == 14) {
    return "Vendor Cap";
  }

  if (gene == 15) {
    return "Banana";
  }

  if (gene == 16) {
    return "Cake";
  }

  if (gene == 17) {
    return "Rabbit Ears";
  }

  if (gene == 18) {
    return "Party Hat";
  }

  if (gene == 19) {
    return "Rice Hat";
  }

  if (gene == 20) {
    return "None";
  }

  if (gene == 21) {
    return "Alarm";
  }

  if (gene == 22) {
    return "Karate Band";
  }

  if (gene == 23) {
    return "Butchered";
  }

  if (gene == 24) {
    return "Green Bear Rag";
  }

  if (gene == 25) {
    return "Red Bear Rag";
  }

  if (gene == 26) {
    return "Wizard Hat";
  }

  if (gene == 27) {
    return "Ninja Headband";
  }

  if (gene == 28) {
    return "Sombrero";
  }

  if (gene == 29) {
    return "Blue Ice Cream";
  }

  if (gene == 30) {
    return "Red Ice Cream";
  }

  if (gene == 31) {
    return "Viking Helmet";
  }

  if (gene == 32) {
    return "Snow Hat";
  }

  if (gene == 33) {
    return "Green Bucket Hat";
  }

  if (gene == 34) {
    return "Blue Bucket Hat";
  }

  if (gene == 35) {
    return "Red Bucket Hat";
  }

  if (gene == 36) {
    return "Chef Hat";
  }

  if (gene == 37) {
    return "Bearz Police";
  }

  if (gene == 38) {
    return "Cowboy Hat";
  }

  if (gene == 39) {
    return "Straw Hat";
  }

  if (gene == 40) {
    return "Kings Crown";
  }

  if (gene == 41) {
    return "Halo";
  }

  if (gene == 42) {
    return "Jester Hat";
  }

  if (gene == 43) {
    return "Dark Piratez";
  }

  if (gene == 44) {
    return "Santa Hat";
  }

  if (gene == 45) {
    return "Cyber Rice hat";
  }

  if (gene == 46) {
    return "Wulfz";
  }

  if (gene == 47) {
    return "Two Toned Cap";
  }

  if (gene == 48) {
    return "Black Cap";
  }

  if (gene == 49) {
    return "Green Cap";
  }

  if (gene == 50) {
    return "Trainer Cap";
  }

  if (gene == 51) {
    return "Horn";
  }

  if (gene == 52) {
    return "Green Punk Hair";
  }

  if (gene == 53) {
    return "Blue Punk Hair";
  }

  if (gene == 54) {
    return "Red Punk Hair";
  }

  if (gene == 55) {
    return "Purple Punk Hair";
  }

  if (gene == 56) {
    return "Grey Poof";
  }

  if (gene == 57) {
    return "Blue Beanie";
  }

  if (gene == 58) {
    return "Orange Beanie";
  }

  if (gene == 59) {
    return "Red Beanie";
  }

  if (gene == 60) {
    return "Green Flames";
  }

  if (gene == 61) {
    return "Blue Flames";
  }

  if (gene == 62) {
    return "Flames";
  }

  if (gene == 63) {
    return "Grey Headphones";
  }

  if (gene == 64) {
    return "Blue Headphones";
  }

  if (gene == 65) {
    return "Red Headphones";
  }

  if (gene == 66) {
    return "Black Snapback";
  }

  if (gene == 67) {
    return "Green Snapback";
  }

  if (gene == 68) {
    return "Blue Snapback";
  }

  if (gene == 69) {
    return "Two Tones Snapback";
  }

  if (gene == 70) {
    return "Red Snapback";
  }

  if (gene == 71) {
    return "Vault Bear";
  }
  return "";
};

const geneToEyes = (gene) => {
  if (gene == 0) {
    return "Real Green";
  }

  if (gene == 1) {
    return "Black";
  }

  if (gene == 2) {
    return "Black Side Eye";
  }

  if (gene == 3) {
    return "Real Black";
  }

  if (gene == 4) {
    return "Real Blue";
  }

  if (gene == 5) {
    return "Honey";
  }

  if (gene == 6) {
    return "Ghost";
  }

  if (gene == 7) {
    return "Snake";
  }

  if (gene == 8) {
    return "Worried";
  }

  if (gene == 9) {
    return "Cyber";
  }

  if (gene == 10) {
    return "Lizard";
  }

  if (gene == 11) {
    return "Brown";
  }

  if (gene == 12) {
    return "Bloodshot";
  }
  return "";
};

const geneToMouth = (gene) => {
  if (gene == 0) {
    return "Serious";
  }

  if (gene == 1) {
    return "Tongue";
  }

  if (gene == 2) {
    return "Ramen";
  }

  if (gene == 3) {
    return "Lollipop";
  }

  if (gene == 4) {
    return "Orge";
  }

  if (gene == 5) {
    return "Tiger";
  }

  if (gene == 6) {
    return "Smile";
  }

  if (gene == 7) {
    return "Angry";
  }

  if (gene == 8) {
    return "Worried";
  }

  if (gene == 9) {
    return "Rage";
  }

  if (gene == 10) {
    return "Bloody Fangs";
  }
  return "";
};

const geneToOutfit = (gene) => {
  if (gene == 0) {
    return "Dark Space Suit";
  }

  if (gene == 1) {
    return "Golden Space Suit";
  }

  if (gene == 2) {
    return "Space Suit";
  }

  if (gene == 3) {
    return "Rugged Jacket";
  }

  if (gene == 4) {
    return "Multi Jacket";
  }

  if (gene == 5) {
    return "Plated Suit";
  }

  if (gene == 6) {
    return "T16 Jacket";
  }

  if (gene == 7) {
    return "Sand Raider Armor";
  }

  if (gene == 8) {
    return "Raider Armor";
  }

  if (gene == 9) {
    return "Tuxedo";
  }

  if (gene == 10) {
    return "Blue Don Jacket";
  }

  if (gene == 11) {
    return "Green Don Jacket";
  }

  if (gene == 12) {
    return "Purple Don Jacket";
  }

  if (gene == 13) {
    return "Red Don Jacket";
  }

  if (gene == 14) {
    return "Hunter Jacket";
  }

  if (gene == 15) {
    return "Brawler Bearz Hoodie";
  }

  if (gene == 16) {
    return "Quartz Paw Hoodie";
  }

  if (gene == 17) {
    return "Cyan Paw Hoodie";
  }

  if (gene == 18) {
    return "Blue Two Tone Hoodie";
  }

  if (gene == 19) {
    return "Red Two Tone Hoodie";
  }

  if (gene == 20) {
    return "Purple Two Tone Hoodie";
  }

  if (gene == 21) {
    return "Orange Paw Hoodie";
  }

  if (gene == 22) {
    return "Green Paw Hoodie";
  }

  if (gene == 23) {
    return "MVHQ Hoodie";
  }

  if (gene == 24) {
    return "Green Bearz Hoodie";
  }

  if (gene == 25) {
    return "Red Bearz Hoodie";
  }

  if (gene == 26) {
    return "Street Hoodie";
  }

  if (gene == 27) {
    return "Ranger Trench Jacket";
  }

  if (gene == 28) {
    return "Night Rider Jacket";
  }

  if (gene == 29) {
    return "Blue Utility Jacket";
  }

  if (gene == 30) {
    return "Orange Utility Jacket";
  }

  if (gene == 31) {
    return "Red Utility Jacket";
  }

  if (gene == 32) {
    return "Brown Neo Jacket";
  }

  if (gene == 33) {
    return "Green Neo Jacet";
  }

  if (gene == 34) {
    return "Forester Jacket";
  }

  if (gene == 35) {
    return "Robe";
  }

  if (gene == 36) {
    return "Champions Robe";
  }

  if (gene == 37) {
    return "Red Flame Pullover";
  }

  if (gene == 38) {
    return "Blue Flame Pullover";
  }

  if (gene == 39) {
    return "Leather Jacket";
  }

  if (gene == 40) {
    return "Chain";
  }

  if (gene == 41) {
    return "Tech Suit";
  }

  if (gene == 42) {
    return "Red 10 Plate Armor";
  }

  if (gene == 43) {
    return "Blue 10 Plate Armor";
  }

  if (gene == 44) {
    return "Orange 10 Plate Armor";
  }

  if (gene == 45) {
    return "Green 9 Plate Armor";
  }

  if (gene == 46) {
    return "Orange 9 Plate Armor";
  }

  if (gene == 47) {
    return "Blue 9 Plate Armor";
  }

  if (gene == 48) {
    return "Red 9 Plate Armor";
  }

  if (gene == 49) {
    return "Forester Bandana";
  }

  if (gene == 50) {
    return "Purple Striped Bandana";
  }

  if (gene == 51) {
    return "Green Striped Bandana";
  }

  if (gene == 52) {
    return "Green Bandana";
  }

  if (gene == 53) {
    return "Blue Striped Bandana";
  }

  if (gene == 54) {
    return "Red Striped Bandana";
  }

  if (gene == 55) {
    return "Red Bandana";
  }

  if (gene == 56) {
    return "Red Arm Bandana";
  }

  if (gene == 57) {
    return "Blue Arm Bandana";
  }

  if (gene == 58) {
    return "Black Arm Bandana";
  }

  if (gene == 59) {
    return "Black Tee";
  }

  if (gene == 60) {
    return "White Tee";
  }

  if (gene == 61) {
    return "Two Toned Tee";
  }

  if (gene == 62) {
    return "Two Tone Long Sleeve";
  }

  if (gene == 63) {
    return "Bearz Long Sleeve";
  }

  if (gene == 64) {
    return "Bearz Tee";
  }

  if (gene == 65) {
    return "Graphic Tee";
  }

  if (gene == 66) {
    return "Black Graphic Tee";
  }

  if (gene == 67) {
    return "Dark Piratez Suit";
  }

  if (gene == 68) {
    return "Green Arm Bandana";
  }

  if (gene == 69) {
    return "Black Bearz Hoodie";
  }

  if (gene == 70) {
    return "White Futura Jacket";
  }

  if (gene == 71) {
    return "Orange Futura Jacket";
  }

  if (gene == 72) {
    return "Red Futura Jacket";
  }

  if (gene == 73) {
    return "Damaged Shirt";
  }

  if (gene == 74) {
    return "None";
  }
  return "";
};

const dnaToFields = (dna) => {
  const backgroundId = getGene(dna, 12);
  const skinId = getGene(dna, 11);
  const headId = getGene(dna, 10);
  const eyesId = getGene(dna, 9);
  const mouthId = getGene(dna, 8);
  const outfitId = getGene(dna, 7);
  return {
    backgroundId: backgroundId,
    skinId: skinId?.toNumber(),
    headId: headId?.toNumber(),
    eyesId: eyesId?.toNumber(),
    mouthId: mouthId?.toNumber(),
    outfitId: outfitId?.toNumber(),
    dynamicBackgroundId: getGene(dna, 6)?.toNumber(),
    weaponId: getGene(dna, 5)?.toNumber(),
    armorId: getGene(dna, 4)?.toNumber(),
    faceArmorId: getGene(dna, 3)?.toNumber(),
    dynamicEyewearId: getGene(dna, 2)?.toNumber(),
    miscId: getGene(dna, 1)?.toNumber(),
    dynamicHeadId: getGene(dna, 0)?.toNumber(),
    backgroundValue: geneToBackground(backgroundId),
    skinValue: geneToSkin(skinId),
    headValue: geneToHead(headId),
    eyesValue: geneToEyes(eyesId),
    mouthValue: geneToMouth(mouthId),
    outfitValue: geneToOutfit(outfitId),
  };
};

const InteractiveNFT = () => {
  const { dna = "" } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(25);
  const [isShowingMenu, setIsShowingMenu] = useState(false);
  const [isShowingPixel, setIsShowingPixel] = useState(false);

  useEffect(() => {
    if (isLoading && dna) {
      const start = Math.floor(Math.random() * 30 + 20);
      setProgress(start);
      setTimeout(() => {
        setProgress(100 - start > 70 ? Math.floor(100 - start / 2) : 90);
      }, 500);
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [isLoading, dna]);

  if (isLoading)
    return (
        <div className="flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-dark2">
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
    );

  const fields = dnaToFields(dna);
  const isSynthEnabled = fields?.miscId === 211;
  const isRendering2d = isSynthEnabled && !isShowingPixel;

  const basePath = isRendering2d
      ? "https://allofthethings.s3.amazonaws.com/brawlerbearz/layers2d"
      : "https://allofthethings.s3.amazonaws.com/brawlerbearz/layers";

  const imagesToRender = isRendering2d
      ? [
        `${basePath}/Skin/${fields?.skinValue}.png`,
        `${basePath}/Outfit/${fields?.outfitValue}.png`,
        `${basePath}/Eyes/${fields?.eyesValue}.png`,
        `${basePath}/Mouth/${fields?.mouthValue}.png`,
        `${basePath}/Head/${fields?.headValue}.png`,
      ]
      : [
        // Weapon
        fields?.weaponId ? `${basePath}/Dynamic/${fields?.weaponId}.gif` : null,
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
            ? `${basePath}/Dynamic/${fields?.faceArmorId}.gif`
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
      ].filter(Boolean);

  return (
      <div
          className={classnames(
              "relative flex flex-col h-screen w-screen overflow-auto font-primary text-white bg-main overflow-hidden",
              {
                "pb-[80px]": isShowingMenu,
              }
          )}
      >
        {isSynthEnabled && (
            <div className="fixed top-0 flex flex-row h-[70px] items-center justify-between w-full z-[10] px-3">
              <div />
              <button
                  onClick={(e) => {
                    setIsShowingPixel(!isShowingPixel);
                  }}
              >
                <img
                    src={
                      isShowingPixel
                          ? twoDButton
                          : pixelButton
                    }
                    className="h-[57px] w-[104px]"
                    alt="enabler icon"
                />
              </button>
            </div>
        )}
        <div className="relative flex flex-col items-center justify-center z-[1] mx-auto h-full w-full bg-dark2">
          <div className="absolute top-0 left-0 h-full w-full z-[1]">
            <img
                src={`${basePath}/Background/${fields?.backgroundValue}.${
                    isRendering2d ? "png" : "gif"
                }`}
                className="h-full w-full object-cover"
            />
          </div>
          {imagesToRender.map((imageURL, index) => {
            return (
                <img
                    key={`${imageURL}_${index}`}
                    src={imageURL || ''}
                    className="absolute bottom-0 max-h-[500px] max-w-[500px] object-cover"
                    style={{ zIndex: imagesToRender.length + index }}
                    alt="Layered image"
                />
            );
          })}
        </div>
      </div>
  );
};

export default InteractiveNFT;

