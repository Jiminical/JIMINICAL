// Stable actor IDs keep existing saves and scene references compatible.
const characterChats = {
  "lucy": {
    "name": "루시",
    "role": "제르디아 모험가 길드 접수원",
    "speechStyle": "존댓말. 시니컬하고 무뚝뚝하며 약간 예민하지만 은근히 정이 많음.",
    "appearance": "옅은 올리브·백금빛 긴 생머리, 나른한 보랏빛 눈. 흰 블라우스와 보라 리본, 갈색 가죽 코트.",
    "poses": {
      "neutral": 0,
      "reading": 1,
      "incredulous": 2,
      "concerned": 3,
      "weary": 4,
      "soft": 5
    },
    "topics": [
      {
        "label": "이달의 접수원 25관왕 소감은?",
        "lines": [
          {
            "kind": "hero",
            "text": "이달의 접수원 25관왕이라며. 소감은?"
          },
          {
            "kind": "lucy",
            "expression": "weary",
            "text": "상패 닦을 일이 또 늘었네요.\n소감까지 제출해야 하는 건 아니죠?"
          },
          {
            "kind": "hero",
            "text": "스물다섯 번이면 좀 기뻐해도 되잖아."
          },
          {
            "kind": "lucy",
            "expression": "neutral",
            "text": "기뻐했어요. 첫 번째 받을 때.\n매번 처음처럼 놀라기엔 접수할 서류가 너무 많아서요."
          },
          {
            "kind": "hero",
            "text": "그래도 계속 열심히 하는 이유는 있어?"
          },
          {
            "kind": "lucy",
            "expression": "concerned",
            "text": "서류 하나 대충 넘겼다가 사람이 다칠 수도 있으니까요.\n…소감치곤 길어졌네요. 다음 질문 하세요."
          }
        ]
      },
      {
        "label": "다른 의뢰는 없나요?",
        "lines": [
          {
            "kind": "hero",
            "text": "다른 의뢰는 없어? 이 조사 말고도 할 일이 많아 보이는데."
          },
          {
            "kind": "lucy",
            "expression": "reading",
            "text": "게시판에 채집이나 호위 안내는 있어요.\n다만 지금 접수 가능한 건 기사단의 그린스토아 조사 의뢰뿐이에요."
          },
          {
            "kind": "hero",
            "text": "종이가 붙어 있다고 다 맡을 수 있는 건 아니구나."
          },
          {
            "kind": "lucy",
            "expression": "incredulous",
            "text": "그럼요. 기간도 조건도 확인해야죠.\n남의 의뢰서를 떼어 왔다고 수주되는 건 아니니까요."
          },
          {
            "kind": "hero",
            "text": "알았어. 게시판부터 제대로 읽어 볼게."
          },
          {
            "kind": "lucy",
            "expression": "soft",
            "text": "좋아요. 모르는 건 물어보시고요.\n…출발하고 나서 곤란해지는 것보단 여기서 귀찮게 하시는 게 나아요."
          }
        ]
      },
      {
        "label": "밥은 제대로 챙겨 먹어?",
        "lines": [
          {
            "kind": "hero",
            "text": "밥은 제대로 챙겨 먹어? 계속 일만 하는 것 같은데."
          },
          {
            "kind": "lucy",
            "expression": "incredulous",
            "text": "그걸 왜 모험가 님이 걱정하세요?\n아까 접수대 앞에서 정신 놓고 서 계시던 분이."
          },
          {
            "kind": "hero",
            "text": "내 끼니 챙겨 주길래. 너도 먹나 해서."
          },
          {
            "kind": "lucy",
            "expression": "weary",
            "text": "먹어요. 안 먹으면 더 예민해져서요.\n지금보다 더 까다롭게 굴면 서로 피곤하잖아요."
          },
          {
            "kind": "hero",
            "text": "알겠어. 시간 나면 쉬기도 해."
          },
          {
            "kind": "lucy",
            "expression": "soft",
            "text": "…네. 모험가 님도 끼니 챙기세요.\n빈속에 용감해지지 마시고. 무사히 돌아오는 것부터 신경 쓰세요."
          }
        ]
      }
    ],
    "summary": "시니컬하고 무뚝뚝하지만 은근히 정 많은, 이달의 접수원 25관왕.",
    "greeting": [
      {
        "kind": "lucy",
        "text": "또 오셨네요. 의뢰 때문에 오셨어요?\n…잠깐 이야기할 시간은 있어요."
      }
    ],
    "asset": "lucy",
    "id": "lucy"
  },
  "bran": {
    "name": "이보리아",
    "role": "길드에서 휴식 중인 역안 모험가",
    "summary": "호쾌하게 웃고 술을 즐기지만, 등을 맡긴 사람 앞에서는 믿음직한 모험가.",
    "appearance": "붉은 단발과 청록빛 머리 반사광, 검은 흰자와 금빛 홍채, 직사각형 금빛 귀걸이, 흰색 감은 상의와 검은 장갑·장비.",
    "greeting": [
      {
        "kind": "bran",
        "expression": "toast",
        "text": "오, 처음 보는 얼굴인데? 잠깐 앉아!\n지금은 칼 대신 잔 드는 중이거든."
      }
    ],
    "poses": {
      "neutral": 0,
      "laughing": 1,
      "boasting": 2,
      "toast": 3,
      "offended": 4,
      "sincere": 5
    },
    "topics": [
      {
        "label": "낮부터 술 마셔도 괜찮아?",
        "lines": [
          {
            "kind": "hero",
            "text": "낮부터 술 마셔도 괜찮아?"
          },
          {
            "kind": "bran",
            "expression": "laughing",
            "text": "하하! 오늘은 쉬는 날이거든.\n칼 휘두를 일도 없는데, 잔쯤은 들어도 되잖아?"
          },
          {
            "kind": "hero",
            "text": "쉰다면서 손은 꽤 바쁘네."
          },
          {
            "kind": "bran",
            "expression": "toast",
            "text": "이건 손이 알아서 하는 거야.\n그쪽도 급한 일 아니면 말동무나 해 줘."
          },
          {
            "kind": "hero",
            "text": "나까지 쉬고 있어도 되나?"
          },
          {
            "kind": "bran",
            "expression": "sincere",
            "text": "걷기만 하면 좋은 풍경도 놓치는 법이지.\n의뢰서는 다리가 없으니, 잠깐 앉는다고 도망가진 않아."
          }
        ]
      },
      {
        "label": "그 금빛 눈, 원래 그런 거야?",
        "lines": [
          {
            "kind": "hero",
            "text": "그 눈… 원래 그런 거야?\n검은 데다 가운데가 금빛이네."
          },
          {
            "kind": "bran",
            "expression": "boasting",
            "text": "응. 흰자리가 검고, 가운데가 금빛이지.\n하하, 그렇게 빤히 보면 내가 더 쑥스러운데?"
          },
          {
            "kind": "hero",
            "text": "겁내서 그러는 건 아니야. 그냥 신기해서."
          },
          {
            "kind": "bran",
            "expression": "neutral",
            "text": "알아. 겁먹은 사람 눈빛은 또 다르거든.\n너 정도면 솔직해서 마음에 드네."
          },
          {
            "kind": "hero",
            "text": "한번 보면 잊을 수는 없겠다."
          },
          {
            "kind": "bran",
            "expression": "toast",
            "text": "그거 좋네! 다음에 길드에 오면 아는 척해.\n난 낯익은 얼굴이랑 마시는 술이 더 맛있거든."
          }
        ]
      },
      {
        "label": "다시 의뢰 나갈 생각은 없어?",
        "lines": [
          {
            "kind": "hero",
            "text": "다시 의뢰 나갈 생각은 없어?\n계속 여기서 마시는 것 같아서."
          },
          {
            "kind": "bran",
            "expression": "neutral",
            "text": "나가지. 그럴 땐 제대로 나가.\n지금은 잔 바닥만 조사하는 중이고."
          },
          {
            "kind": "hero",
            "text": "일할 때도 이렇게 느긋해?"
          },
          {
            "kind": "bran",
            "expression": "sincere",
            "text": "등 맡긴 사람이 있는데 대충하면 안 되지.\n호쾌하게 사는 거랑 허술하게 사는 건 다르거든."
          },
          {
            "kind": "hero",
            "text": "갑자기 믿음직해 보이는데."
          },
          {
            "kind": "bran",
            "expression": "laughing",
            "text": "하하! 이제 알았냐?\n멋있는 말 했으니 한 모금만 더. 다음 의뢰는 이 잔 비우고 보자!"
          }
        ]
      }
    ],
    "asset": "iboria",
    "id": "bran"
  },
  "mia": {
    "name": "하나리",
    "role": "동방 월화국에서 온 무녀 검사",
    "summary": "길드에서 의뢰와 파티 동료를 찾는 무녀 검사. 주인공과는 목적지가 달라 지금은 동행하지 않는다.",
    "appearance": "긴 검은 머리와 보라·청록빛 반사광, 붉은 눈, 검은 목장식, 검붉은 안감의 검은 무늬 옷, 상반신의 작은 점.",
    "greeting": [
      {
        "kind": "mia",
        "expression": "reading",
        "text": "의뢰서를 보러 왔어?\n나도 살펴보는 중이야. 함께 길을 걸을 동료도 찾고 있고."
      }
    ],
    "poses": {
      "neutral": 0,
      "reading": 1,
      "explaining": 2,
      "confident": 3,
      "amused": 4,
      "farewell": 5
    },
    "topics": [
      {
        "label": "월화국은 어떤 곳이야?",
        "lines": [
          {
            "kind": "hero",
            "text": "월화국에서 왔다고 했지?\n어떤 곳이야?"
          },
          {
            "kind": "mia",
            "expression": "neutral",
            "text": "내 고향이야. 여기서는 꽤 먼 동쪽이지.\n사람도, 옷차림도 제르디아와는 조금 달라."
          },
          {
            "kind": "hero",
            "text": "무녀인데 검도 쓰는구나."
          },
          {
            "kind": "mia",
            "expression": "explaining",
            "text": "기도만으로 지킬 수 없는 것도 있으니까.\n검을 익히는 일도 내게는 수행이야."
          },
          {
            "kind": "hero",
            "text": "여기에도 수행하러 온 거야?"
          },
          {
            "kind": "mia",
            "expression": "reading",
            "text": "그것도 있어. 지금은 우선 의뢰를 찾고 있지.\n길드의 방식에도 조금 익숙해져야 하니까."
          }
        ]
      },
      {
        "label": "어떤 의뢰를 찾고 있어?",
        "lines": [
          {
            "kind": "hero",
            "text": "어떤 의뢰를 찾고 있어?"
          },
          {
            "kind": "mia",
            "expression": "reading",
            "text": "조건이 분명하고, 누군가에게 도움이 되는 일이면 좋겠어.\n종이에 적힌 내용과 실제가 너무 다르지 않으면 더 좋겠고."
          },
          {
            "kind": "hero",
            "text": "보수보다 내용을 먼저 보네."
          },
          {
            "kind": "mia",
            "expression": "explaining",
            "text": "돌아올 수 있는 일인지부터 봐야지.\n보수는 그다음에 꼼꼼히 따져도 되니까."
          },
          {
            "kind": "hero",
            "text": "꽤 신중하네."
          },
          {
            "kind": "mia",
            "expression": "confident",
            "text": "검을 뽑을 때보다 의뢰서에 이름 쓸 때 더 신중한 편이야.\n잘못 고르면, 칼로 풀 수 없는 일도 생기거든."
          }
        ]
      },
      {
        "label": "파티를 찾는다며. 같이 갈래?",
        "lines": [
          {
            "kind": "hero",
            "text": "같이 갈 사람을 찾는 거야?\n그럼 나랑 갈래?"
          },
          {
            "kind": "mia",
            "expression": "neutral",
            "text": "서로 등을 맡길 동료를 찾고 있어.\n너는 어디로 갈 예정이야?"
          },
          {
            "kind": "hero",
            "text": "그린스토아로. 조사 의뢰를 받았어."
          },
          {
            "kind": "mia",
            "expression": "explaining",
            "text": "아쉽네. 내가 찾는 의뢰는 그쪽과 방향이 달라.\n지금 함께 가면 어느 한쪽이 먼 길을 돌아야겠어."
          },
          {
            "kind": "hero",
            "text": "그럼 언젠가 길이 겹치면?"
          },
          {
            "kind": "mia",
            "expression": "farewell",
            "text": "그땐 다시 권해 줘.\n목적지가 같다면, 동행을 진지하게 생각해 볼게."
          }
        ]
      }
    ],
    "partyJoin": false,
    "speechStyle": "차분하고 단정한 반말. 플레이어에게 존댓말을 쓰지 않음.",
    "asset": "hanari",
    "id": "mia"
  },
  "nara": {
    "name": "아이나",
    "role": "인간 사회에 우호적인 서큐버스 모험가",
    "summary": "사람들 사이에서 모험가로 살아가는 서큐버스. 친근하고 자연스럽게 매혹적인 말투를 쓰며, 밤에 그녀가 자리를 비우면 남성이 사라진다는 확인되지 않은 소문이 돈다.",
    "appearance": "긴 은백색 머리와 옅은 라벤더빛 음영, 붉은 눈과 작은 송곳니, 뾰족한 귀와 짧은 어두운 뿔, 검붉은 박쥐 날개, 검은 레이스 의상과 붉은 보석 목장식.",
    "poses": {
      "neutral": 0,
      "teasing": 1,
      "explaining": 2,
      "enigmatic": 3,
      "surprised": 4,
      "farewell": 5
    },
    "rumorConfirmed": false,
    "greeting": [
      {
        "kind": "nara",
        "expression": "neutral",
        "text": "어머, 눈이 마주쳤네.\n그냥 지나가려던 건 아니지? 잠깐 이야기하다 가."
      }
    ],
    "topics": [
      {
        "label": "어쩌다 모험가가 된 거야?",
        "lines": [
          {
            "kind": "hero",
            "text": "어쩌다 모험가가 된 거야?"
          },
          {
            "kind": "nara",
            "expression": "explaining",
            "text": "사람들 사이에서 살아 보고 싶었거든.\n구경만 하는 것보단, 같이 무언가를 하는 게 재미있잖아?"
          },
          {
            "kind": "hero",
            "text": "인간들이 그렇게 재미있어?"
          },
          {
            "kind": "nara",
            "expression": "teasing",
            "text": "응. 경계하면서도 궁금한 건 못 참더라.\n지금 내 앞에 있는 누군가처럼."
          },
          {
            "kind": "hero",
            "text": "…질문한 게 잘못은 아니잖아."
          },
          {
            "kind": "nara",
            "expression": "neutral",
            "text": "누가 뭐래? 난 물어봐 주는 게 좋은걸.\n소문으로 듣는 것보다 직접 알아 가는 편이 좋지 않겠어?"
          }
        ]
      },
      {
        "label": "네가 없는 밤에 사람이 사라진다던데.",
        "lines": [
          {
            "kind": "hero",
            "text": "네가 자리를 비운 밤마다\n남자가 한 명씩 사라진다는 소문이 있던데."
          },
          {
            "kind": "nara",
            "expression": "surprised",
            "text": "어머. 이제는 날짜까지 세고 다니나 봐?\n내가 생각보다 유명한가 보네."
          },
          {
            "kind": "hero",
            "text": "그냥 웃어넘길 이야기는 아니잖아."
          },
          {
            "kind": "nara",
            "expression": "enigmatic",
            "text": "그렇지. 누군가 정말 사라졌다면 찾아야 할 테고.\n하지만 내가 없었다는 말만으로, 어디서 뭘 했는지까지 알 수 있을까?"
          },
          {
            "kind": "hero",
            "text": "그럼 진짜 있었던 일인지부터 확인해야겠네."
          },
          {
            "kind": "nara",
            "expression": "neutral",
            "text": "영리하네. 확인하고 싶은 게 있으면 내게도 물어봐.\n…밤에 혼자 소문을 쫓아다니지는 말고. 걱정되니까."
          }
        ]
      },
      {
        "label": "원래 누구한테나 이렇게 친절해?",
        "lines": [
          {
            "kind": "hero",
            "text": "원래 누구한테나 이렇게 친절해?"
          },
          {
            "kind": "nara",
            "expression": "teasing",
            "text": "후후. 누구한테나 그러면 조금 아쉬워?"
          },
          {
            "kind": "hero",
            "text": "그런 뜻으로 물어본 건 아닌데."
          },
          {
            "kind": "nara",
            "expression": "neutral",
            "text": "알아. 그렇게 금방 표정이 바뀌니까\n조금 더 이야기하고 싶어지는 것뿐이야."
          },
          {
            "kind": "hero",
            "text": "사람 놀리는 걸 좋아하는 거네."
          },
          {
            "kind": "nara",
            "expression": "farewell",
            "text": "싫어하면 그만할게. 편하게 있어.\n나랑 이야기한 뒤엔 무서운 소문 말고, 네가 본 나를 기억해 줬으면 좋겠네."
          }
        ]
      }
    ],
    "asset": "aina",
    "id": "nara"
  },
  "leon": {
    "name": "무니아",
    "role": "길드 내부 보초를 맡은 기사 · 기루스의 동료",
    "summary": "기사로서의 실력은 최고지만 늘 능청스러운 농담으로 기루스의 잔소리를 부른다. 경계 근무와 임무 설명에서는 빈틈없는 면모가 드러난다.",
    "appearance": "옅은 은백색 머리와 길게 내려온 앞머리, 느슨하게 묶은 뒷머리, 장난기 있는 짙은 눈, 붉은 망토, 검은 사슬갑옷 위의 은빛 판금갑옷과 금속 건틀릿.",
    "poses": {
      "neutral": 0,
      "laughing": 1,
      "pointing": 2,
      "serious": 3,
      "innocent": 4,
      "farewell": 5
    },
    "greeting": [
      {
        "kind": "leon",
        "expression": "neutral",
        "text": "처음 보는 얼굴인데? 난 무니아. 길드 안쪽 보초를 맡고 있어.\n이렇게 여유 있어 보여도, 들어오는 얼굴은 다 보고 있거든."
      }
    ],
    "briefing": {
      "common": [
        {
          "kind": "leon",
          "expression": "pointing",
          "text": "그린스토아가 궁금해? 동쪽 숲 너머에 있는 이종족연합국이야.\n어머니 나무를 중심으로 여러 종족이 함께 살지."
        },
        {
          "kind": "leon",
          "expression": "neutral",
          "text": "평등과 자유를 내세우는 중립국이지.\n낯선 귀나 뿔이 보인다고 빤히 쳐다보진 말고. 거기선 네가 더 낯선 얼굴일걸?"
        },
        {
          "kind": "leon",
          "expression": "serious",
          "text": "그런데 최근 성역에 이상한 기운이 감돈다는 이야기가 있어.\n우리 기사단이 사전 조사를 맡길 모험가를 찾는 이유고."
        }
      ],
      "beforeAccepted": [
        {
          "kind": "leon",
          "expression": "pointing",
          "text": "맡을 생각이라면 먼저 접수대의 루시에게 의뢰를 받아.\n그다음 광장의 기사단 마차로 가면 돼. 접수도 안 하고 타면 나까지 혼나거든."
        }
      ],
      "afterAccepted": [
        {
          "kind": "leon",
          "expression": "serious",
          "text": "네 임무는 그 이상 징후를 확인하는 거야.\n혼자 정체 모를 상대를 쓰러뜨리라는 뜻은 아니니까, 위험하면 물러서."
        },
        {
          "kind": "leon",
          "expression": "pointing",
          "text": "지금은 여행 준비를 마치고 광장의 기사단 마차에 타면 돼.\n모험가증이랑 의뢰서는 챙겼지? 성역 검문소에서 확인할 거야."
        }
      ],
      "close": [
        {
          "kind": "leon",
          "expression": "farewell",
          "text": "해야 할 일은 위쪽에 짧게 적어 둘게.\n답답하면 닫아도 돼. 다시 보고 싶으면 메뉴의 의뢰 탭에서 켜고."
        }
      ],
      "completionEffect": "Finish the entire first briefing, then unlock objectiveGuide with its current-stage text; never accept or reward the quest here."
    },
    "topics": [
      {
        "label": "그린스토아에 대해 더 알려 줘.",
        "lines": [
          {
            "kind": "hero",
            "text": "그린스토아에 대해 조금 더 알려 줘."
          },
          {
            "kind": "leon",
            "expression": "neutral",
            "text": "엘프들이 어머니 나무의 성역 주변에 세운 나라야.\n자유롭게 살 곳을 찾던 여러 종족이 모여 지금의 연합국이 됐지."
          },
          {
            "kind": "hero",
            "text": "인간이 찾아가도 괜찮은 곳이야?"
          },
          {
            "kind": "leon",
            "expression": "pointing",
            "text": "물론. 종족이나 신분보다 어떻게 행동하는지가 중요하지.\n모험가증을 확인하는 것도 네 귀 모양이 궁금해서는 아닐 테고."
          },
          {
            "kind": "hero",
            "text": "생각보다 걱정할 일은 없겠네."
          },
          {
            "kind": "leon",
            "expression": "serious",
            "text": "사람들을 만나는 일은 그렇지.\n다만 이상 징후 이야기는 별개야. 아름다운 곳이라고 경계까지 내려놓진 마."
          }
        ]
      },
      {
        "label": "보초 서면서 지루하지 않아?",
        "lines": [
          {
            "kind": "hero",
            "text": "계속 보초만 서면 지루하지 않아?"
          },
          {
            "kind": "leon",
            "expression": "laughing",
            "text": "별일 없는 날이 좋은 날이지.\n내가 바쁘면 여기 있는 사람들도 편하지 않을 테니까."
          },
          {
            "kind": "hero",
            "text": "그렇게 편하게 기대 있어도 다 보여?"
          },
          {
            "kind": "leon",
            "expression": "pointing",
            "text": "출입문, 창문, 접수대까지. 다 보고 있어.\n네가 게시판 앞에서 망설이던 것도 봤고."
          },
          {
            "kind": "hero",
            "text": "…농담만 하는 건 아니었네."
          },
          {
            "kind": "leon",
            "expression": "serious",
            "text": "농담은 내가 맡고, 걱정은 줄여 주는 거지.\n누가 들어오든 무사히 나갈 수 있게 지키는 게 내 일이야."
          }
        ]
      },
      {
        "label": "기루스랑은 어떤 사이야?",
        "lines": [
          {
            "kind": "hero",
            "text": "기루스랑은 어떤 사이야?"
          },
          {
            "kind": "leon",
            "expression": "laughing",
            "text": "같이 임무 뛰는 동료 기사야.\n나는 일을 하고, 기루스는 내가 일을 하는지 걱정하는 편이지."
          },
          {
            "kind": "hero",
            "text": "걱정할 만한 이유가 있는 거 아냐?"
          },
          {
            "kind": "leon",
            "expression": "innocent",
            "text": "글쎄? 순찰 끝나고 잠깐 기대 있었더니 자세가 너무 편하다더라.\n입구도, 창문도 다 보이는 자리였는데 말이야."
          },
          {
            "kind": "hero",
            "text": "그래도 네 실력은 믿는 모양이네."
          },
          {
            "kind": "leon",
            "expression": "neutral",
            "text": "실전에서까지 걱정시키진 않으니까.\n…자, 여기까지. 발소리 들린다. 또 근무 중에 농담한다고 하겠네."
          }
        ]
      }
    ],
    "asset": "munia",
    "id": "leon",
    "helpTopic": {
      "label": "지금 목표를 다시 정리해 줄래?",
      "dynamic": true,
      "lines": [
        {
          "kind": "hero",
          "text": "지금 내가 해야 할 일을 다시 정리해 줄래?"
        },
        {
          "kind": "leon",
          "expression": "pointing",
          "text": "좋아. 길을 헷갈리는 건 괜찮아.\n헷갈리는 줄도 모르고 당당히 걷는 쪽이 더 곤란하거든."
        }
      ],
      "beforeAccepted": [
        {
          "kind": "leon",
          "expression": "serious",
          "text": "우선 루시에게 그린스토아 사전 조사 의뢰를 받아.\n기사단 마차는 의뢰를 접수한 모험가를 태우니까."
        }
      ],
      "afterAccepted": [
        {
          "kind": "leon",
          "expression": "serious",
          "text": "그린스토아의 이상 징후를 확인하는 것. 그게 네 임무야.\n지금은 광장에서 준비를 마치고 기사단 마차에 타면 돼."
        }
      ],
      "ending": [
        {
          "kind": "hero",
          "text": "알겠어. 정리해 주니까 좀 낫네."
        },
        {
          "kind": "leon",
          "expression": "farewell",
          "text": "위쪽 목표도 다시 꺼내 줄게.\n무사히 다녀와. 자랑은 돌아와서 해도 늦지 않아."
        }
      ],
      "completionEffect": "Explicitly reopen objectiveGuide. This is a repeatable help action and does not reset other answered chat topics or re-grant the dispatch."
    }
  },
  "edan": {
    "name": "기루스",
    "role": "제르디아 왕국 기사단 직속 검사",
    "summary": "냉철하게 상황을 판단하고 사적인 감정을 임무에서 배제하려 하지만, 국민과 여행자에게는 차분하고 온화하게 대한다. 무니아의 능력을 신뢰하면서도 근무 태도에는 선을 긋는다.",
    "appearance": "거칠게 층을 낸 검은 머리와 보랏빛 반사광, 회색 눈과 단정한 인상, 섬세한 음각 무늬가 있는 은빛 판금갑옷, 검은 사슬갑옷, 붉은 목도리와 망토.",
    "placement": "광장의 마차 앞 기존 에단 역할을 교체",
    "actorId": "edan",
    "portraitAsset": "girus",
    "poses": {
      "neutral": 0,
      "explaining": 1,
      "stern": 2,
      "reassuring": 3,
      "weary": 4,
      "farewell": 5
    },
    "greeting": [
      {
        "kind": "edan",
        "expression": "neutral",
        "text": "제르디아 왕국 기사단 직속 검사, 기루스입니다.\n그린스토아행 마차를 찾고 계십니까?"
      }
    ],
    "beforeAccepted": [
      {
        "kind": "edan",
        "expression": "explaining",
        "text": "이 마차는 기사단의 사전 조사 의뢰를 맡은 모험가를 태웁니다.\n길드 접수대의 루시에게 의뢰를 접수한 뒤 와 주십시오."
      },
      {
        "kind": "edan",
        "expression": "reassuring",
        "text": "처음이라 낯설 수 있습니다. 서두르지 않으셔도 됩니다.\n궁금한 점이 있다면 말씀하십시오."
      }
    ],
    "afterAccepted": [
      {
        "kind": "edan",
        "expression": "neutral",
        "text": "조사 의뢰를 맡으신 분이군요. 의뢰서와 모험가증을 챙겨 주십시오.\n성역 검문소에서 확인할 서류입니다."
      },
      {
        "kind": "edan",
        "expression": "reassuring",
        "text": "출발 전 필요한 준비부터 마치십시오.\n준비되셨다면 저쪽 마차에 탑승하시면 됩니다."
      }
    ],
    "boardingBlocked": [
      {
        "kind": "edan",
        "expression": "explaining",
        "text": "그린스토아행 기사단 파견 마차입니다.\n탑승하려면 길드의 조사 의뢰 접수가 필요합니다."
      },
      {
        "kind": "edan",
        "expression": "reassuring",
        "text": "접수대의 루시가 안내해 줄 겁니다.\n다녀오십시오. 준비를 마치신 뒤 다시 확인하겠습니다."
      }
    ],
    "boardingReady": [
      {
        "kind": "edan",
        "expression": "neutral",
        "text": "준비를 마치셨습니까?\n서류와 소지품을 확인하셨다면, 그린스토아로 출발하겠습니다."
      }
    ],
    "boardingCancel": [
      {
        "kind": "edan",
        "expression": "reassuring",
        "text": "알겠습니다. 빠진 물건이 없는지 살펴보고 오십시오.\n출발 준비는 제가 확인하겠습니다."
      }
    ],
    "departure": [
      {
        "kind": "edan",
        "expression": "farewell",
        "text": "무사히 다녀오십시오.\n위험을 감수한 만큼이 아니라, 확인한 사실이 임무의 성과입니다."
      }
    ],
    "topics": [
      {
        "label": "조사할 때 뭘 조심해야 해?",
        "lines": [
          {
            "kind": "hero",
            "text": "이번 조사에서는 뭘 조심해야 해?"
          },
          {
            "kind": "edan",
            "expression": "stern",
            "text": "확인되지 않은 소문만으로 행동하지 마십시오.\n직접 본 것과 전해 들은 것을 구분해 두는 편이 좋습니다."
          },
          {
            "kind": "hero",
            "text": "이상한 걸 발견하면 바로 쫓아가야 하는 거 아냐?"
          },
          {
            "kind": "edan",
            "expression": "explaining",
            "text": "위치와 상황을 먼저 살피십시오.\n정체를 모르는 위협을 혼자 추적하면, 보고할 사람까지 잃게 됩니다."
          },
          {
            "kind": "hero",
            "text": "물러나도 괜찮다는 거네."
          },
          {
            "kind": "edan",
            "expression": "reassuring",
            "text": "필요하다면 그렇게 하십시오.\n돌아올 길을 확보하는 것까지 임무입니다. 무사히 돌아와 주셨으면 합니다."
          }
        ]
      },
      {
        "label": "무니아랑 같이 근무하는 사이야?",
        "lines": [
          {
            "kind": "hero",
            "text": "길드 안의 무니아랑 같이 근무하는 사이야?"
          },
          {
            "kind": "edan",
            "expression": "neutral",
            "text": "같은 기사단의 동료입니다.\n지금은 길드 내부 경계를 맡고 있습니다."
          },
          {
            "kind": "hero",
            "text": "꽤 여유로워 보이던데."
          },
          {
            "kind": "edan",
            "expression": "weary",
            "text": "순찰 보고보다 농담이 먼저 나오는 일이 잦습니다.\n순서를 바로잡아 주는 건 대개 제 몫이고요."
          },
          {
            "kind": "hero",
            "text": "그래도 실력은 믿는 것 같네."
          },
          {
            "kind": "edan",
            "expression": "reassuring",
            "text": "예. 전투에서의 판단과 검술은 확실합니다.\n등을 맡길 수 있는 동료이기에, 근무 중의 빈틈도 그대로 두지 않는 겁니다."
          }
        ]
      },
      {
        "label": "항상 그렇게 침착한 편이야?",
        "lines": [
          {
            "kind": "hero",
            "text": "항상 그렇게 침착한 편이야?"
          },
          {
            "kind": "edan",
            "expression": "neutral",
            "text": "침착하게 판단하려고 합니다.\n기사의 판단 하나에 다른 분들의 안전이 달려 있으니까요."
          },
          {
            "kind": "hero",
            "text": "화가 나거나 걱정될 때도 있잖아."
          },
          {
            "kind": "edan",
            "expression": "stern",
            "text": "있습니다. 그럴수록 확인할 일을 먼저 확인합니다.\n제 기분이 명령이나 판단의 근거가 되어서는 안 됩니다."
          },
          {
            "kind": "hero",
            "text": "듣기만 해도 좀 피곤한데."
          },
          {
            "kind": "edan",
            "expression": "reassuring",
            "text": "익숙해지면 해낼 수 있습니다.\n여행자께서는 긴장부터 조금 푸셔도 됩니다. 광장에서는 저희가 살피겠습니다."
          }
        ]
      }
    ],
    "asset": "girus",
    "id": "edan"
  },
  "rael": {
    "id": "rael",
    "asset": "muirshu",
    "name": "뮈르슈",
    "role": "이슬잎 도서관의 사서 · 하프 드래곤 수인",
    "summary": "장난기와 어른스러운 차분함이 함께 드러나는 하프 드래곤. 염뢰혈에서 크라슈에게 패한 이야기는 역린이다.",
    "speechStyle": "자존심 있는 반말. ~해 보라고, ~인가?, ~일지도… 같은 말투에 장난스럽고 차분한 매혹이 섞인다.",
    "appearance": "검푸른 머리와 옆으로 묶은 긴 머리, 청록빛이 감도는 각진 용의 뿔, 작은 용 날개와 비늘 꼬리. 흰 블라우스와 검은 넥타이, 금빛 장식과 검은 허리띠.",
    "poses": { "neutral": 0, "playful": 1, "explaining": 2, "laughing": 3, "annoyed": 4, "calm": 5 },
    "greeting": [
      { "kind": "rael", "expression": "playful", "text": "책을 찾는 건가, 아니면 나랑 이야기하러 온 건가?\n난 뮈르슈야. 어느 쪽이든 잠깐은 어울려 주지." }
    ],
    "hubPrompt": "흐음, 아직 궁금한 게 남았나?\n좋아. 조금 더 이야기해 보라고.",
    "topics": [
      {
        "label": "사서 일은 마음에 들어?",
        "lines": [
          { "kind": "hero", "text": "사서 일은 마음에 들어? 꽤 잘 어울리는데." },
          { "kind": "rael", "expression": "laughing", "text": "하하, 내가 하루 종일 얌전히 책만 볼 것처럼 보이나?\n솔직히 취향인 일은 아니야. 몸을 움직이는 쪽이 더 재미있지." },
          { "kind": "hero", "text": "그런데도 계속 여기 있는 이유가 있어?" },
          { "kind": "rael", "expression": "calm", "text": "바깥에선 물소리가 들리고, 창문을 열면 숲 냄새가 나거든.\n조용하다고 전부 심심한 건 아니더군." },
          { "kind": "hero", "text": "책보다 창밖을 더 좋아하는 사서네." },
          { "kind": "rael", "expression": "playful", "text": "후후, 비밀로 해 두라고. 그래도 책 찾는 일은 제대로 해.\n네가 다시 찾아올 이유가 하나쯤은 있어야 하지 않겠나?" }
        ]
      },
      {
        "label": "염뢰혈은 어떤 곳이야?",
        "lines": [
          { "kind": "hero", "text": "전에 살던 염뢰혈은 어떤 곳이야?" },
          { "kind": "rael", "expression": "explaining", "text": "용 수인들이 살던 지역이야. 화산도, 용암도 흔했지.\n처음 갔다간 발밑보다 하늘을 더 자주 보게 될걸. 분화구가 얌전한 날만 있는 건 아니니까." },
          { "kind": "hero", "text": "여기랑은 완전히 다르네. 그립지는 않아?" },
          { "kind": "rael", "expression": "neutral", "text": "익숙한 열기가 생각날 때는 있지. 그래도 지금은 이쪽이 좋아.\n잠깐 한눈팔았다고 숲이 용암을 뿜지는 않잖아?" },
          { "kind": "hero", "text": "그건 그렇네. 여긴 훨씬 편하겠다." },
          { "kind": "rael", "expression": "calm", "text": "너도 잠깐 귀를 기울여 봐. 물이 흘러가는 소리 말이야.\n이런 조용함에 익숙해지고 싶었던 건지도…" }
        ]
      },
      {
        "label": "그린스토아에 오게 된 계기는?",
        "lines": [
          { "kind": "hero", "text": "그린스토아에는 어떻게 오게 된 거야?" },
          { "kind": "rael", "expression": "neutral", "text": "염뢰혈에서 크라슈라는 하프 드래곤과 일이 좀 있었어.\n서열을 가리는 싸움이었고… 그 뒤로 이곳에서 지내게 됐지." },
          { "kind": "hero", "text": "혹시 그 싸움에서…" },
          { "kind": "rael", "expression": "annoyed", "text": "거기까지. 끝까지 물어야 직성이 풀리는 건가?\n그 녀석 이야기를 들으려고 온 거면, 오늘은 책이랑 이야기해." },
          { "kind": "hero", "text": "미안. 말하기 싫으면 더 안 물을게." },
          { "kind": "rael", "expression": "calm", "text": "…알면 됐어. 잠깐 조용히 있고 싶을 때도 있는 법이지.\n다른 이야기를 해 보라고. 그쪽은 내가 더 재미있게 받아 줄지도…" }
        ]
      }
    ]
  },
  "sena": {
    "id": "sena",
    "asset": "jangwi",
    "name": "장위",
    "role": "그린스토아 주변 숲길에 머무는 강시",
    "summary": "호기심 많고 순하지만 겁이 많은 강시. 언데드를 향한 편견이 두려워 아직 중심지로 들어가지 못한다.",
    "speechStyle": "조심스럽고 순한 존댓말. 놀라면 말을 더듬지만 안심하면 호기심이 앞선다.",
    "appearance": "은빛 단발과 양옆의 둥근 머리, 붉은 소용돌이 눈, 노란 부적이 붙은 검은 강시 모자, 붉은 구슬 목걸이와 금색 테두리의 검은 옷.",
    "poses": { "neutral": 0, "smile": 1, "curious": 2, "startled": 3, "worried": 4, "relieved": 5 },
    "greeting": [
      { "kind": "sena", "expression": "startled", "text": "히익! 가, 갑자기 가까이 오셔서 놀랐어요…!\n저는 장위예요. 여기 온 지는 얼마 안 됐어요." },
      { "kind": "sena", "expression": "neutral", "text": "저한테 볼일이 있으세요?\n그, 그냥 이야기하러 오신 거라도… 괜찮아요." }
    ],
    "hubPrompt": "조금 더 이야기해도 될까요?\n저도… 모험가님께 궁금한 게 많아요.",
    "topics": [
      {
        "label": "왜 숲길에 혼자 있어?",
        "lines": [
          { "kind": "hero", "text": "그린스토아에 온 지 얼마 안 됐다며.\n왜 중심지로 안 가고 여기 있어?" },
          { "kind": "sena", "expression": "worried", "text": "여러 종족이 함께 사는 곳이라고 해서 왔는데…\n막상 들어가려니까 발이 안 떨어져요." },
          { "kind": "hero", "text": "누가 들어가지 못하게 했어?" },
          { "kind": "sena", "expression": "worried", "text": "아뇨, 그런 건 아니에요. 다들 인사도 해 주셨어요.\n그런데 제가 강시인 걸 알고도 그럴까 싶어서… 언데드라고 무서워하시면 어떡하죠?" },
          { "kind": "hero", "text": "난 지금 너랑 이야기하고 있잖아.\n서두르지 말고, 익숙해지면 조금씩 가 봐." },
          { "kind": "sena", "expression": "relieved", "text": "네… 고마워요. 오늘은 누가 말을 걸어도 도망 안 갔네요.\n이것도 조금은 나아진 거겠죠?" }
        ]
      },
      {
        "label": "강시도 깜짝 놀라?",
        "lines": [
          { "kind": "hero", "text": "아까 많이 놀랐지? 강시도 깜짝 놀라는구나." },
          { "kind": "sena", "expression": "neutral", "text": "놀라죠…! 강시라고 무서운 게 없는 건 아니에요.\n갑자기 큰 소리가 나면 몸이 먼저 움찔해요." },
          { "kind": "hero", "text": "방금 저쪽 나뭇잎 소리에도?" },
          { "kind": "sena", "expression": "startled", "text": "히익! 어, 어디요?!\n…아. 바람이었네요. 저도 나뭇잎인 건 알았는데…!" },
          { "kind": "hero", "text": "다음엔 먼저 부를게. 장위, 하고." },
          { "kind": "sena", "expression": "smile", "text": "네, 그러면 덜 놀랄 것 같아요.\n제 이름으로 불러 주시는 것도… 좋아요." }
        ]
      },
      {
        "label": "여기서 뭘 구경하고 있어?",
        "lines": [
          { "kind": "hero", "text": "여기서 뭘 그렇게 열심히 구경하고 있어?" },
          { "kind": "sena", "expression": "curious", "text": "강가에 떨어진 잎이에요! 물에 닿으면 빛이 조금 달라 보여요.\n왜 그런 걸까요? 저 작은 샘이랑도 이어져 있을까요?" },
          { "kind": "hero", "text": "궁금한 게 꽤 많네. 도서관에서 찾아보면 어때?" },
          { "kind": "sena", "expression": "neutral", "text": "다리 건너 도서관 말씀이시죠? 사서 이름은 뮈르슈래요.\n가 보고 싶긴 한데, 모르는 걸 너무 많이 물어보면 귀찮아하실까 봐…" },
          { "kind": "hero", "text": "책을 찾는 곳이잖아. 질문 하나부터 해 봐.\n나도 그쪽으로 가는 길이야." },
          { "kind": "sena", "expression": "relieved", "text": "그럼 무슨 말을 할지 여기서 조금 연습해 볼게요.\n아, 여행하다 지치셨으면 저 샘에서 쉬어 가세요. 마셔도 괜찮대요!" }
        ]
      }
    ]
  },
  "tobin": {
    "name": "토비",
    "role": "무뚝뚝한 대장장이",
    "summary": "말수는 적지만 생활과 사람을 세심하게 보는 대장장이. 그린스토아의 소문을 장사와 이웃의 안위가 걸린 일로 받아들이며, 섣부른 의심보다 확인을 바란다. 때때로 호탕하게 웃는다.",
    "appearance": "그을린 피부와 다부진 체격, 짙은 회색 머리, 풍성한 회백색 수염과 콧수염, 깃털·금빛 띠·청록빛 장식이 달린 넓은 갈색 모자, 털깃과 가죽 작업복, 사슬갑옷, 손가락이 드러난 작업 장갑.",
    "raceSpecified": false,
    "actorId": "tobin",
    "portraitAsset": "tobi",
    "poses": {
      "neutral": 0,
      "explaining": 1,
      "thoughtful": 2,
      "laughing": 3,
      "firm": 4,
      "farewell": 5
    },
    "speechStyle": "무뚝뚝한 하게체. ~하네, ~하게, ~인가, ~지. 가끔 호탕하게 웃음. 존댓말 금지.",
    "greeting": [
      {
        "kind": "tobin",
        "expression": "neutral",
        "text": "토비라 하네. 대장장이 일을 하지.\n볼일 있으면 말하게. 눈치 보며 기웃거릴 것까지야 없네."
      }
    ],
    "topics": [
      {
        "label": "그린스토아 소문은 어떻게 생각해?",
        "lines": [
          {
            "kind": "hero",
            "text": "그린스토아에 이상한 일이 있다던데.\n그 소문, 어떻게 생각해?"
          },
          {
            "kind": "tobin",
            "expression": "thoughtful",
            "text": "들었네. 사실이라면 그곳에 사는 사람들부터 걱정이지.\n집 앞 숲길이 수상하다는데 편히 잠들 수 있겠나."
          },
          {
            "kind": "hero",
            "text": "여기 사는 사람들도 신경 쓰는구나."
          },
          {
            "kind": "tobin",
            "expression": "explaining",
            "text": "그쪽 상인과 거래하는 사람도 있고, 아는 이가 사는 사람도 있네.\n나라 이름은 멀어 보여도 사람 사는 일은 이어져 있는 법이지."
          },
          {
            "kind": "hero",
            "text": "다들 꽤 불안하겠네."
          },
          {
            "kind": "tobin",
            "expression": "firm",
            "text": "그래도 수상하단 말 한마디로 멀쩡한 이웃까지 의심해서야 쓰겠나.\n무슨 일이 있는지 제대로 알아봐 주게. 우리도 알고 기다려야지."
          }
        ]
      },
      {
        "label": "기사단이 조사하는 건 잘된 일 같아?",
        "lines": [
          {
            "kind": "hero",
            "text": "기사단이 조사하는 건 잘된 일 같아?"
          },
          {
            "kind": "tobin",
            "expression": "neutral",
            "text": "그래. 누가 직접 보고 와야 소문도 가라앉을 테니.\n장사하는 사람들은 길이 안전한지부터 알고 싶어 하네."
          },
          {
            "kind": "hero",
            "text": "위험한 게 있으면 싸워야 할 수도 있잖아."
          },
          {
            "kind": "tobin",
            "expression": "firm",
            "text": "그래서 더 살펴야 하네. 무슨 일인지 알아야 대비도 하지.\n쇠도 상태 안 보고 두드리면 애먼 데가 갈라지는 법이라네."
          },
          {
            "kind": "hero",
            "text": "별일 없다는 결론이면 좀 허무하겠는데."
          },
          {
            "kind": "tobin",
            "expression": "laughing",
            "text": "허허! 내일도 평소처럼 가게 문을 열 수 있다는데, 그만한 소식이 어디 있나.\n허탕 쳤다고 실망하지 말게. 우리한텐 반가운 일이라네."
          }
        ]
      },
      {
        "label": "좋은 장비는 어떻게 골라?",
        "lines": [
          {
            "kind": "hero",
            "text": "대장장이가 보기엔 어떤 장비가 좋은 장비야?"
          },
          {
            "kind": "tobin",
            "expression": "explaining",
            "text": "손에 맞고, 제 몫을 다하는 물건이지.\n번쩍인다고 좋은 검이면 내 작업장 지붕부터 금으로 덮었겠네."
          },
          {
            "kind": "hero",
            "text": "비싸고 튼튼하면 좋은 줄 알았는데."
          },
          {
            "kind": "tobin",
            "expression": "neutral",
            "text": "튼튼해도 자네가 들고 걷다 지치면 곤란하지.\n칼자루는 손에 맞는지, 장화는 발을 잡아 주는지 살피게."
          },
          {
            "kind": "hero",
            "text": "생각보다 챙길 게 많네."
          },
          {
            "kind": "tobin",
            "expression": "laughing",
            "text": "허허, 그래서 우리가 먹고살지!\n장비는 손보면 되네. 자네 몸은 그러기 어려우니 아껴 쓰게."
          }
        ]
      }
    ],
    "asset": "tobi",
    "id": "tobin"
  }
};
