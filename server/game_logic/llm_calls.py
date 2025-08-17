# game_logic/llm_calls.py
# Contains the GeminiAPI class and all prompt engineering logic.

import json
import google.generativeai as genai
from config import ITEM_POOL, ACCESSIBLE_LOCATIONS

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
        You are a master storyteller and mystery writer. Your task is to generate the high-level concept for a new mystery in the game "Village of Echoes".

        **Your Goal:**
        1.  Create a unique, dark, and compelling secret or 'story theme' for the village.
        2.  Based on this theme, generate {context['num_inaccessible_locations']} creative, evocative names for potential secret locations.
        3.  Choose one of these newly generated locations to be the `correct_location` where the player's friends are hidden.

        **Examples of Story Themes:**
        - "The village made a pact with an ancient entity in the woods, and the player's friends are the next offering."
        - "A rare, hallucinogenic flower grows only in this valley, and the villagers are trapped in a collective delusion."
        - "The founder of the village discovered a hidden treasure and the villagers are sworn to protect its secret at any cost."

        **Your Task:**
        Generate a JSON object with three keys:
        1.  `story_theme`: A string describing the core secret of the village for this playthrough.
        2.  `inaccessible_locations`: A list of {context['num_inaccessible_locations']} unique, thematic location names you invented.
        3.  `correct_location`: A string containing one of the names from your `inaccessible_locations` list.

        Output ONLY the raw JSON object.
        """

    def _create_world_builder_prompt(self, context):
        difficulty = context.get('difficulty', 'medium')
        if difficulty == 'easy':
            node_count = "15-20"
            key_clue_count = 3
            final_clue_instruction = "The final clue should be a strong hint, making the answer clear."
        elif difficulty == 'hard':
            node_count = "35-40"
            key_clue_count = 6
            final_clue_instruction = "The final clue must be extremely cryptic, requiring significant deduction from the player."
        else: # Medium
            node_count = "25-30"
            key_clue_count = 4
            final_clue_instruction = "The final clue must be cryptic. Do not state the answer directly. It should give the player the final piece of the puzzle to solve themselves."

        return f"""
        You are a world-class narrative designer. Your task is to generate a complex "Quest Network" for the game "Village of Echoes".

        The correct location is: **{context['correctLocation']}**.
        The difficulty is: **{difficulty.upper()}**.
        The core secret of the village is: **{context['story_theme']}**

        **Your Process (Internal Monologue First, then JSON):**
        1.  **Social Graph:** First, internally reason about a social graph based on the story theme. Who are the true believers? Who are the dissenters? Who is ignorant? This graph will inform the logic of your quest web.
        2.  **Web Construction:** Using your social graph, construct the JSON "nodes" list.

        **CRITICAL DESIGN PRINCIPLES:**
        - **Web, Not a Chain:** Create a complex, crisscrossing web. A single node should branch out, and multiple nodes should converge on a single, more important clue.
        - **Character-Driven:** Quests must originate from the villager's personality and their role in the village's secret.
        - **GROUND DIALOGUE IN MECHANICS:** When generating a `FetchItem` quest, the dialogue (`content`) you write MUST NOT invent a specific, non-explorable location. Instead, the dialogue must logically guide the player towards the actual, explorable `item_location` you have defined for that node.

        **NODE STRUCTURE:**
        -   `node_id`: Unique ID.
        -   `villager_name`: Who provides this node.
        -   `content`: The core information, task, or riddle.
        -   `type`: "Information", "FetchItem", or "TalkToVillager".
        -   `priority`: Importance (1=Minor, 5=Major).
        -   `key_clue`: A boolean (true/false) indicating if this is an essential clue for the "true ending".
        -   `preconditions`: List of `node_id` strings required.
        -   `required_item`: Item needed to unlock, or `null`.
        -   `required_familiarity`: An integer from 1-5 indicating the trust level needed, or `null`.
        -   `reward_item`: Item given upon completing the task, or `null`.
        -   `item_location`: For "FetchItem" nodes, specify the ACCESSIBLE_LOCATION where the `reward_item` can be found.

        **GENERATION REQUIREMENTS ({difficulty.upper()}):**
        -   **Generate a network of {node_count} nodes.**
        -   **Designate exactly {key_clue_count} nodes as `key_clue: true`.**
        -   **No single villager should have more than 5 nodes.**
        -   Ensure multiple starting points (no preconditions).
        -   **{final_clue_instruction}**

        **Game Data for Context:**
        -   Villagers: {json.dumps(context['villagers'], indent=2)}
        -   Item Pool: {json.dumps(ITEM_POOL)}
        -   Accessible Locations: {json.dumps(ACCESSIBLE_LOCATIONS)}

        Output ONLY the raw JSON object containing the "nodes" list.
        """

    def _create_interaction_prompt(self, context):
        familiarity_gate_info = ""
        if context.get('is_familiarity_locked'):
            familiarity_gate_info = "CRITICAL: The available node is LOCKED due to low familiarity. Your goal is to have an in-character conversation that encourages the player to build trust and return later. Hint that you know more without revealing the secret."
        
        conversation_exhausted_info = ""
        player_responses_instruction = "Dynamically determine the number of player responses (1-3) based on the conversational context. If the conversation is active and the player is investigating, provide 3 options. If the conversation feels like it is naturally concluding, it is appropriate to generate only one or two options."
        if context.get('is_conversation_exhausted'):
            conversation_exhausted_info = "CRITICAL: This character has no more clues to give and the player knows them well. Your goal is to provide a final, reflective, or summary piece of dialogue. Do not introduce new topics."
            player_responses_instruction = "Generate exactly 1 in-character player response that acknowledges the end of the conversation."


        return f"""
        You are a character actor AND a game director in a psychological horror game. Your task is to have a realistic, in-character conversation that also moves the game forward.

        **GAME DIRECTOR'S MANDATE (ABSOLUTE RULES):**
        1.  **ROLEPLAY IS PARAMOUNT:** Your first priority is to embody the character described below. Their personality vector dictates *how* you speak.
        2.  **PROGRESSION IS ESSENTIAL:** Your second priority is to ensure the game moves forward. A player leaving a conversation with zero new information after multiple attempts is a **FAILURE CONDITION**.
        3.  **PERSONALITY IS FLAVOR, NOT A BLOCKER:** A character's high 'mystery' or low 'truthfulness' is a filter for *how* they deliver information, not an excuse to withhold it forever.
        4.  **REWARD DIRECT QUESTIONS:** If the player's input directly relates to the topic of your available clue, you MUST treat it as a cue. Your response should begin to guide the conversation towards that topic.
        5.  **USE CONVERSATIONAL TECHNIQUES:** Do not be a script-reader. Use techniques like the 'Hook and Tease' (introduce a keyword, then elaborate if the player asks) and the 'Pivot' (change the subject to something related to your clue if the conversation stalls).
        6.  **BE CONCISE:** Your dialogue response (`npc_dialogue`) MUST be concise, ideally 2 sentences. You may extend to 3-4 sentences ONLY if it is absolutely essential to reveal a complex clue or character detail.

        **Your Role:**
        You are roleplaying as the villager: **{context['villagerProfile']['name']}**.

        **Your Character Profile:**
        {json.dumps(context['villagerProfile'], indent=2)}

        **Director's Notes for this Turn:**
        - **Familiarity Level:** Your familiarity with the player is **{context['familiarity_level']} ({context['familiarity_description']})**. Adjust your tone accordingly. If "Unknown," you should introduce yourself. Be wary of Strangers; be more open with Confidants.
        - **Familiarity Gate:** {familiarity_gate_info}
        - **Conversation Exhausted:** {conversation_exhausted_info}
        - **Player Frustration Level:** The player has asked about their 'friends' {context['frustration'].get('friends', 0)} times. If this number is 3 or more, you MUST provide a more direct, tangible piece of information in your response.
        - **Player's Knowledge:** The player already knows: `{context['player_knowledge_summary']}`. Do not repeat this. Build upon it.
        - **Player's Inventory:** The player is carrying: `{context['player_inventory']}`. If an item is relevant, react to it.

        **Your Background Knowledge (Available Quest Node to potentially reveal):**
          - Node ID: `{context['available_node']['node_id'] if context['available_node'] else 'None'}`
          - Content: `{context['available_node']['content'] if context['available_node'] else 'You have no specific critical information to share right now.'}`
          - Priority: `{context['available_node']['priority'] if context['available_node'] else 'N/A'}`
        
        **Your Goal for this Turn:**
        1.  Respond to the player's last statement: `"{context['player_last_response']}"`, following all Director's Mandates and Notes.
        2.  If you can naturally weave your "Background Knowledge" into the response (and it's not familiarity locked), do so. If you do, you MUST set `node_revealed_id` to the correct ID.
        3.  {player_responses_instruction}

        **Full Conversation History:**
        {json.dumps(context['chatHistory'], indent=2)}

        **Your Task:**
        Generate a JSON object with three keys:
        1.  `npc_dialogue`: Your character's next line of dialogue.
        2.  `player_responses`: A list of strings for the player to choose.
        3.  `node_revealed_id`: The string ID of the node you revealed, or `null`.
        4.  `new_familiarity_level`: An integer from 0-5. Based on the conversation, decide the player's new familiarity level with you.
        
        **CRITICAL FINAL CHECK:** Your entire output must be a single, valid JSON object. Ensure there are no duplicate keys, trailing commas, or syntax errors.

        """
