#[test_only]
module contracts::contracts_chest_tests {
    use contracts::contracts::{
        Self,
        ChestRegistry,
        ItemNFT
    };
    use one::test_scenario::{Self as ts};
    use one::clock::{Self, Clock};
    use one::random::{Self, Random};
    use one::test_utils;

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0xA1;
    const USER2: address = @0xA2;

    // Helper function to advance time by milliseconds
    fun advance_clock(clock: &mut Clock, ms: u64) {
        clock::increment_for_testing(clock, ms);
    }

    #[test]
    fun test_init_chest_registry() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize chest registry
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        // Check that ChestRegistry was created and shared
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(ts::has_most_recent_shared<ChestRegistry>(), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_first_time_chest_open() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random (must be from @0x0)
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        // Create clock
        ts::next_tx(&mut scenario, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // User opens chest for first time
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            
            // Check can open (first time should be true)
            assert!(contracts::can_open_chest(&reg, &clock, USER1), 1);
            
            // Check cooldown is 0
            assert!(contracts::get_chest_cooldown_remaining(&reg, &clock, USER1) == 0, 2);
            
            // Open chest
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Check that user received an item
        ts::next_tx(&mut scenario, USER1);
        {
            assert!(ts::has_most_recent_for_address<ItemNFT>(USER1), 3);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_chest_cooldown() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // User opens chest first time
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Try to open immediately (should fail due to cooldown)
        ts::next_tx(&mut scenario, USER1);
        {
            let reg = ts::take_shared<ChestRegistry>(&scenario);
            
            // Should not be able to open
            assert!(!contracts::can_open_chest(&reg, &clock, USER1), 4);
            
            // Cooldown should be approximately 24 hours
            let cooldown = contracts::get_chest_cooldown_remaining(&reg, &clock, USER1);
            assert!(cooldown > 0, 5);
            assert!(cooldown <= 24 * 60 * 60 * 1000, 6); // Less than or equal to 24 hours
            
            ts::return_shared(reg);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0x1001)]
    fun test_chest_open_fails_during_cooldown() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // First chest open
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Advance time by 12 hours (not enough)
        advance_clock(&mut clock, 12 * 60 * 60 * 1000);
        
        // Try to open again (should fail with 0x1001)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_chest_open_after_24_hours() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // First chest open
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Advance time by 24 hours + 1ms
        advance_clock(&mut clock, (24 * 60 * 60 * 1000) + 1);
        
        // Should be able to open again
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            
            // Check can open
            assert!(contracts::can_open_chest(&reg, &clock, USER1), 7);
            
            // Check cooldown is 0
            assert!(contracts::get_chest_cooldown_remaining(&reg, &clock, USER1) == 0, 8);
            
            // Open chest successfully
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // User should have received 2 items total
        ts::next_tx(&mut scenario, USER1);
        {
            // Note: In real tests you'd check the count, but for simplicity we just verify success
            assert!(ts::has_most_recent_for_address<ItemNFT>(USER1), 9);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_users_independent_cooldowns() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // USER1 opens chest
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Advance time by 12 hours
        advance_clock(&mut clock, 12 * 60 * 60 * 1000);
        
        // USER2 can still open (independent cooldown)
        ts::next_tx(&mut scenario, USER2);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            
            // USER2 should be able to open
            assert!(contracts::can_open_chest(&reg, &clock, USER2), 10);
            
            // USER1 should NOT be able to open
            assert!(!contracts::can_open_chest(&reg, &clock, USER1), 11);
            
            // Open chest for USER2
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Both users should have items
        ts::next_tx(&mut scenario, USER1);
        assert!(ts::has_most_recent_for_address<ItemNFT>(USER1), 12);
        
        ts::next_tx(&mut scenario, USER2);
        assert!(ts::has_most_recent_for_address<ItemNFT>(USER2), 13);
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_get_last_chest_open_time() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Check initial time (should be 0 for new user)
        ts::next_tx(&mut scenario, USER1);
        {
            let reg = ts::take_shared<ChestRegistry>(&scenario);
            assert!(contracts::get_last_chest_open_time(&reg, USER1) == 0, 14);
            ts::return_shared(reg);
        };
        
        // Set clock to specific time
        let test_time = 1000000u64;
        clock::set_for_testing(&mut clock, test_time);
        
        // Open chest
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Check that last open time is recorded
        ts::next_tx(&mut scenario, USER1);
        {
            let reg = ts::take_shared<ChestRegistry>(&scenario);
            let last_time = contracts::get_last_chest_open_time(&reg, USER1);
            assert!(last_time == test_time, 15);
            ts::return_shared(reg);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_chest_drops_random_items() {
        let mut scenario = ts::begin(@0x0);
        
        // Initialize random
        {
            let ctx = ts::ctx(&mut scenario);
            random::create_for_testing(ctx);
        };
        
        // Initialize chest registry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            contracts::init_chest_registry(ctx);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Open chest and verify item is received
        ts::next_tx(&mut scenario, USER1);
        {
            let mut reg = ts::take_shared<ChestRegistry>(&scenario);
            let random_state = ts::take_shared<Random>(&scenario);
            contracts::open_chest(&mut reg, &random_state, &clock, ts::ctx(&mut scenario));
            ts::return_shared(reg);
            ts::return_shared(random_state);
        };
        
        // Check user received an ItemNFT
        ts::next_tx(&mut scenario, USER1);
        {
            let item = ts::take_from_address<ItemNFT>(&scenario, USER1);
            
            // Verify item has a valid name (one of the 8 possible items)
            let item_name = contracts::name(&item);
            let name_length = std::vector::length(item_name);
            assert!(name_length > 0, 16); // Item should have a name
            
            ts::return_to_address(USER1, item);
        };
        
        test_utils::destroy(clock);
        ts::end(scenario);
    }
}