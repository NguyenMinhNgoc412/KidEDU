import type { LearningItemMedia } from "./types";

export interface IllustrationAnimation {
  itemId: string;
  label: string;
  source: number | string;
  frameCount: number;
  frameDurationMs: number;
  staticFrame: number;
}

export const illustrationAnimations: Readonly<Record<string, IllustrationAnimation>> = {
  "item-ba": {
    itemId: "item-ba",
    label: "Ba vẫy tay chào.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ba-v2.jpg") as number | string
  },
  "item-me": {
    itemId: "item-me",
    label: "Mẹ vẫy tay chào.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/me-v2.jpg") as number | string
  },
  "item-ong": {
    itemId: "item-ong",
    label: "Ông vẫy tay chào.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ong-v2.jpg") as number | string
  },
  "item-ba-noi": {
    itemId: "item-ba-noi",
    label: "Bà vẫy tay chào.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ba-noi-v2.jpg") as number | string
  },
  "item-an": {
    itemId: "item-an",
    label: "Bé đưa thìa cơm lên miệng và ăn.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/an-v2.jpg") as number | string
  },
  "item-uong": {
    itemId: "item-uong",
    label: "Bé nâng ly, uống nước rồi hạ ly.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/uong-v2.jpg") as number | string
  },
  "item-ngu": {
    itemId: "item-ngu",
    label: "Bé ngủ yên, thở nhẹ.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ngu-v2.jpg") as number | string
  },
  "item-dau": {
    itemId: "item-dau",
    label: "Bé ôm má và thể hiện cảm giác đau nhẹ.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/dau-v2.jpg") as number | string
  },
  "item-be": {
    itemId: "item-be",
    label: "Mẹ nâng và bế bé trong vòng tay.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/be-v2.jpg") as number | string
  },
  "item-nua": {
    itemId: "item-nua",
    label: "Bé đưa bát rỗng ra xin thêm.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/nua-v2.jpg") as number | string
  },
  "item-khong": {
    itemId: "item-khong",
    label: "Bé giơ lòng bàn tay và lắc đầu từ chối.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/khong-v2.jpg") as number | string
  },
  "item-bong": {
    itemId: "item-bong",
    label: "Quả bóng lăn một đoạn rồi dừng.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/bong-v2.jpg") as number | string
  },
  "item-xe": {
    itemId: "item-xe",
    label: "Xe lăn bánh một đoạn rồi dừng.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/xe-v2.jpg") as number | string
  },
  "item-ly": {
    itemId: "item-ly",
    label: "Bàn tay nhấc ly lên rồi đặt xuống.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ly-v2.jpg") as number | string
  },
  "item-sua": {
    itemId: "item-sua",
    label: "Sữa trắng được rót vào ly.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/sua-v2.jpg") as number | string
  },
  "item-banh": {
    itemId: "item-banh",
    label: "Bàn tay nhấc chiếc bánh rồi đặt lại.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/banh-v2.jpg") as number | string
  },
  "item-gau": {
    itemId: "item-gau",
    label: "Gấu bông được ôm nhẹ rồi thả lỏng.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/gau-v2.jpg") as number | string
  },
  "item-meo": {
    itemId: "item-meo",
    label: "Mèo chớp mắt và ve vẩy đuôi.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/meo-v2.jpg") as number | string
  },
  "item-cho": {
    itemId: "item-cho",
    label: "Chó ngồi và vẫy đuôi.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/cho-v2.jpg") as number | string
  },
  "item-ca": {
    itemId: "item-ca",
    label: "Cá quẫy đuôi và vây để bơi.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ca-v2.jpg") as number | string
  },
  "item-ga": {
    itemId: "item-ga",
    label: "Gà cúi đầu mổ rồi ngẩng lên.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ga-v2.jpg") as number | string
  },
  "item-chim": {
    itemId: "item-chim",
    label: "Chim mở và khép đôi cánh trên cành.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/chim-v2.jpg") as number | string
  },
  "item-di": {
    itemId: "item-di",
    label: "Bé bước đi, tay và chân luân phiên.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/di-v2.jpg") as number | string
  },
  "item-ngoi": {
    itemId: "item-ngoi",
    label: "Bé hạ người ngồi xuống ghế.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/ngoi-v2.jpg") as number | string
  },
  "item-dung": {
    itemId: "item-dung",
    label: "Bé từ tư thế ngồi đứng dậy.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/dung-v2.jpg") as number | string
  },
  "item-lay": {
    itemId: "item-lay",
    label: "Bé lấy khối đồ chơi từ dưới sàn.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/lay-v2.jpg") as number | string
  },
  "item-dua": {
    itemId: "item-dua",
    label: "Bé đưa khối đồ chơi cho người đối diện.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/dua-v2.jpg") as number | string
  },
  "item-mo": {
    itemId: "item-mo",
    label: "Bé mở nắp hộp, kết thúc khi hộp mở.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/mo-v2.jpg") as number | string
  },
  "item-dong": {
    itemId: "item-dong",
    label: "Bé đóng nắp hộp, kết thúc khi hộp đóng.",
    frameCount: 8,
    frameDurationMs: 375,
    staticFrame: 7,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source: require("../../assets/illustration-animations/dong-v2.jpg") as number | string
  }
};

export function resolveIllustrationAnimation(
  itemId: string | undefined,
  media?: LearningItemMedia
): IllustrationAnimation | null {
  if (
    !itemId ||
    (media &&
      (media.asset.source !== "default" || !media.asset.uri.startsWith("bundle://default/")))
  )
    return null;
  return illustrationAnimations[itemId] ?? null;
}
