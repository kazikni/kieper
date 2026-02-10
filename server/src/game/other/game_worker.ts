import { ConnectionLimiter, SelfGameWorker, WorkerMessageBase } from "common/engine/server.ts";
import { PacketManager } from "common/scripts/net/packets_manager.ts";
import { Game, GameConfig, GameData } from "./game.ts";
import { Config } from "../configType.ts";
export type WorkerMessage=WorkerMessageBase<GameConfig,GameData,Config>&({

})
class App extends SelfGameWorker<Game,GameData,GameConfig,Config>{
    constructor(){
        super(PacketManager)
    }
    protected override onBegin(): void {
        this.limiter = new ConnectionLimiter({
            enabled: true,
            windowMs: 20_000,
            maxConnections: 3,
            burst: 5,
        })
        if(this.limiter.config.enabled){
            this.limiter.start()
        }
        this.server!.route("/api/ws",this.clients_manager.handler())
    }
    protected override createGame(config?: GameConfig | undefined): Game {
        const game=new Game(60,this.id,this.clients_manager)
        return game
    }
}
const app=new App()