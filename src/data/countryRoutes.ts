/**
 * Country-wide common cities & classic visitor routes.
 *
 * Product principle: when the user enters a COUNTRY (英國 / 法國 / 瑞士…),
 * propose the cities and classic routes normal travelers cover — not only the
 * capital and its day-trips. Duration must scale with how many regions they keep.
 *
 * - One country → propose common cities + route packages for select/add
 * - Several countries → each country expands to its major visitor cities;
 *   total days should roughly add, not collapse to one city-break
 */

export interface RouteCity {
  id: string
  nameZh: string
  nameLocal: string
  /** Nation / region label e.g. 英格蘭、蘇格蘭、愛爾蘭 */
  region: string
  /** Typical nights visitors spend in this base */
  typicalNights: number
  /** Short why-visit line */
  blurb: string
  /** Seed highlight spots for this city (used before AI research) */
  highlights: string[]
  /** Pre-selected in the default “經典” package */
  defaultSelected?: boolean
}

export interface CommonRoutePackage {
  id: string
  nameZh: string
  summary: string
  /** RouteCity ids included */
  cityIds: string[]
  minDays: number
  comfortableDays: number
  suggestedLongest: number
}

export interface CountryRouteProfile {
  /** Match user-typed destination names */
  match: RegExp
  /** Exclude when user clearly wants a single city only */
  exclude?: RegExp
  countryNameZh: string
  tagline: string
  intro: string
  background: string
  memorable: string[]
  cities: RouteCity[]
  routes: CommonRoutePackage[]
  /** Default package id when user just types the country name */
  defaultRouteId: string
  tips: string[]
}

export const COUNTRY_ROUTE_PROFILES: CountryRouteProfile[] = [
  {
    match:
      /^(英國|UK|United Kingdom|Britain|大不列顛|英倫)$|英國(?!.*倫敦)|UK(?!.*London)|England.*Scotland|英格蘭.*蘇格蘭/i,
    exclude: /^(倫敦|London|愛丁堡|Edinburgh|曼徹斯特|Manchester)$/i,
    countryNameZh: '英國',
    tagline: '英格蘭・蘇格蘭・愛爾蘭 — 多城經典路線，不是倫敦一日遊',
    intro:
      '「英國」對一般旅客通常不只倫敦：英格蘭（倫敦、巴斯、牛津／劍橋、約克／湖區）、蘇格蘭（愛丁堡、高地）與愛爾蘭／北愛（都柏林、巨人堤）才是常見涵蓋範圍。請先勾選想去的城市或套用經典路線；全走重要景點往往需要 18–28 天，不是 10 天首都圈。',
    background:
      '聯合王國由英格蘭、蘇格蘭、威爾斯與北愛爾蘭組成；許多華語旅客說的「英國行程」也會把愛爾蘭共和國的都柏林算進同一趟島國之旅。首都倫敦是門面，但約克的中世紀街巷、巴斯的羅馬浴場、愛丁堡的火山城堡與愛爾蘭的海岸公路，才是「走一趟英倫」的完整印象。',
    memorable: [
      '倫敦泰晤士河畔與博物館半日，只是英格蘭的開場白',
      '巴斯石造街與羅馬浴場的溫泉蒸汽',
      '愛丁堡城堡俯瞰皇家英里的風',
      '約克或湖區的慢節奏，對比首都完全不同',
      '若加愛爾蘭：都柏林酒吧與巨人堤的玄武岩海岸',
    ],
    defaultRouteId: 'uk-england-scotland',
    cities: [
      {
        id: 'london',
        nameZh: '倫敦',
        nameLocal: 'London',
        region: '英格蘭',
        typicalNights: 4,
        blurb: '首都精華：博物館、泰晤士河、西區與近郊溫莎／Outlet 一日購',
        highlights: ['大英博物館', '塔橋', '大本鐘', '白金漢宮', 'Bicester Village'],
        defaultSelected: true,
      },
      {
        id: 'bath',
        nameZh: '巴斯',
        nameLocal: 'Bath',
        region: '英格蘭',
        typicalNights: 1,
        blurb: '羅馬浴場與喬治亞石造城，英格蘭南部經典',
        highlights: ['羅馬浴場', '巴斯修道院', '皇家新月樓'],
        defaultSelected: true,
      },
      {
        id: 'oxford-cambridge',
        nameZh: '牛津／劍橋',
        nameLocal: 'Oxford / Cambridge',
        region: '英格蘭',
        typicalNights: 1,
        blurb: '學院城擇一或兩城輕訪；也可與倫敦連線',
        highlights: ['牛津大學', '劍橋大學', '學院橋'],
        defaultSelected: true,
      },
      {
        id: 'stonehenge',
        nameZh: '巨石陣',
        nameLocal: 'Stonehenge',
        region: '英格蘭',
        typicalNights: 0,
        blurb: '常與巴斯同日或溫莎連線的史前巨石',
        highlights: ['巨石陣'],
        defaultSelected: true,
      },
      {
        id: 'york',
        nameZh: '約克',
        nameLocal: 'York',
        region: '英格蘭',
        typicalNights: 2,
        blurb: '中世紀古城與大教堂，北上蘇格蘭常見停點',
        highlights: ['約克大教堂', '肉舖街 Shambles'],
        defaultSelected: true,
      },
      {
        id: 'lake',
        nameZh: '湖區',
        nameLocal: 'Lake District',
        region: '英格蘭',
        typicalNights: 2,
        blurb: '英格蘭自然經典；舒服版常加 1–2 晚',
        highlights: ['溫德米爾湖', '湖區國家公園'],
      },
      {
        id: 'edinburgh',
        nameZh: '愛丁堡',
        nameLocal: 'Edinburgh',
        region: '蘇格蘭',
        typicalNights: 3,
        blurb: '蘇格蘭門面：城堡、皇家英里與威士忌',
        highlights: ['愛丁堡城堡', '皇家英里大道', '亞瑟王座'],
        defaultSelected: true,
      },
      {
        id: 'highlands',
        nameZh: '蘇格蘭高地',
        nameLocal: 'Scottish Highlands',
        region: '蘇格蘭',
        typicalNights: 2,
        blurb: '湖泊、城堡與風景公路；建議獨立留日',
        highlights: ['尼斯湖', '格蘭芬南高架橋', '高地風光'],
      },
      {
        id: 'cardiff',
        nameZh: '卡地夫',
        nameLocal: 'Cardiff',
        region: '威爾斯',
        typicalNights: 1,
        blurb: '威爾斯首都；想蓋全聯合王國時可加',
        highlights: ['卡地夫城堡'],
      },
      {
        id: 'liverpool',
        nameZh: '利物浦',
        nameLocal: 'Liverpool',
        region: '英格蘭',
        typicalNights: 1,
        blurb: '披頭四與碼頭區；北英格蘭串線可停',
        highlights: ['披頭四故事館', '阿爾伯特碼頭'],
      },
      {
        id: 'dublin',
        nameZh: '都柏林',
        nameLocal: 'Dublin',
        region: '愛爾蘭',
        typicalNights: 3,
        blurb: '愛爾蘭共和國首都；華語旅客常與英國行程合開',
        highlights: ['三一學院', '聖詹姆斯門啤酒廠', '神殿酒吧區'],
      },
      {
        id: 'giants',
        nameZh: '巨人堤道／貝爾法斯特',
        nameLocal: "Giant's Causeway / Belfast",
        region: '北愛爾蘭',
        typicalNights: 2,
        blurb: '北愛海岸與冰火經典取景；可接蘇格蘭或都柏林',
        highlights: ['巨人堤道', '貝爾法斯特泰坦尼克號館'],
      },
    ],
    routes: [
      {
        id: 'uk-london-core',
        nameZh: '倫敦＋英格蘭南（短假期）',
        summary: '首都＋巴斯／巨石／學院城，約一週級',
        cityIds: ['london', 'bath', 'oxford-cambridge', 'stonehenge'],
        minDays: 6,
        comfortableDays: 9,
        suggestedLongest: 12,
      },
      {
        id: 'uk-england-scotland',
        nameZh: '英格蘭＋蘇格蘭經典',
        summary: '倫敦—南英格蘭—約克—愛丁堡，最常見的「英國」長度',
        cityIds: [
          'london',
          'bath',
          'oxford-cambridge',
          'stonehenge',
          'york',
          'edinburgh',
        ],
        minDays: 12,
        comfortableDays: 16,
        suggestedLongest: 21,
      },
      {
        id: 'uk-full-isles',
        nameZh: '英格蘭＋蘇格蘭＋愛爾蘭／北愛',
        summary: '三島重要場景；舒服走完常需三週以上',
        cityIds: [
          'london',
          'bath',
          'oxford-cambridge',
          'stonehenge',
          'york',
          'lake',
          'edinburgh',
          'highlands',
          'dublin',
          'giants',
        ],
        minDays: 18,
        comfortableDays: 24,
        suggestedLongest: 32,
      },
    ],
    tips: [
      '先選路線或勾城市：系統用你勾的城市估算天數，而不是預設只有倫敦。',
      '倫敦近郊（溫莎、Bicester Village、巨石陣）可當日往返；愛丁堡／都柏林請當過夜城。',
      '英格蘭＋蘇格蘭舒適版多在兩週上下；再加愛爾蘭／高地請往 20 天以上想。',
    ],
  },
  {
    match: /^(法國|France|FR)$|法國(?!.*巴黎)|France(?!.*Paris)/i,
    exclude: /^(巴黎|Paris|尼斯|Nice|里昂|Lyon)$/i,
    countryNameZh: '法國',
    tagline: '巴黎只是門面 — 普羅旺斯、羅亞爾、南部海岸常見串線',
    intro:
      '「法國」行程對一般旅客常含：巴黎、羅亞爾河谷城堡、里昂或勃艮第、普羅旺斯／蔚藍海岸。若只去巴黎，請直接輸入「巴黎」。全國重要場景舒服走完往往 14–21 天。',
    background:
      '法國從巴黎盆地到地中海與阿爾卑斯，飲食、酒莊與城市性格差異很大。首都美術館是門面，羅亞爾城堡、普羅旺斯薰衣草與尼斯海岸才構成「走一趟法國」的常見地圖。',
    memorable: [
      '巴黎塞納河與博物館半日',
      '羅亞爾河谷城堡的花園與石階',
      '普羅旺斯或蔚藍海岸的陽光與市集',
      '里昂老城與美食傳統',
    ],
    defaultRouteId: 'fr-classic',
    cities: [
      {
        id: 'paris',
        nameZh: '巴黎',
        nameLocal: 'Paris',
        region: '法蘭西島',
        typicalNights: 4,
        blurb: '美術館、塞納河與街區漫遊',
        highlights: ['羅浮宮', '艾菲爾鐵塔', '聖母院周邊', '蒙馬特'],
        defaultSelected: true,
      },
      {
        id: 'versailles',
        nameZh: '凡爾賽',
        nameLocal: 'Versailles',
        region: '法蘭西島',
        typicalNights: 0,
        blurb: '巴黎近郊經典一日',
        highlights: ['凡爾賽宮'],
        defaultSelected: true,
      },
      {
        id: 'loire',
        nameZh: '羅亞爾河谷',
        nameLocal: 'Loire Valley',
        region: '中央羅亞爾',
        typicalNights: 2,
        blurb: '城堡群一日或兩日',
        highlights: ['香波堡', '雪儂梭城堡'],
        defaultSelected: true,
      },
      {
        id: 'lyon',
        nameZh: '里昂',
        nameLocal: 'Lyon',
        region: '奧弗涅－隆河',
        typicalNights: 2,
        blurb: '美食之都與老城',
        highlights: ['里昂老城', '富維耶山'],
        defaultSelected: true,
      },
      {
        id: 'provence',
        nameZh: '普羅旺斯',
        nameLocal: 'Provence',
        region: '普羅旺斯',
        typicalNights: 2,
        blurb: '市集、古城與季節花田',
        highlights: ['亞維農', '亞爾', '艾克斯'],
      },
      {
        id: 'nice',
        nameZh: '尼斯／蔚藍海岸',
        nameLocal: 'Nice / Côte d’Azur',
        region: '蔚藍海岸',
        typicalNights: 3,
        blurb: '地中海海岸線經典',
        highlights: ['尼斯舊城', '埃茲', '摩納哥'],
        defaultSelected: true,
      },
      {
        id: 'bordeaux',
        nameZh: '波爾多',
        nameLocal: 'Bordeaux',
        region: '新阿基坦',
        typicalNights: 2,
        blurb: '酒莊與河岸城市',
        highlights: ['波爾多舊城', '酒莊體驗'],
      },
      {
        id: 'strasbourg',
        nameZh: '史特拉斯堡',
        nameLocal: 'Strasbourg',
        region: '阿爾薩斯',
        typicalNights: 1,
        blurb: '東法德法風情；可接瑞士',
        highlights: ['大教堂', '小法國區'],
      },
    ],
    routes: [
      {
        id: 'fr-paris-only-plus',
        nameZh: '巴黎＋近郊',
        summary: '城市遊尺度，約一週',
        cityIds: ['paris', 'versailles'],
        minDays: 5,
        comfortableDays: 7,
        suggestedLongest: 10,
      },
      {
        id: 'fr-classic',
        nameZh: '巴黎＋羅亞爾＋里昂＋蔚藍海岸',
        summary: '最常見的法國多城路線',
        cityIds: ['paris', 'versailles', 'loire', 'lyon', 'nice'],
        minDays: 12,
        comfortableDays: 16,
        suggestedLongest: 21,
      },
      {
        id: 'fr-grand',
        nameZh: '法國大環線（含普羅旺斯／酒鄉）',
        summary: '重要場景較完整；建議三週級',
        cityIds: [
          'paris',
          'versailles',
          'loire',
          'lyon',
          'provence',
          'nice',
          'bordeaux',
          'strasbourg',
        ],
        minDays: 18,
        comfortableDays: 24,
        suggestedLongest: 32,
      },
    ],
    tips: [
      '輸入「法國」會展開多城；若只想首都請改輸入「巴黎」。',
      'TGV 串線為主；同一城景點排同一天。',
    ],
  },
  {
    match: /^(瑞士|Switzerland|Swiss)$|瑞士(?!.*蘇黎世)|Switzerland/i,
    exclude: /^(蘇黎世|Zurich|日內瓦|Geneva|因特拉肯|Interlaken)$/i,
    countryNameZh: '瑞士',
    tagline: '湖光山城串線 — 不是單一城市假期',
    intro:
      '瑞士常見旅客路線含蘇黎世／琉森、因特拉肯（少女峰）、策馬特／馬特洪峰、日內瓦或伯恩。山區移動與景觀列車需要天數；舒服版多在 10–14 天，不是只排一座城。',
    background:
      '瑞士以鐵路精準度與阿爾卑斯山城聞名。旅客很少只停首都：琉森的湖、因特拉肯的少女峰、策馬特的馬特洪峰，才是明信片級的組合。',
    memorable: [
      '琉森木橋與湖面蒸汽船',
      '少女峰景觀列車的雪白',
      '策馬特無車村與馬特洪峰三角峰',
      '伯恩舊城或日內瓦湖畔的安靜午後',
    ],
    defaultRouteId: 'ch-classic',
    cities: [
      {
        id: 'zurich',
        nameZh: '蘇黎世',
        nameLocal: 'Zürich',
        region: '蘇黎世州',
        typicalNights: 2,
        blurb: '進出門户與湖畔城市',
        highlights: ['蘇黎世舊城', '蘇黎世湖'],
        defaultSelected: true,
      },
      {
        id: 'lucerne',
        nameZh: '琉森',
        nameLocal: 'Lucerne',
        region: '琉森州',
        typicalNights: 2,
        blurb: '湖、木橋與皮拉圖斯山',
        highlights: ['卡貝爾橋', '琉森湖', '皮拉圖斯山'],
        defaultSelected: true,
      },
      {
        id: 'interlaken',
        nameZh: '因特拉肯／少女峰',
        nameLocal: 'Interlaken / Jungfrau',
        region: '伯恩高地',
        typicalNights: 3,
        blurb: '瑞士山景核心，建議多留',
        highlights: ['少女峰', '格林德瓦', '勞特布倫南'],
        defaultSelected: true,
      },
      {
        id: 'zermatt',
        nameZh: '策馬特',
        nameLocal: 'Zermatt',
        region: '瓦萊州',
        typicalNights: 2,
        blurb: '馬特洪峰無車村',
        highlights: ['馬特洪峰', '戈爾內格拉特'],
        defaultSelected: true,
      },
      {
        id: 'geneva',
        nameZh: '日內瓦',
        nameLocal: 'Geneva',
        region: '日內瓦州',
        typicalNights: 1,
        blurb: '西瑞士湖畔；可接法國',
        highlights: ['噴泉', '日內瓦老城'],
      },
      {
        id: 'bern',
        nameZh: '伯恩',
        nameLocal: 'Bern',
        region: '伯恩州',
        typicalNights: 1,
        blurb: '首都舊城世界遺產',
        highlights: ['伯恩舊城', '鐘樓'],
      },
    ],
    routes: [
      {
        id: 'ch-highlights',
        nameZh: '琉森＋少女峰精華',
        summary: '短假期山湖精華',
        cityIds: ['zurich', 'lucerne', 'interlaken'],
        minDays: 6,
        comfortableDays: 9,
        suggestedLongest: 12,
      },
      {
        id: 'ch-classic',
        nameZh: '蘇黎世－琉森－少女峰－策馬特',
        summary: '最常見的瑞士多城山景線',
        cityIds: ['zurich', 'lucerne', 'interlaken', 'zermatt'],
        minDays: 9,
        comfortableDays: 12,
        suggestedLongest: 16,
      },
      {
        id: 'ch-grand',
        nameZh: '瑞士大環線',
        summary: '東西瑞士都蓋到；可到兩週以上',
        cityIds: ['zurich', 'lucerne', 'interlaken', 'zermatt', 'bern', 'geneva'],
        minDays: 12,
        comfortableDays: 16,
        suggestedLongest: 21,
      },
    ],
    tips: [
      '山區天氣多變，少女峰／策馬特請留彈性日。',
      '瑞士火車準點但票價高；可評估瑞士通行證。',
    ],
  },
  {
    match: /^(愛爾蘭|Ireland)$|愛爾蘭(?!.*都柏林)/i,
    exclude: /^(都柏林|Dublin)$/i,
    countryNameZh: '愛爾蘭',
    tagline: '都柏林＋西海岸（ Cliffs / Ring of Kerry ）常見串線',
    intro:
      '愛爾蘭不只都柏林：西海岸懸崖、凱爾特小鎮與鄉村公路才是精華。舒服版常 8–12 天；若與英國合開請分開估算天數。',
    background:
      '愛爾蘭共和國以文學、音樂與大西洋海岸聞名。旅客常以都柏林為門户，再西進高威或凱瑞環線。',
    memorable: [
      '都柏林神殿酒吧區的現場樂',
      '莫赫懸崖的大西洋風',
      '鄉村公路與彩色屋小鎮',
    ],
    defaultRouteId: 'ie-classic',
    cities: [
      {
        id: 'dublin',
        nameZh: '都柏林',
        nameLocal: 'Dublin',
        region: '倫斯特',
        typicalNights: 3,
        blurb: '首都文化與酒吧',
        highlights: ['三一學院', '聖詹姆斯門', '神殿酒吧區'],
        defaultSelected: true,
      },
      {
        id: 'galway',
        nameZh: '高威／莫赫懸崖',
        nameLocal: 'Galway / Cliffs of Moher',
        region: '康諾特',
        typicalNights: 2,
        blurb: '西海岸經典',
        highlights: ['莫赫懸崖', '高威舊城'],
        defaultSelected: true,
      },
      {
        id: 'kerry',
        nameZh: '凱瑞環線',
        nameLocal: 'Ring of Kerry',
        region: '芒斯特',
        typicalNights: 2,
        blurb: '西南半島風景公路',
        highlights: ['凱瑞環線', '基拉尼國家公園'],
        defaultSelected: true,
      },
      {
        id: 'cork',
        nameZh: '科克',
        nameLocal: 'Cork',
        region: '芒斯特',
        typicalNights: 1,
        blurb: '南部城市與附近海岸',
        highlights: ['科克英式市集'],
      },
    ],
    routes: [
      {
        id: 'ie-classic',
        nameZh: '都柏林＋西海岸',
        summary: '最常見愛爾蘭長度',
        cityIds: ['dublin', 'galway', 'kerry'],
        minDays: 7,
        comfortableDays: 10,
        suggestedLongest: 14,
      },
      {
        id: 'ie-grand',
        nameZh: '愛爾蘭環島精華',
        summary: '南北都停；可到兩週',
        cityIds: ['dublin', 'galway', 'kerry', 'cork'],
        minDays: 10,
        comfortableDays: 14,
        suggestedLongest: 18,
      },
    ],
    tips: ['自駕或一日團走懸崖；鄉間公車班次少請先查。'],
  },
]

/** Find a country profile for a user-typed place (country-level, not single city). */
export function findCountryRouteProfile(
  name: string,
): CountryRouteProfile | null {
  const text = name.trim()
  if (!text) return null
  // Pure single-city names never expand to a country tour.
  if (
    /^(倫敦|London|巴黎|Paris|蘇黎世|Zurich|都柏林|Dublin|愛丁堡|Edinburgh|尼斯|Nice|里昂|Lyon|日內瓦|Geneva)$/i.test(
      text,
    )
  ) {
    return null
  }
  for (const profile of COUNTRY_ROUTE_PROFILES) {
    if (profile.exclude?.test(text)) continue
    if (profile.match.test(text)) return profile
    // Phrases like「英國兩週」「瑞士山景慢遊」
    if (
      text.includes(profile.countryNameZh) ||
      (profile.countryNameZh === '英國' &&
        /UK|Britain|United Kingdom|英倫|大不列顛/i.test(text)) ||
      (profile.countryNameZh === '法國' && /France/i.test(text)) ||
      (profile.countryNameZh === '瑞士' && /Switzerland|Swiss/i.test(text)) ||
      (profile.countryNameZh === '愛爾蘭' && /Ireland/i.test(text))
    ) {
      return profile
    }
  }
  return null
}

export function defaultSelectedCityIds(profile: CountryRouteProfile): string[] {
  const route = profile.routes.find((r) => r.id === profile.defaultRouteId)
  if (route) return [...route.cityIds]
  return profile.cities.filter((c) => c.defaultSelected).map((c) => c.id)
}

export function citiesByIds(
  profile: CountryRouteProfile,
  cityIds: string[],
): RouteCity[] {
  const set = new Set(cityIds)
  return profile.cities.filter((c) => set.has(c.id))
}

/** Estimate days from selected cities / a route package. */
export function estimateDaysForCities(
  profile: CountryRouteProfile,
  cityIds: string[],
): { min: number; comfortable: number; suggestedLongest: number; note: string } {
  const route = profile.routes.find(
    (r) =>
      r.cityIds.length === cityIds.length &&
      r.cityIds.every((id) => cityIds.includes(id)),
  )
  if (route) {
    return {
      min: route.minDays,
      comfortable: route.comfortableDays,
      suggestedLongest: route.suggestedLongest,
      note: `${profile.countryNameZh}「${route.nameZh}」：最少約 ${route.minDays} 天，舒服 ${route.comfortableDays} 天，完整可到 ${route.suggestedLongest} 天。`,
    }
  }
  const cities = citiesByIds(profile, cityIds)
  const nights = cities.reduce((sum, c) => sum + Math.max(c.typicalNights, 0), 0)
  const transferBuffer = Math.max(0, cities.length - 1)
  const comfortable = Math.min(
    32,
    Math.max(5, nights + transferBuffer + 1),
  )
  const min = Math.max(4, Math.round(comfortable * 0.75))
  const longest = Math.min(32, comfortable + Math.max(3, Math.ceil(cities.length * 0.8)))
  return {
    min,
    comfortable,
    suggestedLongest: longest,
    note: `${profile.countryNameZh}：已選 ${cities.length} 個城市／區域，估約 ${min}–${comfortable} 天（完整可到 ${longest} 天）。勾越多城，天數應越長，不是首都週邊 10 天就能走完。`,
  }
}

/**
 * Broad country / nation-tour detector. Used so AI can propose agent-style
 * cities for ANY country — not only the curated UK/FR/CH/IE profiles.
 */
const COUNTRY_NAME_RE =
  /英國|UK|Britain|United Kingdom|英倫|法國|France|瑞士|Switzerland|愛爾蘭|Ireland|德國|Germany|Deutschland|義大利|意大利|Italy|西班牙|Spain|葡萄牙|Portugal|希臘|Greece|荷蘭|Netherlands|Holland|比利時|Belgium|奧地利|Austria|捷克|Czech|匈牙利|Hungary|波蘭|Poland|克羅埃西亞|Croatia|挪威|Norway|瑞典|Sweden|丹麥|Denmark|芬蘭|Finland|冰島|Iceland|土耳其|Turkey|Türkiye|摩洛哥|Morocco|埃及|Egypt|以色列|Israel|阿聯酋|UAE|杜拜|阿拉伯聯合大公國|日本|Japan|韓國|南韓|Korea|泰國|Thailand|越南|Vietnam|馬來西亞|Malaysia|印尼|Indonesia|菲律賓|Philippines|新加坡|Singapore|台灣|臺灣|Taiwan|中國|China|美國|USA|United States|加拿大|Canada|墨西哥|Mexico|巴西|Brazil|阿根廷|Argentina|秘魯|Peru|智利|Chile|澳洲|澳大利亞|Australia|紐西蘭|新西蘭|New Zealand|南非|South Africa|肯尼亞|Kenya|印度|India|斯里蘭卡|Sri Lanka|尼泊爾|Nepal|俄羅斯|Russia|烏克蘭|Ukraine|喬治亞|Georgia/i

const OBVIOUS_CITY_ONLY_RE =
  /^(倫敦|London|巴黎|Paris|羅馬|Rome|米蘭|Milan|威尼斯|Venice|佛羅倫斯|Florence|巴塞隆納|Barcelona|馬德里|Madrid|阿姆斯特丹|Amsterdam|維也納|Vienna|布拉格|Prague|柏林|Berlin|慕尼黑|Munich|蘇黎世|Zurich|日內瓦|Geneva|都柏林|Dublin|愛丁堡|Edinburgh|東京|Tokyo|大阪|Osaka|京都|Kyoto|首爾|Seoul|曼谷|Bangkok|新加坡|Singapore|台北|臺北|紐約|New York|洛杉磯|Los Angeles|舊金山|San Francisco|雪梨|Sydney|墨爾本|Melbourne|多倫多|Toronto|溫哥華|Vancouver|杜拜|Dubai|開羅|Cairo|伊斯坦堡|Istanbul|西安|大阪|京都)$/i

export function looksLikeCountryTourName(name: string): boolean {
  const text = name.trim()
  if (!text || OBVIOUS_CITY_ONLY_RE.test(text)) return false
  if (findCountryRouteProfile(text)) return true
  if (COUNTRY_NAME_RE.test(text)) return true
  // 「XX國」「共和國」等
  if (/國$|共和國|王國|聯邦|合衆國|合眾國/.test(text) && text.length <= 12) {
    return true
  }
  return false
}

/** Whether this name should use extended (country-tour) day ranges instead of city-break caps. */
export function isCountryTourName(name: string): boolean {
  return looksLikeCountryTourName(name)
}

/** Estimate days from lightweight city options (curated or AI-sourced). */
export function estimateDaysFromCityOptions(
  countryLabel: string,
  cities: {
    id: string
    nameZh: string
    typicalNights: number
  }[],
  cityIds: string[],
  routes?: {
    id: string
    nameZh: string
    cityIds: string[]
    minDays: number
    comfortableDays: number
    suggestedLongest: number
  }[],
): { min: number; comfortable: number; suggestedLongest: number; note: string } {
  const route = routes?.find(
    (r) =>
      r.cityIds.length === cityIds.length &&
      r.cityIds.every((id) => cityIds.includes(id)),
  )
  if (route) {
    return {
      min: route.minDays,
      comfortable: route.comfortableDays,
      suggestedLongest: route.suggestedLongest,
      note: `${countryLabel}「${route.nameZh}」：最少約 ${route.minDays} 天，舒服 ${route.comfortableDays} 天，完整可到 ${route.suggestedLongest} 天。`,
    }
  }
  const selected = cities.filter((c) => cityIds.includes(c.id))
  const nights = selected.reduce((sum, c) => sum + Math.max(c.typicalNights, 0), 0)
  const transferBuffer = Math.max(0, selected.length - 1)
  const comfortable = Math.min(32, Math.max(6, nights + transferBuffer + 1))
  const min = Math.max(5, Math.round(comfortable * 0.75))
  const longest = Math.min(
    32,
    comfortable + Math.max(3, Math.ceil(selected.length * 0.8)),
  )
  return {
    min,
    comfortable,
    suggestedLongest: longest,
    note: `${countryLabel}：已選 ${selected.length} 個城市／區域，估約 ${min}–${comfortable} 天（完整可到 ${longest} 天）。這是旅行社常見多城涵蓋，不是只玩首都。`,
  }
}

/** Build placeholder scenic seeds from selected route cities. */
export function routeCitiesToSpotSeeds(
  profile: CountryRouteProfile,
  cityIds: string[],
): {
  name: string
  tags: ('must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping')[]
  hours: number
  area: string
  summary: string
}[] {
  const cities = citiesByIds(profile, cityIds)
  return routeCityHighlightsToSeeds(cities, cityIds)
}

export function routeCityHighlightsToSeeds(
  cities: RouteCity[],
  cityIds: string[],
): {
  name: string
  tags: ('must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping')[]
  hours: number
  area: string
  summary: string
}[] {
  const set = new Set(cityIds)
  const seeds: {
    name: string
    tags: ('must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping')[]
    hours: number
    area: string
    summary: string
  }[] = []
  for (const city of cities.filter((c) => set.has(c.id))) {
    city.highlights.forEach((highlight, index) => {
      seeds.push({
        name: highlight,
        tags:
          index === 0
            ? ['must', 'photo', 'popular']
            : ['popular', 'photo'],
        hours: city.typicalNights === 0 ? 5 : index === 0 ? 3.5 : 2.5,
        area: `${city.nameZh}・${city.region}`,
        summary: `${highlight}是${city.nameZh}（${city.region}）常見必訪點。${city.blurb}`,
      })
    })
  }
  return seeds
}

/** AI / client payload for dynamic country routes. */
export type AiCountryRoutePayload = {
  isCountryTour: boolean
  countryNameZh: string
  tagline?: string
  intro?: string
  background?: string
  memorable?: string[]
  tips?: string[]
  defaultRouteId?: string
  cities: {
    id: string
    nameZh: string
    nameLocal: string
    region: string
    typicalNights: number
    blurb: string
    highlights: string[]
    defaultSelected?: boolean
  }[]
  routes: {
    id: string
    nameZh: string
    summary: string
    cityIds: string[]
    minDays: number
    comfortableDays: number
    suggestedLongest: number
  }[]
  recommendedDays?: {
    min: number
    comfortable: number
    suggestedLongest: number
    note: string
  }
}
