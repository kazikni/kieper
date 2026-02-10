import { Casters,Key } from "common/engine/client"

export const server="ws://localhost:8081"

export enum GraphicsDConfig {
    None=0,
    Normal,
    Advanced,
}
export const ConfigCasters=Object.freeze({
    cv_game_name:Casters.toString,
    cv_graphics_renderer:Casters.generateUnionCaster(["webgl1","webgl2"]),
})
export const ConfigDefaultValues={
    cv_game_name:"",
    cv_graphics_renderer:"webgl2",
}
export const ConfigDefaultActions={
    "fire":{
        buttons:[],
        keys:[Key.Mouse_Left]
    },
    "attributes":{
        buttons:[],
        keys:[Key.Q]
    },
    "evolutions":{
        buttons:[],
        keys:[Key.E]
    },
}