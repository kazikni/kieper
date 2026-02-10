import { LivingEntity } from "./living_entity.ts";
import { GameObjectType } from "common/scripts/config/constants.ts";

export class Shape extends LivingEntity{
    override number_type: GameObjectType=GameObjectType.Shape
    override string_type: string="shape"
    constructor(){
        super()
    }
}