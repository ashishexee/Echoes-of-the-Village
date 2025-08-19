
const API_BASE_URL = "http://127.0.0.1:8000"; 
let currentGameId = null;

/**
 * Starts a new game session by calling the backend.
 * @param {string} difficulty The difficulty level ('easy', 'medium', 'hard').
 * @returns {Promise<string|null>} The new game ID, or null if it fails.
 */
async function startNewGame(difficulty) {
  try {
    console.log("Difficulty level - ",difficulty);
    
    const response = await fetch(`${API_BASE_URL}/game/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ difficulty: difficulty }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentGameId = data.game_id; // Store the game ID
    console.log(`New game started with ID: ${currentGameId}`);
    console.log(data);
    
    return data;

  } catch (error) {
    console.error("Error starting new game:", error);
    return null;
  }
}

/**
 * Fetches the next part of a conversation from the backend.
 * @param {string} villagerId The ID of the villager being spoken to.
 * @param {string} playerMessage The message or suggestion chosen by the player.
 * @returns {Promise<object|null>} The conversation data, or null if it fails.
 */
async function getConversation(villagerId, playerMessage) {
  if (!currentGameId) {
    console.error("Cannot get conversation, game_id is not set.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/game/${currentGameId}/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        villager_id: villagerId,
        player_message: playerMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error getting conversation:", error);
    return null;
  }
}

// Export the functions to be used in your game scenes
export { startNewGame, getConversation };
