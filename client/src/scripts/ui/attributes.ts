import { PlayerAttributes } from "common/scripts/config/constants.ts";
import { type Game } from "../main/game.ts";
import { HideElement, ShowElement, UIModule } from "common/engine/client.ts";
export class AttributesManager extends UIModule<Game>{
    visible:boolean=false
    attributes:Record<PlayerAttributes,[string,number,number,string,number]>={
        [PlayerAttributes.MaxHealth]:["Max Health",0,10,"#ee44ee",PlayerAttributes.MaxHealth],
        [PlayerAttributes.HealthRegen]:["Health Regen",0,10,"#f39a76",PlayerAttributes.HealthRegen],
        [PlayerAttributes.MoveSpeed]:["Move Speed",0,10,"#29aec5",PlayerAttributes.MoveSpeed],
        [PlayerAttributes.BodyDamage]:["Body Damage",0,10,"#810b81",PlayerAttributes.BodyDamage],
        [PlayerAttributes.BulletDamage]:["Bullet Damage",0,10,"#da203f",PlayerAttributes.BulletDamage],
        [PlayerAttributes.BulletHealth]:["Bullet Health",0,10,"#cac71d",PlayerAttributes.BulletHealth],
        [PlayerAttributes.BulletSpeed]:["Bullet Speed",0,10,"#2522cc",PlayerAttributes.BulletSpeed],
        [PlayerAttributes.Reload]:["Bullet Reload",0,10,"#44ee44",PlayerAttributes.Reload],
    }
    override on_init(): void {
        this.root.register_html("attributes",document.querySelector("#attributes") as HTMLDivElement)
        const btn=document.querySelector('#button-open-attributes') as HTMLButtonElement
        btn.onclick=(e)=>[
            this.root.signal("action","attributes")
        ]
    }
    override on_update(dt: number): void {
    }
    dirty(): void {
        const att=this.root.content.attributes as HTMLDivElement
        att.innerHTML=""
        if(this.visible){
            ShowElement(att)
            for(const a of Object.values(this.attributes)){
                const elem=document.createElement("div")
                elem.className="attribute"
                elem.innerHTML=`<p>${a[0]}</p> `
                const slots=document.createElement("div")
                slots.classList="content"
                for(let i=0;i<a[2];i++){
                    const div=document.createElement("div")
                    div.className="attribute-slot"
                    if(i<a[1]){
                        div.style.backgroundColor=a[3]
                    }
                    slots.appendChild(div)
                }
                const btn=document.createElement("button")
                btn.classList="attribute-add"
                btn.style.backgroundColor=a[3]
                btn.onclick=()=>{
                    this.game.input.attribute=a[4]
                    this.game.input.attribute_count=1
                }
                btn.innerHTML="+"
                slots.appendChild(btn)
                elem.appendChild(slots)
                att.appendChild(elem)
            }
        }else{
            HideElement(att)
        }
    }
    override on_destroy(): void {
    }
    override on_signal(signal: string, content: any): void {
        if(signal=="update_private"){
            let dirty=false
            for(const o of Object.keys(content.attributes as Record<PlayerAttributes,number>)){
                if(content.attributes[o]!=this.attributes[o as unknown as PlayerAttributes][1]){
                    this.attributes[o as unknown as PlayerAttributes][1]=content.attributes[o]
                    dirty=true
                }
            }
            if(dirty)this.dirty()
        }else if(signal==="action"){
            if(content==="attributes"){
                this.visible=!this.visible
                this.dirty()
            }else if(content==="evolutions"){
                this.visible=false
                this.dirty()
            }
        }
    }
    override on_clear(): void {
    }
}