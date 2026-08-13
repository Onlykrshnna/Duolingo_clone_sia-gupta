"""Realistic mini-conversation scenarios keyed by vocabulary id."""
from __future__ import annotations

# line_a: English prompt shown to learner
# line_a_target: optional target-language line A (shown instead when set)
# response_id: vocabulary id of the correct reply in target language
# category: for distractor sampling

CONVERSATION_SCENARIOS: dict[str, dict] = {
    "hello": {
        "line_a": "Hello!",
        "response_id": "hello",
        "category": "greetings",
    },
    "good_morning": {
        "line_a": "Good morning!",
        "response_id": "hello",
        "category": "greetings",
    },
    "good_afternoon": {
        "line_a": "Good afternoon!",
        "response_id": "hello",
        "category": "greetings",
    },
    "good_evening": {
        "line_a": "Good evening!",
        "response_id": "hello",
        "category": "greetings",
    },
    "goodbye": {
        "line_a": "Goodbye!",
        "response_id": "goodbye",
        "category": "greetings",
    },
    "see_you_later": {
        "line_a": "See you later!",
        "response_id": "goodbye",
        "category": "greetings",
    },
    "thank_you": {
        "line_a": "Thank you!",
        "response_id": "youre_welcome",
        "category": "greetings",
    },
    "please": {
        "line_a": "Can I have some water, please?",
        "response_id": "please",
        "category": "greetings",
    },
    "youre_welcome": {
        "line_a": "Thank you!",
        "response_id": "youre_welcome",
        "category": "greetings",
    },
    "sorry": {
        "line_a": "I'm sorry.",
        "response_id": "sorry",
        "category": "greetings",
    },
    "yes": {
        "line_a": "Do you want coffee?",
        "response_id": "yes",
        "category": "daily_life",
    },
    "no": {
        "line_a": "Do you want tea?",
        "response_id": "no",
        "category": "daily_life",
    },
    "water": {
        "line_a": "I'm thirsty.",
        "response_id": "water",
        "category": "food",
    },
    "coffee": {
        "line_a": "I'd like something hot to drink.",
        "response_id": "coffee",
        "category": "food",
    },
    "tea": {
        "line_a": "Would you like a drink?",
        "response_id": "tea",
        "category": "food",
    },
    "bread": {
        "line_a": "I'm hungry.",
        "response_id": "bread",
        "category": "food",
    },
    "order": {
        "line_a": "Are you ready to order?",
        "response_id": "order",
        "category": "restaurant",
    },
    "bill": {
        "line_a": "Can we pay now?",
        "response_id": "bill",
        "category": "restaurant",
    },
    "train": {
        "line_a": "How do we get to the city?",
        "response_id": "train",
        "category": "travel",
    },
    "ticket": {
        "line_a": "I need to buy a ticket.",
        "response_id": "ticket",
        "category": "travel",
    },
    "left": {
        "line_a": "Which way should I turn?",
        "response_id": "left",
        "category": "directions",
    },
    "right": {
        "line_a": "Should I turn here?",
        "response_id": "right",
        "category": "directions",
    },
    "price": {
        "line_a": "How much does this cost?",
        "response_id": "price",
        "category": "shopping",
    },
}


def get_scenario_for_word(word: dict) -> dict | None:
    wid = word.get("id", "")
    if wid in CONVERSATION_SCENARIOS:
        return CONVERSATION_SCENARIOS[wid]
    custom = word.get("conversationScenario")
    if custom:
        return custom
    return None


def resolve_response_word(scenario: dict, get_word) -> dict | None:
    """Look up the vocabulary entry for the expected reply."""
    rid = scenario.get("response_id")
    if not rid:
        return None
    return get_word(rid)
