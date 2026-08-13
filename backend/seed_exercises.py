"""Exercise seed helpers — always English (source) → target language."""
import uuid
from models import Exercise, ExerciseOption, ExerciseType


def seed_en_to_target_lesson_exercises(session, lesson_uuid, content: dict):
    """
    Seed 6 exercise types teaching target language FROM English.

    content keys:
      multiple_choice: {prompt, answer, options}
      meaning: {prompt, answer, options}  — target word → English meaning
      fill_blank: {prompt, sentence, answer, options}
      word_bank: {prompt, words, tokens}
      match_pairs: {prompt, pairs, left, right}
      translate: {prompt, translation}
      type_answer: {prompt, text, alternatives}
    """
    order = 1

    mc = content.get("multiple_choice")
    if mc:
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.multiple_choice,
                prompt=mc["prompt"],
                correct_answer={"selected": mc["answer"]},
                exercise_metadata={"options": mc["options"]},
            )
        )
        for idx, label in enumerate(mc["options"], 1):
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=label,
                    is_correct=label == mc["answer"],
                    order_index=idx,
                )
            )
        order += 1

    meaning = content.get("meaning")
    if meaning:
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.multiple_choice,
                prompt=meaning["prompt"],
                correct_answer={"selected": meaning["answer"]},
                exercise_metadata={"options": meaning["options"]},
            )
        )
        for idx, label in enumerate(meaning["options"], 1):
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=label,
                    is_correct=label == meaning["answer"],
                    order_index=idx,
                )
            )
        order += 1

    fill = content.get("fill_blank")
    if fill:
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.fill_blank,
                prompt=fill["prompt"],
                correct_answer={"selected": fill["answer"]},
                exercise_metadata={"sentence": fill["sentence"], "options": fill["options"]},
            )
        )
        for idx, label in enumerate(fill["options"], 1):
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=label,
                    is_correct=label == fill["answer"],
                    order_index=idx,
                )
            )
        order += 1

    wb = content.get("word_bank")
    if wb:
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.word_bank,
                prompt=wb["prompt"],
                correct_answer={"words": wb["words"]},
                exercise_metadata={"tokens": wb["tokens"]},
            )
        )
        for idx, token in enumerate(wb["tokens"], 1):
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=token,
                    is_correct=token in wb["words"],
                    order_index=idx,
                )
            )
        order += 1

    match = content.get("match_pairs")
    if match:
        ex_id = uuid.uuid4()
        session.add(
            Exercise(
                id=ex_id,
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.match_pairs,
                prompt=match.get("prompt", "Match the English word to its translation."),
                correct_answer={"pairs": match["pairs"]},
                exercise_metadata={"left": match["left"], "right": match["right"]},
            )
        )
        opt_idx = 1
        for left_word in match["left"]:
            session.add(
                ExerciseOption(exercise_id=ex_id, label=left_word, pair_key=left_word, order_index=opt_idx)
            )
            opt_idx += 1
            session.add(
                ExerciseOption(
                    exercise_id=ex_id,
                    label=match["pairs"][left_word],
                    pair_key=left_word,
                    order_index=opt_idx,
                )
            )
            opt_idx += 1
        order += 1

    translate = content.get("translate")
    if translate:
        session.add(
            Exercise(
                id=uuid.uuid4(),
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.translate,
                prompt=translate["prompt"],
                correct_answer={"translation": translate["translation"]},
                exercise_metadata={"sentence": translate.get("sentence", translate["prompt"])},
            )
        )
        order += 1

    type_ex = content.get("type_answer")
    if type_ex:
        session.add(
            Exercise(
                id=uuid.uuid4(),
                lesson_id=lesson_uuid,
                order_index=order,
                type=ExerciseType.type_answer,
                prompt=type_ex["prompt"],
                correct_answer={"text": type_ex["text"]},
                exercise_metadata={"alternatives": type_ex.get("alternatives", [])},
            )
        )


# --- Per-course content packs (English → target) ---

SPANISH_GREETINGS = {
    "multiple_choice": {
        "prompt": "Choose the Spanish translation for:\n\nHello",
        "answer": "Hola",
        "options": ["Hola", "Adiós", "Gracias"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nGracias",
        "answer": "Thank you",
        "options": ["Thank you", "Hello", "Goodbye"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Good morning' in Spanish?",
        "sentence": "___",
        "answer": "Buenos días",
        "options": ["Buenos días", "Buenas noches", "Hola"],
    },
    "word_bank": {
        "prompt": "Tap the Spanish words for:\n\nGoodbye",
        "words": ["Adiós"],
        "tokens": ["Adiós", "Hola", "Gracias", "Sí", "No"],
    },
    "match_pairs": {
        "pairs": {"Hello": "Hola", "Thank you": "Gracias", "Yes": "Sí", "No": "No"},
        "left": ["Hello", "Thank you", "Yes", "No"],
        "right": ["Hola", "Gracias", "Sí", "No"],
    },
    "translate": {
        "prompt": "Translate to Spanish:\n\nI am a student.",
        "translation": "Soy un estudiante.",
    },
    "type_answer": {
        "prompt": "Write in Spanish:\n\nThank you",
        "text": "gracias",
        "alternatives": ["Gracias"],
    },
}

JAPANESE_GREETINGS = {
    "multiple_choice": {
        "prompt": "Choose the Japanese translation for:\n\nHello",
        "answer": "こんにちは",
        "options": ["こんにちは", "ありがとう", "さようなら"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nありがとう",
        "answer": "Thank you",
        "options": ["Thank you", "Hello", "Sorry"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Good morning' in Japanese?",
        "sentence": "___",
        "answer": "おはようございます",
        "options": ["おはようございます", "こんにちは", "おやすみなさい"],
    },
    "word_bank": {
        "prompt": "Tap the Japanese word for:\n\nThank you",
        "words": ["ありがとう"],
        "tokens": ["ありがとう", "こんにちは", "さようなら", "はい", "いいえ"],
    },
    "match_pairs": {
        "pairs": {
            "Hello": "こんにちは",
            "Thank you": "ありがとう",
            "Yes": "はい",
            "No": "いいえ",
        },
        "left": ["Hello", "Thank you", "Yes", "No"],
        "right": ["こんにちは", "ありがとう", "はい", "いいえ"],
    },
    "translate": {
        "prompt": "Translate to Japanese:\n\nGood night",
        "translation": "おやすみなさい",
    },
    "type_answer": {
        "prompt": "Write in Japanese:\n\nSorry",
        "text": "ごめんなさい",
        "alternatives": ["ごめんなさい", "すみません"],
    },
}

JAPANESE_FOOD = {
    "multiple_choice": {
        "prompt": "Choose the Japanese translation for:\n\nWater",
        "answer": "みず",
        "options": ["みず", "ごはん", "パン"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nごはん",
        "answer": "Rice / meal",
        "options": ["Rice / meal", "Water", "Bread"],
    },
    "fill_blank": {
        "prompt": "How do you say 'I eat rice' in Japanese?",
        "sentence": "___",
        "answer": "ごはんを食べます",
        "options": ["ごはんを食べます", "みずを飲みます", "パンを食べます"],
    },
    "word_bank": {
        "prompt": "Tap the Japanese words for:\n\nI drink water",
        "words": ["みず", "を", "飲みます"],
        "tokens": ["みず", "を", "飲みます", "食べます", "ごはん", "パン"],
    },
    "match_pairs": {
        "pairs": {"Water": "みず", "Rice": "ごはん", "Bread": "パン", "Tea": "おちゃ"},
        "left": ["Water", "Rice", "Bread", "Tea"],
        "right": ["みず", "ごはん", "パン", "おちゃ"],
    },
    "translate": {
        "prompt": "Translate to Japanese:\n\nI eat rice.",
        "translation": "ごはんを食べます。",
    },
    "type_answer": {
        "prompt": "Write in Japanese:\n\nTea",
        "text": "おちゃ",
        "alternatives": ["お茶", "おちゃ"],
    },
}

JAPANESE_TRAVEL = {
    "multiple_choice": {
        "prompt": "Choose the Japanese translation for:\n\nTrain",
        "answer": "でんしゃ",
        "options": ["でんしゃ", "くるま", "ひこうき"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nえき",
        "answer": "Station",
        "options": ["Station", "Train", "Airport"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Where is the station?' in Japanese?",
        "sentence": "___",
        "answer": "えきはどこですか",
        "options": ["えきはどこですか", "でんしゃです", "とうきょうです"],
    },
    "word_bank": {
        "prompt": "Tap the Japanese words for:\n\nI go to Tokyo",
        "words": ["とうきょう", "に", "行きます"],
        "tokens": ["とうきょう", "に", "行きます", "えき", "でんしゃ", "来ます"],
    },
    "match_pairs": {
        "pairs": {"Train": "でんしゃ", "Station": "えき", "Car": "くるま", "Airport": "くうこう"},
        "left": ["Train", "Station", "Car", "Airport"],
        "right": ["でんしゃ", "えき", "くるま", "くうこう"],
    },
    "translate": {
        "prompt": "Translate to Japanese:\n\nWhere is the station?",
        "translation": "えきはどこですか。",
    },
    "type_answer": {
        "prompt": "Write in Japanese:\n\nTrain",
        "text": "でんしゃ",
        "alternatives": ["電車", "でんしゃ"],
    },
}

JAPANESE_FAMILY = {
    "multiple_choice": {
        "prompt": "Choose the Japanese translation for:\n\nMother",
        "answer": "おかあさん",
        "options": ["おかあさん", "おとうさん", "あね"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nかぞく",
        "answer": "Family",
        "options": ["Family", "Mother", "Friend"],
    },
    "fill_blank": {
        "prompt": "How do you say 'This is my brother' in Japanese?",
        "sentence": "___",
        "answer": "これはわたしのあにです",
        "options": ["これはわたしのあにです", "これはわたしのともだちです", "これはわたしのいぬです"],
    },
    "word_bank": {
        "prompt": "Tap the Japanese words for:\n\nI love my family",
        "words": ["かぞく", "が", "すき", "です"],
        "tokens": ["かぞく", "が", "すき", "です", "わたし", "ともだち", "ねこ"],
    },
    "match_pairs": {
        "pairs": {"Mother": "おかあさん", "Father": "おとうさん", "Brother": "あに", "Family": "かぞく"},
        "left": ["Mother", "Father", "Brother", "Family"],
        "right": ["おかあさん", "おとうさん", "あに", "かぞく"],
    },
    "translate": {
        "prompt": "Translate to Japanese:\n\nThis is my mother.",
        "translation": "これはわたしのおかあさんです。",
    },
    "type_answer": {
        "prompt": "Write in Japanese:\n\nFamily",
        "text": "かぞく",
        "alternatives": ["家族", "かぞく"],
    },
}

GERMAN_GREETINGS = {
    "multiple_choice": {
        "prompt": "Choose the German translation for:\n\nHello",
        "answer": "Hallo",
        "options": ["Hallo", "Danke", "Tschüss"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nDanke",
        "answer": "Thank you",
        "options": ["Thank you", "Hello", "Goodbye"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Good day' in German?",
        "sentence": "___",
        "answer": "Guten Tag",
        "options": ["Guten Tag", "Gute Nacht", "Hallo"],
    },
    "word_bank": {
        "prompt": "Tap the German words for:\n\nThank you",
        "words": ["Danke"],
        "tokens": ["Danke", "Hallo", "Tschüss", "Ja", "Nein"],
    },
    "match_pairs": {
        "pairs": {"Hello": "Hallo", "Thank you": "Danke", "Yes": "Ja", "No": "Nein"},
        "left": ["Hello", "Thank you", "Yes", "No"],
        "right": ["Hallo", "Danke", "Ja", "Nein"],
    },
    "translate": {
        "prompt": "Translate to German:\n\nI am a student.",
        "translation": "Ich bin Student.",
    },
    "type_answer": {
        "prompt": "Write in German:\n\nGoodbye",
        "text": "tschüss",
        "alternatives": ["Tschüss", "Auf Wiedersehen"],
    },
}

GERMAN_FOOD = {
    "multiple_choice": {
        "prompt": "Choose the German translation for:\n\nBread",
        "answer": "Brot",
        "options": ["Brot", "Milch", "Käse"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nWasser",
        "answer": "Water",
        "options": ["Water", "Bread", "Milk"],
    },
    "fill_blank": {
        "prompt": "How do you say 'I drink water' in German?",
        "sentence": "___",
        "answer": "Ich trinke Wasser",
        "options": ["Ich trinke Wasser", "Ich esse Brot", "Ich lese ein Buch"],
    },
    "word_bank": {
        "prompt": "Tap the German words for:\n\nI eat bread",
        "words": ["Ich", "esse", "Brot"],
        "tokens": ["Ich", "esse", "Brot", "trinke", "Wasser", "Milch"],
    },
    "match_pairs": {
        "pairs": {"Bread": "Brot", "Water": "Wasser", "Milk": "Milch", "Cheese": "Käse"},
        "left": ["Bread", "Water", "Milk", "Cheese"],
        "right": ["Brot", "Wasser", "Milch", "Käse"],
    },
    "translate": {
        "prompt": "Translate to German:\n\nI drink water.",
        "translation": "Ich trinke Wasser.",
    },
    "type_answer": {
        "prompt": "Write in German:\n\nMilk",
        "text": "milch",
        "alternatives": ["Milch"],
    },
}

GERMAN_TRAVEL = {
    "multiple_choice": {
        "prompt": "Choose the German translation for:\n\nTrain",
        "answer": "Zug",
        "options": ["Zug", "Auto", "Flugzeug"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nBahnhof",
        "answer": "Train station",
        "options": ["Train station", "Train", "Airport"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Where is the station?' in German?",
        "sentence": "___",
        "answer": "Wo ist der Bahnhof?",
        "options": ["Wo ist der Bahnhof?", "Das ist ein Zug", "Ich gehe nach Berlin"],
    },
    "word_bank": {
        "prompt": "Tap the German words for:\n\nI go to Berlin",
        "words": ["Ich", "gehe", "nach", "Berlin"],
        "tokens": ["Ich", "gehe", "nach", "Berlin", "fahre", "Zug", "Paris"],
    },
    "match_pairs": {
        "pairs": {"Train": "Zug", "Station": "Bahnhof", "Car": "Auto", "Airport": "Flughafen"},
        "left": ["Train", "Station", "Car", "Airport"],
        "right": ["Zug", "Bahnhof", "Auto", "Flughafen"],
    },
    "translate": {
        "prompt": "Translate to German:\n\nWhere is the station?",
        "translation": "Wo ist der Bahnhof?",
    },
    "type_answer": {
        "prompt": "Write in German:\n\nTrain",
        "text": "zug",
        "alternatives": ["Zug", "Der Zug"],
    },
}

GERMAN_FAMILY = {
    "multiple_choice": {
        "prompt": "Choose the German translation for:\n\nMother",
        "answer": "Mutter",
        "options": ["Mutter", "Vater", "Schwester"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nFamilie",
        "answer": "Family",
        "options": ["Family", "Mother", "Friend"],
    },
    "fill_blank": {
        "prompt": "How do you say 'This is my brother' in German?",
        "sentence": "___",
        "answer": "Das ist mein Bruder",
        "options": ["Das ist mein Bruder", "Das ist mein Freund", "Das ist mein Hund"],
    },
    "word_bank": {
        "prompt": "Tap the German words for:\n\nI love my family",
        "words": ["Ich", "liebe", "meine", "Familie"],
        "tokens": ["Ich", "liebe", "meine", "Familie", "hasse", "deine", "Freunde"],
    },
    "match_pairs": {
        "pairs": {"Mother": "Mutter", "Father": "Vater", "Brother": "Bruder", "Family": "Familie"},
        "left": ["Mother", "Father", "Brother", "Family"],
        "right": ["Mutter", "Vater", "Bruder", "Familie"],
    },
    "translate": {
        "prompt": "Translate to German:\n\nI love my family.",
        "translation": "Ich liebe meine Familie.",
    },
    "type_answer": {
        "prompt": "Write in German:\n\nFamily",
        "text": "familie",
        "alternatives": ["Familie"],
    },
}

FRENCH_GREETINGS = {
    "multiple_choice": {
        "prompt": "Choose the French translation for:\n\nHello",
        "answer": "Bonjour",
        "options": ["Bonjour", "Merci", "Au revoir"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nMerci",
        "answer": "Thank you",
        "options": ["Thank you", "Hello", "Goodbye"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Good morning' in French?",
        "sentence": "___",
        "answer": "Bonjour",
        "options": ["Bonjour", "Bonne nuit", "Au revoir"],
    },
    "word_bank": {
        "prompt": "Tap the French words for:\n\nThank you",
        "words": ["Merci"],
        "tokens": ["Merci", "Bonjour", "Au revoir", "Oui", "Non"],
    },
    "match_pairs": {
        "pairs": {"Hello": "Bonjour", "Thank you": "Merci", "Yes": "Oui", "No": "Non"},
        "left": ["Hello", "Thank you", "Yes", "No"],
        "right": ["Bonjour", "Merci", "Oui", "Non"],
    },
    "translate": {
        "prompt": "Translate to French:\n\nI am a student.",
        "translation": "Je suis étudiant.",
    },
    "type_answer": {
        "prompt": "Write in French:\n\nGoodbye",
        "text": "au revoir",
        "alternatives": ["Au revoir"],
    },
}

FRENCH_FOOD = {
    "multiple_choice": {
        "prompt": "Choose the French translation for:\n\nBread",
        "answer": "Pain",
        "options": ["Pain", "Lait", "Fromage"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nEau",
        "answer": "Water",
        "options": ["Water", "Bread", "Milk"],
    },
    "fill_blank": {
        "prompt": "How do you say 'I drink water' in French?",
        "sentence": "___",
        "answer": "Je bois de l'eau",
        "options": ["Je bois de l'eau", "Je mange du pain", "Je lis un livre"],
    },
    "word_bank": {
        "prompt": "Tap the French words for:\n\nI eat bread",
        "words": ["Je", "mange", "du", "pain"],
        "tokens": ["Je", "mange", "du", "pain", "bois", "eau", "lait"],
    },
    "match_pairs": {
        "pairs": {"Bread": "Pain", "Water": "Eau", "Milk": "Lait", "Cheese": "Fromage"},
        "left": ["Bread", "Water", "Milk", "Cheese"],
        "right": ["Pain", "Eau", "Lait", "Fromage"],
    },
    "translate": {
        "prompt": "Translate to French:\n\nI drink water.",
        "translation": "Je bois de l'eau.",
    },
    "type_answer": {
        "prompt": "Write in French:\n\nMilk",
        "text": "lait",
        "alternatives": ["Lait", "du lait"],
    },
}

FRENCH_TRAVEL = {
    "multiple_choice": {
        "prompt": "Choose the French translation for:\n\nTrain",
        "answer": "Train",
        "options": ["Train", "Voiture", "Avion"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nGare",
        "answer": "Station",
        "options": ["Station", "Train", "Airport"],
    },
    "fill_blank": {
        "prompt": "How do you say 'Where is the station?' in French?",
        "sentence": "___",
        "answer": "Où est la gare ?",
        "options": ["Où est la gare ?", "C'est un train", "Je vais à Paris"],
    },
    "word_bank": {
        "prompt": "Tap the French words for:\n\nI go to Paris",
        "words": ["Je", "vais", "à", "Paris"],
        "tokens": ["Je", "vais", "à", "Paris", "viens", "Londres", "train"],
    },
    "match_pairs": {
        "pairs": {"Train": "Train", "Station": "Gare", "Car": "Voiture", "Airport": "Aéroport"},
        "left": ["Train", "Station", "Car", "Airport"],
        "right": ["Train", "Gare", "Voiture", "Aéroport"],
    },
    "translate": {
        "prompt": "Translate to French:\n\nWhere is the station?",
        "translation": "Où est la gare ?",
    },
    "type_answer": {
        "prompt": "Write in French:\n\nTrain",
        "text": "train",
        "alternatives": ["Train", "Le train"],
    },
}

FRENCH_FAMILY = {
    "multiple_choice": {
        "prompt": "Choose the French translation for:\n\nMother",
        "answer": "Mère",
        "options": ["Mère", "Père", "Sœur"],
    },
    "meaning": {
        "prompt": "What does this mean?\n\nFamille",
        "answer": "Family",
        "options": ["Family", "Mother", "Friend"],
    },
    "fill_blank": {
        "prompt": "How do you say 'This is my brother' in French?",
        "sentence": "___",
        "answer": "C'est mon frère",
        "options": ["C'est mon frère", "C'est mon ami", "C'est mon chat"],
    },
    "word_bank": {
        "prompt": "Tap the French words for:\n\nI love my family",
        "words": ["J'aime", "ma", "famille"],
        "tokens": ["J'aime", "ma", "famille", "Je", "déteste", "ton", "ami"],
    },
    "match_pairs": {
        "pairs": {"Mother": "Mère", "Father": "Père", "Brother": "Frère", "Family": "Famille"},
        "left": ["Mother", "Father", "Brother", "Family"],
        "right": ["Mère", "Père", "Frère", "Famille"],
    },
    "translate": {
        "prompt": "Translate to French:\n\nI love my family.",
        "translation": "J'aime ma famille.",
    },
    "type_answer": {
        "prompt": "Write in French:\n\nFamily",
        "text": "famille",
        "alternatives": ["Famille", "ma famille"],
    },
}

CONTENT_BY_KEY = {
    "greetings": {
        "es": SPANISH_GREETINGS,
        "ja": JAPANESE_GREETINGS,
        "de": GERMAN_GREETINGS,
        "fr": FRENCH_GREETINGS,
    },
    "food": {
        "ja": JAPANESE_FOOD,
        "de": GERMAN_FOOD,
        "fr": FRENCH_FOOD,
    },
    "travel": {
        "ja": JAPANESE_TRAVEL,
        "de": GERMAN_TRAVEL,
        "fr": FRENCH_TRAVEL,
    },
    "family": {
        "ja": JAPANESE_FAMILY,
        "de": GERMAN_FAMILY,
        "fr": FRENCH_FAMILY,
    },
}
