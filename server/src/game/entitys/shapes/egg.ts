import { GameColors } from "common/scripts/config/constants.ts";
import { Shape } from "../../abstract_objects/shape.ts";
import { random } from "common/engine/core.ts";

export class EggShape extends Shape{
    constructor(){
        super()
        this.physical_data.sides=1
        this.physical_data.color=GameColors.Egg
        this.physical_data.radius=0.75

        this.shape_data.transmutation_time=random.float(10,60)

        this.health_data.max_health=0.0025
        this.health_data.health=0.0025

        this.shape_data.mitose_chance=0.1
        this.shape_data.orbit=random.float(1,0.01)
        this.score_reward=1
        
    }
    override mitose() {
        const s=super.mitose()
        if(s&&Math.random()<=this.shape_data.mitose_chance*7)this.game.add_timeout(this.mitose.bind(s),random.float(0.5,1))
        return s
    }
    override transmutate(): void {
        super.transmutate()

        const s=this.shape_manager.generate_shape(this.position,this.shape_manager.egg_shape_spawns)
        if(s){
            this.shape_manager.shapes.splice(this.shape_manager.shapes.indexOf(this),1)
            this.shape_manager.add_shape(s,this.position)
        }
    }
}