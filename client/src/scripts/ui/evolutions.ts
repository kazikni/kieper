import { v2, v2m } from "common/engine/core.ts";
import { type Game } from "../main/game.ts";
import { BarrelData } from "common/scripts/config/entity_datas.ts";
import { Tanks } from "common/scripts/config/tanks_definition.ts";
import { HideElement, ShowElement, UIModule } from "common/engine/client.ts";

export class TankPreviewMapper {
    static SCALE = 11;

    static barrelStyle(b: BarrelData) {
        const size = b.physical.size ?? v2.new(3.5, 1.5)
        const pos  = v2.clone(b.physical.position ?? v2.zero)
        const off  = v2.clone(b.physical.offset ?? v2.zero)

        const base = v2(size.x / 2, 0);

        const local = v2.add(base, pos);

        v2m.rotate_DegAngle(local, b.physical.direction ?? 0);

        v2m.add(local, local, off);

        const px = local.x * this.SCALE;
        const py = local.y * this.SCALE;

        const rot = (b.physical.rotation ?? 0) + (b.physical.direction ?? 0);

        const width  = `${(size.y * this.SCALE)}px`
        const height = `${(size.x * this.SCALE)}px`
        const left   = `calc(50% + ${px}px)`
        const top    = `calc(50% + ${py}px)`
        const transform = `translate(-50%,-50%) rotate(${rot}deg) rotate(-90deg)`

        return {
            width,
            height,
            left,
            top,
            transform,
            transformOrigin: `50% 50%`,
            position: "absolute",
        } as Partial<CSSStyleDeclaration>;
    }
}

export class EvolutionsManager extends UIModule<Game>{
    visible:boolean=false
    evolutions:string[]=[]
    override on_init(): void {
        this.root.register_html("evolutions",document.querySelector("#evolutions") as HTMLDivElement)
        const btn=document.querySelector('#button-open-evolutions') as HTMLButtonElement
        btn.onclick=(e)=>[
            this.root.signal("action","evolutions")
        ]
    }
    override on_update(dt: number): void {
    }
    dirty(): void {
        const evo = this.root.content["evolutions"];
        evo.innerHTML = "";
        if (!this.visible){
            HideElement(evo)
            return
        };

        ShowElement(evo)
        let idx = 0;
        for (const id of this.evolutions) {
            const tank = Tanks.getFromString(id);
            const evoDiv = document.createElement("div");
            evoDiv.className = "evolution";

            if(tank.name)evoDiv.innerHTML=`<p>${tank.name}</p>`
            const tankDiv = document.createElement("div");
            tankDiv.className = "tank";
            tankDiv.style.width  = `120px`;
            tankDiv.style.height = `120px`;
            tankDiv.style.position = "relative";


            for (const b of tank.barrels) {
                const barrel = document.createElement("div");
                barrel.className = "tank-barrel";

                Object.assign(barrel.style, TankPreviewMapper.barrelStyle(b));
                tankDiv.appendChild(barrel);
            }

            const body = document.createElement("div");
            body.className = "tank-body";
            const bodySize = (tank.physical.radius ?? 2) * 2 * TankPreviewMapper.SCALE;
            body.style.width = `${bodySize}px`;
            body.style.height = `${bodySize}px`;
            body.style.position = "absolute";
            body.style.left = "50%";
            body.style.top = "50%";
            body.style.transform = "translate(-50%,-50%)";
            tankDiv.appendChild(body);

            evoDiv.appendChild(tankDiv);
            const lidx = idx;
            evoDiv.onclick = (_e) => (this.game.input.evolve_to = lidx);
            evo.appendChild(evoDiv);
            idx++;
        }
    }

    override on_destroy(): void {
    }
    override on_signal(signal: string, content: any): void {
        if(signal=="update_private"){
            let dirty=content.evolutions.length!=this.evolutions.length
            if(!dirty){
                for(const i in content.evolutions){
                    if(Tanks.getFromNumber(content.evolutions[i]).idString!=this.evolutions[i as unknown as number]){
                        dirty=true
                        break
                    }
                }
            }
            if(dirty){
                this.evolutions.length=0
                for(const e of content.evolutions){
                    this.evolutions.push(Tanks.getFromNumber(e as unknown as number).idString)
                }
                if(!this.visible){
                    this.root.signal("action","evolutions")
                }
                this.dirty()
            }
        }else if(signal==="action"){
            if(content==="evolutions"){
                this.visible=!this.visible
                this.dirty()
            }else if(content==="attributes"){
                this.visible=false
                this.dirty()
            }
        }
    }
    override on_clear(): void {
    }
}