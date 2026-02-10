import { GameColors } from "common/scripts/config/constants.ts";
import { PentagonShape } from "./pentagon.ts";

export class HexagonShape extends PentagonShape{
    constructor(){
        super()
        this.physical_data.sides=6
        this.physical_data.color=GameColors.Hexagon
        this.physical_data.radius=3.75
        
        this.health_data.max_health=50
        this.health_data.health=50

        this.shape_data.rarity_kind=2
        this.shape_data.rarity_rotation=Math.PI/2

        this.score_reward=500
    }
}