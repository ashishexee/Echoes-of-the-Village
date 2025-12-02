import os
import logging
from typing import Optional
from pysui import SuiConfig, AsyncClient  # CHANGED: Use AsyncClient instead of SyncClient
from pysui.abstracts import SignerBlock
from pysui.sui.sui_clients.transaction import SuiTransaction
from pysui.sui.sui_types.address import SuiAddress
from pysui.sui.sui_types.scalars import ObjectID, SuiU64, SuiBoolean

logger = logging.getLogger(__name__)

class BlockchainService:
    """Handle on-chain transactions for reward claims"""
    
    def __init__(self):
        # Load admin wallet configuration
        self.config = SuiConfig.user_config(
            rpc_url="https://rpc-testnet.onelabs.cc:443"  # Use OneChain testnet
        )
        self.client = None  # Will initialize async client when needed
        
        # Get admin address from environment or config
        self.admin_address = os.getenv('ADMIN_ADDRESS')
        self.package_id = os.getenv('PACKAGE_ID', '0x48826cf627c4695d7ebb281732b208dec8a595121877924aa65a1347cec1cee9')
        self.treasury_id = os.getenv('TREASURY_OBJECT_ID', '0xfac68f3a4db67a32515f3553b9c5cf18fdb7a2d936b5448fb76d3abf5d6aa3d2')
        
        if not self.admin_address:
            logger.warning("ADMIN_ADDRESS not set - on-chain claiming disabled")
    
    async def _get_client(self) -> AsyncClient:
        """Lazy initialization of async client"""
        if self.client is None:
            self.client = AsyncClient(self.config)
        return self.client
    
    async def create_reward_claim(
        self,
        game_session_id: str,
        player_address: str,
        won: bool,
        reward_amount: int
    ) -> Optional[str]:
        """
        Create an on-chain RewardClaim object by calling complete_game
        
        Returns:
            The object ID of the created RewardClaim, or None if failed
        """
        if not self.admin_address:
            logger.error("Cannot create reward claim: Admin address not configured")
            return None
        
        try:
            logger.info(f"Creating reward claim for {player_address}, amount: {reward_amount}")
            
            # Get async client
            client = await self._get_client()
            
            # Build transaction to call complete_game
            txn = SuiTransaction(client=client)
            
            # Call complete_game Move function
            txn.move_call(
                target=f"{self.package_id}::contract_onechain::complete_game",
                arguments=[
                    ObjectID(self.treasury_id),
                    ObjectID(game_session_id),  # GameSession object
                    SuiBoolean(won),
                    SuiU64(reward_amount),
                ]
            )
            
            # Execute transaction as admin (requires signing)
            # NOTE: This requires admin's private key to be configured in pysui
            result = await client.execute_transaction_block(
                transaction=txn,
                signer=self.config.active_address,  # Admin must have signing capability
                options={
                    "showEffects": True,
                    "showEvents": True,
                }
            )
            
            if result.is_ok():
                # Extract the created RewardClaim object ID from effects
                effects = result.effects
                created_objects = effects.get("created", [])
                
                for obj in created_objects:
                    # Look for RewardClaim object type
                    obj_type = obj.get("objectType", "")
                    if "RewardClaim" in obj_type:
                        claim_id = obj["objectId"]
                        logger.info(f"✓ Created RewardClaim: {claim_id}")
                        return claim_id
                
                logger.warning("RewardClaim object not found in created objects")
                logger.debug(f"Created objects: {created_objects}")
                return None
            else:
                logger.error(f"Transaction failed: {result.error}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create reward claim: {e}", exc_info=True)
            return None