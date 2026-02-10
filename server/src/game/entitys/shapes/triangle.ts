import { GameColors } from "common/scripts/config/constants.ts";
import { Shape } from "../../abstract_objects/shape.ts";

export class TriangleShape extends Shape{
    constructor(){
        super()
        this.physical_data.sides=3
        this.physical_data.color=GameColors.Triangle
        this.physical_data.radius=1.12

        this.health_data.max_health=2
        this.health_data.health=2

        this.score_reward=5
    }
}