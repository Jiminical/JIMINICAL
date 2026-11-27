// Shared source for the opening and the library. Each chapter has a whole illustration.
const greenstoaLore = (() => {
  const scenes = [
    {
      asset: "chapter1",
      title: "나라 이전의 시대",
      text: "먼 옛날, 아직 나라와 국경조차 없던 시대.\n제루스 대륙은 끝없는 혼돈에 휩싸여 있었다.",
      art: "검은 갑옷의 군세와 보랏빛 거룡이 뒤덮은 고대 제루스 대륙.",
    },
    {
      asset: "chapter2",
      title: "어둠의 위협",
      text: "들끓는 마족과 포악한 짐승, 사악한 악령들.\n약탈과 죽음이 끊이지 않았고, 어디에도 안전한 땅은 없었다.",
      art: "거대한 보랏빛 마수와 검을 든 갑옷 기사가 마주 선 전장.",
    },
    {
      asset: "chapter3",
      title: "어머니 나무",
      text: "그러나 대륙이 제루스라 불리기 수천 년 전부터, 생명의 거목 ‘어머니 나무’는 굳건히 서 있었다.\n순수한 생명력이 깃든 그 성역만큼은 누구도 감히 침범하지 못했다.",
      art: "푸른 생명력의 문자와 빛을 뿜는 거대한 어머니 나무.",
    },
    {
      asset: "chapter4",
      title: "엘프의 탄생",
      text: "어머니 나무로부터 태어나 그 힘을 나눠 받고, 성역을 지키며 살아가는 이들.\n세상은 그 종족을 ‘엘프’라 불렀다.",
      art: "푸른 물의 마법을 펼치는 어린 엘프.",
    },
    {
      asset: "chapter5",
      title: "평등과 자유의 건국",
      text: "하지만 어머니 나무의 힘을 나눠 받은 고대 엘프들조차 대륙의 혼란을 잠재우기에는 역부족이었다.\n마침내 그들은 나라의 필요성을 깨닫고, 평등과 자유를 기치로 성역 주변에 중립 국가를 세웠다.",
      art: "붉은 깃발을 든 엘프가 어머니 나무와 성곽을 바라보는 모습.",
    },
    {
      asset: "chapter6",
      title: "새로운 시민들",
      text: "그 나라의 이름은 그린스토아.\n인간들의 차별을 피해 자유를 갈망하던 이종족들이 대륙 각지에서 모여들었다.\n그들은 평등과 보금자리에 보답하며, 시민이자 성역을 지키는 힘이 되었다.",
      art: "그린스토아의 숲과 강을 배경으로 웃는 슬라임 시민.",
    },
    {
      asset: "chapter7",
      title: "용사 제르와 동맹",
      text: "그리고 마침내 나타난 최초의 용사, 제르.\n당대 최강의 인간들과 그린스토아는 동맹을 맺고 선대 마왕을 격퇴했다.\n흩어진 대륙이 하나로 이어지고, 이 땅에는 긴 평화가 찾아왔다.",
      art: "검을 들고 먼 곳을 바라보는 갑옷 차림의 용사 제르.",
    },
    {
      asset: "chapter8",
      title: "이종족연합국 그린스토아",
      text: "오늘날 그린스토아는 제루스 대륙의 허파이자, 수려한 대자연을 품은 이종족들의 연합국.\n종족도 신분도 묻지 않는 중립 지대, 열정으로 꿈을 현실로 만들 수 있는 땅이다.",
      art: "노을빛 속 어머니 나무를 둘러싼 그린스토아의 도시.",
    },
    {
      asset: "chapter9",
      title: "성역에 스미는 그림자",
      text: "그러나 최근, 이 신성한 땅에도 불길한 기운이 감돈다는 소문이 들려온다.\n제르디아 기사단은 성역을 조사할 모험가를 찾기 시작했다.\n그리고 지금, 한 모험가가 길드의 접수대 앞에 서 있다…",
      art: "길드 접수대 위의 그린스토아 이상징후 조사 의뢰서와 금화 주머니.",
    },
  ];

  const articles = [
    {
      title: "세계와 국가들",
      tag: "제루스의 땅과 이웃들",
      hero: { asset: "worldOverview", width: 1216, height: 704, alt: "꽃밭의 모험가 너머로 펼쳐진 거대한 어머니 나무와 하얀 도시" },
      body: [
        "이번 여정의 배경은 제루스 대륙입니다. 마족과 몬스터, 그리고 모험가들이 섞여 살아가는 대지이죠. 물론 국가들 또한 존재합니다. 모험가들의 성소이자 꿈인 제르디아, 초원의 이종족 연합국 그린스토아, 만년설의 제국 아이리스, 동방의 월화국까지. 여정의 주 무대는 그린스토아입니다.",
      ],
      sections: [
        {
          title: "이종족연합국 그린스토아",
          image: { asset: "greenstoa", alt: "푸른 마력과 폭포, 흰 기둥에 둘러싸인 그린스토아 본청" },
          body: ["어머니 나무의 가호 아래, 웅장한 자연경관을 이루는 대자연 안에서 수없이 많은 종족들이 살아가는 국가입니다. 거목의 생명력을 받아 태어난 엘프들이 주를 이루고, 수인 & 몬스터 & 마족조차 일부 살아가고 있습니다. 어머니 나무의 생명력이 닿는 곳은 모두 성역으로, 적대적인 마기를 뿜어내는 존재들은 접근조차 할 수 없습니다."],
        },
        {
          title: "제르디아 왕국",
          image: { asset: "zerdia", alt: "번화한 제르디아 왕국의 광장과 분수 너머로 보이는 거대한 왕성" },
          body: ["제루스 대륙의 초강대국이자, 모험가들에겐 꿈과 같은 나라입니다. 인구수, 번영도 모두 최고 수준이며, 최대규모 모험가 길드와 그에 맞는 복지를 자랑합니다. 또, 당신의 출신이기도 합니다. 본격적인 여정에서는 그린스토아에 집중하게 될테지만, 제르디아에서 볼 수 있는 인물들이 있습니다. 여정을 마치고 돌아가거나, 정보를 얻기 위해 이곳 저곳 돌아다녀보세요."],
        },
      ],
    },
    {
      title: "어머니 나무와 엘프들",
      tag: "생명의 거목 · 엘프의 기원",
      hero: { asset: "motherTree", width: 1216, height: 640, alt: "푸른 하늘과 넓은 꽃밭 위로 솟은 어머니 나무" },
      body: [
        "대륙이 제루스라고 불리기에도 수천 년 전, 하나의 작은 새싹이 있었습니다.",
        "어머니 나무는 그린스토아와 그곳에서 살아가는 모든 것들의 기원, 순수한 생명력의 거목입니다. 그 크기가 너무나도 거대해 인간 천 명을 세워도 끝에 닿지 않고, 뿜어내는 생명력은 주변 일대를 전부 성역으로 만들 정도입니다. 대륙의 모두가 거목의 생명력에 의존하며 살아가고 있으며, 그 힘을 보다 더 많이 받아 인간과는 다른 특성을 지니고 태어난 존재들을 엘프라고 칭합니다.",
        "엘프들은 총량의 차이는 있어도 모두 어머니 나무의 생명력을 이어받은 자손이기 때문에 마법 적응력과 외모가 타 종족에 비해 월등하며, 장수합니다. 종족마다 특정한 신체 위치에 거목의 일부를 나타내는 문신이 새겨져 있습니다. 이 문신의 모양은 감정의 변화에 따라 미세하게 변화합니다.",
      ],
      sections: [
        {
          title: "하이엘프",
          image: { asset: "highElf", width: 1216, height: 832, alt: "금발과 긴 귀, 푸른 옷을 갖춘 하이엘프" },
          bullets: [
            "거목의 생명력만을 깨끗하게 받아 태어난 순혈 종족입니다. 마법 적응력과 구사력이 모두 뛰어나고, 지능도 대부분 비상한 수준으로 발달합니다.",
            "그린스토아는 평등과 자유를 표방하지만, 하이엘프들만큼은 암묵적으로 한 계층 위로 생각되는 경향이 있습니다...만, 정말로 공대받는 것은 아닙니다. 그린스토아에서 '귀족'이란 그저 돈이 많은 사람쯤의 취급입니다.",
            "왼쪽 가슴 깊은 곳에 달 모양 문신이 자리 잡고 있습니다.",
          ],
        },
        {
          title: "하프엘프",
          image: { asset: "halfElf", width: 1216, height: 832, alt: "은발과 긴 귀, 초록 망토를 갖춘 하프엘프" },
          bullets: [
            "인간과 엘프의 혼혈입니다. 인간의 호기심과 학습력을 내려받아 창의성이 돋보이는 지능을 가집니다. 수명은 불안정하여 단명하는 경우도, 장수하는 경우도 있습니다.",
            "전임 지도자 헬렌, 현임 지도자 아란이 하프엘프에 속합니다.",
            "엉덩이와 골반 사이 중간 위치에 나뭇잎 모양 문신이 자리 잡고 있습니다.",
          ],
        },
        {
          title: "우드엘프",
          image: { asset: "woodElf", width: 1216, height: 832, alt: "흰 머리와 이마의 문신, 지팡이를 갖춘 우드엘프" },
          bullets: [
            "북부, 어머니 나무의 뿌리 부근에서 태어나 거목을 수호해왔던 종족입니다. 지능과 마법 적응력이 특출나다고 할 수는 없으나, 독자적인 마법 양식을 구축하여 그린스토아가 쉽게 뚫리지 않도록 막아내는 중요한 역할을 하고 있습니다.",
            "다소 개방적이고 자유로운 생활 양식을 보유하여 옷차림, 성행위 등에 거리낌이나 주저함, 부끄러움이 없습니다.",
            "이마 한가운데에 원 모양 문신이 자리 잡고 있습니다.",
          ],
        },
      ],
    },
    {
      title: "마왕과 대혼란",
      tag: "평화 이전의 기록",
      hero: { asset: "demonKing", width: 1216, height: 640, alt: "검은 갑옷과 붉은 마법진을 두른 마왕" },
      body: [
        "나라와 국경조차 존재하지 않던 시대, 제루스 대륙은 죽음과 저주가 들끓던 위험한 땅이었습니다. 마족과 악령, 포악한 들짐승들이 상시 도사리고 있었죠.",
        "그리고 마왕을 자처하는 이가 나타났습니다. 그의 힘은 너무나도 강력하여 마주하는 모든 생명을 쓰러트린 후 자신의 휘하로 삼았습니다.",
      ],
      sections: [
        {
          title: "용사 제르",
          image: { asset: "zerAlliance", width: 1216, height: 640, alt: "넓은 초원에서 먼 풍경을 바라보는 은빛 갑옷의 인물" },
          body: [
            "그리고 그와 동일한 시기 대륙에 최초의 용사 제르가 나타납니다. 그는 마치 신의 가호라도 받은 것 처럼 선하고 정의로운 인물이었고, 선대 마왕과 대등하게 겨룰 유일한 인물이었습니다, 마침 개개인의 힘으로는 혼란을 잠재울 수 없다고 판단한 고대의 엘프들은 그린스토아를 건국, 제르와 협력하여 마왕을 물리쳤습니다.",
            "그로부터 수 백년, 지금까지도 그 평화는 이어져오고 있습니다.",
          ],
        },
      ],
    },
    {
      title: "이어져온 평화, 그리고 위기",
      tag: "긴 평화의 시작",
      hero: { asset: "peace", width: 1216, height: 704, alt: "꽃밭과 붉은 꽃 너머로 빛나는 평화로운 어머니 나무" },
      body: [
        "선대 마왕과 최초의 용사의 결전 이후, 이 대륙과 그린스토아는 덧없이 평화로운 나날을 보내고 있습니다. 몇 백년 주기로 야망을 품은 마족이 대륙을 들쑤실 때도 있었지만, 모두 선대 마왕급의 영향력을 행사하지 못했죠. 당연한 일입니다. 웬만한 힘이 아닌 이상 어머니 나무의 신성함은 무너트릴 수 없으며, 이전보다 더욱 발전한 마법과 검술 체계를 사용하는 수호자들이 버팀목이 되어주었으니까요. 대륙과 성역에 불온한 마기가 감돈다면, 그것은 분명한 이상현상일겁니다.",
      ],
      sections: [
        {
          title: "953년 10월 1일, 현 시점",
          image: { asset: "crisis", width: 1216, height: 704, alt: "푸른 어둠 속 보랏빛 마기가 스며드는 어머니 나무" },
          body: [
            "하지만, 그 우려는 현실이 되었습니다. 성역의 생명력이 어딘가로 새어나가고 있고, 그에 따라 영역의 범위가 줄어들어 마족과 몬스터가 더 자주 출몰, 시민들을 위협하는 현상이 벌어지고 있습니다. 거목이 무너진다면, 그 그늘 또한 사라져 곧 대륙 전체가 위협받게 될 것이 분명합니다.",
            "다행히도 바로 지금, 제르디아의 한 모험가 또한 이 현상에 흥미를 붙였습니다...",
          ],
        },
      ],
    },
    {
      title: "그린스토아 조사 의뢰",
      tag: "현재의 여정",
      hero: { asset: "investigationLucy", width: 1216, height: 704, alt: "길드에서 의뢰서를 들고 확인하는 접수원 루시" },
      body: [
        "당신은 제르디아 모험가 길드 소속의 모험가입니다. 길드에는 수색을 비롯한 여러 의뢰가 모이고, 당신 역시 루시를 통해 여러 의뢰를 수행해왔습니다.",
        "그린스토아의 이상현상에 대하여 제르디아 왕국 기사단은 사전 조사를 맡길 모험가를 구했습니다. 하지만, 그 어머니 나무를 건드릴 정도의 힘이 있는 자를 상대한다면 생환을 기대하기 어렵기 때문에 그 누구도 아직 의뢰를 수주하지 않았습니다.",
        "허나 위험을 마주하며 성장하는 자도 있는 법. 당신은 이 의뢰를 수주하여 그린스토아로 여정을 떠나게 됩니다.",
        "의뢰의 목적은 오로지 '조사'입니다. 현 그린스토아에 당장에 터질 위협은 없으나, 언젠가는 무언가에 잠식당할 것이 분명합니다. 그 진상을 발빠르게 조사하여 빠르게 싹을 잘라야 합니다. 피할 수 없는 전투가 있을 수도 있습니다.",
      ],
      personLinks: [{ name: "루시", targetId: "lucy" }],
      dividerBefore: 2,
      bodyImages: {
        2: { asset: "investigationGreenstoa", width: 1216, height: 704, alt: "어머니 나무와 성역을 바라보는 검은 망토의 모험가" },
      },
    },
    {
      title: "엘프 외의 종족",
      tag: "서로 다른 이웃을 알아가는 일",
      hero: { asset: "racesOverview", width: 1216, height: 704, alt: "푸른 하늘 아래 대화하는 고양이 수인 루냐와 슈냐" },
      body: [
        "대륙, 그리고 그린스토아에는 엘프 외에도 마족, 몬스터, 언데드, 수인 등 많은 종족들이 뒤섞여 살아가고 있습니다. 사악하고 적대적인 기운을 내재하지 않는다면 어떠한 종족도 차별 없이 지낼 수 있게 해주는 헬렌의 정책 덕분이죠. 그 때문에 엘프들만으로는 이뤄낼 수 없었던 발전 또한 가능했습니다.",
      ],
      personLinks: [{ name: "헬렌", targetId: "helen" }],
      sections: [
        {
          title: "수인",
          image: { asset: "raceBeast", width: 1216, height: 704, alt: "붉은 마법 문양을 펼치는 드래곤 수인 뮈르슈" },
          body: ["대륙에 존재하는 동물들의 특징이 인간에게 결합되어 태어난 종족입니다. 다만, 두 종족이 반반으로 섞였다기보다는 동물의 특성을 띈 인간에 더 가깝습니다. 그렇기에 육식이나 사냥에 부담을 느끼지 않고, 자신들이 동물과는 다르다는 것을 정확히 인지하고 살아갑니다. 예시로, 캐롤라는 목장의 소들을 친구라고 생각하면서도 사고 파는 데에 전혀 개의치 않습니다."],
          personLinks: [{ name: "캐롤라", targetId: "carola" }],
          members: ["seia", "shunya", "runya", "rael", "carola", "sif"],
        },
        {
          title: "마족",
          image: { asset: "raceDemon", width: 1216, height: 704, alt: "보랏빛 마력을 두른 검은 갑옷의 마족" },
          body: ["본래 대륙을 위협했던 마족은 성역에서 살아가는 것이 물리적으로 불가했습니다. 하지만 엘프들의 연구로 어머니 나무가 막아내는 것은 마족 그 자체가 아닌 그들이 뿜어내는 '사악한 마력'임을 알아내었고, 이에 가끔씩 나타나던 우호적이고 공존을 원했던 마족들은 그린스토아에서 살아가는 것을 허락받았습니다. 이따금씩 무의식 속의 두려움을 지워내지 못한 시민들이 진위가 불분명한 소문을 퍼뜨리기도 합니다."],
          members: ["ellen", { id: "bran", note: "마인" }, "unrevealed"],
        },
        {
          title: "언데드, 몬스터",
          image: { asset: "raceMonster", width: 1216, height: 704, alt: "슬라임 추출물이 든 병을 보고 놀란 슬라임 레무" },
          body: ["대륙에 남은 사자의 혼이 죽은 몸에 들어가거나, 대지의 마력으로부터 태어난 존재들입니다. 이들은 적대적인 존재보다는 생과 사 그 어디에도 속하지 않는 부류에 가깝습니다. 그렇기에 본능에 충실한 경우가 많고, 그 중 시민들을 위협하는 존재는 그린스토아에 발을 들일 수 없습니다. 워낙에 개개인의 성격과 특성이 천차만별이기 때문에 이들에 대한 입국 심사는 보다 더 엄격하게 치뤄집니다."],
          members: ["sena", "remu", "seia", "ellen"],
        },
        {
          title: "인간",
          image: { asset: "raceHuman", width: 1216, height: 704, alt: "길드 안에서 취한 이보리아와 그녀를 바라보는 접수원 루시" },
          body: ["가장 나약하면서도 가장 강인한, 대륙 인구의 대부분을 차지하는 종족입니다. 학습력과 창의성이 매우 뛰어나 상대적으로 힘과 지능이 떨어짐에도 모든 고난에 대처할 수 있는, 꺾이지 않는 신성한 열정을 품었습니다. 어떤 국가와 마을을 가도 흔하게 발견할 수 있습니다."],
          members: ["lucy", "rose", "edan", "bord", "godric", "mia", "aiherde"],
        },
      ],
    },
    {
      title: "그린스토아의 행정",
      tag: "지도자와 주요 구역",
      chapter: 8,
      body: [],
      sections: [
        {
          title: "지도자",
          body: ["그린스토아의 지도자는 군림하며 권력을 행사하는 왕이나 황제보다는, 일종의 총책임자 혹은 관리자에 가깝습니다. 하지만 맡은 일이 막중하며 선택과 결정에서 오는 희생과 피로 또한 대단하기 때문에 지도자들은 모두 존경받습니다. 그렇기에 평등을 표방하는 그린스토아에서도 '님' 호칭으로 불리며, 예를 차려 대우합니다."],
          members: [{ id: "helen", note: "전임" }, { id: "aran", note: "현임" }],
        },
        {
          title: "그린스토아 본청",
          body: ["마기의 출입을 막는 거대한 봉화 기둥들 뒤로 웅장하게 세워진 대리석 건물입니다. 모든 정책 토론과 의사결정, 마법 연구의 중심이 되는 곳이며, 마법탐구자들의 연구소, 지도자의 집무실 또한 존재합니다. 1층 로비까지는 민간인이 출입할 수 있으며, 그 외에는 정찰대와 용병들이 출입구와 중심 구역을 지킵니다."],
        },
        {
          title: "힐리아스 여관",
          body: ["전임 지도자 헬렌이 은퇴 후 취미 삼아 세운 여관입니다. 여관이라고 하기에는 너무나도 웅장하고 아름다워 궁전이라고 표현하는 것이 맞을지도 모르겠습니다. 대부분의 인물들이 투숙 경험이 있으며 지금도 여러 인물이 출입하고 있습니다. 일종의 거점이자 정비 구역으로 생각하면 편합니다."],
          emphasis: ["취미 삼아"],
        },
        {
          title: "동부",
          body: ["그린스토아의 최대 번영지이자, 일종의 도심 역할을 하는 구역입니다. 본청, 여관이 존재하며 시장과 주택들이 들어차 있습니다. 자연보다 건물이 더 많은 유일한 구역입니다."],
        },
        {
          title: "서부",
          body: ["목축업이 발달한 구역입니다. 어디로 눈을 돌려도 사방이 샛노란 밀밭으로 가득 차있으며, 긴 강이 힘차게 넘실거리며 흐릅니다. 그 근원에는 어머니 나무 만큼은 아니지만 거대한 나무에서 흐르는 폭포가 있습니다. 캐롤라의 목장이 이 곳에 위치합니다."],
        },
        {
          title: "남부",
          body: ["푸른 룬 마법으로 보호되는 거대한 돌담 정문이 위치하는 구역입니다. 그린스토아로 통하는 길은 이 곳밖에 없으며, 주변은 온통 푸른 들판으로 개발되지 않은 구역입니다. 법적으로 해당 구역에는 건물과 조형물을 지을 수 없기에 어머니 나무와 그 주변 웅장한 경치를 가장 잘 감상할 수 있는 구역입니다."],
        },
        {
          title: "북부",
          body: ["고대 엘프들의 유적지가 그대로 남아있는 울창한 숲 구역입니다. 거대한 폭포를 중심으로 유산이 남겨진 유적, 고대 마법식 전서 등 연구 가치가 높은 물건들이 보존되어 있습니다. 또한, 우드엘프들의 거주지와 가까워 상대적으로 그들을 자주 마주칠 수 있는 구역입니다."],
        },
        {
          title: "중심 상권",
          body: ["동부와 서부 그 사이, 밤낮없이 활발한 상권 구역입니다. 최근 이상현상으로 야생동물과 수집품이 늘어 열기는 사그라들 기미가 보이지 않는 상태입니다. 동부의 건축 양식과 서부의 자연이 뒤섞여 아름다운 경치를 자랑합니다. 레무의 대장간 또한 이곳에 위치하며, 주변에는 상점들과 식당이 가득합니다."],
        },
        {
          title: "정찰대",
          body: ["그린스토아를 지키고 태어나는 위협을 가장 먼저 감지하는 이들입니다. 인간, 엘프 외에도 다양한 종족들이 자원하여 입대할 수 있으며, 사용하는 공격/방어 체계도 다양합니다. 특별히 대장이나 지휘관은 없으며, 지도자의 명령 아래 체계적으로 움직이는 조직입니다."],
        },
      ],
    },
    {
      title: "외부",
      tag: "성역 너머의 나라들",
      chapter: 8,
      body: [
        "상술했듯 그린스토아 외에도 제르디아, 월화국, 아이리스 제국 등의 크고 작은 국가들이 존재합니다. 하지만 여러분이 이번 여정에서 경험할 외부 지역은 제르디아 왕국이 유일합니다. 제르디아의 핵심 지역과 다른 국가들에 대한 짧은 설명을 작성하자면 이렇습니다.",
      ],
      sections: [
        {
          title: "제르디아 모험가 길드",
          body: ["제르디아 시내, 그 중에서도 가장 중심에 위치한 구역으로, 의뢰의 발주와 수주, 모험가 등록 및 친목 다짐 등 제르디아의 광장으로써 기능하는 공간입니다. 안내 데스크에는 여러 접수원들이 대기하고 있으며, 로비의 테이블에는 진탕 술을 마셔대는 모험가들과 파티를 찾는 이들이 상주하고 있습니다. 그린스토아의 정찰대 거점과 비슷한 기능을 합니다."],
        },
        {
          title: "아이리스 제국",
          body: ["폭설이 끊기지 않는 만년설의 제국입니다. 규모와 위세는 상대적으로 밀릴지라도, 혹독한 환경과 일찍이 배우는 생존 훈련을 통해 강인한 정신의 병사들을 길러냈습니다. 그렇기에 강대국이어도 함부로 외교적 도발과 대담한 태도를 취하기 힘든 국가 중 하나입니다."],
        },
        {
          title: "월화국",
          body: ["대륙 동쪽에 위치한 이색적이고도 날카로운 국가입니다. 유흥과 검술이 발달했으며, 동방 문화의 대부분을 이끌고 있습니다. 대륙의 주요 자원인 마력과 생명력을 사용하는 대신 요기와 영력을 사용한 독자적인 전투 방식을 사용합니다. 제르디아의 모험가인 하나리의 고향이기도 합니다."],
          members: ["mia"],
        },
        {
          title: "염뢰혈",
          body: ["모든 용족들의 고향이자, 분출하는 화산과 낙뢰가 끊기지 않는 지대입니다. 이 곳에서는 오로지 힘이 규칙이며, 제르디아 왕국이 개발해두지 않은 구역은 폭력과 서열다툼이 끊기지 않죠. 그 덕에 용족들은 살아남기 위해 압도적인 마력량과 신체능력을 타고났습니다."],
          members: ["rael"],
        },
      ],
    },
  ];
  const recordedPeople = [
    {
      "id": "lucy",
      "name": "루시",
      "portraitSrc": "assets/person-lucy.webp",
      "tags": ["인기 접수원", "시니컬", "걱정 많음", "24세"],
      "role": "길드의 화제",
      "summary": "길드의 화제",
      "body": [
        "모험가들의 성소이자 당신의 소속이기도 한, 제르디아 모험가 길드의 접수원입니다. 그 인기가 뛰어나 이 달의 접수원을 25연속 수상하고 있고. 그 만큼 추파도 가끔씩 받고 있습니다...",
        "시니컬하고 무심해보이면서도 위험한 의뢰를 말리거나 끼니를 챙기는 등 다채로운 성격이 그녀의 인기 비결입니다. 직업 상 예의일 수도, 사심일 수도 있습니다. 대상에 따라서요.",
      ]
    },
    {
      id: "scout",
      name: "카니아",
      portraitSrc: "assets/person-kania.webp",
      tags: ["정찰대", "하이엘프", "츤 70% 데레 30%", "길잡이", "197세"],
      role: "그린스토아 정찰대 궁병",
      summary: "그린스토아 정찰대 궁병",
      body: "그린스토아 정찰대의 하이엘프 궁수입니다. 본래 하이엘프라면 조금 더 안전하고 품위 있는 마법탐구자나 본청 직원을 희망하기 마련이지만, 카니아는 그런 것에는 흥미가 없었던 걸까요? 발로 뛰고 흙탕물에서 구르는 정찰대에 자원했습니다. 까칠한 말투와 날렵한 인상에 반해 감정이나 애정 표현에는 굉장히 서투른 모습을 보입니다. 그녀가 당신에게 날 선 말들을 뱉는다면, 그건 진심이 아닐 확률이 높습니다.",
    },
    {
      id: "hero",
      name: "후드의 모험가",
      portraitSrc: "",
      tags: ["모험가", "그린스토아 조사", "후드 속 얼굴", "아직 쓰이지 않은 이야기"],
      role: "기사단 사전 조사 의뢰 수행자",
      summary: "후드 아래로 얼굴을 감춘 낯선 여행자.",
      body: "제르디아 길드에서 그린스토아 사전 조사 의뢰를 수락했다. 모험가증과 의뢰서를 지니고 성역으로 향한다. 이 여행자가 어떤 이야기를 써 내려갈지는 아직 정해지지 않았다.",
    },
    {
      id: "rogue",
      name: "노란 머리 도적",
      portraitSrc: "",
      tags: ["마차 동승객", "큰 자신감", "소문의 추적자", "검문소에서 발길을 돌린"],
      role: "마차의 떠들썩한 동승객",
      summary: "비대칭 금발과 검은 가시 갑옷, 지나치게 큰 자신감.",
      body: "기사단의 보수와 그린스토아에 대한 소문을 좇아 마차에 탔다. 그러나 성역의 검문소에서 카니아에게 입장을 거절당하고, 울음을 훔치며 발길을 돌린다.",
    },
    {
      id: "rael",
      name: "뮈르슈",
      portraitSrc: "assets/person-muirshu.webp",
      tags: ["드래곤 수인", "염뢰혈 출신", "용족", "사서", "나이 불명"],
      role: "깐깐한 도서관 사서",
      summary: "깐깐한 도서관 사서",
      body: [
        "그린스토아 정문 근처, 도서관을 운영하고 있는 드래곤 수인 사서입니다. 무뚝뚝하고 고압적인 성격을 지녔지만 생물로서의 정이 없는 것은 아니며, 오히려 딱딱한 장난기를 보이기도 합니다.",
        "본래 용족들은 대부분 염뢰혈에 거주하며 조용한 곳과는 거리가 멀지만, 그녀가 흥미도 없는 사서 일을 고른 이유는 따로 있습니다, 오래 전, 크라슈라는 다른 용과 서열 다툼이 있었습니다. 그리고 그 결과는, 그녀가 흥미도 없는 사서 일을 하는 점에서 알 수 있습니다... 그녀 앞에서 이 역사를 언급하지 마세요, 역린이니까요.",
      ],
      bodyLinks: [{ name: "염뢰혈", articleTitle: "외부", sectionTitle: "염뢰혈" }],
    },
    {
      id: "sena",
      name: "장위",
      portraitSrc: "assets/person-jangwi.webp",
      tags: ["언데드", "강시", "몬스터", "조심성", "내향성", "생전 28세"],
      role: "겁쟁이 강시",
      summary: "겁쟁이 강시",
      body: [
        "정문 근처에서 지내는 순한 강시입니다. 물지 않고, 날지도 않고, 불을 뿜지도 않습니다. 따분한 정문 인근에서 지내는 이유는, 번화가로 가면 혹시나 시민들의 차별과 질타를 받지 않을까 하는 걱정 때문입니다. 그런 생각을 할 정도로 내향적이고 우유부단한 성격을 지니고 있지만, 그에 비교되는 도저히 인간의 것이라고 할 수 없는 (아니지만) 몸매가 특징입니다.",
        "그녀를 만나게 된다면, 뒤에서 말을 걸거나 큰 소리로 말하지 마세요. 이미 죽은 몸, 또 놀라 죽을 수 있습니다.",
      ],
    },
    {
      id: "rose",
      name: "아르다",
      portraitSrc: "assets/person-arda.webp",
      tags: ["제르디아", "잡화점 주인", "제빵 취미", "특이한 말투", "22세"],
      role: "잡화점 제빵사",
      summary: "잡화점 제빵사",
      body: [
        "제르디아 길드 근처, 잡화점의 주인입니다. 주로 상처약, 악세서리, 마도구 등을 판매합니다. ~용 하는 특이한 말투를 구사하는데, 딱히 이유는 없습니다. 오히려 기억에 남는 매력이 되기도 하죠.",
        "제빵에 취미를 두고 있어 그린스토아의 유제품이나 밀가루에 관심이 꽤 있습니다.",
      ],
    },
    {
      "id": "edan",
      "name": "기루스",
      "portraitSrc": "",
      "tags": ["철두철미", "원칙주의", "제르디아 왕국", "왕실 소속", "24세"],
      "role": "기사단 직속 검사",
      "summary": "기사단 직속 검사",
      "body": "제르디아 왕국 기사단의 검사입니다. 사심과 감성을 최대한 배제한 채 업무에 임하며, 규율을 최우선으로 중시합니다. 고지식하다고 생각할 수 있지만, 사실은 조국에 대한 굳건한 충성심이 반영된 행실입니다. 약간의, 아니 꽤 많은 질문에 대답해야 할 수도 있지만 통과만 한다면 그는 시민들에게 꽤 따뜻하고 믿음직한 기사입니다."
    },
    {
      id: "aiherde",
      name: "아이헤르데",
      portraitSrc: "",
      portraitKind: "unrevealed",
      tags: ["마법탐구자", "과묵함", "제르디아 왕국", "피지컬", "35세"],
      role: "전신갑주의 지식인",
      summary: "전신갑주의 지식인",
      quote: "강인한 육체 또한 학자의 소양이다.",
      body: [
        "라는 말을 입에 달고 사는 제르디아의 마법탐구자입니다. 실제로 191cm의 큰 키와 다부진 체격을 지니고 있으며, 한 치의 빈틈도 찾아볼 수 없는 전신 금 갑주가 특징입니다. 직업과 어울리는 외모는 아니다만 능력은 뛰어납니다.",
        "박식하지만 제르디아 외부에서 사용되는 마법에는 별로 흥미가 없습니다.",
      ],
    },
    {
      "id": "bran",
      "name": "이보리아",
      "portraitSrc": "assets/person-ivoria.webp",
      "tags": ["제르디아 모험가", "길드 소속", "마인", "주정뱅이", "20세"],
      "role": "술, 더 많은 술, 진탕 많은 술",
      "summary": "술, 더 많은 술, 진탕 많은 술",
      "body": [
        "붉은 머리칼과 금빛 역안의 마인입니다. 마인이란 마족과 인간이 섞인 종으로, 대부분 타고난 폭력성을 억제하고 살아갈 수 있기에 대륙 이곳저곳에서 꽤 자주 마주칠 수 있는 이들입니다.",
        "이보리아의 경우는 억제의 방식이 술이 아닌가 할 정도로 마주칠 때마다 음주 중인 경우가 많습니다. 성격 자체도 호쾌하고 방탕한 탓에 가끔은 민폐가 되기도...",
        "전투 방식은 뛰어난 육체를 바탕으로 한 그냥 주먹질입니다.",
      ]
    },
    {
      "id": "mia",
      "name": "하나리",
      "portraitSrc": "assets/person-hanari.webp",
      "tags": ["무녀", "검사", "월화국 출신", "모험가", "27세"],
      "role": "월화의 꽃",
      "summary": "월화의 꽃",
      "body": [
        "유흥과 검술의 나라, 월화국에서 건너온 제르디아의 모험가입니다.",
        "월화국에선 대륙의 보편적 체계인 마력과 생명력 대신에 영력과 요기라는 기묘한 힘을 사용합니다. 정보조차 외부로 새어나간 적이 없어 모호하죠. 하나리는 그런 곳의 무녀이자 검사입니다.",
        "제르디아에 도착한 후 특유의 기품과 실력 덕에 암암리에 주목받고 있습니다. 그녀 또한 적극적으로 파티를 찾고 있습니다.",
      ]
    },
    {
      "id": "nara",
      "name": "아이나",
      "portraitSrc": "",
      "tags": ["서큐버스", "모험가", "친근한 매혹", "확인되지 않은 소문"],
      "role": "인간 사회에 우호적인 서큐버스 모험가",
      "summary": "사람들 사이에서 모험가로 살아가는 서큐버스. 친근하고 자연스럽게 매혹적인 말투를 쓰며, 밤에 그녀가 자리를 비우면 남성이 사라진다는 확인되지 않은 소문이 돈다.",
      "body": "긴 은백색 머리와 옅은 라벤더빛 음영, 붉은 눈과 작은 송곳니, 뾰족한 귀와 짧은 어두운 뿔, 검붉은 박쥐 날개, 검은 레이스 의상과 붉은 보석 목장식. 사람들 사이에서 모험가로 살아가는 서큐버스. 친근하고 자연스럽게 매혹적인 말투를 쓰며, 밤에 그녀가 자리를 비우면 남성이 사라진다는 확인되지 않은 소문이 돈다."
    },
    {
      "id": "tobin",
      "name": "토비",
      "portraitSrc": "",
      "tags": ["대장장이", "무뚝뚝함", "세심한 눈", "호탕한 웃음", "이웃 걱정"],
      "role": "무뚝뚝한 대장장이",
      "summary": "말수는 적지만 생활과 사람을 세심하게 보는 대장장이. 그린스토아의 소문을 장사와 이웃의 안위가 걸린 일로 받아들이며, 섣부른 의심보다 확인을 바란다. 때때로 호탕하게 웃는다.",
      "body": "그을린 피부와 다부진 체격, 짙은 회색 머리, 풍성한 회백색 수염과 콧수염, 깃털·금빛 띠·청록빛 장식이 달린 넓은 갈색 모자, 털깃과 가죽 작업복, 사슬갑옷, 손가락이 드러난 작업 장갑. 말수는 적지만 생활과 사람을 세심하게 보는 대장장이. 그린스토아의 소문을 장사와 이웃의 안위가 걸린 일로 받아들이며, 섣부른 의심보다 확인을 바란다. 때때로 호탕하게 웃는다."
    },
    {
      "id": "leon",
      "name": "무니아",
      "portraitSrc": "",
      "tags": ["기사", "길드 보초", "능청스러운 농담", "빈틈없는 실력", "기루스의 동료"],
      "role": "길드 내부 보초를 맡은 기사 · 기루스의 동료",
      "summary": "기사로서의 실력은 최고지만 늘 능청스러운 농담으로 기루스의 잔소리를 부른다. 경계 근무와 임무 설명에서는 빈틈없는 면모가 드러난다.",
      "body": "옅은 은백색 머리와 길게 내려온 앞머리, 느슨하게 묶은 뒷머리, 장난기 있는 짙은 눈, 붉은 망토, 검은 사슬갑옷 위의 은빛 판금갑옷과 금속 건틀릿. 기사로서의 실력은 최고지만 늘 능청스러운 농담으로 기루스의 잔소리를 부른다. 경계 근무와 임무 설명에서는 빈틈없는 면모가 드러난다."
    },
    {
      "id": "runya",
      "name": "루냐",
      "portraitSrc": "assets/person-runya.webp",
      "portraitKind": "photo",
      "tags": [
        "고양이 수인",
        "온순함",
        "예의범절",
        "슈냐의 친구",
        "마법사",
        "20세"
      ],
      "role": "슈냐의 억제기",
      "summary": "슈냐의 억제기",
      "body": "순하고 예의바른 고양이 수인 마법사입니다. 어릴 적부터 엘프들에게 마법을 겉핥기로 배웠으며, 꾸준히 배운 덕에 꽤나 고난도 마법인 월광 마법의 기초를 사용할 수 있게 되었습니다. 슈냐와는 오래된 친구로, 너무나도 자유분방한 그녀의 성격 탓에 골머리를 썩힐 때가 많지만 그만큼 친구를 아끼고 항상 동행하는 우정도 보입니다. 슈냐에 비해 동물의 본능은 많이 남아있지 않습니다."
    },
    {
      "id": "shunya",
      "name": "슈냐",
      "portraitSrc": "assets/person-shunya.webp",
      "portraitKind": "photo",
      "tags": [
        "고양이 수인",
        "자유분방",
        "루냐의 친구",
        "도적",
        "20세"
      ],
      "role": "루냐의 애물단지",
      "summary": "루냐의 애물단지",
      "body": "자유로운 문제아이자 고양이 수인 도적입니다. 마법처럼 복잡하고 어려운 것에는 영 흥미를 못 느끼고, 한 시라도 가만히 있지 못하는 유형입니다. 타인의 물건을 훔치는 도적이 어떻게 마음대로 돌아다닐 수 있냐 하면, 도난에 성공한 경험이 없기 때문입니다. 설령 성공한다고 한들, 루냐의 닦달에 돌려주기 일쑤입니다. 동물의 본능이 비교적 많이 남은 편이기에, 냐체를 사용합니다."
    },
    {
      "id": "sif",
      "name": "시프",
      "portraitSrc": "assets/person-sif.webp",
      "portraitKind": "photo",
      "tags": [
        "양 수인",
        "여행객",
        "제르디아 출신",
        "모험가 선망",
        "21세"
      ],
      "role": "털 날리는 여행객",
      "summary": "털 날리는 여행객",
      "body": "제르디아에서 온 양 수인 여행객입니다. 특별히 혈통이 좋거나 귀족 가문에서 태어나지는 않았지만, 집안이 부유하여 여러가지 경험을 쌓는 데에 지장이 없는 편입니다. 꽤 수준 높은 마법인 빛 마법도 배우고, 이곳저곳 돌아다니며 지혜 또한 쌓고 있습니다. 특히 모험가를 선망하는데, 본인의 좋아하는 것에 열정적인 성격 덕에 모험가를 마주치면 흥분하기도 합니다. 그녀에게 '침착하라'고 말해보세요. 방금까지 자신이 들떠있던 것에 부끄러워 할지도요."
    },
    {
      "id": "carola",
      "name": "캐롤라",
      "portraitSrc": "assets/person-carola.webp",
      "portraitKind": "photo",
      "tags": [
        "소 수인",
        "쾌활함",
        "장난기",
        "마당발",
        "31세"
      ],
      "role": "서부 목장의 주인",
      "summary": "서부 목장의 주인",
      "body": "서부, 중대형 목장을 운영하고 있는 소 수인입니다. 상업 활동을 활발히 하고 있으며, 시민 대부분 및 상인들과 넓게 안면을 트고 있는 마당발입니다. 장난기가 많아 여러가지 농담을 필살기처럼 상시 준비하고 있는데, 자신의 농담에 웃던 안 웃던 신경쓰지 않고 다음 농담이 나온다고 하네요."
    },
    {
      "id": "seia",
      "name": "세이아",
      "portraitSrc": "assets/person-seia.webp",
      "portraitKind": "photo",
      "tags": [
        "토끼 수인",
        "뱀파이어",
        "몬스터",
        "천하태평",
        "21세"
      ],
      "role": "악동 뱀파이어",
      "summary": "악동 뱀파이어",
      "body": [
        "수인과 몬스터가 섞인 희귀종으로, 일단은 수인의 비중이 높아 꼬리와 귀가 발달했고, 햇빛에도 거뜬하며, 흡혈하지 않고도 살아갈 수 있습니다, 그럼에도 피를 좋아하고 밤에 활동하는 편입니다.",
        "장난기가 다분하고 놀래키는 것을 좋아해 갑자기 튀어나오기도 하지만, 겁이 많은 사람이 아니라면 전혀 위협이 되지 않는 수준입니다. 오히려 정말로 무서운 것은 나타나고 난 뒤에 감당해야 할 엄청난 양의 수다와 천진난만함이죠.",
      ]
    },
    {
      "id": "aran",
      "name": "아란",
      "portraitSrc": "assets/person-aran.webp",
      "portraitKind": "photo",
      "tags": [
        "허당",
        "하프엘프",
        "현임 지도자",
        "품위 연기",
        "백치미",
        "160세"
      ],
      "role": "얼렁뚱땅 현임 지도자",
      "summary": "얼렁뚱땅 현임 지도자",
      "body": "그린스토아의 현임 지도자입니다. 어머니 헬렌의 자리를 이어받은 것에 굉장한 책임감을 느끼면서도, 자부심 또한 갖고 있습니다. 타고난 내향성과 허당기를 지닌 탓에 우유부단하고 사소한 것에 쩔쩔매는 모습도 보입니다. 그녀 자신도 이를 알고 있기에, 꾸준하게 검술을 갈고닦고 있으며 소통을 위해 제 발로 뛰어다니는 중입니다. 그녀를 마주친다면, 작은 응원 한 마디 혹은 짓궃은 지적 한 마디를 건네보세요. 어느 쪽이던 정말 크게 당황할 것입니다."
    },
    {
      "id": "remu",
      "name": "레무",
      "portraitSrc": "assets/person-remu.webp",
      "portraitKind": "photo",
      "tags": [
        "몬스터",
        "슬라임",
        "대장장이",
        "신체변형",
        "활기참",
        "나이불명"
      ],
      "role": "슬라임 대장장이",
      "summary": "슬라임 대장장이",
      "body": "그린스토아 중심 상권은 모루와 망치가 부딪히는 금속음이 끊이지 않습니다. 인기도, 평가도 제일인 레무의 대장간이 바로 그 이유입니다. 레무는 모든 손님들을 반기는 순한 슬라임 대장장이입니다.  슬라임이라고 하면 자칫 흐물흐물하고 힘이라고는 없을 것 같지만, 그녀의 실력은 타의 추종을 불허할 정도로 야무집니다. 오히려 차갑고 물컹한 신체가 열을 빠르게 식히는 도움을 주기도 하죠. 궁금하다면, 만져도 되냐고 물어보세요. 그녀에겐 일상입니다."
    },
    {
      "id": "klone",
      "name": "클로네",
      "portraitSrc": "assets/person-klone.webp",
      "portraitKind": "photo",
      "tags": [
        "고지능",
        "우드엘프",
        "현실적",
        "개방적 생활문화",
        "마법탐구자",
        "311세"
      ],
      "role": "천재 마법탐구자",
      "summary": "천재 마법탐구자",
      "body": "뛰어난 지능의 우드엘프 마법탐구자입니다. 우드엘프는 본래 지능이 특출난 편은 아니지만, 그녀는 타고난 학습력을 내재하고 태어났고 그 덕에 현재 그린스토아 마법계의 중심에서 활동 중입니다. 그와 동시에, 우드엘프의 개방적이고 자유로운 생활문화도 몸에 배어있어 노출과 성행위를 꺼리지 않는 본능에 충실한 면모도 보입니다. 그렇다고 그녀의 옷차림과 적극성에 놀라지는 마세요, 그녀에겐 그것이 상식입니다. 때와 장소를 가리지 않는 것도 아닙니다."
    },
    {
      "id": "helen",
      "name": "헬렌",
      "portraitSrc": "assets/person-helen.webp",
      "portraitKind": "photo",
      "tags": [
        "너그러움",
        "나긋나긋",
        "전임 지도자",
        "여관 주인",
        "하프엘프",
        "417세"
      ],
      "role": "전임 지도자, 현임 여관 주인",
      "summary": "전임 지도자, 현임 여관 주인",
      "body": "몇십 년 전까지 그린스토아를 이끌던 지도자였지만, 지금은 취미 삼아 거대한 여관을 운영 중입니다. 살아온 세월만큼 성격도 유연하고, 파릇파릇한 열기와 새싹들을 귀여워하는 경향이 있습니다. 딸이자 후임인 아란을 굉장히 아끼고, 또 바른 길로 이끌어주기 위해 다분히 노력하고 있습니다. 암묵적인 서열 1위입니다."
    },
    {
      "id": "ellen",
      "name": "엘레나",
      "portraitSrc": "assets/person-elena.webp",
      "portraitKind": "photo",
      "tags": [
        "서큐버스",
        "몬스터",
        "마족",
        "매혹적",
        "100세"
      ],
      "role": "밤의 마녀",
      "summary": "밤의 마녀",
      "body": [
        "감언이설과 매혹 마법으로 남성을 유혹하고, 정기를 흡수하는 몽마!",
        "...일 뻔한 서큐버스입니다. 그린스토아에선 허용되지 않는 행동이거든요. 종족 특유의 방탕한 성격과 유혹적인 말투는 여전하지만, 죄 없는 남성을 미라로 만들어버리지는 않습니다. 그럼에도 마족에 대한 공포심이 남은 시민들은 그녀가 나타난 밤에 남성이 한 명씩 실종된다는 소문을 퍼뜨리기도 합니다. 진위여부는 불명이지만요.",
      ],
      "bodyEmphasis": ["감언이설과 매혹 마법으로 남성을 유혹하고, 정기를 흡수하는 몽마!"]
    },
    {
      "id": "henia",
      "name": "헤니아",
      "portraitSrc": "assets/person-henia.webp",
      "portraitKind": "photo",
      "tags": [
        "오만함",
        "귀족",
        "영애",
        "온실 속 화초",
        "197세"
      ],
      "role": "나르시시즘 영애님",
      "summary": "나르시시즘 영애님",
      "body": [
        "하이엘프 중에서도 가장 깨끗한 피를 지닌 가문의 영애입니다. 취미는 힐리아스 여관에서의 차 한 잔, 카니아 흉보기입니다. 비교적 안전한 곳에서 특출난 마법 재능으로 후방을 지원하는 것이 하이엘프들의 역할이지만, 헤니아는 사실 놀고 있습니다! 이 사실에 은근히 무시당하고 있지만, 본인은 인정하지 않는 중이라네요.",
        "고압적이지만, 칭찬과 반격에 약한 영애님입니다.",
      ],
      "bodyEmphasis": ["헤니아는 사실 놀고 있습니다!"],
      "bodyLinks": [{ "name": "힐리아스 여관", "articleTitle": "그린스토아의 행정", "sectionTitle": "힐리아스 여관" }]
    },
  ];
  const peopleGroups = [
    { id: "lead", title: "주연" },
    { id: "supporting", title: "조연" },
  ];
  const roster = {
    lead: [
      ["mareri", "마르에리"], ["scout", "카니아"], ["henia", "헤니아"],
      ["helen", "헬렌"], ["aran", "아란"], ["klone", "클로네"],
      ["remu", "레무"], ["runya", "루냐"], ["shunya", "슈냐"],
      ["sif", "시프"], ["rael", "뮈르슈"], ["ellen", "엘레나"],
      ["carola", "캐롤라"], ["seia", "세이아"], ["sena", "장위"],
      ["unrevealed", "???"],
    ],
    supporting: [
      ["lucy", "루시"], ["rose", "아르다"], ["mia", "하나리"],
      ["bran", "이보리아"], ["aiherde", "아이헤르데"], ["edan", "기루스"],
      ["bord", "보르드"], ["godric", "고드릭"],
    ],
  };
  const mareri = {
    "id": "mareri",
    "name": "마르에리",
    "portraitSrc": "assets/person-mareri.webp",
    "portraitKind": "title",
    "tags": [
      "하프엘프",
      "정령술사",
      "애주가",
      "앳된 외견",
      "시니컬",
      "251세"
    ],
    "role": "주정뱅이 정령사",
    "summary": "주정뱅이 정령사",
    "body": "그린스토아 이곳저곳을 돌아다니며 상등품 술을 찾는 정령술사입니다. 소요를 좋아하여 자연발생하듯 나타나 짧게 머무르는 생활을 하며, 이따금씩 그린스토아 밖에서도 나타나고는 합니다. 앳되어보이는 외견과 달리 나이가 많은 편이고 하루 종일 술과 함께하며 성격도 시니컬합니다. 예법이나 지위같은 고리타분한 것들은 그녀의 취향이 아닙니다."
  };
  const personRelationships = {
    edan: [
      { targetId: "lucy", relation: "길드의 접수원입니다. 능률이 좋은 것 같습니다.", emotion: "neutral" },
      { targetId: "bran", relation: "...함구하겠습니다.", emotion: "neutral" },
      { targetId: "mia", relation: "월화국 출신의 모험가라는군요. 이질적인 기운이 느껴집니다.", emotion: "neutral" },
    ],
    aiherde: [
      { targetId: "godric", relation: "...간신배", emotion: "neutral" },
      { targetId: "lucy", relation: "접수원.", emotion: "neutral" },
      { targetId: "edan", relation: "충신이다.", emotion: "neutral" },
    ],
    bran: [
      { targetId: "mia", relation: "술친구 겸 동료. 좀 깐깐해 보여도 은근 마음이 잘 맞아서 말이야!", emotion: "neutral" },
      { targetId: "lucy", relation: "접수원. 피곤에 안 절어있으면 어떤 모습일까 싶은걸! 은퇴하지 않는 이상 불가능하겠지만.", emotion: "neutral" },
    ],
    mia: [
      { targetId: "bran", relation: "얼마 전에 친해졌어. 뭐, 가끔은 너무 앞서갈 때도 있지만, 괜찮은 녀석이야.", emotion: "neutral" },
      { targetId: "lucy", relation: "접수원. 인기가 많은가 봐. 맡은 일만 열심히 해주면 그만이지만.", emotion: "neutral" },
    ],
    rose: [
      { targetId: "carola", relation: "우유나 치즈를 가끔 공수해와용. 그린스토아산은 역시 달라용.", emotion: "neutral" },
      { targetId: "lucy", relation: "길드의 접수원님이세용. 자주 마주치진 않지만 착해보이세용.", emotion: "neutral" },
      { targetId: "bran", relation: "가끔씩 잔뜩 취한 채로 잡화점에 올 때가 있는데... 곤란해용...", emotion: "neutral" },
    ],
    lucy: [
      { targetId: "bran", relation: "길드에 상주하다시피 하는 모험가님이시죠. 몸에 붕대만 두르고 다니시는데, 안 춥나?", emotion: "neutral" },
      { targetId: "mia", relation: "비교적 최근에 오신 분이세요. 월화국 출신이라던데,.. 말은 별로 안 나눠봤지만, 마력이랑 다른 기운이 나긴 하더라고요.", emotion: "neutral" },
      { targetId: "rose", relation: "길드 근처 잡화점의 주인이에요. 자주 마주치진 않지만 말투가 특이해서 기억에 남네요. 그린스토아로 물건을 납품할 때도 있다고 해요.", emotion: "neutral" },
      { targetId: "edan", relation: "기사단의 일원이세요. 성격은 조금 딱딱하시지만, 그럴 수 밖에 없는 자리니까요. 사석에서의 모습이 궁금하긴 해요.", emotion: "neutral" },
    ],
    mareri: [
      { targetId: "henia", relation: "고지식한 녀석", emotion: "neutral" },
      { targetId: "helen", relation: "술친구", emotion: "neutral" },
      { targetId: "aran", relation: "어리버리.", emotion: "neutral" },
    ],
    henia: [
      { targetId: "scout", relation: "악우. 정말 안타깝구나, 카니아. 하이엘프라면 응당 품위를 차리는게 종족에 대한 예의 아니겠니? 정찰대같은 진흙탕이 아니라.", emotion: "puzzled" },
      { targetId: "klone", relation: "이해 불가. 왜 저런 천쪼가리만 걸치고 다니는 거니?", emotion: "annoyed" },
      { targetId: "helen", relation: "인정하는 전임 지도자. 헬렌 님의 체면을 생각해서 순순히 지내는 거란다. 절대 내가 무시당하는 게 아니고!", emotion: "flustered" },
    ],
    scout: [
      { targetId: "henia", relation: "악우. 온실 속 화초 주제에 정찰대를 흉본다!", emotion: "annoyed" },
      { targetId: "klone", relation: "신뢰하는 탐구자. 거적데기만 걸쳐 눈 둘 곳이 없다...", emotion: "flustered" },
      { targetId: "remu", relation: "신뢰하는 대장장이. 능률이 대단하군.", emotion: "neutral" },
      { targetId: "helen", relation: "존경하는 전임 지도자. 헬렌 님께는 예를 갖춰라!", emotion: "neutral" },
      { targetId: "aran", relation: "현임 지도자. 신뢰한다만... 아니, 아니!", emotion: "flustered" },
    ],
    helen: [
      { targetId: "aran", relation: "딸. 기특하게 잘 해주고 있어~", emotion: "neutral" },
      { targetId: "scout", relation: "믿음직한 아이. 놀리는게 재밌고 귀여워~.", emotion: "neutral" },
      { targetId: "henia", relation: "고양이같은 아이. 틱틱대면서도 주눅드는게 귀여워~", emotion: "neutral" },
      { targetId: "klone", relation: "똑똑한 마법탐구자. 옷차림 덕분에 시민들을 놀래키곤 하지만... 말은 잘 통해~", emotion: "neutral" },
      { targetId: "mareri", relation: "술친구. 허울없는 모습이 맘에 들어~", emotion: "neutral" },
    ],
    aran: [
      { targetId: "helen", relation: "존경하는 어머니. 기대에 부응할 수 있었으면 좋겠다.", emotion: "neutral" },
      { targetId: "scout", relation: "신뢰하는 동료. 발빠르게 움직이며 소식을 빠르게 알려준다.", emotion: "neutral" },
      { targetId: "klone", relation: "뛰어난 마법탐구자. 정말 유능하지만 그... 그 옷차림 만큼은! 어떻게 안 되겠나앗...", emotion: "flustered" },
      { targetId: "remu", relation: "믿을 수 있는 대장장이. 직접적 만남은 뜸하지만 정찰대의 무기를 수리해주는 고마운 녀석이다.", emotion: "neutral" },
      { targetId: "henia", relation: "마법은 뛰어난 영애. 카니아와 티격대는 것을 많이 봤는데, 서로 친한가...?", emotion: "puzzled" },
    ],
    klone: [
      { targetId: "helen", relation: "대화가 잘 통하는 전 지도자. 헬렌 님의 지원 덕에 많은 마법식을 만들고 개량했다.", emotion: "neutral" },
      { targetId: "henia", relation: "피곤하게 사는 영애. 다른 문화를 비난할 생각은 없다만, 귀찮은 껍데기 안에서 살아가는 건 분명하군.", emotion: "neutral" },
      { targetId: "rael", relation: "흥미로운 용족. 용족의 지능과 압도적인 마력에 관심이 가는군. 기회가 된다면 만남을 가지고 싶다.", emotion: "neutral" },
    ],
    remu: [
      { targetId: "ellen", relation: "무서운 사람. 자꾸 대장간에 찾아와서 놀린다니까요!", emotion: "flustered" },
      { targetId: "scout", relation: "정찰병 님. 이따금씩 활을 손질해달라고 찾아오시는데, 저는 금속 외에는 잘...", emotion: "puzzled" },
      { targetId: "sena", relation: "정문의 강시. 상권까지 오지는 않지만... 분명 좋은 사람일 거에요!", emotion: "neutral" },
    ],
    runya: [
      { targetId: "shunya", relation: "친한 친구. 사람들 물건 좀 그만 훔치란 말이야...! 점찍는 것도 안 돼!", emotion: "annoyed" },
      { targetId: "helen", relation: "전임 지도자님. 만나볼 기회는 많이 없지만... 월광 마법을 정말 잘 다루세요.", emotion: "neutral" },
      { targetId: "ellen", relation: "소문의 주인공...? 저, 저는 직접 보기까지는 안 믿을래요.", emotion: "puzzled" },
    ],
    shunya: [
      { targetId: "runya", relation: "친한 친구. 답답하다냐! 내 손에 들어오면 내 거다냐.", emotion: "annoyed" },
      { targetId: "carola", relation: "우유...! 가끔씩 우유를 준다냐. 여기 목장 우유는 맛있다냐.", emotion: "neutral" },
    ],
    sif: [
      { targetId: "hero", targetType: "player", relation: "모험가 님. 혹시, 괜찮으시면 대화라도...!", emotion: "flustered" },
      { targetIds: ["aran", "helen"], relation: "이 곳의 지도자. 명성은 알고 있어요...", emotion: "neutral" },
      { targetId: "carola", relation: "목장 주인. 목장의 우유에 관심이 있어요. 그리고 저한텐 없는 활력도 느껴져요.", emotion: "neutral" },
    ],
    rael: [
      { targetId: "klone", relation: "흥미로운 학자. 여러가지 지식과 마법식이 눈에 띄는군, 만나봐도 좋을 사람이지.", emotion: "neutral" },
      { targetId: "sena", relation: "정문 근처에서 떠도는 언데드 녀석. 쓸데없는 걱정을 하는 것 같더군.", emotion: "neutral" },
    ],
    carola: [
      { targetId: "sif", relation: "귀여운 손님. 얌전한 부잣집 아가씨 같은데, 우유에 관심있는게 귀여워!", emotion: "neutral" },
      { targetId: "helen", relation: "믿음직한 전 지도자님이시지! 헬렌 님과는 성격이 잘 맞아서 좋았어. 바쁘셔서 만나뵐 기회는 많이 없었지만.", emotion: "neutral" },
      { targetId: "aran", relation: "지도자에겐 예를 차리지만, 솔직히 속으로는 귀엽고 기특한 아가씨라고 생각하고 있어. 전임의 품위를 지키기 위해 열심이니까!", emotion: "neutral" },
      { targetId: "scout", relation: "서부까지 순찰을 돌 때 많이 만나. 툴툴대면서도 할 일은 꼼꼼히 하는 괜찮은 녀석이지. 언젠가 남자 하나 물어 은퇴하지 않으려나?", emotion: "neutral" },
      { targetId: "bord", relation: "카니아와 가끔씩 같이 순찰을 돌더군. 성격은 좀 고약해도 본성은 착한 녀석이야. 우유 한 병 주면 좋아하더라고.", emotion: "neutral" },
      { targetId: "mareri", relation: "목장 근처 그늘에서 잠을 자곤 해. 내쫓기 뭐하잖아? 낮잠 잘 곳을 주는 대신 정령들의 도움을 좀 받고 있지. 덕분에 일할 때도 덥지 않아.", emotion: "neutral" },
      { targetId: "remu", relation: "목장 기구가 고장나도 걱정거리가 없는건 이 친구 덕분이지. 서로서로 잘 되고 있어서 좋아.", emotion: "neutral" },
      { targetId: "shunya", relation: "사고뭉치. 옆에 있는 흰 녀석이 없었다면 아마 정말 큰 사고를 치겠지. 그럴 일은 없겠지만 말야.", emotion: "neutral" },
      { targetId: "runya", relation: "소심해도 할 말은 다 하는게 귀여워. 검은 녀석한테 휘둘리긴 하지만, 서로 아끼는게 보인단 말이지.", emotion: "neutral" },
      { targetId: "rose", relation: "그린스토아 말고도 제르디아에 납품할 기회가 있었는데, 제빵이 취미인 녀석이 있더라고. 밝고 선량한게 맘에 들어.", emotion: "neutral" },
      { targetIds: ["henia", "klone"], relation: "안면 정도는 텄어. 둘 다 만날 일이 별로 없어서 말이야.", emotion: "neutral" },
      { targetId: "ellen", relation: "낮에는 아주 가끔씩 보는데, 자세히는 모르고... 소문으로는 알고 있어.", emotion: "neutral" },
    ],
    seia: [
      { targetId: "sena", relation: "겁 많은 녀석. 놀래키기 좋아!", emotion: "neutral" },
    ],
    sena: [
      { targetId: "remu", relation: "몇 번 본 적 있어요... 좋으신 분이에요.", emotion: "neutral" },
      { targetId: "seia", relation: "어...어딘가에서 자꾸 나타나고... 막... 놀래켜요...!!!", emotion: "flustered" },
      { targetId: "ellen", relation: "소문의 주인공이래요... 무서워요...", emotion: "flustered" },
    ],
    ellen: [
      { targetId: "remu", relation: "반응 재밌는 슬라임. 이번엔 어떻게 놀려먹어야 할까나~?", emotion: "neutral" },
      { targetId: "sena", relation: "몸매 좋은 겁쟁이. 흉악한 걸 달고 다니면서, 겁은 엄청 많다니까~", emotion: "neutral" },
    ],
  };
  const reactionAssets = { scout: "kania", henia: "henia", helen: "helen", aran: "aran", remu: "remu", ellen: "elena", unrevealed: "unknown" };
  const reactionGrids = {};
  for (const [asset, members] of Object.entries({
    casta: ["mareri", "klone", "runya", "shunya"],
    castb: ["sif", "rael", "carola", "seia"],
    castc: ["sena", "lucy", "rose"],
    castd: ["mia", "bran", "edan"],
  })) members.forEach((id, row) => {
    reactionAssets[id] = asset;
    reactionGrids[id] = { columns: 4, rows: members.length, start: row * 4 };
  });
  const mystery = {
    id: "unrevealed", name: "???", portraitKind: "unrevealed",
    portraitSrc: "assets/person-unknown.webp", portraitAspect: 1216 / 704, portraitEffect: "arcane",
    tags: [], role: "", summary: "",
    body: "(아무 것도 쓰이지 않았다. 혹은, 당신이 인식할 수 없는 무언가로 가득 찬 페이지이다.)",
  };
  const people = peopleGroups.flatMap(group => roster[group.id].map(([id, name]) => {
    const recorded = id === "mareri" ? mareri : id === "unrevealed" ? mystery : recordedPeople.find(person => person.id === id);
    const relationships = personRelationships[id] || [];
    const reactionAsset = reactionAssets[id] || "";
    const reactionGrid = reactionAsset ? reactionGrids[id] || { columns: 2, rows: 2, start: 0 } : null;
    if (recorded) return { ...recorded, portraitKind: recorded.portraitKind || "actor", group: group.id, relationships, reactionAsset, reactionGrid };
    // Unannounced cast members have their own entries, never another actor's biography or art.
    return {
      id, name, group: group.id, portraitSrc: "", portraitKind: "unrevealed", relationships, reactionAsset, reactionGrid,
      tags: ["미공개"], role: group.title,
      summary: "자세한 인물 정보는 아직 공개되지 않았다.",
      body: "이 인물의 모습과 자세한 이야기는 아직 공개되지 않았다.",
    };
  }));
  const holder = document.querySelector("#chronicle-art");
  const art = Object.fromEntries(scenes.map(scene => {
    const image = new Image();
    image.src = holder.dataset[scene.asset + "Src"];
    return [scene.asset, image];
  }));
  const ready = Promise.all(Object.values(art).map((image) => image.decode()));
  ready.catch(() => {});
  function paintChapter(canvas, index) {
    const scene = scenes[index],
      image = art[scene.asset],
      c = canvas.getContext("2d");
    if (!image.naturalWidth) return;
    const w = image.naturalWidth,
      h = image.naturalHeight,
      scale = Math.min(canvas.width / w, canvas.height / h);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(
      image,
      (canvas.width - w * scale) / 2,
      (canvas.height - h * scale) / 2,
      w * scale,
      h * scale,
    );
    canvas.dataset.chapter = String(index);
    canvas.setAttribute("aria-label", scene.art);
  }
  return { scenes, articles, people, peopleGroups, ready, paintChapter };
})();
