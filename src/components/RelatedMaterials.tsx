import { ArrowRight, BookOpen } from "lucide-react";
import type { Topic } from "../domain/types";

export function RelatedMaterials({
  topics,
  candidateIds = [],
}: {
  topics: Topic[];
  candidateIds?: string[];
}) {
  if (!topics.length) return null;
  return (
    <section className="playlist-material-note">
      <BookOpen size={21} />
      <div>
        <h2>単元の公式・解説・例題</h2>
        <p>Mathveo独自の関連教材です。授業動画の書き起こしではありません。</p>
        <div className="playlist-material-links">
          {topics.map((topic) => (
            <a key={topic.id} href={`#/material/${topic.id}`}>
              {topic.title}
              {candidateIds.includes(topic.id) && <span>対応要確認</span>}
              <ArrowRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
