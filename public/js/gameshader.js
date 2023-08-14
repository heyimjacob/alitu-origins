export default class GameShader extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
constructor (game) {
        super({
            game,
            renderTarget: true,
            fragShader: `precision mediump float;
                        uniform sampler2D uMainSampler;
                        varying vec2 outTexCoord;
                        void main(void) {
                        vec4 color = texture2D(uMainSampler, outTexCoord);
                        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                        gl_FragColor = vec4(vec3(gray), 1.0);
                        }`
            });
        }
    }
