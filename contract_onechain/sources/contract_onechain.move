module contract_onechain::contract_onechain {
    use 0x2::table::{Self as table, Table};

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
        transfer::transfer(scores, tx_context::sender(ctx));
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

    /// Read one user’s score
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
}
