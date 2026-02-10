import { GameColors } from "common/scripts/config/constants.ts";
import { Shape } from "../../abstract_objects/shape.ts";
import { v2 } from "common/engine/core.ts";

export class PentagonShape extends Shape{
    constructor(){
        super()
        this.physical_data.sides=5
        this.physical_data.color=GameColors.Pentagon
        this.physical_data.radius=3

        this.health_data.max_health=15
        this.health_data.health=15

        this.shape_data.mitose_chance=0.02
        this.shape_data.rarity_kind=2
        this.shape_data.rarity_rotation=Math.PI

        this.score_reward=50
    }
    override mitose(){
        const center=v2.dscale(this.game.arena.size,2)
        const dist=v2.distance(center,this.position)
        if(dist<=this.game.arena.settings.special_zone*0.7){
            this.shape_data.mitose_chance=1
        }else{
            this.shape_data.mitose_chance=0.02
        }
        return super.mitose()
    }
}