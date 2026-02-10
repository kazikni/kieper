import { FrameDef, FrameTransform, KeyFrameSpriteDef } from "../../core/definition/definitions.ts"
import { ImageModel2D } from "../../core/definition/models.ts"
import { ColorM } from "../../core/math/color.ts"
import { Numeric } from "../../core/math/utils.ts"
import { v2, Vec2, Vec2M } from "../../core/math/vec2.ts"
import { Frame, ResourcesManager } from "../resources/resources.ts"
import { CamA, Container2DObject } from "./base.ts"
export class Sprite2D extends Container2DObject{
    object_type:string="sprite2d"
    _frame?:Frame
    hotspot:Vec2=v2(0,0)
    _size?:Vec2M

    get size():Vec2|undefined{
        return this._size as Vec2|undefined
    }
    set size(val:Vec2|undefined){
        if(val){
            if(!this._size)this._size=new Vec2M(0,0,this.update_real.bind(this))
            this._size.set(val.x,val.y)
        }else{
            this._size=undefined
        }
    }

    _real_size:Vec2=v2(0,0)

    get frame():Frame|undefined{
        return this._frame
    }
    set frame(f:Frame|undefined){
        this._frame=f
        this.update_real()
    }

    frames?:KeyFrameSpriteDef[]
    current_delay:number=0
    current_frame:number=0

    old_ms=1

    cam?:CamA

    override update_visual(): void {
        super.update_visual()
        this.update_model()
    }

    update_model(){
        if(!this.frame||!this.frame.source||!this.cam)return
        this._real_size=this.size??this.frame.frame_size??v2(this.frame.source.width,this.frame.source.height)
        this.model=ImageModel2D(this._real_scale,this._real_rotation,this.hotspot,this._real_size,100,this._real_position)
        this.old_ms=this.cam.meter_size
    }

    model:Float32Array

    constructor(){
        super()
        this.model=ImageModel2D(this._real_scale,this.rotation,this.hotspot,v2(0,0),100)
    }
    
    set_frame(frame:FrameDef,resources:ResourcesManager){
        if(frame.scale)this.scale=v2(frame.scale,frame.scale)
        if(frame.hotspot)this.hotspot=v2.clone(frame.hotspot)
        if(frame.rotation)this.rotation=frame.rotation
        if(frame.visible)this.visible=frame.visible
        if(frame.zIndex)this.zIndex=frame.zIndex
        if(frame.position)this.position=v2.clone(frame.position)
        if(frame.image)this.frame=resources.get_sprite(frame.image)
        if(frame.tint)this.tint=ColorM.number(frame.tint)
        this.update_real()
    }
    
    transform_frame(frame:FrameTransform){
        if(frame.scale)this.scale=v2(frame.scale,frame.scale)
        if(frame.hotspot)this.hotspot=v2.clone(frame.hotspot)
        if(frame.rotation)this.rotation=frame.rotation
        if(frame.visible)this.visible=frame.visible
        if(frame.zIndex)this.zIndex=frame.zIndex
        if(frame.position)this.position=v2.clone(frame.position)
        this.update_real()
    }
    override draw(cam:CamA): Promise<void> {
        return new Promise<void>((resolve) => {
            this.draw_super()
            this.cam=cam
            //if(this.frame)renderer.draw_image2D(this.frame,this._real_position,this.model,cam.matrix,this._real_tint)
            cam.ctx.draw_frame2d(this.frame,this.model,this._real_tint)
            resolve()
        })
    }
}
export class AnimatedSprite2D extends Sprite2D{
    override object_type:string="animated_sprite2d"
    override has_update: boolean=true
    override update(dt:number,resources:ResourcesManager){
        super.update(dt,resources)
        if(this.frames){
            if(this.current_delay<this.frames[this.current_frame].delay){
                this.current_delay+=dt
            }else{
                this.current_delay=0
                this.current_frame=Numeric.loop(this.current_frame+1,0,this.frames.length)
                this.set_frame(this.frames[this.current_frame],resources)
            }
        }
    }
}