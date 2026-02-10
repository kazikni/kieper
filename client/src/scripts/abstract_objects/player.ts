import { LivingEntity } from "./living_entity.ts";
import { GameObjectType } from "common/scripts/config/constants.ts";

export class Player extends LivingEntity{
    override number_type: GameObjectType=GameObjectType.Tank
    override string_type: string="tank"
    constructor(){
        super()
    }
}