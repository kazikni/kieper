import { Vec2 } from "../../engine/core.ts";
import { GameColors } from "./constants.ts";

export type PhysicalSubModel=({
    model_type:0 //Hitbox
    sides:number
    radius:number
}|{
    model_type:1 //Rect
    size:Vec2
})&{
    color:GameColors
    rotation:number
    position:Vec2
    zindex?:number
}
export type SimplePhysical={
    sides?:number
    color?:GameColors
    radius?:number
}
export type PhysicalData={
    sides:number
    color:GameColors
    radius:number
    scale:number
    sub_models?:PhysicalSubModel[]
}
export type HealthData={
    health:number
    max_health:number
    regen:number
    dead:boolean
    visible:boolean
}
export type NameData={
    name:string,
    visible:boolean,
}
export type BulletDefinition={
    damage:number
    health:number
    speed?:number
    distance?:number
    type?:"bullet"|"drone"
}&SimplePhysical
export type BarrelData={
    physical:{
        color?:GameColors
        size?:Vec2
        position?:Vec2
        offset?:Vec2
        direction?:number
        rotation?:number
    }
    shoot:{
        delay:number
        limit?:number
        spread?:number
        recoil?:number
        bullet_count?:number
        bullet:BulletDefinition
    }
}
export interface TankDefinition{
    name?:string
    barrels:BarrelData[]
    physical:{
        radius?:number
        sides?:number
    }
    tank:{
        speed?:number
        health?:number
        evolution?:{level:number,id:string}[]
    }
}