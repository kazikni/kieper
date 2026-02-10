import { Server } from "./server.ts"

export type WorkerMessageBase<GameConfig, GameData, MainConfig> =
    | {
        type: 0 // Begin

        id: number
        port: number

        config:MainConfig
    }
    | {
        type: 1 // New Game
        config?: GameConfig
    }
    | {
        type: 2 // Set Data
        data: GameData
    }
    | {
        type: 3 // Stop
    }
export enum WorkerMsg {
    Begin = 0,
    NewGame = 1,
    SetData = 2,
    Stop = 3,
}
export interface GameDataBase{
    running:boolean
}

export abstract class AbstractGameServer<
    GameData extends GameDataBase = GameDataBase,
    GameConfig = {},
    MainConfig = {},
    WorkerMessage extends WorkerMessageBase<GameConfig,GameData,MainConfig>=WorkerMessageBase<GameConfig,GameData,MainConfig>
> {
    server: Server

    games = new Map<number, AbstractGameContainer<GameData, GameConfig,MainConfig,WorkerMessage>>()

    config:MainConfig

    constructor(server: Server,config:MainConfig) {
        this.server = server
        this.config=config
    }

    add_container(game:AbstractGameContainer<GameData, GameConfig,MainConfig,WorkerMessage>,id?: number) {
        const gameId = id ?? this.games.size

        if (this.games.has(gameId)) {
            return this.games.get(gameId)
        }

        game.id=gameId
        game.server=this

        this.games.set(gameId, game)

        game?.begin()

        return game
    }
    run() {
        this.server.run()
    }
}
export abstract class AbstractGameContainer<
    GameData extends GameDataBase,
    GameConfig,
    MainConfig,
    WorkerMessage extends WorkerMessageBase<GameConfig,GameData,MainConfig>
> {
    id = 0
    data!: GameData
    worker!: Worker
    abstract worker_path: URL

    server!:AbstractGameServer<GameData,GameConfig,MainConfig,WorkerMessage>
    port:number
    constructor(){
        this.port=8001
    }
    begin() {
        this.worker = new Worker(this.worker_path.href, { type: "module" })
        this.worker.postMessage({
            type: 0,

            id: this.id,
            port:this.port,

            config:this.server.config
        })
    }
    new_game(config:GameConfig){
        this.worker.postMessage({
            type: 1,
            config:config
        })
    }
    stop() {
        this.worker.postMessage({ type: 3 })
    }
}