# config.py
# This file contains the static, base data for the game world.
# It defines the characters, items, and locations that the LLM can use to build a mystery.

VILLAGER_ROSTER = [
    {
        "name": "Arthur the Woodcutter",
        "title": "A kind-faced old man in a cottage",
        "location": "Woodcutter's Cottage",
        "backstory": "Arthur is the heart of the village, a man who has lived here his entire life and acts as its unofficial caretaker. It was he who found you by the car wreck and brought you to safety. He is genuinely kind and helpful, but his deep love for the village and its traditions makes him hesitant to speak about the darker secrets that lie beneath the surface. He believes protecting the community's peace is more important than uncovering painful truths.",
        "personality_traits": {"truthfulness": 4, "verbosity": 3, "sarcasm": 1, "fearfulness": 3, "mystery": 3, "humor": 2, "helpfulness": 5}
    },
    {
        "name": "Old Mara",
        "title": "A gruff woman by the river",
        "location": "Foggy Riverbed",
        "backstory": "Mara's life was shattered when she lost her son in a great flood years ago. Grief has hardened her into a cynical, sarcastic shell. She spends her days by the river, speaking to the water as if it holds the answers. While she seems unhelpful, her sharp wit hides a deep-seated knowledge of the village's natural dangers and forgotten history. She respects persistence but has no time for fools.",
        "personality_traits": {"truthfulness": 3, "verbosity": 2, "sarcasm": 5, "fearfulness": 2, "mystery": 3, "humor": 3, "helpfulness": 2}
    },
    {
        "name": "Father Elias",
        "title": "A robed figure in the temple ruins",
        "location": "Abandoned Temple",
        "backstory": "A man of unwavering, fanatical faith, Elias was defrocked for practicing unsanctioned rituals. He sees the village's isolation as a holy trial and speaks in cryptic parables, believing direct answers are a form of blasphemy. He protects a dark secret about the village's founding, viewing it as a sacred trust. He is not malicious, but his worldview is so esoteric that extracting a straight answer from him is a monumental task.",
        "personality_traits": {"truthfulness": 2, "verbosity": 4, "sarcasm": 1, "fearfulness": 3, "mystery": 5, "humor": 1, "helpfulness": 1}
    },
    {
        "name": "Jacob the Gravedigger",
        "title": "A man leaning on a shovel in the cemetery",
        "location": "Cemetery",
        "backstory": "Jacob is a man haunted by the past. A plague swept through the village decades ago, and he buried nearly everyone he knew, including his family. He uses alcohol and gallows humor to cope with the memories. In his rare moments of sobriety, his mind is terrifyingly sharp, but he often confuses the living with the dead, offering clues wrapped in morbid jokes or drunken ramblings.",
        "personality_traits": {"truthfulness": 4, "verbosity": 3, "sarcasm": 4, "fearfulness": 4, "mystery": 2, "humor": 4, "helpfulness": 3}
    },
    {
        "name": "Ms. Caelia",
        "title": "A stern woman in the old schoolhouse",
        "location": "Old Schoolhouse",
        "backstory": "The former village schoolteacher, Ms. Caelia believes in order, discipline, and earned knowledge. She sees the player as an unruly student and will often demand they solve a riddle or demonstrate intellect before she deems them 'worthy' of information. Her mind is a library of village history, but she is a stern gatekeeper who despises laziness and emotional appeals.",
        "personality_traits": {"truthfulness": 5, "verbosity": 3, "sarcasm": 3, "fearfulness": 1, "mystery": 3, "humor": 2, "helpfulness": 2}
    },
    {
        "name": "Elric the Tailor",
        "title": "A nervous-looking man in a tailor's shop",
        "location": "Tailor's Shop",
        "backstory": "Timid and soft-spoken, Elric is the village's eyes and ears. From his shop window, he sees all comings and goings. He is terrified of conflict and will often lie or feign ignorance if he feels threatened, but his conscience gnaws at him. He wants to help but is paralyzed by fear, often giving information in frantic, whispered bursts before retreating.",
        "personality_traits": {"truthfulness": 2, "verbosity": 2, "sarcasm": 1, "fearfulness": 5, "mystery": 2, "humor": 1, "helpfulness": 4}
    },
    {
        "name": "Silas the Hunter",
        "title": "A rugged man outside a remote cabin",
        "location": "Hunter's Cabin",
        "backstory": "Silas turned his back on the village long ago, preferring the solitude of the forest. He is a rugged survivalist who speaks in short, practical terms. He views the village as a source of corruption and only interacts when necessary. He knows the hidden paths and natural secrets of the land, but sharing that knowledge depends on whether he thinks you're worthy of surviving the woods.",
        "personality_traits": {"truthfulness": 4, "verbosity": 1, "sarcasm": 3, "fearfulness": 1, "mystery": 4, "humor": 1, "helpfulness": 3}
    },
    {
        "name": "Dr. Alistair Finch",
        "title": "An elderly doctor in the village square",
        "location": "Village Square",
        "backstory": "The village doctor is a man of science, but his advanced age has made his mind a cluttered attic of facts. He keeps meticulous records but can rarely find the one he needs. He is kind and genuinely wants to help, but his thoughts often wander into long, tangential stories about past patients, often burying crucial details in a sea of irrelevant information.",
        "personality_traits": {"truthfulness": 5, "verbosity": 5, "sarcasm": 1, "fearfulness": 3, "mystery": 1, "humor": 3, "helpfulness": 4}
    },
    {
        "name": "Genevieve the Innkeeper",
        "title": "A cheerful woman polishing a glass",
        "location": "The Weary Traveler Inn",
        "backstory": "Genevieve runs the only inn in the village, a hub of gossip and quiet deals. She maintains a professional, cheerful demeanor at all times, using her warm humor to disarm visitors and locals alike. She hears everything but volunteers nothing, preferring to trade information like currency. Her helpfulness is directly proportional to what she thinks she can get in return.",
        "personality_traits": {"truthfulness": 3, "verbosity": 4, "sarcasm": 2, "fearfulness": 2, "mystery": 4, "humor": 4, "helpfulness": 3}
    },
    {
        "name": "Little Nia",
        "title": "A small, quiet child",
        "location": "Anywhere",
        "backstory": "Nia is not like the others. She appears and vanishes without a sound, often seen humming by the lake or drawing strange symbols in the dirt. It's unclear if she is a ghost, a hallucination, or something else entirely. She never speaks directly, communicating only in riddles or through the cryptic pictures she draws, which sometimes foretell the future... or the past.",
        "personality_traits": {"truthfulness": 3, "verbosity": 1, "sarcasm": 1, "fearfulness": 2, "mystery": 5, "humor": 1, "helpfulness": 2}
    }
]

FAMILIARITY_LEVELS = {0: "Unknown", 1: "Stranger", 2: "Acquaintance", 3: "Familiar Face", 4: "Ally", 5: "Confidant"}