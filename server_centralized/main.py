# main.py
# This script runs the FastAPI server, exposing the game engine through API endpoints.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict
import logging
import uuid
import os
import traceback
import sys
from datetime import datetime
from dotenv import load_dotenv

from schemas import *
from game_logic.engine import GameEngine
from game_logic.state_manager import GameState
from reward_service import RewardManager, RewardValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Echoes of the Village - Game Backend")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
active_games: dict[str, GameState] = {}
completed_games: dict[str, dict] = {}

API_KEY = os.environ.get("GOOGLE_API_KEY")
game_engine: GameEngine

@app.on_event("startup")
async def startup_event():
    global game_engine
    print("--- Server Startup ---")
    if not API_KEY or API_KEY == "YOUR_GOOGLE_API_KEY_HERE":
        sys.exit("API Key is not configured. Shutting down.")
    
    print("API Key found. Initializing Game Engine...")
    game_engine = GameEngine(api_key=API_KEY)
    if not game_engine.llm_api.model:
        sys.exit("Failed to initialize Gemini Model.")
    print("Game Engine initialized successfully.")

@app.post("/game/new", response_model=NewGameResponse)
async def create_new_game(request: NewGameRequest):
    game_id = str(uuid.uuid4())
    try:
        game_state = game_engine.start_new_game(
            game_id=game_id,
            num_inaccessible_locations=request.num_inaccessible_locations,
            difficulty=request.difficulty
        )
        active_games[game_id] = game_state
        
        initial_villagers = [
            {"id": f"villager_{i}", "title": v["title"]} 
            for i, v in enumerate(game_state.villagers)
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
        villager_index = int(request.villager_id.split('_')[1])
        if not (0 <= villager_index < len(game_state.villagers)):
            raise HTTPException(status_code=400, detail="Invalid villager ID.")
            
        villager_name = game_state.villagers[villager_index]["name"]
        frustration = {"friends": len([
            msg for msg in game_state.full_npc_memory.get(villager_name, [])
            if msg.get("content") and "friend" in msg.get("content").lower()
        ])}
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

    return GuessResponse(
        message=message,
        is_correct=is_correct,
        is_true_ending=is_true_ending
    )

# ============== Reward System Models ==============

class CompleteGameRequest(BaseModel):
    userAddress: str = Field(..., description="Player's wallet address (0x...)")
    gameSessionId: str = Field(..., description="ID of the game session (transaction digest from start_game)")
    score: int = Field(..., ge=0, description="Final score achieved")
    won: bool = Field(..., description="Whether player won the game")
    isTrueEnding: bool = Field(default=False, description="Whether true ending was found")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of game completion")
    
    @validator('userAddress')
    def validate_user_address(cls, v):
        if not RewardValidator.validate_user_address(v):
            raise ValueError("Invalid wallet address format")
        return v
    
    @validator('gameSessionId')
    def validate_session_id(cls, v):
        if not v or len(v) < 10:
            raise ValueError("Invalid game session ID")
        return v
    
    @validator('score')
    def validate_score(cls, v):
        if not RewardValidator.validate_score(v):
            raise ValueError("Invalid score value")
        return v

class CompleteGameResponse(BaseModel):
    success: bool
    message: str
    gameSessionId: str
    userAddress: str
    score: int
    won: bool
    isTrueEnding: bool
    rewardAmount: int
    rewardClaimId: Optional[str] = None
    completedAt: str

# ============== Reward Endpoints ==============

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Echoes of the Village Backend",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/complete-game", response_model=CompleteGameResponse)
async def complete_game(request: CompleteGameRequest):
    """
    Complete game and return reward calculation.
    Frontend will call complete_game_and_create_proof on-chain.
    """
    try:
        logger.info(f"Processing game completion: {request.userAddress}")
        
        if not RewardValidator.validate_user_address(request.userAddress):
            raise HTTPException(status_code=400, detail="Invalid wallet address")
        if not RewardValidator.validate_score(request.score):
            raise HTTPException(status_code=400, detail="Invalid score")
        
        reward_manager = RewardManager(db_session=None)
        
        result = reward_manager.create_game_completion_record(
            user_address=request.userAddress,
            game_session_id=request.gameSessionId,
            score=request.score,
            won=request.won,
            is_true_ending=request.isTrueEnding
        )
        
        completion_id = f"{request.userAddress}_{request.gameSessionId}"
        completed_games[completion_id] = result
        
        logger.info(f"Game completion processed: {result}")
        
        message = "Game completed! "
        if result["won"] and result["rewardAmount"] > 0:
            message += f"Reward: {result['rewardAmount'] / 1e9:.2f} OCT - Create proof on-chain to claim."
        
        return CompleteGameResponse(
            success=True,
            message=message,
            gameSessionId=result["gameSessionId"],
            userAddress=result["userAddress"],
            score=result["score"],
            won=result["won"],
            isTrueEnding=result["isTrueEnding"],
            rewardAmount=result["rewardAmount"],
            rewardClaimId=None,  # No claim ID needed anymore
            completedAt=result["completedAt"]
        )
        
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/completions/{user_address}")
async def get_user_completions(user_address: str):
    """Get all game completions for a user"""
    try:
        if not RewardValidator.validate_user_address(user_address):
            raise HTTPException(status_code=400, detail="Invalid user address")
        
        user_completions = [
            comp for comp_id, comp in completed_games.items()
            if comp["userAddress"] == user_address
        ]
        
        return {
            "success": True,
            "userAddress": user_address,
            "completions": user_completions,
            "totalRewards": sum(c["rewardAmount"] for c in user_completions if c["won"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting completions: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving completions")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)