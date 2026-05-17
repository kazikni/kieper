import "common/engine/main.scss"
import "../../scss/main.scss"
import { Game } from "./game.ts";
import { server } from "./config.ts";
async function main(){
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement

    const play_btn=document.querySelector("#play-button") as HTMLDivElement
    const name_input=document.querySelector("#name-input") as HTMLInputElement
    const game=new Game(canvas)
    game.bind()
    play_btn.addEventListener("click",()=>{
        if(!game.client){
            game.connect(`${server}/api/ws`)
            setTimeout(()=>game.join(),1000)
        }else{
            game.join()
        }
    })
    name_input.value=game.save.get_variable("sv_game_name")
    name_input.addEventListener("change",(e)=>{
        game.save.set_variable("sv_game_name",name_input.value)
    })

    game.mainloop(true)
    game.connect(`${server}/api/ws`)
}
main()