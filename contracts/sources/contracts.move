#[allow(duplicate_alias)]
module contracts::contracts {
    use one::table::{Self, Table};
    use one::random::{Self, Random};
    use one::coin::{Self, Coin};
    use one::balance::{Self, Balance};
    use one::oct::OCT;
    use one::event;
    use one::object::{Self, UID, ID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    use one::clock::{Self, Clock};
    use std::vector;

    // Error constants
    const E_INSUFFICIENT_FUNDS: u64 = 1;
    const E_UNAUTHORIZED: u64 = 4;
    const E_ALREADY_CLAIMED: u64 = 5;
    const E_INVALID_REWARD_AMOUNT: u64 = 7;
    const E_GAME_NOT_WON: u64 = 8;
    const E_INVALID_SCORE: u64 = 9;

    // Game constants
    const ENTRANCE_FEE: u64 = 50000000; // 0.05 OCT in smallest units
    
    // Reward calculation constants (matching backend)
    const BASE_REWARD: u64 = 100000000; // 0.5 OCT
    const SCORE_MULTIPLIER: u64 = 100000; // 0.0001 OCT per score point
    const MAX_REWARD: u64 = 5000000000; // 5.0 OCT
    const MIN_REWARD: u64 = 100000000; // 0.1 OCT
    const TRUE_ENDING_BONUS: u64 = 1000000000; // 1.0 OCT

    /***********************
     * SCOREBOARD
     ***********************/
    public struct Scores has key {
        id: UID,
        map: Table<address, u64>,
        keys: vector<address>,
    }

    public entry fun init_scores(ctx: &mut TxContext) {
        let scores = Scores {
            id: object::new(ctx),
            map: table::new(ctx),
            keys: vector::empty<address>(),
        };
       transfer::share_object(scores);
    }

    public entry fun register_user(scores: &mut Scores, user: address) {
        if (!table::contains(&scores.map, user)) {
            table::add(&mut scores.map, user, 0);
            vector::push_back(&mut scores.keys, user);
        }
    }

    public entry fun update_score(scores: &mut Scores, user: address, new_score: u64) {
        if (table::contains(&scores.map, user)) {
            let _old = table::remove(&mut scores.map, user);
            table::add(&mut scores.map, user, new_score);
        } else {
            table::add(&mut scores.map, user, new_score);
            vector::push_back(&mut scores.keys, user);
        }
    }

    public fun get_score(scores: &Scores, user: address): u64 {
        if (table::contains(&scores.map, user)) {
            *table::borrow(&scores.map, user)
        } else {
            0
        }
    }

    public fun get_leaderboard(scores: &Scores): (vector<address>, vector<u64>) {
        let n = vector::length(&scores.keys);
        let mut i = 0;
        let mut addrs = vector::empty<address>();
        let mut vals = vector::empty<u64>();

        while (i < n) {
            let addr = *vector::borrow(&scores.keys, i);
            let val = if (table::contains(&scores.map, addr)) {
                *table::borrow(&scores.map, addr)
            } else { 0 };
            vector::push_back(&mut addrs, addr);
            vector::push_back(&mut vals, val);
            i = i + 1;
        };
        (addrs, vals)
    }

    /***********************
     * NFT ITEMS
     ***********************/
    public struct ItemNFT has key {
        id: UID,
        name: vector<u8>,
    }

    public entry fun mint_item(
        recipient: address,
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let item = ItemNFT {
            id: object::new(ctx),
            name,
        };
        transfer::transfer(item, recipient);
    }

    public entry fun burn_item(item: ItemNFT) {
        let ItemNFT { id, name: _ } = item;
        object::delete(id);
    }

    public fun name(item: &ItemNFT): &vector<u8> {
        &item.name
    }

    /***********************
     * AVATAR (Soulbound NFT)
     ***********************/
    public struct AvatarNFT has key, store {
        id: UID,
        avatar_id: u8,
        owner: address,
    }

    public struct AvatarRegistry has key {
        id: UID,
        avatars: Table<address, ID>,
    }

    public entry fun init_avatar_registry(ctx: &mut TxContext) {
        let reg = AvatarRegistry {
            id: object::new(ctx),
            avatars: table::new(ctx),
        };
        transfer::share_object(reg);
    }

    fun mint_avatar(avatar_id: u8, ctx: &mut TxContext): AvatarNFT {
        AvatarNFT {
            id: object::new(ctx),
            avatar_id,
            owner: tx_context::sender(ctx),
        }
    }

    #[allow(lint(public_random))]
    public entry fun ensure_avatar(
        reg: &mut AvatarRegistry,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        if (table::contains(&reg.avatars, user)) {
            return
        };

        let mut generator = random::new_generator(r, ctx);
        let avatar_id_num = random::generate_u8_in_range(&mut generator, 1, 10);
        
        let avatar = mint_avatar(avatar_id_num, ctx);
        let avatar_object_id = object::id(&avatar);
        table::add(&mut reg.avatars, user, avatar_object_id);

        transfer::transfer(avatar, user);
    }

    public fun get_avatar_object_id(reg: &AvatarRegistry, user: address): ID {
        *table::borrow(&reg.avatars, user)
    }

    public fun owner(avatar: &AvatarNFT): address {
        avatar.owner
    }

    public fun avatar_id(avatar: &AvatarNFT): u8 {
        avatar.avatar_id
    }

    public fun has_avatar(reg: &AvatarRegistry, user: address): bool {
        table::contains(&reg.avatars, user)
    }

    /***********************
     * CHEST SYSTEM
     ***********************/
    public struct ChestRegistry has key {
        id: UID,
        chest_timers: Table<address, u64>,
    }

    public entry fun init_chest_registry(ctx: &mut TxContext) {
        let reg = ChestRegistry {
            id: object::new(ctx),
            chest_timers: table::new(ctx),
        };
        transfer::share_object(reg);
    }

    public fun can_open_chest(reg: &ChestRegistry, clock: &Clock, user: address): bool {
        if (!table::contains(&reg.chest_timers, user)) {
            return true
        };
        
        let last_open_time = *table::borrow(&reg.chest_timers, user);
        let current_time = clock::timestamp_ms(clock);
        let cooldown_ms = 24 * 60 * 60 * 1000;
        
        current_time >= last_open_time + cooldown_ms
    }

    public fun get_chest_cooldown_remaining(reg: &ChestRegistry, clock: &Clock, user: address): u64 {
        if (!table::contains(&reg.chest_timers, user)) {
            return 0
        };
        
        let last_open_time = *table::borrow(&reg.chest_timers, user);
        let current_time = clock::timestamp_ms(clock);
        let cooldown_ms = 24 * 60 * 60 * 1000;
        let target_time = last_open_time + cooldown_ms;
        
        if (current_time >= target_time) {
            0
        } else {
            target_time - current_time
        }
    }

    #[allow(lint(public_random))]
    public entry fun open_chest(
        reg: &mut ChestRegistry,
        r: &Random,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        assert!(can_open_chest(reg, clock, user), 0x1001);
        
        let current_time = clock::timestamp_ms(clock);
        if (table::contains(&reg.chest_timers, user)) {
            let _old_time = table::remove(&mut reg.chest_timers, user);
            table::add(&mut reg.chest_timers, user, current_time);
        } else {
            table::add(&mut reg.chest_timers, user, current_time);
        };
        
        let mut generator = random::new_generator(r, ctx);
        let item_index = random::generate_u8_in_range(&mut generator, 0, 7);
        
        let item_name = if (item_index == 0) {
            b"FISHING_ROD"
        } else if (item_index == 1) {
            b"AXE"
        } else if (item_index == 2) {
            b"SHOVEL"
        } else if (item_index == 3) {
            b"LANTERN"
        } else if (item_index == 4) {
            b"PICKAXE"
        } else if (item_index == 5) {
            b"HAMMER"
        } else if (item_index == 6) {
            b"BUCKET"
        } else {
            b"SCYTHE"
        };
        
        let item = ItemNFT {
            id: object::new(ctx),
            name: item_name,
        };
        transfer::transfer(item, user);
    }

    public fun get_last_chest_open_time(reg: &ChestRegistry, user: address): u64 {
        if (table::contains(&reg.chest_timers, user)) {
            *table::borrow(&reg.chest_timers, user)
        } else {
            0
        }
    }

    /***********************
    * AUTONOMOUS REWARD POOL SYSTEM
    ***********************/
    
    public struct RewardPool has key {
        id: UID,
        balance: Balance<OCT>,
        total_collected: u64,
        total_distributed: u64,
        admin: address,
    }

    public struct GameCompletionProof has key {
        id: UID,
        player: address,
        score: u64,
        won: bool,
        is_true_ending: bool,
        reward_amount: u64,
        game_session_id: vector<u8>,
        completed_at: u64,
        claimed: bool,
    }

    // Events
    public struct GameStarted has copy, drop {
        player: address,
        entrance_fee: u64,
        timestamp: u64,
    }

    public struct GameCompleted has copy, drop {
        player: address,
        score: u64,
        won: bool,
        reward_amount: u64,
        game_session_id: vector<u8>,
    }

    public struct RewardClaimed has copy, drop {
        player: address,
        amount: u64,
        game_session_id: vector<u8>,
    }

    public entry fun init_reward_pool(ctx: &mut TxContext) {
        let pool = RewardPool {
            id: object::new(ctx),
            balance: balance::zero(),
            total_collected: 0,
            total_distributed: 0,
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(pool);
    }

    public entry fun start_game_with_fee(
        pool: &mut RewardPool,
        payment: Coin<OCT>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        let payment_value = coin::value(&payment);
        assert!(payment_value >= ENTRANCE_FEE, E_INSUFFICIENT_FUNDS);
        
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut pool.balance, payment_balance);
        pool.total_collected = pool.total_collected + payment_value;
        
        event::emit(GameStarted {
            player,
            entrance_fee: ENTRANCE_FEE,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    fun calculate_reward_amount(score: u64, is_true_ending: bool): u64 {
        let mut reward = BASE_REWARD + (score * SCORE_MULTIPLIER);
        
        if (is_true_ending) {
            reward = reward + TRUE_ENDING_BONUS;
        };
        
        if (reward < MIN_REWARD) {
            reward = MIN_REWARD;
        };
        if (reward > MAX_REWARD) {
            reward = MAX_REWARD;
        };
        
        reward
    }

    public entry fun complete_game_and_create_proof(
        pool: &mut RewardPool,
        game_session_id: vector<u8>,
        score: u64,
        won: bool,
        is_true_ending: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        assert!(score <= 1000000, E_INVALID_SCORE);
        
        let reward_amount = if (won) {
            let calculated = calculate_reward_amount(score, is_true_ending);
            assert!(balance::value(&pool.balance) >= calculated, E_INSUFFICIENT_FUNDS);
            calculated
        } else {
            0
        };
        
        let proof = GameCompletionProof {
            id: object::new(ctx),
            player,
            score,
            won,
            is_true_ending,
            reward_amount,
            game_session_id,
            completed_at: clock::timestamp_ms(clock),
            claimed: false,
        };
        
        transfer::transfer(proof, player);
        
        event::emit(GameCompleted {
            player,
            score,
            won,
            reward_amount,
            game_session_id,
        });
    }

    public entry fun claim_reward_with_proof(
        pool: &mut RewardPool,
        proof: GameCompletionProof,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        
        assert!(proof.player == player, E_UNAUTHORIZED);
        assert!(proof.won, E_GAME_NOT_WON);
        assert!(!proof.claimed, E_ALREADY_CLAIMED);
        assert!(proof.reward_amount > 0, E_INVALID_REWARD_AMOUNT);
        assert!(balance::value(&pool.balance) >= proof.reward_amount, E_INSUFFICIENT_FUNDS);
        
        let reward_amount = proof.reward_amount;
        let game_session_id = proof.game_session_id;
        
        let reward_balance = balance::split(&mut pool.balance, reward_amount);
        let reward_coin = coin::from_balance(reward_balance, ctx);
        
        pool.total_distributed = pool.total_distributed + reward_amount;
        
        transfer::public_transfer(reward_coin, player);
        
        let GameCompletionProof { 
            id, 
            player: _, 
            score: _, 
            won: _, 
            is_true_ending: _,
            reward_amount: _, 
            game_session_id: _,
            completed_at: _,
            claimed: _
        } = proof;
        object::delete(id);
        
        event::emit(RewardClaimed {
            player,
            amount: reward_amount,
            game_session_id,
        });
    }

    public entry fun fund_reward_pool(pool: &mut RewardPool, funding: Coin<OCT>) {
        let funding_balance = coin::into_balance(funding);
        let amount = balance::value(&funding_balance);
        balance::join(&mut pool.balance, funding_balance);
        pool.total_collected = pool.total_collected + amount;
    }

    public entry fun admin_withdraw_excess(
        pool: &mut RewardPool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.admin, E_UNAUTHORIZED);
        assert!(balance::value(&pool.balance) >= amount, E_INSUFFICIENT_FUNDS);
        
        let withdrawal_balance = balance::split(&mut pool.balance, amount);
        let withdrawal_coin = coin::from_balance(withdrawal_balance, ctx);
        transfer::public_transfer(withdrawal_coin, pool.admin);
    }

    // View Functions
    public fun get_pool_balance(pool: &RewardPool): u64 {
        balance::value(&pool.balance)
    }

    public fun get_pool_stats(pool: &RewardPool): (u64, u64, u64) {
        (
            balance::value(&pool.balance),
            pool.total_collected,
            pool.total_distributed
        )
    }

    public fun get_entrance_fee(): u64 {
        ENTRANCE_FEE
    }

    public fun is_proof_claimed(proof: &GameCompletionProof): bool {
        proof.claimed
    }

    public fun get_proof_details(proof: &GameCompletionProof): (address, u64, bool, u64) {
        (proof.player, proof.score, proof.won, proof.reward_amount)
    }
}