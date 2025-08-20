# game_logic/llm_calls.py
# Contains the GeminiAPI class and all prompt engineering logic.

import json
import google.generativeai as genai

class GeminiAPI:
    def __init__(self, api_key):
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
            print("✅ Gemini API configured successfully.")
        except Exception as e:
            print(f"❌ Error configuring Gemini API: {e}")
            self.model = None

    def _clean_json_response(self, text_response):
        text_response = text_response.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
        return text_response.strip()

    def generate_content(self, prompt_type, context):
        if not self.model: return "{}"
        print(f"\n--- 🤖 Live Gemini API Call ({prompt_type}) ---")
        
        prompts = {
            "StoryGenerator": self._create_story_generator_prompt,
            "WorldBuilder": self._create_world_builder_prompt,
            "Interaction": self._create_interaction_prompt,
        }
        prompt = prompts.get(prompt_type, lambda _: "")(context)
        if not prompt: 
            print(f"--- ERROR: No prompt found for type '{prompt_type}' ---")
            return "{}"

        print("--- Sending Prompt to Gemini... (This may take a moment) ---")
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return self._clean_json_response(response.text)
        except Exception as e:
            print(f"❌ An error occurred during the API call: {e}")
            return "{}"

    def _create_story_generator_prompt(self, context):
        return f"""
        You are a master storyteller and mystery writer for the game "Village of Echoes".

        **The Fixed Premise:**
        The player's story ALWAYS begins this way: Their car crashes in a mysterious forest after a tree falls. They awaken in the cottage of a kind old man, Arthur. He tells them he found them unconscious but saw no sign of their friends. During their unconsciousness, the player heard a desperate, psychic cry from their friends: 'Help us... find us...' The game begins as the player steps outside to search the village.

        **Your Task:**
        Your job is to generate the secret, underlying mystery of the village that the player will uncover. You must create a unique reason for the friends' disappearance that fits the dark, psychological mystery theme of the game.

        **10 Story Theme Examples for Inspiration:**
        1. A sentient, ancient tree in the woods caused the crash to lure people in for a seasonal ritual.
        2. The friends stumbled upon a hidden, Cold War-era government experiment in an old mine.
        3. A parasitic fungus that creates a hive-mind has infected the village.
        4. The village is trapped in a time loop, and the friends were taken by entities that maintain it.
        5. The villagers are all ghosts, re-enacting their final days and want the friends to join them.
        6. The village is a cult that worships a "founder" who promised them eternal life.
        7. A rare, hallucinogenic flower in the valley traps the villagers in a collective delusion.
        8. The psychic cry the player heard was a trap, created by a predatory entity that feeds on hope.
        9. The villagers "harvest" memories from outsiders to keep their own fading memories alive.
        10. There are no villagers. They are all constructs created by a single, powerful psychic child (Nia).

        **Your Goal:**
        Based on this premise and the examples, generate a NEW, unique JSON object with three keys:
        1.  `story_theme`: A string describing the core secret of the village for this playthrough.
        2.  `inaccessible_locations`: A list of {context['num_inaccessible_locations']} unique, thematic location names you invented that tie into your new story theme, the names shouldn't absurd of fancy ones, generate the simple ones only.
        3.  `correct_location`: A string containing one of the names from your `inaccessible_locations` list where the friends are actually being held.

        Output ONLY the raw JSON object.
        """

    def _create_world_builder_prompt(self, context):
        difficulty = context.get('difficulty', 'medium')
        if difficulty == 'very_easy':
            node_count = "8"
            key_clue_count = 2
            final_clue_instruction = "The final clue must be extremely direct and explicitly state where to go."
            difficulty_instructions = "Clues must be direct and obvious. Avoid riddles or metaphors."
            type_instruction = "Generate **exactly 2 nodes** of type 'TalkToVillager' to guide the player. The rest should be 'Information'."
        elif difficulty == 'easy':
            node_count = "15-20"
            key_clue_count = 3
            final_clue_instruction = "The final clue should be a strong hint, making the answer clear."
            difficulty_instructions = "Clues should be mostly straightforward."
            type_instruction = "You may use a mix of 'Information' and 'TalkToVillager' nodes."
        elif difficulty == 'hard':
            node_count = "35-40"
            key_clue_count = 6
            final_clue_instruction = "The final clue must be extremely cryptic, requiring significant deduction."
            difficulty_instructions = "Clues must be cryptic and often misleading. Use riddles and metaphors."
            type_instruction = "Create a complex web using many 'TalkToVillager' nodes to interconnect clues."
        else: # Medium
            node_count = "25-30"
            key_clue_count = 4
            final_clue_instruction = "The final clue must be cryptic. Do not state the answer directly."
            difficulty_instructions = "Clues should require some thought and interpretation."
            type_instruction = "Create a web-like structure with a good mix of 'Information' and 'TalkToVillager' nodes."

        return f"""
        You are a world-class narrative designer generating a "Quest Network" for the game "Village of Echoes".

        The correct location is: **{context['correctLocation']}**.
        The difficulty is: **{difficulty.upper()}**.
        The core secret of the village is: **{context['story_theme']}**

        **Guiding Principles:**
        - **Clarity of Content is Paramount:** The `content` field must be written to be as clear as possible for the player.
            - If `type` is `Information`, the `content` is a direct clue the player learns with complete brief of clue history, direction and reason.
            - If `type` is `TalkToVillager`, the `content` **MUST** explicitly name the villager to talk to and give a clear reason and also where they will be found/ are. **Bad example:** 'The river holds many secrets.' **Good example:** 'You should go speak with Old Mara by the river; she knows things about the recent disappearances.'
        - **Character-Driven:** Clues must originate from the villager's personality and their role in the secret.
        - **Difficulty:** {difficulty_instructions}

        **Node Structure:**
        -   `node_id`: A simple, unique, sequential string, like "node1", "node2", "node3", etc.
        -   `villager_name`: Who provides this node.
        -   `content`: The core information or clue, written according to the Clarity of Content principle.
        -   `type`: "Information" or "TalkToVillager".
        -   `priority`: Importance order (1=Minor, 5=Major), higher the priority it should be given considered first for the story.
        -   `key_clue`: A boolean (true/false).
        -   `preconditions`: List of `node_id` strings required.
        -   `required_familiarity`: An integer from 1-5, or `null`.

        **Generation Requirements ({difficulty.upper()}):**
        -   Generate a network of **{node_count} nodes**.
        -   Designate **exactly {key_clue_count} nodes** as `key_clue: true`.
        -   {type_instruction}
        -   **{final_clue_instruction}**

        **Game Data for Context:**
        -   Villagers: {json.dumps(context['villagers'], indent=2)}

        Output ONLY the raw JSON object containing the "nodes" list.
        """

    def _create_interaction_prompt(self, context):
        conversational_status = context.get('conversational_status')
        context_node = context.get('context_node')
        turn_objective = ""
        
        # Default instruction for the final JSON task
        json_task_instruction = "Generate a JSON object with four keys: `npc_dialogue` (string), `player_responses` (a list of 1 to 3 relevant, in-character questions for the player to ask next. If the conversation is not progressing the search for the player's friends, one option should try to steer it back to that topic)., `node_revealed_id` (string or null), `new_familiarity_level` (an integer from 0-5; this should typically only increase by 0 or 2 point per positive or negative interaction (irrespective))."

        if conversational_status == "PERMANENTLY_EXHAUSTED":
            turn_objective = "You have no more clues to give. Your objective is to provide a final, reflective piece of dialogue that feels like a natural end to your conversations."
            json_task_instruction = "Generate a JSON object with four keys: `npc_dialogue` (string), `player_responses` (a list containing EXACTLY ONE polite, closing string option), `node_revealed_id` (null), `new_familiarity_level` (integer 0-5)."
        elif conversational_status == "HAS_LOCKED_CLUES":
            turn_objective = "The player is not yet ready for your next clue. Your objective is to hint at the reason (e.g., lack of trust, a missing piece of information) without revealing the clue itself, and then gracefully end the conversation. Communicate this principle creatively, not by repeating the same line every time."
            json_task_instruction = "Generate a JSON object with four keys: `npc_dialogue` (string), `player_responses` (a list containing EXACTLY ONE polite, closing string option), `node_revealed_id` (null), `new_familiarity_level` (integer 0-5)."
        elif conversational_status == "CAN_REVEAL":
            turn_objective = "A clue is available and all conditions are met. Your goal is to steer the conversation towards this topic and deliver the information naturally. If the player is off-topic, gently guide them back before delivering the information."


        return f"""
        You are a master character actor performing in an interactive psychological mystery game. Your performance must be natural, consistent, and serve the story.

        **The Philosophy of Your Performance:**
        Your character's personality is your primary filter for every word you speak. However, the game must progress. If a game objective (like revealing a clue) conflicts with your personality, the objective takes precedence, but you must perform the action *in character*. For example, an unhelpful person might reveal a clue grudgingly; a liar might frame a truth as a rumor they overheard.

        Crucially, maintain realism: do not mention the player's "friends" unless they have mentioned it to you first in the current conversation. Your dialogue should always be a natural, in-character response to what the player just said.

        **Your Role:**
        You are roleplaying as the villager: **{context['villagerProfile']['name']}**.

        **Your Turn-by-Turn Objective:**
        {turn_objective}

        **Key Context for Your Performance:**
        - **Your Character Profile:** {json.dumps(context['villagerProfile'], indent=2)}
        - **Your Relationship with Player:** Your familiarity is **{context['familiarity_level']} ({context['familiarity_description']})**. This should heavily influence your tone. **If "Unknown," you MUST introduce yourself.**
        - **What the Player Already Knows:** `{context['player_knowledge_summary']}`. Do not repeat this information.
        - **Your Available Clue:** `{json.dumps(context_node)}`
        - **Full Conversation History:** {json.dumps(context['chatHistory'], indent=2)}

        **Your Task:**
        Respond to the player's last statement: `"{context['player_last_response']}"`. Your dialogue should be concise (around 2 sentences). Then, generate the required JSON object.
        {json_task_instruction}
        
        Output ONLY the raw JSON object.
        """