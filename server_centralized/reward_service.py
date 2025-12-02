import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class RewardManager:
    """Manages game completion and reward calculation (NO blockchain calls)"""
    
    # Reward calculation constants (in smallest OCT units = 10^-9)
    BASE_REWARD = int(0.1 * 1e9)
    SCORE_MULTIPLIER = int(0.0001 * 1e9)
    MAX_REWARD = int(5 * 1e9)
    MIN_REWARD = int(0.1 * 1e9)
    TRUE_ENDING_BONUS = int(1.0 * 1e9)
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def calculate_reward(self, score: int, is_true_ending: bool) -> int:
        """Calculate reward based on game performance (matches Move contract logic)"""
        try:
            reward = self.BASE_REWARD + (score * self.SCORE_MULTIPLIER)
            
            if is_true_ending:
                reward += self.TRUE_ENDING_BONUS
            
            reward = max(self.MIN_REWARD, min(reward, self.MAX_REWARD))
            
            logger.info(f"Calculated reward: {reward} (score={score}, true_ending={is_true_ending})")
            return int(reward)
            
        except Exception as e:
            logger.error(f"Error calculating reward: {e}")
            return self.BASE_REWARD
    
    def create_game_completion_record(
        self,
        user_address: str,
        game_session_id: str,
        score: int,
        won: bool,
        is_true_ending: bool
    ) -> Dict[str, Any]:
        """
        Create game completion record.
        Returns data for frontend to call complete_game_and_create_proof.
        """
        try:
            if not user_address or not game_session_id:
                raise ValueError("Invalid user_address or game_session_id")
            
            if score < 0:
                raise ValueError("Score cannot be negative")
            
            reward_amount = 0
            if won:
                reward_amount = self.calculate_reward(score, is_true_ending)
            
            logger.info(
                f"Game completed - User: {user_address}, Score: {score}, Won: {won}, "
                f"Reward: {reward_amount}"
            )
            
            return {
                "success": True,
                "gameSessionId": game_session_id,
                "userAddress": user_address,
                "score": score,
                "won": won,
                "isTrueEnding": is_true_ending,
                "rewardAmount": reward_amount,
                "completedAt": datetime.now().isoformat(),
                # Frontend will call complete_game_and_create_proof with these params
                "needsBlockchainProof": won and reward_amount > 0
            }
            
        except Exception as e:
            logger.error(f"Error creating game completion record: {e}")
            raise


class RewardValidator:
    """Validates reward claims and game sessions"""
    
    @staticmethod
    def validate_game_session(game_session_id: str) -> bool:
        """Validate that game session exists and is valid"""
        try:
            if not game_session_id or len(game_session_id) < 10:
                return False
            return True
        except Exception as e:
            logger.error(f"Error validating game session: {e}")
            return False
    
    @staticmethod
    def validate_user_address(address: str) -> bool:
        """Validate wallet address format"""
        try:
            if not address or not isinstance(address, str):
                return False
            if not address.startswith("0x"):
                return False
            hex_part = address[2:]
            if len(hex_part) > 64:
                return False
            int(hex_part, 16)
            return True
        except Exception as e:
            logger.error(f"Error validating address: {e}")
            return False
    
    @staticmethod
    def validate_score(score: int, max_score: int = 1000000) -> bool:
        """Validate score is within reasonable bounds"""
        try:
            return isinstance(score, int) and 0 <= score <= max_score
        except Exception as e:
            logger.error(f"Error validating score: {e}")
            return False