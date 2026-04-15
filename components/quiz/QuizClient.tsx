"use client";
import { useEffect, useState } from "react";

export function QuizClientComponent({ dictionary, lang }: { dictionary: any; lang: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (dictionary) {
      setData(dictionary);
    }
  }, [dictionary]);

  if (!data) {
    return <div>Loading quiz...</div>;
  }

  return (
    <div>
      <h1>{lang === "ua" ? "Квіз" : "Quiz"}</h1>
      {/* Здесь отрисовываем вопросы */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
