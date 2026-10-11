import { VideoThumbnail } from "./VideoThumbnail";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Play,
  TriangleAlert,
} from "lucide-react";
import type { Topic } from "../domain/types";
import { topicVideos, getTopic } from "../data/catalog";
import type { LearningStore } from "../hooks/useLearning";
import { MathText, CopyFormula } from "./Math";
import { ParabolaGraph } from "./Graph";

export function FormulaSection({
  topic,
  announce,
}: {
  topic: Topic;
  announce: (text: string) => void;
}) {
  return (
    <div className="formula-section">
      <div className="section-intro">
        <span className="eyebrow">KEY FORMULAS</span>
        <h2>まず、押さえておきたいこと</h2>
        <p>{topic.definition}</p>
      </div>
      {topic.formulas.map((formula, i) => (
        <article className="formula-box" key={formula.id}>
          <div className="formula-title">
            <span className="number-label">0{i + 1}</span>
            <h3>{formula.name}</h3>
            <CopyFormula latex={formula.latex} announce={announce} />
          </div>
          <MathText latex={formula.latex} />
          <p className="formula-condition">
            <b>成立する条件</b>
            {formula.condition}
          </p>
          <p className="formula-meaning">{formula.meaning}</p>
        </article>
      ))}
      <div className="insight">
        <Lightbulb size={19} />
        <p>
          式を覚えるだけでなく、<strong>形を変える理由</strong>
          までつかもう。下の解説と例題で確かめられます。
        </p>
      </div>
    </div>
  );
}

export function ExplanationSection({ topic }: { topic: Topic }) {
  return (
    <div className="explanation-section">
      <div className="section-intro">
        <span className="eyebrow">MAKE IT CLICK</span>
        <h2>式とグラフを、つなげよう</h2>
        <p>{topic.subtitle}</p>
      </div>
      {topic.explanation.map((item) => (
        <article className="explanation-step" key={item.title}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          {item.latex && <MathText latex={item.latex} />}
        </article>
      ))}
      <div className="interactive-graph">
        <div className="graph-heading">
          <span className="tag">自分で動かす</span>
          <h3>頂点が動くと、式はどう変わる？</h3>
        </div>
        <ParabolaGraph interactive />
      </div>
      <div className="cautions">
        <h3>
          <TriangleAlert size={18} />
          間違えやすいポイント
        </h3>
        <ul>
          {topic.cautions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ExampleSection({
  topic,
  learning,
  announce,
}: {
  topic: Topic;
  learning: LearningStore;
  announce: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const example = topic.example;
  const record = learning.get(`topic:${topic.id}`);
  const chosen = record.quizChoice;
  return (
    <div className="example-section">
      <div className="section-intro">
        <span className="eyebrow">TRY IT YOURSELF</span>
        <h2>例題で、理解を確かめる</h2>
        <p>まず自分で考えてから、解答を開いてみましょう。</p>
      </div>
      <article className="example-box">
        <span className="tag">基本例題 01</span>
        <h3>{example.title}</h3>
        <p>{example.question}</p>
        <MathText latex={example.expression} />
        <button
          className={`button ${open ? "secondary" : "primary"} solution-toggle`}
          aria-expanded={open}
          aria-controls={`solution-${example.id}`}
          onClick={() => setOpen(!open)}
        >
          {open ? "解答を閉じる" : "解き方・解答を見る"}
          <ChevronDown className={open ? "rotated" : ""} size={18} />
        </button>
        {open && (
          <div className="solution" id={`solution-${example.id}`}>
            {example.steps.map((step, i) => (
              <div className="solution-step" key={i}>
                <span className="step-dot">{i + 1}</span>
                <div>
                  <p>{step.text}</p>
                  <MathText latex={step.latex} />
                </div>
              </div>
            ))}
            <div className="answer">
              <span>
                <CheckCircle2 size={17} />
                解答
              </span>
              <MathText latex={example.answer} />
              <p>{example.answerText}</p>
            </div>
          </div>
        )}
      </article>
      <article className="quick-check">
        <div className="section-label">
          <BookOpen size={17} />
          1問チェック
        </div>
        <h3>{example.check.question}</h3>
        <MathText latex={example.check.expression} />
        <div className="quiz-choices">
          {example.check.choices.map((choice, i) => (
            <button
              key={choice}
              className={`quiz-choice ${chosen === i ? (i === example.check.correct ? "correct" : "incorrect") : ""}`}
              aria-pressed={chosen === i}
              disabled={!learning.ready}
              onClick={() => {
                void learning.save(`topic:${topic.id}`, { quizChoice: i });
                announce(
                  i === example.check.correct
                    ? "正解です。"
                    : "もう一度、式の形を確かめてみよう。",
                );
              }}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {choice}
              {chosen === i && i === example.check.correct && (
                <CheckCircle2 size={17} />
              )}
            </button>
          ))}
        </div>
        {chosen !== null && (
          <div
            className={`quiz-feedback ${chosen === example.check.correct ? "correct" : ""}`}
            role="status"
          >
            <strong>
              {chosen === example.check.correct
                ? "正解！"
                : "もう一度、確かめよう。"}
            </strong>
            <p>{example.check.explanation}</p>
          </div>
        )}
      </article>
    </div>
  );
}

export function RelatedSection({ topic }: { topic: Topic }) {
  const related = topicVideos(topic.id);
  return (
    <div className="related-section">
      <div className="section-intro">
        <span className="eyebrow">CONNECTED LEARNING</span>
        <h2>動画で、もう一歩深く</h2>
        <p>
          公式タイトルを確認した動画です。教材はMathveoが独自に作成しています。
        </p>
      </div>
      {related.map(({ video, relation, evidence }) => (
        <a
          key={video.id}
          className="related-video"
          href={`#/watch/${topic.id}?video=${video.id}`}
        >
          <VideoThumbnail video={video} className="related-thumbnail" />
          <div>
            <span className={`tag ${relation === "candidate" ? "muted" : ""}`}>
              {relation === "candidate" ? "推定候補・要確認" : "関連教材"}
            </span>
            <h3>{video.title}</h3>
            <p>{evidence}</p>
            <span className="related-author">
              YouTube · {video.channelTitle}
            </span>
          </div>
          <Play size={18} />
        </a>
      ))}
      <h3 className="related-topics-title">つながるテーマ</h3>
      <div className="related-topics">
        {topic.relatedTopicIds.map((id) => {
          const item = getTopic(id);
          return item ? (
            <a key={id} href={`#/material/${id}`}>
              <BookOpen size={17} />
              {item.title}
              <ArrowRight size={16} />
            </a>
          ) : null;
        })}
      </div>
    </div>
  );
}
