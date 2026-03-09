import {readConfig, setUser} from "./config.js";
import {
    CommandsRegistry, handlerAddFeed,
    handlerAddUser, handlerAgg,
    handlerBrowse, handlerDropFollow, handlerFeeds, handlerFollow, handlerFollowing, handlerGetUsers,
    handlerLogin,
    handlerResetUsers, middlewareLoggedIn,
    registerCommand,
    runCommand
} from "./command.js";

async function main() {
    const registry:CommandsRegistry = {};
    const loginCmd = registerCommand(registry, "login", handlerLogin);
    const addUser = registerCommand(registry, "register", handlerAddUser);
    const resetUsers = registerCommand(registry, "reset", handlerResetUsers);
    const getUsers = registerCommand(registry, "users", handlerGetUsers);
    const agg = registerCommand(registry, "agg", handlerAgg);
    const addFeed = registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    const feeds = registerCommand(registry, "feeds", handlerFeeds);
    const follow = registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    const following = registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
    const dropFollow = registerCommand(registry, "unfollow", middlewareLoggedIn(handlerDropFollow));
    const browse = registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("usage: gator <command> <args>");
        process.exit(1);
    }
    if (!(args[0] in registry)) {
        console.log(`command ${args[0]} not found`);
        process.exit(1);

    }
    await runCommand(registry, args[0], ...args.slice(1));
    process.exit(0);
}

main();
