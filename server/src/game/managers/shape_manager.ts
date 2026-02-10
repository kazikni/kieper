import { random, v2, Vec2, WeightDefinition } from "common/engine/core.ts";
import { Shape } from "../abstract_objects/shape.ts";
import { type Game } from "../other/game.ts";
import { EggShape } from "../entitys/shapes/egg.ts";
import { TriangleShape } from "../entitys/shapes/triangle.ts";
import { SquareShape } from "../entitys/shapes/square.ts";
import { PentagonShape } from "../entitys/shapes/pentagon.ts";
import { HexagonShape } from "../entitys/shapes/hexagon.ts";
import { Guardian } from "../entitys/shapes/defender.ts";
interface ShapeSpawnDef extends WeightDefinition{
    shape:(position:Vec2)=>Shape
}
export class ShapeManager{
    shapes:(Shape)[]=[]
    game:Game

    max_shapes:number=2500

    shape_spawns:ShapeSpawnDef[]=[
        {
            weight:1,
            shape:(_pos)=>new EggShape(),
        },
    ]
    special_shape_spawns:ShapeSpawnDef[]=[
        {
            weight:10,
            shape:(_pos)=>new PentagonShape(),
        },
        {
            weight:2,
            shape:(_pos)=>new Guardian(),
        },
        {
            weight:1,
            shape:(_pos)=>new HexagonShape(),
        }
    ]
    egg_shape_spawns:ShapeSpawnDef[]=[
        {
            weight:80,
            shape:(_pos)=>new TriangleShape(),
        },
        {
            weight:20,
            shape:(_pos)=>new SquareShape(),
        },
        {
            weight:5,
            shape:(_pos)=>new PentagonShape(),
        },
        {
            weight:0.1,
            shape:(_pos)=>new HexagonShape(),
        }
    ]
    constructor(game:Game){
        this.game=game
    }
    add_shape(shape?:Shape,position?:Vec2){
        if(this.shapes.length>=this.max_shapes||!shape)return undefined
        const ret=this.game.scene_2d.objects.add_object(shape,0) as Shape
        ret.shape_manager=this
        if(position)ret.position=position
        this.shapes.push(ret)
        return ret
    }
    generate_modifier(){
        let modifier=0

        const rn=random.float(0,1_000_000)
        if(rn<=1_000_000/1_000_000){
            modifier=4
        }else if(rn<=1_000_000/100_000){
            modifier=3
        }else if(rn<=1_000_000/10_000){
            modifier=2
        }else if(rn<=1_000_000/1_000){
            modifier=1
        }
        return modifier
    }
    generate_shape(pos:Vec2,shape_spawns?:ShapeSpawnDef[],special_spawns?:ShapeSpawnDef[],size_weight:number[]=[150,35,7,1.5],special_size_weight:number[]=[100,30,6,1]):Shape|undefined{
        const center=v2.dscale(this.game.arena.size,2)
        const dist=v2.distance(center,pos)
        if(dist<=this.game.arena.settings.special_zone){
            const choose=random.weight2(special_spawns??this.special_shape_spawns)
            if(choose){
                const shape=choose.shape(pos)
                shape.set_data(random.weight([0,1,2,3],special_size_weight)!,this.generate_modifier())
                return shape
            }
        }else if(dist>=this.game.arena.settings.special_zone+this.game.arena.settings.special_zone_offset){
            const choose=random.weight2(shape_spawns??this.shape_spawns)
            if(choose){
                const shape=choose.shape(pos)
                shape.set_data(random.weight([0,1,2,3],size_weight)!,this.generate_modifier())
                return shape
            }
        }
    }
    spawn_shape(){
        const pos=this.game.arena.generate_spawn_pos()
        const shape=this.add_shape(this.generate_shape(pos),pos)
        return shape
    }
    dirty_time:number=1
    update(dt:number){
        for(let i=0;i<3;i++){
            if(this.shapes.length<=this.max_shapes){
                const shape=random.choose(this.shapes)
                if(shape&&Math.random()<=shape.shape_data.mitose_chance&&shape.registred){
                    shape.mitose()
                }else{
                    this.spawn_shape()
                }
            }
        }
        this.dirty_time-=dt
        if(this.dirty_time<=0){
            this.dirty_time=1
            for(let i=0;i<this.shapes.length;i++){
                if(!this.shapes[i].registred){
                    this.shapes.splice(i,1)
                    i--
                    continue
                }
            }
        }
    }
}