import type { PlayPresentation } from "@/content/contracts/playPresentation";
export interface PlaySample {
  id: string;
  title: string;
  goal: "command" | "request" | "social";
  itemId: string;
  object: string;
  response: string;
  preparation: string;
  context: string;
  search: string;
  scenario: "request" | "call" | "greeting" | "invite" | "turn_taking" | "possession";
  presentation: PlayPresentation;
}
export const playSampleLessons: PlaySample[] = [
  {
    id: "fixture_play_today_words",
    title: "5 từ hôm nay · 3 trò chơi",
    goal: "command",
    itemId: "item-bong",
    object: "bóng, gấu, xe, bánh, sữa",
    response: "Nhận biết và dùng các từ bóng, gấu, xe, bánh, sữa",
    preparation:
      "Một bài gồm 5 từ: bóng, gấu, xe, bánh, sữa. Con lần lượt lật thẻ, tìm hình và kéo hình vào ô.",
    context: "Cùng gọi tên và dùng các đồ vật thật sau khi chơi.",
    search: "nam tu hom nay",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "pair",
      wordGames: true,
      instruction: "Cùng chơi với bóng, gấu, xe, bánh và sữa!",
      pieces: [
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "bear",
          label: "Gấu",
          picture: "item-gau"
        },
        {
          id: "car",
          label: "Xe",
          picture: "item-xe"
        },
        {
          id: "cake",
          label: "Bánh",
          picture: "item-banh"
        },
        {
          id: "milk",
          label: "Sữa",
          picture: "item-sua"
        }
      ],
      places: [
        {
          id: "ball_pair",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "bear_pair",
          label: "Gấu",
          picture: "item-gau"
        },
        {
          id: "car_pair",
          label: "Xe",
          picture: "item-xe"
        },
        {
          id: "cake_pair",
          label: "Bánh",
          picture: "item-banh"
        },
        {
          id: "milk_pair",
          label: "Sữa",
          picture: "item-sua"
        }
      ],
      matches: {
        ball: "ball_pair",
        bear: "bear_pair",
        car: "car_pair",
        cake: "cake_pair",
        milk: "milk_pair"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_pairs",
    title: "Ghép đôi đồ chơi",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Ghép hình cùng đồ vật theo lời mời",
    preparation:
      "Mời con kéo hình vào hình cùng đồ vật. Thả đúng hình sẽ ở lại; thả sai hình về chỗ cũ.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "pairs",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "pair",
      instruction:
        "Mời con kéo hình vào hình cùng đồ vật. Thả đúng hình sẽ ở lại; thả sai hình về chỗ cũ.",
      pieces: [
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "bear",
          label: "Gấu",
          picture: "item-gau"
        }
      ],
      places: [
        {
          id: "ball_pair",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "bear_pair",
          label: "Gấu",
          picture: "item-gau"
        }
      ],
      matches: {
        ball: "ball_pair",
        bear: "bear_pair"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_baskets",
    title: "Cất đồ vào giỏ",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Phân biệt đồ ăn và đồ chơi theo lời mời",
    preparation: "Cùng nói tên đồ vật rồi cất đồ ăn vào giỏ ăn, đồ chơi vào hộp chơi.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "baskets",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "sort",
      instruction: "Cùng nói tên đồ vật rồi cất đồ ăn vào giỏ ăn, đồ chơi vào hộp chơi.",
      pieces: [
        {
          id: "milk",
          label: "Sữa",
          picture: "item-sua"
        },
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "cake",
          label: "Bánh",
          picture: "item-banh"
        },
        {
          id: "bear",
          label: "Gấu",
          picture: "item-gau"
        }
      ],
      places: [
        {
          id: "food",
          label: "Đồ ăn",
          picture: "item-banh"
        },
        {
          id: "toys",
          label: "Đồ chơi",
          picture: "icon:box"
        }
      ],
      matches: {
        milk: "food",
        cake: "food",
        ball: "toys",
        bear: "toys"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_feed",
    title: "Cho các bạn nhỏ ăn",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Tìm món ăn phù hợp trong câu chuyện",
    preparation:
      "Trong tranh, mèo chờ cá và chim chờ hạt. Mời con đưa món ăn cho từng bạn rồi cùng nói về hình.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "feed",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "pair",
      instruction:
        "Trong tranh, mèo chờ cá và chim chờ hạt. Mời con đưa món ăn cho từng bạn rồi cùng nói về hình.",
      pieces: [
        {
          id: "fish",
          label: "Cá",
          picture: "item-ca"
        },
        {
          id: "seed",
          label: "Hạt",
          picture: "icon:seed"
        }
      ],
      places: [
        {
          id: "cat",
          label: "Mèo",
          picture: "item-meo"
        },
        {
          id: "bird",
          label: "Chim",
          picture: "item-chim"
        }
      ],
      matches: {
        fish: "cat",
        seed: "bird"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_habitat",
    title: "Đưa con vật về nhà",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Nghe và tìm nơi ở trong tranh",
    preparation: "Mời con đưa cá về nước, chim lên cây và chó về nhà. Hỏi mỗi bạn đang ở đâu.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "habitat",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "sort",
      instruction: "Mời con đưa cá về nước, chim lên cây và chó về nhà. Hỏi mỗi bạn đang ở đâu.",
      pieces: [
        {
          id: "fish",
          label: "Cá",
          picture: "item-ca"
        },
        {
          id: "bird",
          label: "Chim",
          picture: "item-chim"
        },
        {
          id: "dog",
          label: "Chó",
          picture: "item-cho"
        }
      ],
      places: [
        {
          id: "water",
          label: "Dưới nước",
          picture: "icon:water"
        },
        {
          id: "tree",
          label: "Trên cây",
          picture: "icon:tree"
        },
        {
          id: "home",
          label: "Ngôi nhà",
          picture: "icon:home"
        }
      ],
      matches: {
        fish: "water",
        bird: "tree",
        dog: "home"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_purpose",
    title: "Đồ này dùng làm gì?",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Liên hệ đồ vật và hoạt động",
    preparation:
      "Cùng ghép cốc với uống, bánh với ăn. Người lớn hỏi rồi chờ con trả lời bằng lời hoặc cử chỉ.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "purpose",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "pair",
      instruction:
        "Cùng ghép cốc với uống, bánh với ăn. Người lớn hỏi rồi chờ con trả lời bằng lời hoặc cử chỉ.",
      pieces: [
        {
          id: "cup",
          label: "Cốc",
          picture: "item-ly"
        },
        {
          id: "cake",
          label: "Bánh",
          picture: "item-banh"
        }
      ],
      places: [
        {
          id: "drink",
          label: "Uống",
          picture: "item-uong"
        },
        {
          id: "eat",
          label: "Ăn",
          picture: "item-an"
        }
      ],
      matches: {
        cup: "drink",
        cake: "eat"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_sequence",
    title: "Làm trước rồi làm sau",
    goal: "command",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Lấy bóng rồi cho bóng vào hộp",
    preparation:
      "Nói một lần: Lấy bóng rồi cho bóng vào hộp. Mời con xếp hai hình theo thứ tự, rồi thử với bóng và hộp thật.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "sequence",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "sequence",
      instruction:
        "Nói một lần: Lấy bóng rồi cho bóng vào hộp. Mời con xếp hai hình theo thứ tự, rồi thử với bóng và hộp thật.",
      pieces: [
        {
          id: "take",
          label: "Lấy bóng",
          picture: "item-bong"
        },
        {
          id: "put",
          label: "Cho vào hộp",
          picture: "icon:box"
        }
      ],
      places: [],
      matches: {},
      sequence: ["take", "put"],
      dialogue: []
    }
  },
  {
    id: "fixture_play_sentence",
    title: "Xếp lời Con muốn bóng",
    goal: "request",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Con muốn bóng",
    preparation:
      "Mời con kéo các mảnh lời vào ô theo thứ tự để bày tỏ điều muốn. Ghép hình không thay lời nói; chờ con nói hoặc ra hiệu rồi đưa bóng thật.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "sentence",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "sentence",
      instruction:
        "Mời con kéo các mảnh lời vào ô theo thứ tự để bày tỏ điều muốn. Ghép hình không thay lời nói; chờ con nói hoặc ra hiệu rồi đưa bóng thật.",
      pieces: [
        {
          id: "say_child",
          label: "Con",
          picture: "icon:child"
        },
        {
          id: "want",
          label: "muốn",
          picture: "icon:heart"
        },
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        }
      ],
      places: [],
      matches: {},
      sequence: ["say_child", "want", "ball"],
      dialogue: []
    }
  },
  {
    id: "fixture_play_find",
    title: "Mở ô tìm đồ chơi",
    goal: "request",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Yêu cầu món đồ mình tìm thấy",
    preparation:
      "Con mở ô bất kỳ tìm đồ chơi mình thích. Chờ lời hoặc cử chỉ yêu cầu rồi cùng chơi món tương ứng.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "find",
    scenario: "request",
    presentation: {
      schemaVersion: 1,
      kind: "hunt",
      instruction:
        "Con mở ô bất kỳ tìm đồ chơi mình thích. Chờ lời hoặc cử chỉ yêu cầu rồi cùng chơi món tương ứng.",
      pieces: [
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        },
        {
          id: "bear",
          label: "Gấu",
          picture: "item-gau"
        },
        {
          id: "car",
          label: "Xe",
          picture: "item-xe"
        }
      ],
      places: [],
      matches: {},
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_greeting",
    title: "Gõ cửa chào ba",
    goal: "social",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Chào ba bằng lời hoặc cử chỉ",
    preparation: "Đóng vai ghé thăm ba. Gõ cửa rồi chờ con chào người thật bên cạnh.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "greeting",
    scenario: "greeting",
    presentation: {
      schemaVersion: 1,
      kind: "scene",
      instruction: "Đóng vai ghé thăm ba. Gõ cửa rồi chờ con chào người thật bên cạnh.",
      pieces: [
        {
          id: "dad",
          label: "Ba",
          picture: "item-ba"
        },
        {
          id: "door",
          label: "Cửa",
          picture: "icon:door"
        }
      ],
      places: [],
      matches: {},
      sequence: [],
      dialogue: [
        {
          line: "Cốc cốc! Ba ra mở cửa.",
          choices: [
            {
              label: "Gõ cửa",
              reply: "Ba mở cửa rồi. Con muốn chào ba thế nào?"
            }
          ]
        },
        {
          line: "Ba đang chờ lời chào của con.",
          choices: [
            {
              label: "Vẫy tay chào",
              reply: "Ba chào con! Cùng chào người thật bên cạnh nhé."
            }
          ]
        }
      ]
    }
  },
  {
    id: "fixture_play_call",
    title: "Gọi mẹ giúp con",
    goal: "social",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Mẹ ơi, giúp con",
    preparation:
      "Đóng vai chiếc hộp khó mở. Mẹ ở cạnh chờ con gọi hoặc ra hiệu xin giúp; không giữ nhu cầu thiết yếu.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "call",
    scenario: "call",
    presentation: {
      schemaVersion: 1,
      kind: "scene",
      instruction:
        "Đóng vai chiếc hộp khó mở. Mẹ ở cạnh chờ con gọi hoặc ra hiệu xin giúp; không giữ nhu cầu thiết yếu.",
      pieces: [
        {
          id: "mom",
          label: "Mẹ",
          picture: "item-me"
        },
        {
          id: "box",
          label: "Hộp",
          picture: "icon:box"
        }
      ],
      places: [],
      matches: {},
      sequence: [],
      dialogue: [
        {
          line: "Chiếc hộp chưa mở được. Con có thể gọi ai?",
          choices: [
            {
              label: "Gọi mẹ",
              reply: "Mẹ đây! Mẹ cùng con mở hộp nhé."
            }
          ]
        }
      ]
    }
  },
  {
    id: "fixture_play_turns",
    title: "Đến lượt ai?",
    goal: "social",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Mời và chuyển lượt với người chơi thật",
    preparation:
      "Cùng ba chuyền bóng. Mỗi người nói hoặc ra hiệu đến lượt mình, rồi chuyển bóng thật cho người kia.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "turns",
    scenario: "turn_taking",
    presentation: {
      schemaVersion: 1,
      kind: "turns",
      instruction:
        "Cùng ba chuyền bóng. Mỗi người nói hoặc ra hiệu đến lượt mình, rồi chuyển bóng thật cho người kia.",
      pieces: [
        {
          id: "child",
          label: "Con",
          picture: "icon:child"
        },
        {
          id: "dad",
          label: "Ba",
          picture: "item-ba"
        }
      ],
      places: [],
      matches: {},
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_ownership",
    title: "Đồ của ai trong tranh?",
    goal: "social",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Cốc của ba, xe của mẹ",
    preparation:
      "Trong câu chuyện này, cốc của ba và xe của mẹ. Đưa đồ cho từng người rồi nói của ai; không áp đặt sở hữu ngoài đời.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "ownership",
    scenario: "possession",
    presentation: {
      schemaVersion: 1,
      kind: "pair",
      instruction:
        "Trong câu chuyện này, cốc của ba và xe của mẹ. Đưa đồ cho từng người rồi nói của ai; không áp đặt sở hữu ngoài đời.",
      pieces: [
        {
          id: "cup",
          label: "Cốc",
          picture: "item-ly"
        },
        {
          id: "car",
          label: "Xe",
          picture: "item-xe"
        }
      ],
      places: [
        {
          id: "dad",
          label: "Ba",
          picture: "item-ba"
        },
        {
          id: "mom",
          label: "Mẹ",
          picture: "item-me"
        }
      ],
      matches: {
        cup: "dad",
        car: "mom"
      },
      sequence: [],
      dialogue: []
    }
  },
  {
    id: "fixture_play_invite",
    title: "Rủ gấu chơi bóng",
    goal: "social",
    itemId: "item-bong",
    object: "hình và đồ vật quen thuộc",
    response: "Bạn ơi, chơi bóng cùng mình",
    preparation: "Người lớn đóng vai bạn gấu, chờ lời mời hoặc cử chỉ trước khi cùng chơi bóng.",
    context: "Thử lại cơ hội giao tiếp với người thân và đồ thật khi phù hợp.",
    search: "invite",
    scenario: "invite",
    presentation: {
      schemaVersion: 1,
      kind: "scene",
      instruction: "Người lớn đóng vai bạn gấu, chờ lời mời hoặc cử chỉ trước khi cùng chơi bóng.",
      pieces: [
        {
          id: "bear",
          label: "Gấu",
          picture: "item-gau"
        },
        {
          id: "ball",
          label: "Bóng",
          picture: "item-bong"
        }
      ],
      places: [],
      matches: {},
      sequence: [],
      dialogue: [
        {
          line: "Bạn gấu đang ngồi một mình.",
          choices: [
            {
              label: "Mời bạn chơi bóng",
              reply: "Mình cùng chơi nhé! Con thử mời người thật bên cạnh nào."
            }
          ]
        }
      ]
    }
  }
];
