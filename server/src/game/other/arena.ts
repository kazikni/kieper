import { v2, Vec2 } from "common/engine/core.ts";
import { type Game } from "./game.ts";

export class Arena{
    game:Game
    size:Vec2

    settings={
        score_multiplier:1,
        special_zone:100,
        special_zone_offset:10,
    }
    constructor(game:Game){
        this.game=game
        this.size=v2(2000,2000)
    }
    generate_spawn_pos(){
        return v2.random2(v2.zero,this.game.arena.size)
    }
}