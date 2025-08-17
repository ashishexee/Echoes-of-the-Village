# game_logic/engine.py
# The core GameEngine that manages the entire game lifecycle.

import random
import json
import traceback
from .state_manager import GameState
from .llm_calls import GeminiAPI
from config import VILLAGER_ROSTER, FAMILIARITY_LEVELS

class GameEngine:
    def __init__(self, api_key: str):
        self.llm_api = GeminiAPI(api_key)

    def start_new_game(self, game_id: str, num_villagers: int, num_inaccessible_locations: int, difficulty: str) -> GameState:
        game_state = GameState(game_id, difficulty)
        
        # 1. Generate the core story idea with robust error handling
        try:
            print("Attempting to generate story idea...")
            story_context = {"num_inaccessible_locations": num_inaccessible_locations}
            story_idea_json = self.llm_api.generate_content("StoryGenerator", story_context)
            if not story_idea_json or story_idea_json == "{}":
                raise ValueError("API returned an empty response for story generation.")
            story_idea = json.loads(story_idea_json)
            print("Story idea generated successfully.")
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"--- CRITICAL ERROR: Failed to generate or parse story idea. ---")
            print(f"--- Error: {e} ---")
            traceback.print_exc()
            raise Exception("Could not initialize game story.") from e

        game_state.story_theme = story_idea.get("story_theme")
        game_state.inaccessible_locations = story_idea.get("inaccessible_locations", [])
        game_state.correct_location = story_idea.get("correct_location")

        # Set the standardized opening story
        game_state.player_state["knowledge_summary"] = "You've just woken up in a cozy cottage. A kind old man named Arthur tells you he found you unconscious by a car wreck on the edge of the woods. He says he searched the area but saw no sign of your friends. As he speaks, you remember a faint, desperate call in your mind: 'Help us... find us...' You've just thanked him and stepped outside into the village square to begin your search."
        
        # Select a subset of villagers for this game and store it IN THE GAME STATE
        game_state.villagers = random.sample(VILLAGER_ROSTER, k=min(num_villagers, len(VILLAGER_ROSTER)))
        
        # Initialize state for the selected villagers
        for v in game_state.villagers:
            game_state.full_npc_memory[v["name"]] = []
            game_state.player_state["familiarity"][v["name"]] = 0

        # 2. Build the detailed Quest Network
        try:
            print("Attempting to generate quest network...")
            world_context = {
                "correctLocation": game_state.correct_location,
                "villagers": game_state.villagers, # Use the per-game villager list
                "difficulty": difficulty,
                "story_theme": game_state.story_theme
            }
            quest_network_json = self.llm_api.generate_content("WorldBuilder", world_context)
            if not quest_network_json or quest_network_json == "{}":
                raise ValueError("API returned an empty response for quest network generation.")
            game_state.quest_network = json.loads(quest_network_json)
            if not game_state.quest_network.get("nodes"):
                 raise ValueError("Generated quest network is missing the 'nodes' list.")
            print("Quest network generated successfully.")
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"--- CRITICAL ERROR: Failed to generate or parse quest network. ---")
            print(f"--- Error: {e} ---")
            traceback.print_exc()
            raise Exception("Could not initialize game world.") from e


        return game_state
    
    def get_next_quest_node_for_villager(self, game_state: GameState, npc_name: str):
        sorted_nodes = sorted(game_state.quest_network.get("nodes", []), key=lambda x: x.get('priority', 0), reverse=True)
        
        for node in sorted_nodes:
            if node["villager_name"] == npc_name and node["node_id"] not in game_state.player_state["discovered_nodes"]:
                preconditions_met = all(p in game_state.player_state["discovered_nodes"] for p in node.get("preconditions", []))
                item_met = not node.get("required_item") or node["required_item"] in game_state.player_state["inventory"]
                
                if preconditions_met and item_met:
                    current_familiarity = game_state.player_state["familiarity"].get(npc_name, 0)
                    required_familiarity = node.get("required_familiarity")
                    
                    if required_familiarity is None or current_familiarity >= required_familiarity:
                        return node, False # Node is available
                    else:
                        return node, True # Node is locked by familiarity
        return None, False # No node available

    def process_interaction_turn(self, game_state: GameState, npc_name: str, player_input: str, frustration: dict):
        available_node, is_locked = self.get_next_quest_node_for_villager(game_state, npc_name)
        is_exhausted = (not available_node) and (game_state.player_state['familiarity'].get(npc_name, 0) == 5)

        villager_profile = next((v for v in game_state.villagers if v["name"] == npc_name), None)
        
        dialogue_turn = self.llm_api.generate_content("Interaction", {
            "villagerProfile": villager_profile,
            "chatHistory": game_state.full_npc_memory.get(npc_name, []),
            "player_last_response": player_input,
            "available_node": available_node,
            "frustration": frustration,
            "player_inventory": game_state.player_state["inventory"],
            "player_knowledge_summary": game_state.player_state["knowledge_summary"],
            "familiarity_level": game_state.player_state["familiarity"].get(npc_name, 0),
            "familiarity_description": FAMILIARITY_LEVELS.get(game_state.player_state["familiarity"].get(npc_name, 0), "Unknown"),
            "is_familiarity_locked": is_locked,
            "is_conversation_exhausted": is_exhausted
        })
        
        dialogue_data = json.loads(dialogue_turn)
        
        # Update state
        game_state.full_npc_memory[npc_name].append({"role": "player", "content": player_input})
        game_state.full_npc_memory[npc_name].append({"role": "npc", "content": dialogue_data.get("npc_dialogue")})
        
        new_familiarity = dialogue_data.get("new_familiarity_level")
        if new_familiarity is not None:
            game_state.player_state["familiarity"][npc_name] = new_familiarity

        revealed_node_id = dialogue_data.get("node_revealed_id")
        if revealed_node_id and revealed_node_id not in game_state.player_state["discovered_nodes"]:
            game_state.player_state["discovered_nodes"].append(revealed_node_id)
            all_discovered_content = [node['content'] for node in game_state.quest_network.get('nodes', []) if node['node_id'] in game_state.player_state['discovered_nodes']]
            game_state.player_state["knowledge_summary"] = "Key points discovered so far: " + "; ".join(all_discovered_content)

        return dialogue_data
