module contracts::contracts {
    use one::table::{Self, Table};
    use one::random::{Self, Random};
    use one::clock::{Self, Clock};

    /***********************
     * SCOREBOARD
     ***********************/
    public struct Scores has key {
        id: UID,
        map: Table<address, u64>,      // address -> score
        keys: vector<address>,         // list of registered addresses
    }

    /// One-time initializer.
    public entry fun init_scores(ctx: &mut TxContext) {
        let scores = Scores {
            id: object::new(ctx),
            map: table::new(ctx),
            keys: vector::empty<address>(),
        };
       transfer::share_object(scores);
    }

    /// Register a user with score = 0
    public entry fun register_user(scores: &mut Scores, user: address) {
        if (!table::contains(&scores.map, user)) {
            table::add(&mut scores.map, user, 0);
            vector::push_back(&mut scores.keys, user);
        }
    }

    /// Update (or insert) a user's score
    public entry fun update_score(scores: &mut Scores, user: address, new_score: u64) {
        if (table::contains(&scores.map, user)) {
            let _old = table::remove(&mut scores.map, user);
            table::add(&mut scores.map, user, new_score);
        } else {
            table::add(&mut scores.map, user, new_score);
            vector::push_back(&mut scores.keys, user);
        }
    }

    /// Read one user's score
    public fun get_score(scores: &Scores, user: address): u64 {
        if (table::contains(&scores.map, user)) {
            *table::borrow(&scores.map, user)
        } else {
            0
        }
    }

    /// Read all scores (for leaderboard)
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

    /// Public getter for the item's name
    public fun name(item: &ItemNFT): &vector<u8> {
        &item.name
    }

    /***********************
     * AVATAR (Soulbound NFT)
     ***********************/
    public struct AvatarNFT has key, store {
        id: UID,
        avatar_id: u8,         // number from 1–10
        owner: address,        // permanently bound
    }

    public struct AvatarRegistry has key {
        id: UID,
        avatars: Table<address, ID>, // user address -> avatar object ID
    }

    /// Initialize registry once during deployment
    public entry fun init_avatar_registry(ctx: &mut TxContext) {
        let reg = AvatarRegistry {
            id: object::new(ctx),
            avatars: table::new(ctx),
        };
        transfer::share_object(reg);
    }

    /// Internal helper — mint an avatar
    fun mint_avatar(
        avatar_id: u8,
        ctx: &mut TxContext
    ): AvatarNFT {
        AvatarNFT {
            id: object::new(ctx),
            avatar_id,
            owner: tx_context::sender(ctx),
        }
    }

    /// Check if user has avatar, if not mint one with random number
    #[allow(lint(public_random))] // Acknowledge and suppress the randomness warning
    public entry fun ensure_avatar(
        reg: &mut AvatarRegistry,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);

        // if user already has avatar, do nothing
        if (table::contains(&reg.avatars, user)) {
            return
        };

        // else mint random avatar 1–10
        let mut generator = random::new_generator(r, ctx);
        let avatar_id_num = random::generate_u8_in_range(&mut generator, 1, 10);
        
        let avatar = mint_avatar(avatar_id_num, ctx);
        let avatar_object_id = object::id(&avatar);
        table::add(&mut reg.avatars, user, avatar_object_id);

        // soulbound: transfer to user, cannot be transferred again by default
        transfer::transfer(avatar, user);
    }

    /// View function to read user's avatar object ID
    public fun get_avatar_object_id(
        reg: &AvatarRegistry,
        user: address
    ): ID {
        *table::borrow(&reg.avatars, user)
    }

    /// Public getter for the avatar's owner
    public fun owner(avatar: &AvatarNFT): address {
        avatar.owner
    }

    /// Public getter for the avatar's ID
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
        chest_timers: Table<address, u64>, // user address -> last chest open timestamp (ms)
    }

    /// Initialize chest registry once during deployment
    public entry fun init_chest_registry(ctx: &mut TxContext) {
        let reg = ChestRegistry {
            id: object::new(ctx),
            chest_timers: table::new(ctx),
        };
        transfer::share_object(reg);
    }

    /// Check if user can open chest (24 hours have passed)
    public fun can_open_chest(
        reg: &ChestRegistry,
        clock: &Clock,
        user: address
    ): bool {
        if (!table::contains(&reg.chest_timers, user)) {
            return true // First time opening
        };
        
        let last_open_time = *table::borrow(&reg.chest_timers, user);
        let current_time = clock::timestamp_ms(clock);
        let cooldown_ms = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        current_time >= last_open_time + cooldown_ms
    }

    /// Get remaining cooldown time in milliseconds
    public fun get_chest_cooldown_remaining(
        reg: &ChestRegistry,
        clock: &Clock,
        user: address
    ): u64 {
        if (!table::contains(&reg.chest_timers, user)) {
            return 0 // First time, no cooldown
        };
        
        let last_open_time = *table::borrow(&reg.chest_timers, user);
        let current_time = clock::timestamp_ms(clock);
        let cooldown_ms = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        let target_time = last_open_time + cooldown_ms;
        
        if (current_time >= target_time) {
            0
        } else {
            target_time - current_time
        }
    }

    /// Open chest and get a random item
    #[allow(lint(public_random))]
    public entry fun open_chest(
        reg: &mut ChestRegistry,
        r: &Random,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        
        // Check if user can open chest
        assert!(can_open_chest(reg, clock, user), 0x1001); // Custom error: chest on cooldown
        
        // Update the last open time
        let current_time = clock::timestamp_ms(clock);
        if (table::contains(&reg.chest_timers, user)) {
            let _old_time = table::remove(&mut reg.chest_timers, user);
            table::add(&mut reg.chest_timers, user, current_time);
        } else {
            table::add(&mut reg.chest_timers, user, current_time);
        };
        
        // Generate random item
        let mut generator = random::new_generator(r, ctx);
        let item_index = random::generate_u8_in_range(&mut generator, 0, 7); // 0-7 for 8 items
        
        // Map index to item names (same as in frontend)
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
        
        // Mint the item to the user
        let item = ItemNFT {
            id: object::new(ctx),
            name: item_name,
        };
        transfer::transfer(item, user);
    }

    /// View function to get last chest open time
    public fun get_last_chest_open_time(
        reg: &ChestRegistry,
        user: address
    ): u64 {
        if (table::contains(&reg.chest_timers, user)) {
            *table::borrow(&reg.chest_timers, user)
        } else {
            0
        }
    }
}