import { AbstractBoss } from "../boss.ts";
import { GameColors } from "common/scripts/config/constants.ts";
export class OriginalBoss extends AbstractBoss{
    constructor(){
        super()
    }
    override create(args: Record<string, any>): void {
        super.create(args)
        this.physical_data.scale=2.5

        this.health_data.max_health*=30
        this.health_data.health=this.health_data.max_health
        this.health_data.regen*=2

        this.damage_data.bullet_damage*=2
        this.damage_data.bullet_speed*=2

        this.damage_data.reload*=2
        this.damage_data.body_damage*=2

        this.name_data.name="Original "+this.def.name

        this.score_reward=5000

        this.physical_data.color=GameColors.OriginalBoss
    }
}