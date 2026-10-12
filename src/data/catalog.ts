import { registeredVideos } from "./video-library";
import type {
  SubjectId,
  Topic,
  VideoRecord,
  VideoTopicLink,
} from "../domain/types";

export const OFFICIAL_SITE = "https://kouki-honda.jp/youtube_hs-math/";
export const CHANNEL_ID = "UCZUPMvvW1ggn4gbSY741LdA";
export const QUADRATIC_PLAYLIST = "PLd3yb0oVJ_W20PQYfg3gGxtu6HJ4IaZ8W";
export const VERIFIED_ON = "2026-10-12";

export const subjects: {
  id: SubjectId;
  name: string;
  short: string;
  summary: string;
  symbol: string;
  units: string[];
}[] = [
  {
    id: "I",
    name: "数学Ⅰ",
    short: "Ⅰ",
    summary: "高校数学の土台をつくる",
    symbol: "x²",
    units: ["数と式", "集合と命題", "二次関数", "図形と計量", "データの分析"],
  },
  {
    id: "A",
    name: "数学A",
    short: "A",
    summary: "数え方と図形の考え方",
    symbol: "P",
    units: ["場合の数と確率", "図形の性質", "数学と人間の活動"],
  },
  {
    id: "II",
    name: "数学Ⅱ",
    short: "Ⅱ",
    summary: "関数の世界を広げる",
    symbol: "sin",
    units: [
      "いろいろな式",
      "図形と方程式",
      "指数関数・対数関数",
      "三角関数",
      "微分・積分の考え",
    ],
  },
  {
    id: "B",
    name: "数学B",
    short: "B",
    summary: "数列と統計を読み解く",
    symbol: "Σ",
    units: ["数列", "統計的な推測", "数学と社会生活"],
  },
  {
    id: "III",
    name: "数学Ⅲ",
    short: "Ⅲ",
    summary: "微分積分を深く学ぶ",
    symbol: "∫",
    units: ["極限", "微分法", "積分法"],
  },
  {
    id: "C",
    name: "数学C",
    short: "C",
    summary: "ベクトルと複素数の視点",
    symbol: "→",
    units: ["ベクトル", "平面上の曲線と複素数平面", "数学的な表現の工夫"],
  },
  {
    id: "junior",
    name: "中学数学",
    short: "中学",
    summary: "基本に戻って確かめる",
    symbol: "√",
    units: ["数と式", "図形", "関数", "データの活用"],
  },
  {
    id: "special",
    name: "総復習・入試・特別講義",
    short: "入試",
    summary: "学びをつなげて使う",
    symbol: "∞",
    units: ["総復習", "入試演習", "特別講義", "Shorts", "ライブアーカイブ"],
  },
];

const manual = {
  description: null,
  channelId: CHANNEL_ID,
  channelTitle: "超わかる！授業動画",
  publishedAt: null,
  durationSeconds: null,
  embeddable: null,
  fetchedAt: "2026-10-12",
  updatedAt: "2026-10-12",
  source: "manual-oembed" as const,
  originalSubject: "高校数学Ⅰ・A／二次関数",
  currentSubjects: ["I"] as SubjectId[],
  classification: "verified" as const,
  classificationEvidence:
    "公式YouTube oEmbedでタイトル・投稿者を確認。数学Ⅰへの分類は二次関数というタイトルと現行課程を照合。所属再生リストはData API取得前のため未確定。",
  playlistIds: [] as string[],
};

const representativeVideos: VideoRecord[] = [
  {
    ...manual,
    id: "P84CrKaIob0",
    title: "【慶応大】平方完成【超わかる！高校数学Ⅰ・A】～演習～２次関数＃６",
    thumbnail: "https://i.ytimg.com/vi/P84CrKaIob0/hqdefault.jpg",
  },
  {
    ...manual,
    id: "ssuKwW6MBvo",
    title:
      "【センター秒殺】超使える！平方完成の裏技！２次関数の頂点の座標を最速で求める！～超わかる！高校数学",
    thumbnail: "https://i.ytimg.com/vi/ssuKwW6MBvo/hqdefault.jpg",
  },
  {
    ...manual,
    id: "jTx2zwMW6Ho",
    title:
      "【２次関数】センター試験(数学Ⅰ・A)【徹底解説！】(2017年)～【超わかる！高校数学】",
    thumbnail: "https://i.ytimg.com/vi/jTx2zwMW6Ho/hqdefault.jpg",
  },
];

export const videos: VideoRecord[] = Array.from(
  new Map(
    [...representativeVideos, ...registeredVideos].map((v) => [v.id, v]),
  ).values(),
);

export const topics: Topic[] = [
  {
    id: "completing-square",
    subject: "I",
    unit: "二次関数",
    order: 1,
    title: "平方完成",
    subtitle: "式の形を変えると、グラフが見えてくる。",
    summary:
      "二次式を「二乗＋定数」の形に整理し、グラフの軸と頂点を読み取ります。",
    keywords: [
      "二次関数",
      "2次関数",
      "平方完成",
      "頂点",
      "軸",
      "一般形",
      "標準形",
      "二次式",
      "数学Ⅰ",
    ],
    definition:
      "平方完成とは、二次式を平方を含む形に変形することです。式の値は変えずに、グラフの特徴が読み取りやすい形に書き換えます。",
    formulas: [
      {
        id: "square-general",
        name: "平方完成の一般形",
        latex: String.raw`\begin{aligned}ax^2+bx+c&=a\left(x+\frac{b}{2a}\right)^2\\&\quad+c-\frac{b^2}{4a}\end{aligned}`,
        condition: "a, b, c は実数、a ≠ 0。",
        meaning:
          "x の一次の項を、二乗の中にまとめる公式です。a が 1 でないときは、まず x² と x の項から a をくくります。",
      },
      {
        id: "square-unit",
        name: "二乗をつくる基本",
        latex: String.raw`x^2+bx=\left(x+\frac b2\right)^2-\frac{b^2}{4}`,
        condition: "b は実数。x² の係数が 1 の場合。",
        meaning:
          "x の係数の半分を二乗の中に入れます。増えた定数を引くので、元の式と等しくなります。",
      },
    ],
    explanation: [
      {
        title: "01　まず、二乗の形をつくる",
        body: "x² − 4x の x の係数は −4。その半分 −2 を使うと、(x − 2)² の形をつくれます。",
        latex: String.raw`(x-2)^2=x^2-4x+4`,
      },
      {
        title: "02　増えた定数を戻す",
        body: "二乗の形にすると 4 が増えます。4 を引いて元の式に戻し、最後に定数項をまとめましょう。",
        latex: String.raw`x^2-4x+1=(x-2)^2-4+1=(x-2)^2-3`,
      },
      {
        title: "03　頂点と軸を読む",
        body: "(x − 2)² は x = 2 のとき 0 になります。したがって頂点は (2, −3)、対称軸は直線 x = 2 です。",
      },
    ],
    example: {
      id: "square-ex1",
      title: "二次式を平方完成しよう",
      question: "次の式を平方完成し、グラフの頂点の座標を求めてください。",
      expression: String.raw`y=2x^2-8x+5`,
      steps: [
        {
          text: "x² と x の項から 2 をくくる。定数の 5 はそのまま。",
          latex: String.raw`y=2(x^2-4x)+5`,
        },
        {
          text: "かっこの中を平方完成する。増えた 4 を引く。",
          latex: String.raw`y=2\bigl\{(x-2)^2-4\bigr\}+5`,
        },
        {
          text: "外側の 2 を定数にも掛けて整理する。",
          latex: String.raw`y=2(x-2)^2-8+5=2(x-2)^2-3`,
        },
      ],
      answer: String.raw`y=2(x-2)^2-3,\qquad \text{頂点}\ (2,-3)`,
      answerText: "平方完成すると y = 2(x − 2)² − 3。頂点は (2, −3) です。",
      check: {
        question: "次のグラフの頂点はどこ？",
        expression: String.raw`y=(x+3)^2-2`,
        choices: ["(3, −2)", "(−3, −2)", "(−3, 2)"],
        correct: 1,
        explanation:
          "x + 3 = x − (−3) と読むので、頂点の x 座標は −3。y 座標は −2 です。",
      },
    },
    cautions: [
      "二乗の中の符号と頂点の x 座標の符号は逆になります。",
      "a をくくったとき、かっこの中で引いた定数にも a が掛かります。",
      "最後に展開して元の式に戻るか確かめると、計算ミスに気づけます。",
    ],
    relatedTopicIds: ["vertex-and-graph", "maximum-minimum"],
    validation: "verified",
    authorship: "mathveo-original",
  },
  {
    id: "vertex-and-graph",
    subject: "I",
    unit: "二次関数",
    order: 2,
    title: "軸・頂点とグラフ",
    subtitle: "ひとつの式から、放物線の位置を読む。",
    summary: "標準形の a・p・q とグラフの関係を、式と図で確かめます。",
    keywords: [
      "二次関数",
      "2次関数",
      "放物線",
      "軸",
      "頂点",
      "平行移動",
      "グラフ",
      "数学Ⅰ",
    ],
    definition:
      "二次関数 y = ax² + bx + c（a ≠ 0）のグラフは放物線です。標準形 y = a(x − p)² + q にすると、軸と頂点がすぐに読み取れます。",
    formulas: [
      {
        id: "vertex-standard",
        name: "二次関数の標準形",
        latex: String.raw`y=a(x-p)^2+q`,
        condition: "a, p, q は実数、a ≠ 0。x の定義域は実数全体。",
        meaning:
          "頂点は (p, q)、軸は x = p。a > 0 なら下に凸、a < 0 なら上に凸の放物線です。",
      },
      {
        id: "vertex-general",
        name: "一般形から頂点を求める",
        latex: String.raw`\left(-\frac{b}{2a},\ c-\frac{b^2}{4a}\right)`,
        condition: "y = ax² + bx + c、a ≠ 0。",
        meaning:
          "平方完成したときの定数と、二乗の中の符号を使います。暗記するだけでなく、平方完成から確かめましょう。",
      },
    ],
    explanation: [
      {
        title: "01　a は開く向きと広がりを決める",
        body: "a が正なら上向き、負なら下向きに開きます。同じ p・q なら、|a| が大きいほど横幅が狭い形になります。",
      },
      {
        title: "02　p は左右、q は上下の位置",
        body: "y = ax² のグラフを x 軸方向に p、y 軸方向に q だけ平行移動したのが標準形です。",
        latex: String.raw`(0,0)\longrightarrow(p,q)`,
      },
      {
        title: "03　対称軸をはさんで左右が同じ",
        body: "軸から同じ距離の 2 点では、y の値が同じになります。グラフを描くときに使える性質です。",
        latex: String.raw`f(p-t)=f(p+t)=at^2+q`,
      },
    ],
    example: {
      id: "vertex-ex1",
      title: "頂点と軸を読み取ろう",
      question: "次の関数の頂点、軸、グラフの開く向きを求めてください。",
      expression: String.raw`y=-2(x+1)^2+4`,
      steps: [
        {
          text: "x + 1 を x − (−1) と読み替える。",
          latex: String.raw`y=-2\{x-(-1)\}^2+4`,
        },
        {
          text: "p = −1、q = 4 なので、頂点と軸を読み取る。",
          latex: String.raw`\text{頂点}\ (-1,4),\qquad \text{軸}\ x=-1`,
        },
        {
          text: "a = −2 < 0 なので、上に凸の放物線。",
          latex: String.raw`a=-2<0`,
        },
      ],
      answer: String.raw`\text{頂点}\ (-1,4),\qquad \text{軸}\ x=-1`,
      answerText: "頂点は (−1, 4)、軸は x = −1。上に凸で、下向きに開きます。",
      check: {
        question: "下に凸の放物線になるのは？",
        expression: String.raw`y=a(x-p)^2+q`,
        choices: ["a > 0 のとき", "a < 0 のとき", "q > 0 のとき"],
        correct: 0,
        explanation:
          "開く向きは a の符号で決まります。a > 0 なら下に凸（上向き）です。q は頂点の高さを変えます。",
      },
    },
    cautions: [
      "下に凸は上向き、上に凸は下向きです。言葉の向きを混同しないようにしましょう。",
      "頂点は標準形の二乗の中が 0 になる x から求めます。",
    ],
    relatedTopicIds: ["completing-square", "maximum-minimum"],
    validation: "verified",
    authorship: "mathveo-original",
  },
  {
    id: "maximum-minimum",
    subject: "I",
    unit: "二次関数",
    order: 3,
    title: "最大値・最小値",
    subtitle: "定義域を確かめると、答えが決まる。",
    summary: "頂点と定義域の端点を比べて、二次関数の最大・最小を求めます。",
    keywords: [
      "二次関数",
      "2次関数",
      "最大値",
      "最小値",
      "最大最小",
      "定義域",
      "値域",
      "閉区間",
      "数学Ⅰ",
    ],
    definition:
      "最大値・最小値は、定義域の中で関数が実際にとる値のうち、最も大きい値・最も小さい値です。頂点が定義域に入っているかを必ず確認します。",
    formulas: [
      {
        id: "extrema-real",
        name: "実数全体での最大・最小",
        latex: String.raw`y=a(x-p)^2+q`,
        condition: "定義域は実数全体。a ≠ 0。",
        meaning:
          "a > 0 なら x = p で最小値 q（最大値なし）。a < 0 なら x = p で最大値 q（最小値なし）。",
      },
      {
        id: "extrema-interval",
        name: "閉区間で比較する候補",
        latex: String.raw`f(l),\quad f(r),\quad f(p)\ \ (l\le p\le r)`,
        condition:
          "定義域は閉区間 l ≤ x ≤ r、l < r。f(x) = a(x − p)² + q、a ≠ 0。",
        meaning:
          "端点の値を比べます。頂点が定義域の中にある場合だけ、その値も候補に加えます。最大の候補が最大値、最小の候補が最小値です。",
      },
    ],
    explanation: [
      {
        title: "01　平方完成して、頂点を求める",
        body: "一般形のままでは位置が見えにくいので、まず標準形に直します。グラフの開く向きも確認しましょう。",
      },
      {
        title: "02　頂点が定義域に入るか確認",
        body: "頂点が区間の外にある場合、頂点の y 座標は答えの候補にできません。区間内にある部分だけを考えます。",
      },
      {
        title: "03　候補の値を比較する",
        body: "端点と、区間内の頂点の値を比べます。最大・最小になる x の値も一緒に答えると、意味がはっきりします。",
      },
    ],
    example: {
      id: "extrema-ex1",
      title: "定義域があるときの最大・最小",
      question: "次の関数の最大値と最小値を求めてください。",
      expression: String.raw`y=-x^2+2x+3\quad(0\le x\le3)`,
      steps: [
        {
          text: "平方完成する。上に凸で、頂点は (1, 4)。",
          latex: String.raw`y=-(x-1)^2+4`,
        },
        {
          text: "頂点の x = 1 は定義域 0 ≤ x ≤ 3 に入る。両端の値も計算する。",
          latex: String.raw`f(0)=3,\quad f(1)=4,\quad f(3)=0`,
        },
        {
          text: "3、4、0 を比較して最大・最小を決める。",
          latex: String.raw`0<3<4`,
        },
      ],
      answer: String.raw`\text{最大値}\ 4\ (x=1),\qquad \text{最小値}\ 0\ (x=3)`,
      answerText: "x = 1 のとき最大値 4、x = 3 のとき最小値 0 です。",
      check: {
        question: "次の関数の最小値は？",
        expression: String.raw`y=(x-2)^2+1\quad(3\le x\le5)`,
        choices: ["1", "2", "10"],
        correct: 1,
        explanation:
          "頂点の x = 2 は定義域の外。区間 3 ≤ x ≤ 5 では増加するので、x = 3 のとき最小値 (3 − 2)² + 1 = 2 です。",
      },
    },
    cautions: [
      "頂点が区間の外にある場合、頂点の値を最大・最小として使えません。",
      "閉区間と開区間では、端点の値が実際にとれるかが違います。この教材の区間の公式は閉区間に限ります。",
    ],
    relatedTopicIds: ["completing-square", "vertex-and-graph"],
    validation: "verified",
    authorship: "mathveo-original",
  },
];

// Titles confirm themes, not the exact examples, explanations or timestamps in a video.
export const videoTopicLinks: VideoTopicLink[] = [
  {
    videoId: "P84CrKaIob0",
    topicId: "completing-square",
    relation: "related",
    evidence:
      "公式タイトルに「平方完成」。動画内の設問・説明の同一性は未確認。",
  },
  {
    videoId: "ssuKwW6MBvo",
    topicId: "completing-square",
    relation: "related",
    evidence: "公式タイトルに「平方完成」。独自の基本教材として関連付け。",
  },
  {
    videoId: "ssuKwW6MBvo",
    topicId: "vertex-and-graph",
    relation: "related",
    evidence: "公式タイトルに「頂点の座標」。動画内の詳しい解説は未確認。",
  },
  {
    videoId: "jTx2zwMW6Ho",
    topicId: "maximum-minimum",
    relation: "candidate",
    evidence:
      "タイトルで二次関数の入試解説と確認。最大・最小を扱うかは要確認。",
  },
  {
    videoId: "P84CrKaIob0",
    topicId: "vertex-and-graph",
    relation: "related",
    evidence: "平方完成に関連する基本教材。動画内容の直接対応ではない。",
  },
];

export function topicVideos(topicId: string) {
  return videoTopicLinks
    .filter((link) => link.topicId === topicId)
    .map((link) => ({
      ...link,
      video: videos.find((v) => v.id === link.videoId)!,
    }));
}
export const getTopic = (id: string) => topics.find((t) => t.id === id);
export const getVideo = (id: string) => videos.find((v) => v.id === id);
