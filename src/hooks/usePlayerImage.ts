import { useEffect, useState } from "react";
import { Player } from "../types";
import { fetchPlayerImage, getCachedPlayerImage } from "../lib/playerImages";

export const usePlayerImage = (player: Player) => {
  const [imageUrl, setImageUrl] = useState<string | null>(() =>
    getCachedPlayerImage(player),
  );

  useEffect(() => {
    let active = true;

    const loadImage = async () => {
      const image = await fetchPlayerImage(player);
      if (active) setImageUrl(image);
    };

    if (imageUrl === null) {
      void loadImage();
    }

    return () => {
      active = false;
    };
  }, [imageUrl, player]);

  return imageUrl;
};
