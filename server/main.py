# main.py
# This script runs the FastAPI server, exposing the game engine through API endpoints.

from fastapi import FastAPI, HTTPException
from typing import Dict
import uuid
import os
import traceback
import sys
from dotenv import load_dotenv

from schemas import *
from game_logic.engine import GameEngine
from game_logic.state_manager import GameState
from config import ACCESSIBLE_LOCATIONS

# Load environment variables from a .env file if it exists
load_dotenv()

# Initialize the FastAPI app and the Game Engine
app = FastAPI()
# IMPORTANT: Get your API key from your environment or the .env file
API_KEY = os.environ.get("GOOGLE_API_KEY", "YOUR_GOOGLE_API_KEY_HERE")
game_engine: GameEngine
active_games: Dict[str, GameState] = {}

@app.on_event("startup")
async def startup_event():
    """
    This function runs when the server starts.
    It checks for a valid API key and initializes the game engine.
    """
    global game_engine
    print("--- Server Startup ---")
    if not API_KEY or API_KEY == "YOUR_GOOGLE_API_KEY_HERE":
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! FATAL ERROR: API Key not found or is a placeholder.       !!!")
        print("!!! Please set the API_KEY variable in main.py or set the   !!!")
        print("!!! GOOGLE_API_KEY environment variable.                      !!!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        # This is a clean way to stop the server from running without a key.
        # In a real production environment, you might handle this differently.
        sys.exit("API Key is not configured. Shutting down.")
    
    print("API Key found. Initializing Game Engine...")
    game_engine = GameEngine(api_key=API_KEY)
    if not game_engine.llm_api.model:
        sys.exit("Failed to initialize Gemini Model. Please check your API key and network connection.")
    print("Game Engine initialized successfully.")


@app.post("/game/new", response_model=NewGameResponse)
async def create_new_game(request: NewGameRequest):
    game_id = str(uuid.uuid4())
    try:
        game_state = game_engine.start_new_game(
            game_id=game_id,
            num_villagers=8, # Can be customized from request if needed
            num_inaccessible_locations=request.num_inaccessible_locations,
            difficulty=request.difficulty
        )
        active_games[game_id] = game_state
        
        # Prepare the initial list of villagers with titles
        initial_villagers = [
            {"id": f"villager_{i}", "title": v["title"]} 
            for i, v in enumerate(game_state.villagers) # Use the per-game villager list
        ]

        return NewGameResponse(
            game_id=game_id,
            status="success",
            inaccessible_locations=game_state.inaccessible_locations,
            villagers=initial_villagers
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate new game: {e}")

@app.post("/game/{game_id}/interact", response_model=InteractResponse)
async def interact(game_id: str, request: InteractRequest):
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_state = active_games[game_id]
    
    try:
        # Map villager_id back to name using the correct per-game list
        villager_index = int(request.villager_id.split('_')[1])
        if not (0 <= villager_index < len(game_state.villagers)):
            raise HTTPException(status_code=400, detail="Invalid villager ID.")
            
        villager_name = game_state.villagers[villager_index]["name"]

        frustration = {"friends": len([msg for msg in game_state.full_npc_memory.get(villager_name, []) if "friend" in msg.get("content", "").lower()])}
        
        # If it's the first interaction, player_prompt will be None
        player_input = request.player_prompt if request.player_prompt is not None else "I'd like to talk."

        dialogue_data = game_engine.process_interaction_turn(game_state, villager_name, player_input, frustration)
        
        if not dialogue_data:
             raise HTTPException(status_code=500, detail="LLM failed to generate valid dialogue.")

        return InteractResponse(
            villager_id=request.villager_id,
            villager_name=villager_name,
            npc_dialogue=dialogue_data.get("npc_dialogue"),
            player_suggestions=dialogue_data.get("player_responses")
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Interaction failed: {e}")

@app.post("/game/{game_id}/confirm_item", response_model=ConfirmItemResponse)
async def confirm_item(game_id: str, request: ConfirmItemRequest):
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_state = active_games[game_id]
    
    # Simple validation: check if the item is part of any revealed fetch quest
    is_valid_quest = False
    for node in game_state.quest_network.get("nodes", []):
        if (node.get("type") == "FetchItem" and 
            node.get("reward_item") == request.item_id and
            node["node_id"] in game_state.player_state["discovered_nodes"]):
            is_valid_quest = True
            break
            
    if not is_valid_quest:
        raise HTTPException(status_code=400, detail="Player is not on a quest for this item.")

    if request.item_id not in game_state.player_state["inventory"]:
        game_state.player_state["inventory"].append(request.item_id)
    
    return ConfirmItemResponse(status="success", message=f"{request.item_id} added to inventory.")

@app.post("/game/{game_id}/guess", response_model=GuessResponse)
async def guess(game_id: str, request: GuessRequest):
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_state = active_games[game_id]
    is_correct = request.location_name == game_state.correct_location
    
    key_clues = [node['node_id'] for node in game_state.quest_network.get('nodes', []) if node.get('key_clue')]
    discovered_key_clues = [node_id for node_id in game_state.player_state['discovered_nodes'] if node_id in key_clues]
    is_true_ending = len(discovered_key_clues) == len(key_clues)

    message = ""
    if is_correct:
        message += f"You head towards {request.location_name} and find your friends, alive. "
        if is_true_ending:
            message += "You understand the full, dark truth of the village. CONGRATULATIONS, TRUE ENDING!"
        else:
            message += "You never fully understood why they were taken. YOU WIN, BUT THE MYSTERY REMAINS..."
    else:
        message = f"You find nothing but silence and dust at {request.location_name}. Your friends are gone forever. The correct location was {game_state.correct_location}. GAME OVER."

    # Clean up the completed game
    del active_games[game_id]

    return GuessResponse(
        message=message,
        is_correct=is_correct,
        is_true_ending=is_true_ending
    )

# To run this server:
# 1. Create a folder named 'game_logic' and place engine.py, llm_calls.py, and state_manager.py inside it.
# 2. Place main.py, config.py, and schemas.py in the root directory.
# 3. Install FastAPI, Uvicorn, and python-dotenv: pip install "fastapi[all]" python-dotenv
# 4. Run from your terminal: uvicorn main:app --reload
