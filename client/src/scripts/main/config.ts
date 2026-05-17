import { Casters,Key } from "common/engine/client.ts"

export const server="ws://localhost:8081"

export enum GraphicsDConfig {
    None=0,
    Normal,
    Advanced,
}
export const ConfigCasters=Object.freeze({
    sv_game_name:Casters.toString,
    sv_graphics_renderer:Casters.generateUnionCaster(["webgl1","webgl2"]),
})
export const ConfigDefaultValues={
    sv_game_name:"",
    sv_graphics_renderer:"webgl2",
}
export const ConfigDefaultActions={
    "move_up":{
        keys:[Key.W],
        buttons:[]
    },
    "move_down":{
        keys:[Key.S],
        buttons:[]
    },
    "move_left":{
        keys:[Key.A],
        buttons:[]
    },
    "move_right":{
        keys:[Key.D],
        buttons:[]
    },
    "fire":{
        keys:[Key.Mouse_Left],
        buttons:[],
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