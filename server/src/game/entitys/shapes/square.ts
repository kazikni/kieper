import { GameColors } from "common/scripts/config/constants.ts";
import { Shape } from "../../abstract_objects/shape.ts";

export class SquareShape extends Shape{
    constructor(){
        super()
        this.physical_data.sides=4
        this.physical_data.color=GameColors.Square
        this.physical_data.radius=1.55

        this.health_data.max_health=3
        this.health_data.health=3

        this.score_reward=10
    }
}