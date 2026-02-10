import { Server } from "common/engine/server.ts";
import { GameServer } from "./other/server.ts";
import { HostConfig } from "common/engine/core.ts";
import { Config } from "./configType.ts";
function new_server_from_hc(hc:HostConfig):Server{
    if(hc.https){
        return new Server(hc.port,hc.https,hc.cert,hc.key)
    }
    return new Server(hc.port)
}

if (import.meta.main) {
    const config:Config=JSON.parse(await Deno.readTextFile("../config.json"))
    if(config.game?.host){
        const server=new GameServer(new_server_from_hc(config.game.host),config)
        server.run()
    }
}