# config.py
# This file contains the static, base data for the game world.
# It defines the characters, items, and locations that the LLM can use to build a mystery.

VILLAGER_ROSTER = [
    {
        "name": "Old Mara",
        "title": "A gruff woman by the river",
        "location": "Foggy Riverbed",
        "backstory": "Mara's life was shattered when she lost her son in a great flood years ago. She now spends her days by the riverbed, speaking to him as if he's still there. She is hardened by grief, trusting the river more than people. Her knowledge is practical, but her mind often drifts between the present and the tragic past.",
        "personality_vector": {"truthfulness": 3, "verbosity": 2, "sarcasm": 4, "fearfulness": 2, "mystery": 3}
    },
    {
        "name": "Father Elias",
        "title": "A robed figure in the temple ruins",
        "location": "Abandoned Temple",
        "backstory": "A man of unwavering faith, Elias was defrocked for practicing unsanctioned, esoteric rituals. He sees the village's isolation not as a curse, but as a holy trial. He speaks in parables and riddles, believing direct answers are a form of blasphemy. He protects a dark secret about the village's founding.",
        "personality_vector": {"truthfulness": 2, "verbosity": 4, "sarcasm": 1, "fearfulness": 3, "mystery": 5}
    },
    {
        "name": "Jacob the Gravedigger",
        "title": "A man leaning on a shovel in the cemetery",
        "location": "Cemetery",
        "backstory": "Jacob is a man drowning his sorrows. A plague swept through the village decades ago, and he was the one who had to bury the dead, including his own family. The bottle is his only comfort, but in rare moments of sobriety, his memory is terrifyingly sharp. He often confuses the past and present.",
        "personality_vector": {"truthfulness": 4, "verbosity": 3, "sarcasm": 2, "fearfulness": 4, "mystery": 2}
    },
    {
        "name": "Ms. Caelia",
        "title": "A stern woman in the old schoolhouse",
        "location": "Old Schoolhouse",
        "backstory": "The former village schoolteacher, Ms. Caelia believes in order, discipline, and earned knowledge. She sees the player as an unruly student and will often demand they complete a task or solve a riddle before she deems them 'worthy' of information. Her mind is a library of village history, but she is a stern gatekeeper.",
        "personality_vector": {"truthfulness": 5, "verbosity": 3, "sarcasm": 3, "fearfulness": 1, "mystery": 3}
    },
    {
        "name": "Elric the Tailor",
        "title": "A nervous-looking man in a tailor's shop",
        "location": "Tailor's Shop",
        "backstory": "Timid and soft-spoken, Elric is the village's eyes and ears. From his shop window, he sees all the comings and goings. He is terrified of conflict and will often lie or feign ignorance if he feels threatened, but his conscience gnaws at him. He wants to help but is paralyzed by fear.",
        "personality_vector": {"truthfulness": 2, "verbosity": 2, "sarcasm": 1, "fearfulness": 5, "mystery": 2}
    },
    {
        "name": "Silas the Hunter",
        "title": "A rugged man outside a remote cabin",
        "location": "Hunter's Cabin",
        "backstory": "Silas turned his back on the village long ago, preferring the company of the forest. He is a survivalist, speaking in short, practical terms. He views the village as a source of corruption and only interacts when necessary. He knows the hidden paths and natural secrets of the land.",
        "personality_vector": {"truthfulness": 4, "verbosity": 1, "sarcasm": 3, "fearfulness": 1, "mystery": 4}
    },
    {
        "name": "Dr. Alistair Finch",
        "title": "An elderly doctor in the village square",
        "location": "Village Square",
        "backstory": "The village doctor is a man of science, but his advanced age has made his mind a cluttered attic of facts. He keeps meticulous records, but can rarely find the one he needs. He is kind and genuinely wants to help, but his thoughts often wander, and he can be frustratingly tangential.",
        "personality_vector": {"truthfulness": 5, "verbosity": 5, "sarcasm": 1, "fearfulness": 3, "mystery": 1}
    },
    {
        "name": "Little Nia",
        "title": "A small, quiet child",
        "location": "Anywhere",
        "backstory": "Nia is not like the others. She appears and vanishes without a sound, often seen humming by the lake or drawing in the dirt. It's unclear if she is a ghost, a hallucination, or something else entirely. She never speaks directly, communicating only in riddles or through the strange pictures she draws.",
        "personality_vector": {"truthfulness": 3, "verbosity": 1, "sarcasm": 1, "fearfulness": 2, "mystery": 5}
    }
]

ACCESSIBLE_LOCATIONS = ["Village Square", "Foggy Riverbed", "Abandoned Temple", "Cemetery", "Old Schoolhouse", "Tailor's Shop", "Hunter's Cabin"]
ITEM_POOL = ["RUST_REMOVER", "PRIESTS_OLD_JOURNAL", "SILVER_LOCKET", "STRANGE_FLOWER", "DOCTORS_MEDICAL_LOG", "HUNTERS_MAP_FRAGMENT"]
FAMILIARITY_LEVELS = {0: "Unknown", 1: "Stranger", 2: "Acquaintance", 3: "Familiar Face", 4: "Ally", 5: "Confidant"}
