"use client";

import { NormalizedExercise } from "@/lib/exerciseUtils";
import { Exercise } from "@/lib/types";
import { formatPronunciationDisplay } from "@/lib/pronunciation";
import { useExerciseDisplay } from "@/contexts/ExerciseDisplayContext";
import ExerciseIntro from "./ExerciseIntro";
import ExerciseImageVocab from "./ExerciseImageVocab";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseTapWord from "./ExerciseTapWord";
import ExerciseTrueFalse from "./ExerciseTrueFalse";
import ExerciseFillBlank from "./ExerciseFillBlank";
import ExerciseWordBank from "./ExerciseWordBank";
import ExerciseMatchPairs from "./ExerciseMatchPairs";
import ExerciseMemoryCards from "./ExerciseMemoryCards";
import ExerciseTranslate from "./ExerciseTranslate";
import ExerciseTypeAnswer from "./ExerciseTypeAnswer";
import ExerciseListenType from "./ExerciseListenType";
import ExerciseImageSelection from "./ExerciseImageSelection";
import ExerciseListening from "./ExerciseListening";
import ExerciseMiniConversation from "./ExerciseMiniConversation";

interface ExerciseByTemplateProps {
  normalized: NormalizedExercise;
  exercise: Exercise;
  selectedOption: string | null;
  typedAnswer: string;
  selectedWords: string[];
  matchedPairs: Record<string, string>;
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: unknown;
  onSelect: (option: string) => void;
  onChangeAnswer: (text: string) => void;
  onSelectWord: (word: string) => void;
  onUnselectWord: (index: number) => void;
  onMatch: (left: string, right: string) => void;
  onSetMatchedPairs: (pairs: Record<string, string>) => void;
}

type SelectedAnswer = { selected?: string };

export const ExerciseByTemplate: React.FC<ExerciseByTemplateProps> = ({
  normalized,
  exercise,
  selectedOption,
  typedAnswer,
  selectedWords,
  matchedPairs,
  isAnswerChecked,
  isCorrect,
  correctAnswer,
  onSelect,
  onChangeAnswer,
  onSelectWord,
  onUnselectWord,
  onMatch,
  onSetMatchedPairs,
}) => {
  const layout = normalized.layout || normalized.template;
  const selectedCorrect = correctAnswer as SelectedAnswer | undefined;
  const { targetLang } = useExerciseDisplay();
  const foreignOptions = normalized.showsForeignOptions;
  const pronunciationHint = formatPronunciationDisplay(
    targetLang,
    normalized.pronunciationHint || normalized.pronunciation || normalized.romanization
  );
  const fallbackPronunciation = formatPronunciationDisplay(
    targetLang,
    normalized.pronunciation || normalized.romanization
  );

  if (normalized.isIntro && normalized.intro) {
    const autoPlayKey =
      (exercise.metadata?.vocabulary_id as string | undefined) ?? normalized.intro.targetWord;
    if (layout === "speaking") {
      return <ExerciseIntro data={normalized.intro} layout="speaking" autoPlayKey={autoPlayKey} />;
    }
    if (layout === "image_vocab") {
      return <ExerciseImageVocab data={normalized.intro} autoPlayKey={autoPlayKey} />;
    }
    return <ExerciseIntro data={normalized.intro} layout="flashcard" autoPlayKey={autoPlayKey} />;
  }

  switch (layout) {
    case "tap_chips":
      return (
        <ExerciseTapWord
          options={normalized.options}
          selectedOption={selectedOption}
          onSelect={onSelect}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
        />
      );
    case "true_false":
      return (
        <ExerciseTrueFalse
          selectedOption={selectedOption}
          onSelect={onSelect}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
        />
      );
    case "conversation":
      return (
        <ExerciseMiniConversation
          prompt={normalized.prompt}
          options={normalized.options}
          selectedOption={selectedOption}
          onSelect={onSelect}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
          foreignOptions
        />
      );
    case "picture_grid":
    case "listen_image":
      return (
        <ExerciseImageSelection
          options={normalized.imageOptions}
          selectedOption={selectedOption}
          onSelect={onSelect}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
          audioUrl={exercise.prompt_audio_url ?? normalized.audioUrl}
          fallbackText={normalized.fallbackText}
          fallbackPronunciation={fallbackPronunciation}
          showAudioPlayer={layout === "listen_image"}
        />
      );
    case "listening":
      return (
        <ExerciseListening
          options={normalized.options}
          selectedOption={selectedOption}
          onSelect={onSelect}
          audioUrl={normalized.audioUrl}
          fallbackText={normalized.fallbackText}
          romanization={normalized.romanization}
          pronunciation={normalized.pronunciation}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
        />
      );
    case "listen_type":
    case "missing_letters":
      return (
        <ExerciseListenType
          typedAnswer={typedAnswer}
          onChangeAnswer={onChangeAnswer}
          isAnswerChecked={isAnswerChecked}
          audioUrl={normalized.audioUrl ?? exercise.prompt_audio_url}
          fallbackText={normalized.fallbackText}
          fallbackPronunciation={fallbackPronunciation}
          showAudio={layout === "listen_type"}
        />
      );
    case "fill_blank":
      return (
        <ExerciseFillBlank
          sentence={normalized.sentence}
          options={normalized.options}
          selectedOption={selectedOption}
          onSelect={onSelect}
          isAnswerChecked={isAnswerChecked}
          isCorrect={isCorrect}
          correctAnswer={selectedCorrect}
        />
      );
    case "drag_drop":
    case "word_bank":
      return (
        <ExerciseWordBank
          tokens={normalized.tokens}
          selectedWords={selectedWords}
          onSelectWord={onSelectWord}
          onUnselectWord={onUnselectWord}
          isAnswerChecked={isAnswerChecked}
          dragMode={layout === "drag_drop"}
        />
      );
    case "memory_cards":
      return (
        <ExerciseMemoryCards
          left={normalized.left}
          right={normalized.right}
          pairs={normalized.pairs}
          matchedPairs={matchedPairs}
          onMatch={onMatch}
          onSetMatchedPairs={onSetMatchedPairs}
          isAnswerChecked={isAnswerChecked}
        />
      );
    case "match_pairs":
      return (
        <ExerciseMatchPairs
          left={normalized.left}
          right={normalized.right}
          pairs={normalized.pairs}
          matchedPairs={matchedPairs}
          onMatch={onMatch}
          onSetMatchedPairs={onSetMatchedPairs}
          isAnswerChecked={isAnswerChecked}
        />
      );
    case "typing":
    default:
      if (normalized.type === "type_answer" || normalized.type === "translate") {
        if (normalized.type === "translate") {
          return (
            <ExerciseTranslate
              typedAnswer={typedAnswer}
              onChangeAnswer={onChangeAnswer}
              isAnswerChecked={isAnswerChecked}
            />
          );
        }
        return (
          <ExerciseTypeAnswer
            typedAnswer={typedAnswer}
            onChangeAnswer={onChangeAnswer}
            isAnswerChecked={isAnswerChecked}
            pronunciationHint={pronunciationHint}
          />
        );
      }
      if (normalized.type === "multiple_choice") {
        return (
          <ExerciseMultipleChoice
            options={normalized.options}
            selectedOption={selectedOption}
            onSelect={onSelect}
            isAnswerChecked={isAnswerChecked}
            isCorrect={isCorrect}
            correctAnswer={selectedCorrect}
            foreignOptions={foreignOptions}
          />
        );
      }
      return (
        <div className="text-center font-bold text-rose-500">
          Unsupported layout: {layout}
        </div>
      );
  }
};

export default ExerciseByTemplate;
