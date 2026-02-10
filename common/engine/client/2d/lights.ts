import { model2d, Model2D } from "../../core/definition/models.ts"
import { Color } from "../../core/math/color.ts"
import { v2, Vec2 } from "../../core/math/vec2.ts"
import { GL2D_LightMatArgs, GL2D_LightMatAttr } from "../rendering/materials.ts"
import { GLMaterial, Renderer, WebglRenderer } from "../rendering/renderer.ts"
import { CamA, Container2DObject } from "./base.ts"
import { Camera2D } from "./camera.ts"

export type Light2D = {
    mat: GLMaterial<GL2D_LightMatArgs,GL2D_LightMatAttr>
    pos: Vec2
    model: Model2D
    destroyed: boolean
}

export class Lights2D extends Container2DObject {
    override object_type = "lights"

    private renderer!: WebglRenderer
    private lightFBO!: WebGLFramebuffer
    private lightTexture!: WebGLTexture
    private lights: Light2D[] = []
    downscale = 1.0
    ambientColor: Color = { r: 1, g: 1, b: 1, a: 1 }

    quality:number=2 // 0 = None, 1=Just Global Light, 2 All Lights

    ambient_light?:GLMaterial<GL2D_LightMatArgs,GL2D_LightMatAttr>
    get ambient() {
        return 1-this.ambientColor.a
    }
    set ambient(v: number) {
        this.ambientColor.a=1-v
    }

    private initFramebuffer(w: number, h: number) {
        const gl = this.renderer.gl;
        if (this.lightTexture) gl.deleteTexture(this.lightTexture);
        if (this.lightFBO) gl.deleteFramebuffer(this.lightFBO);

        this.lightTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.lightTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.floor(w), Math.floor(h), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.lightFBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.lightTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /*addRadialLight(pos: Vec2, radius: number, intensity = 1.0, color: Color = { r: 1, g: 1, b: 1, a: 1 }) {
        const mat = this.renderer.factorys2D.light.create({ color, radius, intensity});
        const inst: LightInstance = { mat, pos: v2.clone(pos), radius, model:model2d.rect(v2(-radius,-radius),v2(radius,radius)), destroyed: false };
        this.lights.push(inst);
        return inst;
    }*/
    addLight(pos: Vec2, model:Model2D, color: Color = { r: 1, g: 1, b: 1, a: 1 }) {
        const mat = this.renderer.factorys2D.light.create({ color});
        const inst: Light2D = { mat, pos: v2.clone(pos), model, destroyed: false };
        this.lights.push(inst);
        return inst;
    }

    private _lastW:number=0
    private _lastH:number=0
    render(renderer: WebglRenderer, camera: Camera2D) {
        this.renderer = renderer;
        const gl = renderer.gl;
        if(this.quality==0){
            if (this.lightTexture) gl.deleteTexture(this.lightTexture);
            if (this.lightFBO) gl.deleteFramebuffer(this.lightFBO);
            return
        }

        const w = Math.max(1, camera.width*camera.meter_size*this.downscale);
        const h = Math.max(1, camera.height*camera.meter_size*this.downscale);

        if (!this.lightFBO || !this.lightTexture || this._lastW !== w || this._lastH !== h) {
            this.initFramebuffer(w, h);
            this._lastW = w;
            this._lastH = h;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);

        gl.viewport(0, 0, w, h);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        if(!this.ambient_light)this.ambient_light=renderer.factorys2D.light.create({color:this.ambientColor})
        this.ambient_light!.color=this.ambientColor
        renderer.draw(this.ambient_light,camera.projectionMatrix,{
            model:this.screenModel,
            position:camera.visual_position,
            scale:v2(1,1)
        })
        if(this.quality>=2){
            for (let i = 0; i < this.lights.length; i++) {
                const L = this.lights[i];
                if (L.destroyed) { this.lights.splice(i, 1); i--; continue; }
                renderer.draw(L.mat,camera.projectionMatrix,{
                    model:L.model,
                    position:L.pos,
                    scale:v2(1,1)
                })
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        this.updateScreenModel(v2(camera.width,camera.height), camera.meter_size)
        gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        //this.logLightTextureBase64()
    }

    screenModel:Model2D=model2d.rect()
    private updateScreenModel(pixelSize: Vec2, meterSize: number) {
        const s=v2.scale(pixelSize,meterSize)
        this.screenModel=model2d.rect(v2.scale(s,0),v2.scale(s,1))
    }
    logLightTextureBase64() {
        if (!this.lightTexture || !this.lightFBO) return;
        const gl = this.renderer.gl;

        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);

        const pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const srcIndex = ((h - y - 1) * w + x) * 4;
                const dstIndex = (y * w + x) * 4;
                imgData.data[dstIndex + 0] = pixels[srcIndex + 0];
                imgData.data[dstIndex + 1] = pixels[srcIndex + 1];
                imgData.data[dstIndex + 2] = pixels[srcIndex + 2];
                imgData.data[dstIndex + 3] = pixels[srcIndex + 3];
            }
        }

        ctx.putImageData(imgData, 0, 0);

        const dataURL = canvas.toDataURL("image/png")
        console.log("Light Texture Base64:", dataURL)
    }

    dd(cam:CamA,renderer: Renderer){
        this.draw_super()
        if (!this.lightTexture||this.quality===0){}
        const mat = (renderer as WebglRenderer).factorys2D.texture.create({
            texture: this.lightTexture,
            tint: { r: 1, g: 1, b: 1, a: 1 }
        });
        const gl=(renderer as WebglRenderer).gl
        gl.blendFunc(gl.DST_COLOR, gl.ZERO);
        renderer.draw(mat,cam.matrix,{
            model:this.screenModel,
            position:cam.position,
            scale:v2(0.01,0.01)
        })
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }
    override draw(cam: CamA, renderer: Renderer): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve()
        })
    }
}