import { Server, AbstractGameContainer, AbstractGameServer} from "common/engine/server.ts"
import { GameConfig, GameData } from "./game.ts"
import { Config } from "../configType.ts"
import { WorkerMessage } from "./game_worker.ts"

export class GameServer extends AbstractGameServer<GameData,GameConfig>{
    constructor(server: Server,config:Config){
        super(server,config)

        const game=this.add_container(new GameContainer())
        game?.new_game({})
    }
}

export class GameContainer extends AbstractGameContainer<GameData,GameConfig,Config,WorkerMessage>{
    override worker_path: URL
    constructor(){
        super()
        const worker_path=import.meta.filename?.endsWith(".ts")?"./game_worker.ts":"./game_worker.js"
        this.worker_path=new URL(worker_path, import.meta.url)

    }
    override begin(): void {
        this.port=this.server.config.game!.host.port+this.id+1
        super.begin()
    }
}