import { v2, v2m, Vec2, Vec2M } from "../../core/math/vec2.ts"

import {Vec4M,Color, ColorM} from "../../core/math/color.ts"

import { ResourcesManager } from "../resources/resources.ts"
import { type Context2D } from "../rendering/context.ts";
import { Renderer } from "../rendering/renderer.ts";
import { Matrix } from "../../core/definition/matrix.ts";

export interface CamA{
    matrix:Matrix

    position:Vec2
    size:Vec2

    meter_size:number
    center_pos:boolean

    ctx:Context2D
    renderer:Renderer
}
export abstract class Container2DObject {
    abstract object_type: string;

    parent?: Container2D;
    _zIndex: number = 0;

    has_update:boolean=false
    get zIndex():number{
        return this._zIndex
    }
    set zIndex(val:number){
        this._zIndex=val
        if(this.parent){
            this.parent.updateZIndex()
        }
    }

    id_on_parent:number=0

    _position: Vec2M
    get position(): Vec2 {
        return this._position as Vec2
    }
    set position(val: Vec2) {
        this._position.set(val.x,val.y)
    }
    _scale: Vec2M
    get scale(): Vec2 {
        return this._scale as Vec2
    }
    set scale(val: Vec2) {
        this._scale.set(val.x,val.y)
    }

    _rotation: number = 0
    get rotation():number{
        return this._rotation
    }
    set rotation(val:number){
        this._rotation=val
        this.update_real()
    }

    _tint: Vec4M
    get tint(): Color {
        return this._tint as Color
    }
    set tint(val: Color) {
        this._tint.set(val.r,val.g,val.b,val.a)
    }

    _real_position: Vec2 = v2(0, 0)
    _real_scale: Vec2 = v2(1, 1)
    _real_rotation: number = 0;
    _real_tint: Color = ColorM.rgba(255,255,255)

    sync_rotation:boolean=true

    _visible:boolean=true
    get visible():boolean{
        return this._visible
    }
    set visible(val:boolean){
        this._visible=val
        if(this.parent)this.parent.update_visibility()
    }

    destroyed:boolean=false
    destroy(){
        this.destroyed=true
        if(this.parent){
            let i=this.parent.children.indexOf(this)
            if(i!==-1)this.parent.children.splice(i,1)
            i=this.parent.update_children.indexOf(this)
            if(i!==-1)this.parent.update_children.splice(i,1)
            i=this.parent.visible_children.indexOf(this)
            if(i!==-1)this.parent.visible_children.splice(i,1)
        }
    }

    constructor(){
        const bid=this.update_real.bind(this)
        this._position=new Vec2M(0,0,bid)
        this._scale=new Vec2M(1,1,bid)
        this._tint=new Vec4M(1,1,1,1,bid)
    }

    update_v=true
    update_real(){
        this.update_v=true
    }
    update_visual(){
        if (this.parent&&!this.parent.object_group) {
            this._real_scale = v2.mult(this.parent._real_scale, this._scale);
            if(this.sync_rotation){
                this._real_rotation = this.parent._real_rotation + this._rotation
                v2m.mul(this._real_position,this._position,this.parent._real_scale)
                v2m.rotate_RadAngle(this._real_position,this.parent._real_rotation)
                v2m.add(this._real_position,this._real_position,this.parent._real_position)
            }else{
                this._real_rotation=this._rotation
                v2m.mul(this._real_position,this.parent._real_scale, this._position)
                v2m.add(this._real_position,this._real_position,this.parent._real_position)
            }

            ColorM.mult(this._real_tint,this._tint,this.parent._tint)
        } else {
            v2m.set(this._real_position,this._position._x,this._position._y)
            v2m.set(this._real_scale,this._scale._x,this._scale._y)
            this._real_rotation = this._rotation

            if (this.parent)
                ColorM.mult(this._real_tint,this._tint,this.parent._tint)
            else
                ColorM.set1(this._real_tint,this._tint)
        }
    }
    update(_dt:number,_resources:ResourcesManager): void {
    }
    draw_super(){
        if(this.update_v){
            this.update_visual()
            this.update_v=false
        }
    }
    abstract draw(cam:CamA): Promise<void>;
}
export class Container2D extends Container2DObject{
    object_type:string="container2d"
    children:Container2DObject[]=[]

    update_children:Container2DObject[]=[]
    visible_children:Container2DObject[]=[]
    override has_update: boolean=true

    object_group:boolean=false

    update_visibility(){
        this.visible_children = this.children.filter(c => c._visible)
    }
    override update(dt:number,resources:ResourcesManager){
        super.update(dt,resources);
        for (const c of this.update_children) c.update(dt,resources);
    }
    override update_real(): void {
        super.update_real()
        for (const c of this.children) c.update_real()
    }
    updateZIndex(){
        this.children.sort((a, b) => a.zIndex - b.zIndex || a.id_on_parent - b.id_on_parent);
    }
    async draw(cam:CamA,objects?:Container2DObject[]):Promise<void>{
        this.draw_super()
        if(!objects)objects=this.visible_children
        for(let o =0;o<objects.length;o++){
            const c=objects[o]
            if(c.visible)await c.draw(cam)
        }
    }
    add_child(c:Container2DObject){
        c.id_on_parent=this.children.length+1
        c.parent=this
        this.children.push(c)
        if(c.has_update){
            this.update_children.push(c)
        }
        if(c._visible){
            this.visible_children.push(c)
        }
        c.update_real()
    }
    constructor(){
        super()
    }
}