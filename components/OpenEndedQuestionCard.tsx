import React, { useState } from "react";
import { Card } from "@nextui-org/card";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

type OpenEndedQuestionCardProps = {
  cardData: {
    id: number;
    question: string;
  };
  onAnswer: (questionId: number, answer: string) => void;
  outerWrapperClass?: string;
};

export default function OpenEndedQuestionCard({
  cardData,
  onAnswer,
  outerWrapperClass,
}: OpenEndedQuestionCardProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const handleNext = () => {
    if (value.trim().length >= 2) {
      onAnswer(cardData.id, value.trim());
    } else {
      setTouched(true);
    }
  };

  const isValid = value.trim().length >= 2;

  return (
    <Card
      className={
        "p-4 sm:px-10 sm:py-8 md:pb-10 lg:pb-14 md:px-16 mb-4 sm:mb-10 md:mb-12" +
        ` ${outerWrapperClass}`
      }
    >
      <h1 className="font-light text-xl sm:text-2xl lg:text-3xl py-6 sm:py-6 md:py-10">
        {cardData.question}
      </h1>

      <Textarea
        minRows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Введите ваш ответ..."
        className="mb-6"
        variant="bordered"
        radius="sm"
        isInvalid={touched && !isValid}
        errorMessage={
          touched && !isValid
            ? "Ответ должен содержать минимум 2 символа"
            : undefined
        }
      />

      <Button
        type="button"
        size="lg"
        radius="sm"
        onClick={handleNext}
        className="h-14 text-lg font-light"
        color={isValid ? "primary" : "default"}
        isDisabled={!isValid}
      >
        Далее
      </Button>
    </Card>
  );
}
