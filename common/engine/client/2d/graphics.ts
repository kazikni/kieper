import { Material, WebglRenderer } from "../rendering/renderer.ts";
import { Color } from "../../core/math/color.ts";
import { model2d, Model2D } from "../../core/definition/models.ts";
import { CamA, Container2DObject } from "./base.ts";
import { v2, Vec2 } from "../../core/math/vec2.ts";
import { SmoothShape2D } from "../../core/math/geometry.ts";
import { Hitbox2D, HitboxType2D } from "../../core/math/hitbox.ts";
import { Batcher } from "../rendering/batcher.ts";
type Graphics2DCommand =
  | { type: 'fillMaterial'; mat:Material }
  | { type: 'fillColor'; color:Color }
  | { type: 'fill' }
  | { type: 'path'; path:Model2D }
  | { type: 'model'; model:Model2D }

export class Graphics2D extends Container2DObject {
    object_type = "graphics2d"

    current_path:Vec2[]=[]
    current_position:Vec2=v2(0,0)

    repeat_size:number=1

    command: Graphics2DCommand[] = [];
    paths:number[][]=[]

    batcher?:Batcher

    beginPath(): this {
        this.current_path.length=0
        return this
    }
    lineTo(x:number,y:number):this{
        this.current_path.push(v2(x,y))
        this.current_position=v2(x,y)
        return this
    }
    smooth_shape(subdivisions=8) {
        this.current_path=SmoothShape2D(this.current_path,subdivisions)
    }
    endPath():this{
        this.command.push({type:"path",path:model2d.triangulateConvex(this.current_path,this.repeat_size)})
        this.current_path.length=0
        return this
    }
    fill():this{
        this.command.push({type:"fill"})
        return this
    }
    fill_material(mat:Material):this{
        this.command.push({type:"fillMaterial",mat:mat})
        return this
    }
    fill_color(color:Color):this{
        this.command.push({type:"fillColor",color})
        return this
    }
    clear(){
        this.command.length=0
    }
    drawGrid(begin:Vec2,size:Vec2,space:number,width:number){
        const minx=begin.x*space
        const miny=begin.y*space
        const maxx = (begin.x + size.x)*space
        const maxy = (begin.y + size.y)*space
        for (let x = minx; x <= maxx; x += space) {
            const p1 = v2(x, miny)
            const p2 = v2(x, maxy)
            this.drawLine(p1,p2,width)
        }
        for (let y = miny; y <= maxy; y += space) {
            const p1 = v2(minx, y)
            const p2 = v2(maxx, y)
            this.drawLine(p1,p2,width)
        }
    }
    drawLine(a:Vec2,b:Vec2,width:number){
        this.command.push({type:"model",model:model2d.line(a,b,width)})
    }
    drawModel(model:Model2D):Graphics2DCommand{
        const c:Graphics2DCommand={type:"model",model:model}
        this.command.push(c)
        return c
    }
    set_hitbox(hb:Hitbox2D){
        switch(hb.type){
            case HitboxType2D.rect:
                this.lineTo(hb.min.x,hb.min.y)
                this.lineTo(hb.max.x,hb.min.y)
                this.lineTo(hb.max.x,hb.max.y)
                this.lineTo(hb.min.x,hb.max.y)
                break
            case HitboxType2D.null:
            case HitboxType2D.circle:
            case HitboxType2D.group:
                break
            case HitboxType2D.polygon:
                for(const p of hb.points){
                    this.lineTo(p.x+hb.position.x,p.y+hb.position.y)
                }
                break
        }
    }
    color_material?:Material
    override draw(cam:CamA): Promise<void> {
        return new Promise<void>((resolve) => {
            this.draw_super()
            const gl = cam.renderer as WebglRenderer;
            if(!this.color_material)this.color_material=gl.factorys2D.simple_batch.create({})
            let currentMat: Material=this.color_material
            let current_color: Color={r:0,g:0,b:0,a:1}
            let currentModel:Model2D=model2d.zero()
            if(!this.batcher){
                this.batcher=new Batcher(cam.renderer)
            }

            for (const cmd of this.command) {
                switch (cmd.type) {
                    case "fillMaterial":
                        currentMat=cmd.mat
                        break
                    case "fillColor":
                        current_color=cmd.color
                        currentMat=this.color_material
                        break
                    case "fill":
                        this.batcher.draw_model2d(currentMat,currentModel,this._real_position,this._real_scale,{
                            color:{
                                value:[current_color.r,current_color.g,current_color.b,current_color.a]
                            }
                        })
                        break
                    case "model": {
                        this.batcher.draw_model2d(currentMat,cmd.model,this._real_position,this._real_scale,{
                            color:{
                                value:[current_color.r,current_color.g,current_color.b,current_color.a]
                            }
                        })
                        break;
                    }
                    case "path":
                        currentModel=cmd.path
                        break
                }
            }
            this.batcher.render(cam.matrix)
            resolve()
        })
    }
}