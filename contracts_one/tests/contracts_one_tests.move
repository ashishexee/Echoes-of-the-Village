#[test_only]
module contracts_one::contracts_one_tests {
    use one::test_scenario;
    use contracts_one::contracts_one;
    use one::random;       // For Random type

    const ADMIN: address = @0xABBA;
    const USER1: address = @0x1111;
    const USER2: address = @0x2222;
    const USER3: address = @0x3333;

    const SCORE_1: u64 = 100;
    const SCORE_2: u64 = 250;
    const SCORE_3: u64 = 150;

    #[test]
    fun test_init_scores() {
        let mut scenario = test_scenario::begin(ADMIN);

        contracts_one::init_scores(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, ADMIN);
        let scores_obj = test_scenario::take_shared<contracts_one::Scores>(&scenario);

        // Non-existent user should have 0
        assert!(contracts_one::get_score(&scores_obj, USER1) == 0, 1);

        test_scenario::return_shared(scores_obj);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_register_and_update_score() {
        let mut scenario = test_scenario::begin(ADMIN);

        contracts_one::init_scores(test_scenario::ctx(&mut scenario));

        // Register USER1
        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut scores_obj = test_scenario::take_shared<contracts_one::Scores>(&scenario);
        contracts_one::register_user(&mut scores_obj, USER1);
        assert!(contracts_one::get_score(&scores_obj, USER1) == 0, 2);
        test_scenario::return_shared(scores_obj);

        // Update USER1 score
        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut scores_obj = test_scenario::take_shared<contracts_one::Scores>(&scenario);
        contracts_one::update_score(&mut scores_obj, USER1, SCORE_1);
        assert!(contracts_one::get_score(&scores_obj, USER1) == SCORE_1, 3);
        test_scenario::return_shared(scores_obj);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_leaderboard() {
        let mut scenario = test_scenario::begin(ADMIN);

        contracts_one::init_scores(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut scores_obj = test_scenario::take_shared<contracts_one::Scores>(&scenario);
        contracts_one::update_score(&mut scores_obj, USER1, SCORE_1);
        contracts_one::update_score(&mut scores_obj, USER2, SCORE_2);
        contracts_one::update_score(&mut scores_obj, USER3, SCORE_3);

        let (addresses, _scores_vec) = contracts_one::get_leaderboard(&scores_obj);
        assert!(vector::length(&addresses) == 3, 5);

        test_scenario::return_shared(scores_obj);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_mint_and_burn_item() {
        let mut scenario = test_scenario::begin(ADMIN);

        let item_name = b"Legendary Sword";
        contracts_one::mint_item(USER1, item_name, test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER1);
        let item_to_burn = test_scenario::take_from_sender<contracts_one::ItemNFT>(&scenario);

        assert!(*contracts_one::name(&item_to_burn) == b"Legendary Sword", 10);
        contracts_one::burn_item(item_to_burn);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_avatar_flow() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Init registry and Random object
        contracts_one::init_avatar_registry(test_scenario::ctx(&mut scenario));
        test_scenario::new_randomness(test_scenario::ctx(&mut scenario));

        // USER1 ensures avatar
        test_scenario::next_tx(&mut scenario, USER1);
        let mut registry = test_scenario::take_shared<contracts_one::AvatarRegistry>(&scenario);
        let r_obj = test_scenario::take_shared<random::Random>(&scenario);

        contracts_one::ensure_avatar(&mut registry, &r_obj, test_scenario::ctx(&mut scenario));

        test_scenario::return_shared(r_obj);
        test_scenario::return_shared(registry);

        // USER1 receives avatar
        test_scenario::next_tx(&mut scenario, USER1);
        let avatar = test_scenario::take_from_sender<contracts_one::AvatarNFT>(&scenario);
        assert!(contracts_one::owner(&avatar) == USER1, 12);
        let avatar_id = contracts_one::avatar_id(&avatar);
        assert!(avatar_id >= 1 && avatar_id <= 10, 13);
        test_scenario::return_to_sender(&scenario, avatar);

        // USER1 ensures avatar again, should do nothing
        test_scenario::next_tx(&mut scenario, USER1);
        let mut registry = test_scenario::take_shared<contracts_one::AvatarRegistry>(&scenario);
        let r_obj = test_scenario::take_shared<random::Random>(&scenario);
        contracts_one::ensure_avatar(&mut registry, &r_obj, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(r_obj);
        test_scenario::return_shared(registry);

        test_scenario::end(scenario);
    }
}