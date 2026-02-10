import { v2 } from "common/engine/core.ts";
import { GameColors, GameObjectType } from "common/scripts/config/constants.ts";
import { AbstractBullet } from "../../../abstract_objects/bullet.ts";

export class Bullet extends AbstractBullet{
    override string_type="bullet"
    override number_type=GameObjectType.Bullet

    constructor(){
        super()
        this.initial_position=v2(0,0)
        this.health_data.visible=false

        this.physical_data.color=GameColors.Red
        this.physical_data.sides=1
        this.physical_data.radius=1
        this.netSync.deletion=false

        this.bullet_data.type=1
    }
    override create(args: Record<string, any>): void {
        super.create(args)
    }
    override update(dt:number){
        if(v2.distance(this.initial_position,this.position)>this.maxDistance){
            this.die({count:this.health_data.health})
        }
        super.update(dt)
    }
    override set_movement(rotation:number){
        super.set_movement(rotation)

        this.initial_position=v2.clone(this.position)
        this.dirty=true
        this.update_data()
    }
}