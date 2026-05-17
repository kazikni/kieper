import { GameConstant } from "common/scripts/config/constants.ts";
import { type Game } from "../main/game.ts";
import { Numeric, UIModule } from "common/engine/client.ts";

export class ScoreManager extends UIModule<Game>{
    level:number=0
    score:number=-1
    override on_init(): void {
        this.root.register_html("level-bar-container",document.querySelector("#level-bar-container") as HTMLDivElement)
        this.root.register_html("score-bar-container",document.querySelector("#score-bar-container") as HTMLDivElement)
    }
    override on_update(dt: number): void {
    }
    dirty(): void {
        let con = this.root.content["level-bar-container"];
        let bar=con.querySelector("#level-bar") as HTMLDivElement
        let span=con.querySelector(".span") as HTMLDivElement

        const progress=Math.min(Numeric.level.calc_nf(this.score,GameConstant.level_base,GameConstant.level_increse)+1,50)
        const level=Math.floor(progress)

        span.innerHTML=`Level: ${level}`
        bar.style.width=`${(progress-level)*100}%`

        this.level=level

        con = this.root.content["score-bar-container"];
        bar = con.querySelector("#score-bar") as HTMLDivElement
        span = con.querySelector(".span") as HTMLDivElement

        span.innerHTML=`Nutrient Score: ${this.score}`
    }

    override on_destroy(): void {
    }
    override on_clear(): void {
    }
    override on_signal(signal: string, content: any): void {
        if(signal==="update_private"){
            if(this.score!=content.score){
                this.score=content.score
                this.dirty()
            }
        }
    }
}