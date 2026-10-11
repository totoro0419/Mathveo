export type SubjectId =
  "I" | "A" | "II" | "B" | "III" | "C" | "junior" | "special";
export type LearningStatus = "unstarted" | "learning" | "completed";
export type Understanding = "unset" | "understood" | "unsure" | "review";

export interface VideoRecord {
  id: string;
  title: string;
  description: string | null;
  channelId: string;
  channelTitle: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  thumbnail: string;
  playlistIds: string[];
  embeddable: boolean | null;
  fetchedAt: string;
  updatedAt: string;
  source: "youtube-data-api" | "manual-oembed";
  originalSubject: string;
  currentSubjects: SubjectId[];
  classification: "verified" | "needs-review";
  classificationEvidence: string;
}

export interface VideoTopicLink {
  videoId: string;
  topicId: string;
  relation: "direct" | "related" | "candidate";
  evidence: string;
}

export interface Formula {
  id: string;
  name: string;
  latex: string;
  condition: string;
  meaning: string;
}

export interface Example {
  id: string;
  title: string;
  question: string;
  expression: string;
  steps: { text: string; latex: string }[];
  answer: string;
  answerText: string;
  check: {
    question: string;
    expression: string;
    choices: string[];
    correct: number;
    explanation: string;
  };
}

export interface Topic {
  id: string;
  subject: SubjectId;
  unit: string;
  order: number;
  title: string;
  subtitle: string;
  summary: string;
  keywords: string[];
  definition: string;
  formulas: Formula[];
  explanation: { title: string; body: string; latex?: string }[];
  example: Example;
  cautions: string[];
  relatedTopicIds: string[];
  validation: "verified" | "draft";
  authorship: "mathveo-original";
}

export interface LearningRecord {
  key: string;
  status: LearningStatus;
  understanding: Understanding;
  review: boolean;
  note: string;
  position: number;
  duration: number;
  playbackEnded: boolean;
  quizChoice: number | null;
  updatedAt: number;
}

export type LearningPatch = Partial<Omit<LearningRecord, "key" | "updatedAt">>;

export const defaultRecord = (key: string): LearningRecord => ({
  key,
  status: "unstarted",
  understanding: "unset",
  review: false,
  note: "",
  position: 0,
  duration: 0,
  playbackEnded: false,
  quizChoice: null,
  updatedAt: 0,
});

export const statusLabels: Record<LearningStatus, string> = {
  unstarted: "未学習",
  learning: "学習中",
  completed: "学習済み",
};
export const understandingLabels: Record<Understanding, string> = {
  unset: "未記録",
  understood: "理解できた",
  unsure: "少し不安",
  review: "要復習",
};
