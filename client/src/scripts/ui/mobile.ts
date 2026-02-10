import { type Game } from "../main/game.ts";
import {  HideElement, isMobile, ShowElement, UIModule } from "common/engine/client.ts";
export class MobileManager extends UIModule<Game>{
    visible:boolean=isMobile
    override on_init(): void {
        const lj=document.querySelector("#left-joystick") as HTMLDivElement
        const rj=document.querySelector("#right-joystick") as HTMLDivElement
        this.root.register_html("game-mobile-ui",document.querySelector("game-mobile-ui") as HTMLDivElement)
        this.root.register_html("left-joystick",lj)
        this.root.register_html("right-joystick",rj)

        lj.addEventListener("joystickmove",(e)=>{
            this.game.input.movement=e.detail
        })
        lj.addEventListener("joystickend",()=>{
            this.game.input.movement.x=0
            this.game.input.movement.y=0
        })
        rj.addEventListener("joystickmove",(e)=>{
            const dist=Math.sqrt(e.detail.x*e.detail.x+e.detail.y*e.detail.y)
            this.game.input.firing=true
            this.game.set_lookTo_angle(Math.atan2(e.detail.y,e.detail.x),dist*100)
        })
        rj.addEventListener("joystickend",(e)=>{
            this.game.input.firing=false
        })
    }
    override on_update(dt: number): void {
    }
    override on_dirty(): void {
        const elem=document.querySelector("#game-mobile-ui") as HTMLDivElement
        if(this.visible){
            ShowElement(elem)
        }else{
            HideElement(elem)
        }
    }
    override on_destroy(): void {
    }
    override on_signal(signal: string, content: any): void {
        
    }
}